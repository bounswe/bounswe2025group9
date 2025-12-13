from .repositories import get_all_users, create_user, update_user as repo_update_user
from django.db import transaction
from .models import AccountDeletionLog, User, Recipe, UserMetrics, NutritionTargets
from foods.models import FoodProposal
from forum.models import Post, Comment
from meal_planner.models import MealPlan, DailyNutritionLog

"""
Main logic of backend application is generally placed in services layer. 
This layer is responsible for the business logic of the application.
It should not be responsible for any data access logic, so we use repositories layer for that.
Data manipulation, data validation, and data transformation should be done in this layer.
"""


def list_users():
    return get_all_users()


def register_user(validated_data):
    return create_user(validated_data)


def update_user(user, validated_data):
    return repo_update_user(user, validated_data)


BADGE_RULES = {
    "recipes": [
        (10, "Posted 10 recipes"),
        (50, "Posted 50 recipes"),
        (100, "Posted 100 recipes"),
    ],
    "likes": [
        (10, "Received 10 likes"),
        (50, "Received 50 likes"),
        (100, "Received 100 likes"),
    ],
    "food_proposals": [
        (5, "5 approved food proposals"),
        (15, "15 approved food proposals"),
        (30, "30 approved food proposals"),
    ],
}


def get_user_badges(user):
    badges = []

    # recipe milestones
    recipe_count = user.recipes.count()
    for milestone, desc in BADGE_RULES["recipes"]:
        if recipe_count >= milestone:
            badges.append({"type": "recipes", "level": milestone, "description": desc})

    # likes milestones
    total_likes = sum(r.likes for r in user.recipes.all())
    for milestone, desc in BADGE_RULES["likes"]:
        if total_likes >= milestone:
            badges.append({"type": "likes", "level": milestone, "description": desc})

    # food proposals milestones (only approved proposals count)
    food_proposal_count = user.foodproposal_set.filter(isApproved=True).count()
    for milestone, desc in BADGE_RULES["food_proposals"]:
        if food_proposal_count >= milestone:
            badges.append({"type": "food_proposals", "level": milestone, "description": desc})

    return badges


# Certificate Verification Services


def approve_user_tag_certificate(user_tag):
    """
    Approve a user's profession certificate.

    Args:
        user_tag: UserTag instance to approve

    Returns:
        UserTag: The updated user_tag instance
    """
    user_tag.verified = True
    user_tag.save()
    return user_tag


def reject_user_tag_certificate(user_tag):
    """
    Reject a user's profession certificate.

    Args:
        user_tag: UserTag instance to reject

    Returns:
        UserTag: The updated user_tag instance
    """
    user_tag.verified = False
    user_tag.save()
    return user_tag


def delete_user_account(user: User, reason: str = "") -> None:
    """
    Permanently deletes a user account and associated personal data,
    while anonymizing shared content (forum posts, approved food proposals).
    
    Args:
        user: The User instance to delete.
        reason: Optional reason for deletion.
    """
    with transaction.atomic():
        # 1. Audit Start
        # We create the log entry first, but since it's atomic, if it fails, everything rolls back.
        # We store the username/email as text because the User object will be gone.
        audit_log = AccountDeletionLog.objects.create(
            user_identifier=user.username,
            email=user.email,
            reason=reason,
            details={}
        )
        
        details = {
            "anonymized": {},
            "deleted": {}
        }

        # 2. Anonymize Shared Content
        
        # Food Proposals: Only keep APPROVED ones, anonymize them.
        # Rejected/Pending ones are deleted.
        approved_proposals = FoodProposal.objects.filter(proposedBy=user, isApproved=True)
        updated_count = approved_proposals.update(proposedBy=None)
        details["anonymized"]["food_proposals"] = updated_count
        
        # Forum Posts
        posts = Post.objects.filter(author=user)
        updated_count = posts.update(author=None)
        details["anonymized"]["forum_posts"] = updated_count
        
        # Comments
        comments = Comment.objects.filter(author=user)
        updated_count = comments.update(author=None)
        details["anonymized"]["forum_comments"] = updated_count

        # 3. Delete Personal Content
        
        # Rejected/Pending Food Proposals
        rejected_pending_proposals = FoodProposal.objects.filter(proposedBy=user).exclude(isApproved=True)
        count, _ = rejected_pending_proposals.delete()
        details["deleted"]["food_proposals_rejected_pending"] = count
        
        # Personal Recipes (accounts.Recipe)
        # Note: forum.Recipe is OneToOne with Post, so if Post is kept (anonymized), 
        # the recipe content stays with it. accounts.Recipe is personal.
        personal_recipes = Recipe.objects.filter(owner=user)
        count, _ = personal_recipes.delete()
        details["deleted"]["personal_recipes"] = count
        
        # Meal Plans
        meal_plans = MealPlan.objects.filter(user=user)
        count, _ = meal_plans.delete()
        details["deleted"]["meal_plans"] = count
        
        # Daily Nutrition Logs
        logs = DailyNutritionLog.objects.filter(user=user)
        count, _ = logs.delete()
        details["deleted"]["daily_nutrition_logs"] = count
        
        # User Metrics & Targets (OneToOne, should cascade, but explicit is safe)
        if hasattr(user, 'metrics'):
            user.metrics.delete()
            details["deleted"]["user_metrics"] = 1
            
        if hasattr(user, 'nutrition_targets'):
            user.nutrition_targets.delete()
            details["deleted"]["nutrition_targets"] = 1

        # 4. Delete User
        # This will cascade delete many other things linked by CASCADE
        # (e.g. UserTag, Follow, Report, etc.)
        user.delete()
        
        # 5. Update Audit Log
        audit_log.details = details
        audit_log.save()

