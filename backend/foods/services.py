"""
Service layer for food-related business logic.
Provides helpers for price categorization, auditing, proposal approval,
and recipe cost recalculations.
"""

from __future__ import annotations

import math
from datetime import timedelta
from decimal import Decimal, InvalidOperation
from typing import Iterable, Optional, Tuple

from django.db import models, transaction
from django.utils import timezone

from foods.constants import DEFAULT_CURRENCY, PriceCategory, PriceUnit
from foods.models import (
    FoodEntry,
    FoodProposal,
    PriceAudit,
    PriceCategoryThreshold,
)

MAX_PRICE_UPDATES_BEFORE_RECALC = 50
MAX_THRESHOLD_AGE = timedelta(days=7)
CATEGORY_SCORES = {
    PriceCategory.CHEAP: 1,
    PriceCategory.MID: 2,
    PriceCategory.PREMIUM: 3,
}


def _as_decimal(value) -> Optional[Decimal]:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return value
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None


def _fetch_sorted_prices(price_unit: str, currency: str) -> Iterable[Decimal]:
    prices = (
        FoodEntry.objects.filter(
            price_unit=price_unit,
            currency=currency,
            base_price__isnull=False,
        )
        .order_by("base_price")
        .values_list("base_price", flat=True)
    )
    for price in prices:
        decimal_price = _as_decimal(price)
        if decimal_price is not None:
            yield decimal_price


def _compute_tertiles(prices: Iterable[Decimal]) -> Tuple[Optional[Decimal], Optional[Decimal]]:
    price_list = list(prices)
    if not price_list:
        return None, None

    count = len(price_list)
    lower_index = max(0, math.ceil(count / 3) - 1)
    upper_index = max(0, math.ceil((2 * count) / 3) - 1)
    return price_list[lower_index], price_list[upper_index]


def _log_price_audit(
    *,
    change_type: str,
    price_unit: str,
    currency: str = DEFAULT_CURRENCY,
    food: Optional[FoodEntry] = None,
    changed_by=None,
    reason: str = "",
    old_price=None,
    new_price=None,
    old_category=None,
    new_category=None,
    metadata=None,
):
    PriceAudit.objects.create(
        food=food,
        change_type=change_type,
        price_unit=price_unit,
        currency=currency,
        old_base_price=_as_decimal(old_price),
        new_base_price=_as_decimal(new_price),
        old_price_category=old_category,
        new_price_category=new_category,
        changed_by=changed_by,
        reason=reason or "",
        metadata=metadata or {},
    )


@transaction.atomic
def recalculate_price_thresholds(
    price_unit: str,
    currency: str = DEFAULT_CURRENCY,
    *,
    changed_by=None,
    reason: str | None = None,
) -> PriceCategoryThreshold:
    threshold, _ = PriceCategoryThreshold.objects.select_for_update().get_or_create(
        price_unit=price_unit,
        currency=currency,
        defaults={"updates_since_recalculation": 0},
    )

    lower, upper = _compute_tertiles(_fetch_sorted_prices(price_unit, currency))

    threshold.lower_threshold = lower
    threshold.upper_threshold = upper
    threshold.updates_since_recalculation = 0
    threshold.last_recalculated_at = timezone.now()
    threshold.save()

    _log_price_audit(
        change_type=PriceAudit.ChangeType.THRESHOLD_RECALC,
        price_unit=price_unit,
        currency=currency,
        changed_by=changed_by,
        reason=reason or "Automatic tertile recalculation",
        metadata={
            "lower_threshold": str(lower) if lower is not None else None,
            "upper_threshold": str(upper) if upper is not None else None,
        },
    )

    return threshold


def get_price_threshold(
    price_unit: str,
    currency: str = DEFAULT_CURRENCY,
    *,
    force_refresh: bool = False,
    changed_by=None,
    reason: str | None = None,
) -> PriceCategoryThreshold:
    try:
        threshold = PriceCategoryThreshold.objects.get(
            price_unit=price_unit, currency=currency
        )
    except PriceCategoryThreshold.DoesNotExist:
        threshold = recalculate_price_thresholds(
            price_unit,
            currency,
            changed_by=changed_by,
            reason=reason or "Initial tertile calculation",
        )
        return threshold

    needs_data = threshold.lower_threshold is None or threshold.upper_threshold is None
    if force_refresh or needs_data:
        return recalculate_price_thresholds(
            price_unit, currency, changed_by=changed_by, reason=reason
        )
    return threshold


