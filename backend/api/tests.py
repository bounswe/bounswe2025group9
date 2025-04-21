from typing import cast
from django.http import HttpResponse
from django.test import TestCase
from django.contrib.auth.models import User
import json


class GetTimeTest(TestCase):
    def test_get_time_success(self):
        response = cast(HttpResponse, self.client.get("/api/time?name=Arda"))
        self.assertEqual(response.status_code, 200)
        self.assertIn("time", response.json())  # type: ignore
        self.assertEqual(response.json()["name"], "Arda")  # type:ignore

class LoginTest(TestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        
    def test_login_success(self):
        """Test successful login with correct credentials"""
        response = self.client.post(
            '/api/login',
            json.dumps({
                'username': 'testuser',
                'password': 'testpassword123'
            }),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('token', data)
        self.assertIn('user', data)
        self.assertEqual(data['user']['username'], 'testuser')
        
    def test_login_invalid_credentials(self):
        """Test login with incorrect password"""
        response = self.client.post(
            '/api/login',
            json.dumps({
                'username': 'testuser',
                'password': 'wrongpassword'
            }),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)
        self.assertIn('error', response.json())
        
    def test_login_missing_fields(self):
        """Test login with missing fields"""
        response = self.client.post(
            '/api/login',
            json.dumps({
                'username': 'testuser'
                # Missing password
            }),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())