from django.test import TestCase
from django.contrib.auth import get_user_model
from foods.models import FoodEntry, FoodProposal
from accounts.services import get_user_badges, BADGE_RULES

User = get_user_model()


class FoodProposalBadgeTests(TestCase):
    """Test that food proposal badges are awarded correctly based on approved proposals only."""

    def setUp(self):
        """Create a test user for all tests."""
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            name="Test",
            surname="User"
        )

    def make_proposal(self, user, status, **food_kwargs):
        food_entry = FoodEntry.objects.create(
            **food_kwargs,
            category="Test",
            servingSize=100,
            caloriesPerServing=100,
            proteinContent=10,
            fatContent=5,
            carbohydrateContent=20,
            nutritionScore=7.5,
            createdBy=user,
            validated=(status == 'approved')
        )
        return FoodProposal.objects.create(
            food_entry=food_entry,
            proposedBy=user,
            isApproved=(status == 'approved' if status in ['approved', 'rejected'] else None)
        )


    def test_no_badges_with_zero_approved_proposals(self):
        """Test that no food proposal badges are awarded when user has no approved proposals."""
        badges = get_user_badges(self.user)
        food_badges = [b for b in badges if b["type"] == "food_proposals"]
        self.assertEqual(len(food_badges), 0)


    def test_no_badges_with_only_pending_proposals(self):
        """Test that pending proposals (isApproved=None) don't count toward badges."""
        # Create 10 pending proposals
        for i in range(10):
            self.make_proposal(
                user=self.user,
                status='pending',
                name=f"Food {i}",

            )

        badges = get_user_badges(self.user)
        food_badges = [b for b in badges if b["type"] == "food_proposals"]
        self.assertEqual(len(food_badges), 0, "Pending proposals should not count toward badges")

    def test_no_badges_with_only_rejected_proposals(self):
        """Test that rejected proposals (isApproved=False) don't count toward badges."""
        # Create 10 rejected proposals
        for i in range(10):
            self.make_proposal(
                user=self.user,
                status='rejected',
                name=f"Food {i}",
            )

        badges = get_user_badges(self.user)
        food_badges = [b for b in badges if b["type"] == "food_proposals"]
        self.assertEqual(len(food_badges), 0, "Rejected proposals should not count toward badges")

    def test_first_milestone_badge_with_5_approved_proposals(self):
        """Test that the first badge (5 approved proposals) is awarded correctly."""
        # Create exactly 5 approved proposals
        for i in range(5):
            self.make_proposal(
                user=self.user,
                status='approved',
                name=f"Food {i}",
            )

        badges = get_user_badges(self.user)
        food_badges = [b for b in badges if b["type"] == "food_proposals"]
        
        self.assertEqual(len(food_badges), 1, "Should have exactly 1 food proposal badge")
        self.assertEqual(food_badges[0]["level"], 5)
        self.assertEqual(food_badges[0]["description"], "5 approved food proposals")

    def test_second_milestone_badge_with_15_approved_proposals(self):
        """Test that badges accumulate correctly at 15 approved proposals."""
        # Create 15 approved proposals
        for i in range(15):
            self.make_proposal(
                user=self.user,
                status='approved',
                name=f"Food {i}",
            )

        badges = get_user_badges(self.user)
        food_badges = [b for b in badges if b["type"] == "food_proposals"]
        
        self.assertEqual(len(food_badges), 2, "Should have 2 food proposal badges")
        badge_levels = [b["level"] for b in food_badges]
        self.assertIn(5, badge_levels)
        self.assertIn(15, badge_levels)

    def test_all_badges_with_30_approved_proposals(self):
        """Test that all three badges are awarded with 30 approved proposals."""
        # Create 30 approved proposals
        for i in range(30):
            self.make_proposal(
                user=self.user,
                status='approved',
                name=f"Food {i}",
            )

        badges = get_user_badges(self.user)
        food_badges = [b for b in badges if b["type"] == "food_proposals"]
        
        self.assertEqual(len(food_badges), 3, "Should have all 3 food proposal badges")
        badge_levels = [b["level"] for b in food_badges]
        self.assertIn(5, badge_levels)
        self.assertIn(15, badge_levels)
        self.assertIn(30, badge_levels)

    def test_mixed_proposals_only_count_approved(self):
        """Test that only approved proposals count when there's a mix of approved, pending, and rejected."""
        # Create 20 approved, 10 pending, 10 rejected
        for i in range(20):
            self.make_proposal(
                user=self.user,
                status='approved',
                name=f"Approved Food {i}",
            )
        
        for i in range(10):
            self.make_proposal(
                user=self.user,
                status='pending',
                name=f"Pending Food {i}",
            )
        
        for i in range(10):
            self.make_proposal(
                user=self.user,
                status='rejected',
                name=f"Rejected Food {i}",
            )

        # Total: 40 proposals, but only 20 are approved
        badges = get_user_badges(self.user)
        food_badges = [b for b in badges if b["type"] == "food_proposals"]
        
        # Should have 2 badges (5 and 15), not 3 (since 20 < 30)
        self.assertEqual(len(food_badges), 2, "Should only count approved proposals")
        badge_levels = [b["level"] for b in food_badges]
        self.assertIn(5, badge_levels)
        self.assertIn(15, badge_levels)
        self.assertNotIn(30, badge_levels)

    def test_user_with_4_approved_proposals_gets_no_badge(self):
        """Test edge case: 4 approved proposals (just below threshold) earns no badge."""
        for i in range(4):
            self.make_proposal(
                user=self.user,
                status='approved',
                name=f"Food {i}",
            )

        badges = get_user_badges(self.user)
        food_badges = [b for b in badges if b["type"] == "food_proposals"]
        self.assertEqual(len(food_badges), 0, "4 proposals should not earn a badge")

    def test_user_with_14_approved_proposals_gets_one_badge(self):
        """Test edge case: 14 approved proposals earns only the first badge."""
        for i in range(14):
            self.make_proposal(
                user=self.user,
                status='approved',
                name=f"Food {i}",
            )


        badges = get_user_badges(self.user)
        food_badges = [b for b in badges if b["type"] == "food_proposals"]
        self.assertEqual(len(food_badges), 1)
        self.assertEqual(food_badges[0]["level"], 5)

    def test_badge_rules_exist(self):
        """Test that food_proposals badge rules are properly configured."""
        self.assertIn("food_proposals", BADGE_RULES)
        rules = BADGE_RULES["food_proposals"]
        self.assertEqual(len(rules), 3)
        self.assertEqual(rules[0], (5, "5 approved food proposals"))
        self.assertEqual(rules[1], (15, "15 approved food proposals"))
        self.assertEqual(rules[2], (30, "30 approved food proposals"))

    def test_multiple_users_badges_independent(self):
        """Test that badges are calculated independently for each user."""
        # Create another user
        user2 = User.objects.create_user(
            username="testuser2",
            email="test2@example.com",
            password="testpass123",
            name="Test2",
            surname="User2"
        )

        # User 1 has 15 approved proposals
        for i in range(15):
            self.make_proposal(
                user=self.user,
                status='approved',
                name=f"User1 Food {i}",
            )


        # User 2 has 5 approved proposals
        for i in range(5):
            self.make_proposal(
                user=user2,
                status='approved',
                name=f"User2 Food {i}",
            )

        user1_badges = get_user_badges(self.user)
        user1_food_badges = [b for b in user1_badges if b["type"] == "food_proposals"]
        
        user2_badges = get_user_badges(user2)
        user2_food_badges = [b for b in user2_badges if b["type"] == "food_proposals"]

        self.assertEqual(len(user1_food_badges), 2, "User 1 should have 2 badges")
        self.assertEqual(len(user2_food_badges), 1, "User 2 should have 1 badge")