def assign_price_category_value(
    base_price,
    price_unit: str,
    currency: str = DEFAULT_CURRENCY,
    *,
    changed_by=None,
) -> Optional[str]:
    price = _as_decimal(base_price)
    if price is None:
        return None

    threshold = get_price_threshold(
        price_unit,
        currency,
        changed_by=changed_by,
        reason="Automatic assignment requires thresholds",
    )
    lower = threshold.lower_threshold
    upper = threshold.upper_threshold

    if lower is None and upper is None:
        return None
    if lower is None:
        return PriceCategory.CHEAP if price <= upper else PriceCategory.PREMIUM
    if upper is None:
        return PriceCategory.CHEAP if price <= lower else PriceCategory.PREMIUM
    if price <= lower:
        return PriceCategory.CHEAP
    if price <= upper:
        return PriceCategory.MID
    return PriceCategory.PREMIUM


def _should_force_recalculation(threshold: PriceCategoryThreshold) -> bool:
    stale = (
        not threshold.last_recalculated_at
        or timezone.now() - threshold.last_recalculated_at >= MAX_THRESHOLD_AGE
    )
    return stale or threshold.updates_since_recalculation >= MAX_PRICE_UPDATES_BEFORE_RECALC


def register_price_update(entry: FoodEntry, *, changed_by=None):
    threshold, _ = PriceCategoryThreshold.objects.get_or_create(
        price_unit=entry.price_unit,
        currency=entry.currency,
        defaults={"updates_since_recalculation": 0},
    )
    PriceCategoryThreshold.objects.filter(pk=threshold.pk).update(
        updates_since_recalculation=models.F("updates_since_recalculation") + 1
    )
    threshold.refresh_from_db()

    if _should_force_recalculation(threshold):
        recalculate_price_thresholds(
            entry.price_unit,
            entry.currency,
            changed_by=changed_by,
            reason="Scheduled tertile refresh",
        )


def _derive_recipe_category(
    ingredient_categories: Iterable[str],
    *,
    fallback_cost: Optional[Decimal] = None,
    currency: str = DEFAULT_CURRENCY,
) -> Optional[str]:
    scores = [CATEGORY_SCORES.get(cat) for cat in ingredient_categories if CATEGORY_SCORES.get(cat)]
    if scores:
        average = sum(scores) / len(scores)
        if average < 1.5:
            return PriceCategory.CHEAP
        if average < 2.5:
            return PriceCategory.MID
        return PriceCategory.PREMIUM

    if fallback_cost is None:
        return None
    return assign_price_category_value(
        fallback_cost, PriceUnit.PER_UNIT, currency=currency
    )


@transaction.atomic
def recalculate_recipes_for_food(entry: FoodEntry, *, changed_by=None):
    from forum.models import Recipe

    recipe_ids = list(
        entry.recipeingredient_set.values_list("recipe_id", flat=True).distinct()
    )
    if not recipe_ids:
        return

    recipes = (
        Recipe.objects.filter(id__in=recipe_ids)
        .prefetch_related("ingredients__food")
        .select_for_update()
    )

    for recipe in recipes:
        total_cost = Decimal("0.00")
        ingredient_categories = []
        for ingredient in recipe.ingredients.all():
            cost = ingredient.estimated_cost
            total_cost += cost
            if ingredient.food.price_category:
                ingredient_categories.append(ingredient.food.price_category)

        quantized_cost = total_cost.quantize(Decimal("0.01")) if total_cost else None
        recipe.total_cost = quantized_cost
        recipe.currency = entry.currency
        recipe.price_category = _derive_recipe_category(
            ingredient_categories,
            fallback_cost=quantized_cost,
            currency=entry.currency,
        )
        recipe.save(update_fields=["total_cost", "currency", "price_category", "updated_at"])

        _log_price_audit(
            change_type=PriceAudit.ChangeType.RECIPE_RECALC,
            price_unit=entry.price_unit,
            currency=entry.currency,
            food=entry,
            changed_by=changed_by,
            reason="Recipe cost refreshed after price change",
            metadata={
                "recipe_id": recipe.id,
                "recipe_price_category": recipe.price_category,
                "recipe_total_cost": str(quantized_cost) if quantized_cost else None,
            },
        )


