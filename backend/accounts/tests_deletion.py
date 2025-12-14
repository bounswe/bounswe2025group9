from django.test import TestCase
from django.contrib.auth import get_user_model
from accounts.models import AccountDeletionLog, Recipe as PersonalRecipe
from foods.models import FoodEntry, FoodProposal
from forum.models import Post, Comment
from meal_planner.models import MealPlan, DailyNutritionLog
from accounts.services import delete_user_account
import datetime

User = get_user_model()

class AccountDeletionTest(TestCase):
    def make_proposal(self, user, status, **food_kwargs):
        food_entry = FoodEntry.objects.create(
            **food_kwargs,
            createdBy=user,
            validated=(status == 'approved')
        )
        return FoodProposal.objects.create(
            food_entry=food_entry,
            proposedBy=user,
            isApproved=(status == 'approved' if status in ['approved', 'rejected'] else None)
        )

    def setUp(self):
        self.user = User.objects.create_user(username='todelete', email='delete@example.com', password='password')
        
        # Create Personal Data
        self.meal_plan = MealPlan.objects.create(user=self.user, name="My Plan")
        self.log = DailyNutritionLog.objects.create(user=self.user, date=datetime.date.today())
        self.personal_recipe = PersonalRecipe.objects.create(owner=self.user, name="My Secret Recipe")

        self.rejected_proposal = self.make_proposal(
            user=self.user,
            status='rejected',
            name="Bad Food",
            category="Test", servingSize=1, caloriesPerServing=1, proteinContent=1, fatContent=1, carbohydrateContent=1, nutritionScore=1
        )
        
        # Create Shared Data
        self.approved_proposal = self.make_proposal(
            user=self.user,
            status='approved',
            name="Good Food",
            category="Test", servingSize=1, caloriesPerServing=1, proteinContent=1, fatContent=1, carbohydrateContent=1, nutritionScore=1
        )
        self.post = Post.objects.create(author=self.user, title="My Post", body="Content")
        self.comment = Comment.objects.create(author=self.user, post=self.post, body="My Comment")

    def test_delete_account(self):
        # Run deletion
        delete_user_account(self.user, reason="GDPR Request")
        
        # Verify User is gone
        with self.assertRaises(User.DoesNotExist):
            User.objects.get(username='todelete')
            
        # Verify Personal Data is gone
        self.assertFalse(MealPlan.objects.filter(id=self.meal_plan.id).exists())
        self.assertFalse(DailyNutritionLog.objects.filter(id=self.log.id).exists())
        self.assertFalse(PersonalRecipe.objects.filter(id=self.personal_recipe.id).exists())
        self.assertFalse(FoodProposal.objects.filter(id=self.rejected_proposal.id).exists())
        
        # Verify Shared Data exists but is anonymized
        approved_proposal = FoodProposal.objects.get(id=self.approved_proposal.id)
        self.assertIsNone(approved_proposal.proposedBy)
        
        post = Post.objects.get(id=self.post.id)
        self.assertIsNone(post.author)
        
        comment = Comment.objects.get(id=self.comment.id)
        self.assertIsNone(comment.author)
        
        # Verify Audit Log
        log = AccountDeletionLog.objects.get(user_identifier='todelete')
        self.assertEqual(log.email, 'delete@example.com')
        self.assertEqual(log.reason, 'GDPR Request')
        self.assertIn('anonymized', log.details)
        self.assertIn('deleted', log.details)
        self.assertEqual(log.details['anonymized']['forum_posts'], 1)
