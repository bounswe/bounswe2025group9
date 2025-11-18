"""
Service layer for food-related business logic.
This module contains reusable business logic that can be used by both
Django Admin and REST API endpoints.
"""

from django.db import transaction
from .models import FoodEntry, FoodProposal


@transaction.atomic
def approve_food_proposal(proposal):
    """
    Approve a food proposal and create a corresponding FoodEntry.

    Args:
        proposal: FoodProposal instance to approve

    Returns:
        tuple: (FoodProposal, FoodEntry) - The updated proposal and created entry
    """
    if proposal.isApproved:
        # Already approved, return existing
        return proposal, None

    # Mark as approved
    proposal.isApproved = True
    proposal.save()

    # Create FoodEntry from the proposal
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
    )

    # Copy allergens relationship
    entry.allergens.set(proposal.allergens.all())

    return proposal, entry


@transaction.atomic
def reject_food_proposal(proposal):
    """
    Reject a food proposal.

    Args:
        proposal: FoodProposal instance to reject

    Returns:
        FoodProposal: The updated proposal instance
    """
    proposal.isApproved = False
    proposal.save()
    return proposal
