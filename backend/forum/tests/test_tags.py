from typing import Any, cast
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework.views import Response
from forum.models import Post, Tag

User = get_user_model()


class TaggingTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="pass123")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.tag1, _ = Tag.objects.get_or_create(name="Dietary tip")
        self.tag2, _ = Tag.objects.get_or_create(name="Recipe")

        self.post1 = Post.objects.create(
            title="Apple tips", body="Use fiber-rich fruits", author=self.user
        )
        self.post1.tags.set([self.tag1])

        self.post2 = Post.objects.create(
            title="Avocado toast", body="Good fats", author=self.user
        )
        self.post2.tags.set([self.tag2])

        self.post3 = Post.objects.create(
            title="Hybrid Post", body="Both tips and recipes", author=self.user
        )
        self.post3.tags.set([self.tag1, self.tag2])

    def test_create_post_with_tags(self):
        response = cast(
            Response,
            self.client.post(
                "/forum/posts/",
                {
                    "title": "Tagged Post",
                    "body": "Tagged with dietary tip and recipe.",
                    "tag_ids": [self.tag1.id, self.tag2.id],
                },
                format="json",
            ),
        )
        self.assertEqual(response.status_code, 201)
        post = Post.objects.get(title="Tagged Post")
        self.assertEqual(post.tags.count(), 2)
        self.assertIn(self.tag1, post.tags.all())
        self.assertIn(self.tag2, post.tags.all())

    def test_filter_by_single_tag(self):
        response = cast(Any, self.client.get(f"/forum/posts/?tags={self.tag1.id}"))
        self.assertEqual(response.status_code, 200)

        titles = [p["title"] for p in response.data["results"]]
        self.assertIn("Apple tips", titles)
        self.assertIn("Hybrid Post", titles)
        self.assertNotIn("Avocado toast", titles)

    def test_filter_by_multiple_tags(self):
        # Should return posts that match tag1 OR tag2
        response = cast(
            Any,
            self.client.get(f"/forum/posts/?tags={self.tag1.id}&tags={self.tag2.id}"),
        )
        self.assertEqual(response.status_code, 200)

        titles = [p["title"] for p in response.data["results"]]
        self.assertIn("Apple tips", titles)
        self.assertIn("Avocado toast", titles)
        self.assertIn("Hybrid Post", titles)

    def test_ordering_by_created_at(self):
        # ascending
        response = cast(Any, self.client.get("/forum/posts/?ordering=created_at"))
        self.assertEqual(response.status_code, 200)
        ordered_titles = [p["title"] for p in response.data["results"]]
        self.assertEqual(ordered_titles, ["Apple tips", "Avocado toast", "Hybrid Post"])

        # descending
        response = cast(Any, self.client.get("/forum/posts/?ordering=-created_at"))
        self.assertEqual(response.status_code, 200)
        ordered_titles = [p["title"] for p in response.data["results"]]
        self.assertEqual(ordered_titles, ["Hybrid Post", "Avocado toast", "Apple tips"])
