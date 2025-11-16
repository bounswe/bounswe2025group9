from .repositories import get_all_users, create_user, update_user as repo_update_user

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