@transaction.atomic
def update_food_price(
    entry: FoodEntry,
    *,
    base_price,
    price_unit: Optional[str] = None,
    currency: Optional[str] = None,
    changed_by=None,
    reason: str = "",
    respect_override: bool = True,
) -> FoodEntry:
    old_price = entry.base_price
    old_category = entry.price_category

    new_price = _as_decimal(base_price)
    entry.base_price = new_price
    if price_unit:
        entry.price_unit = price_unit
    if currency:
        entry.currency = currency

    if entry.base_price is None:
        entry.price_category = None
    else:
        auto_category = assign_price_category_value(
            entry.base_price, entry.price_unit, entry.currency, changed_by=changed_by
        )
        if entry.category_overridden_by and respect_override:
            entry.price_category = entry.price_category or auto_category
        else:
            entry.price_category = auto_category

    entry.save(
        update_fields=[
            "base_price",
            "price_unit",
            "currency",
            "price_category",
        ]
    )

    _log_price_audit(
        change_type=PriceAudit.ChangeType.PRICE_UPDATE,
        price_unit=entry.price_unit,
        currency=entry.currency,
        food=entry,
        changed_by=changed_by,
        reason=reason or "Price updated",
        old_price=old_price,
        new_price=entry.base_price,
        old_category=old_category,
        new_category=entry.price_category,
    )

    if entry.base_price is not None:
        register_price_update(entry, changed_by=changed_by)
        recalculate_recipes_for_food(entry, changed_by=changed_by)

    return entry


@transaction.atomic
def override_food_price_category(
    entry: FoodEntry,
    *,
    category: str,
    changed_by,
    reason: str,
) -> FoodEntry:
    old_category = entry.price_category
    entry.price_category = category
    entry.category_overridden_by = changed_by
    entry.category_override_reason = reason
    entry.category_overridden_at = timezone.now()
    entry.save(
        update_fields=[
            "price_category",
            "category_overridden_by",
            "category_override_reason",
            "category_overridden_at",
        ]
    )

    _log_price_audit(
        change_type=PriceAudit.ChangeType.CATEGORY_OVERRIDE,
        price_unit=entry.price_unit,
        currency=entry.currency,
        food=entry,
        changed_by=changed_by,
        reason=reason,
        old_category=old_category,
        new_category=entry.price_category,
        old_price=entry.base_price,
        new_price=entry.base_price,
    )
    return entry


@transaction.atomic
def clear_food_price_override(entry: FoodEntry, *, changed_by=None) -> FoodEntry:
    entry.category_overridden_by = None
    entry.category_override_reason = ""
    entry.category_overridden_at = None
    entry.price_category = assign_price_category_value(
        entry.base_price, entry.price_unit, entry.currency, changed_by=changed_by
    )
    entry.save(
        update_fields=[
            "price_category",
            "category_overridden_by",
            "category_override_reason",
            "category_overridden_at",
        ]
    )
    return entry


@transaction.atomic
def approve_food_proposal(proposal: FoodProposal, *, changed_by=None):
    """
    Approve a food proposal and create a corresponding FoodEntry.
    Returns (proposal, food_entry).
    """
    if proposal.isApproved:
        return proposal, None

    proposal.isApproved = True
    proposal.save(update_fields=["isApproved"])

    entry = FoodEntry.objects.create(
        name=proposal.name,
        category=proposal.category,
        servingSize=proposal.servingSize,
        caloriesPerServing=proposal.caloriesPerServing,
        proteinContent=proposal.proteinContent,
        fatContent=proposal.fatContent,
        carbohydrateContent=proposal.carbohydrateContent,
        dietaryOptions=proposal.dietaryOptions,
        nutritionScore=proposal.nutritionScore,
        imageUrl=proposal.imageUrl,
        base_price=proposal.base_price,
        price_unit=proposal.price_unit or PriceUnit.PER_100G,
        currency=proposal.currency or DEFAULT_CURRENCY,
    )
    entry.allergens.set(proposal.allergens.all())

    if entry.base_price is not None:
        entry.price_category = assign_price_category_value(
            entry.base_price,
            entry.price_unit,
            entry.currency,
            changed_by=changed_by,
        )
        entry.save(update_fields=["price_category"])
        register_price_update(entry, changed_by=changed_by)
        _log_price_audit(
            change_type=PriceAudit.ChangeType.PRICE_UPDATE,
            price_unit=entry.price_unit,
            currency=entry.currency,
            food=entry,
            changed_by=changed_by,
            reason="Proposal approved and price recorded",
            old_price=None,
            new_price=entry.base_price,
            old_category=None,
            new_category=entry.price_category,
            metadata={"proposal_id": proposal.id},
        )

    return proposal, entry


@transaction.atomic
def reject_food_proposal(proposal: FoodProposal):
    proposal.isApproved = False
    proposal.save(update_fields=["isApproved"])
    return proposal
