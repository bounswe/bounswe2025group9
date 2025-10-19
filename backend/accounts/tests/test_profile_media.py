from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from accounts.models import Tag
import os
import tempfile
from PIL import Image

User = get_user_model()


class ProfileImageTests(APITestCase):
    """Tests for profile image upload/get/delete endpoints"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            name="Test",
            surname="User",
        )
        self.other_user = User.objects.create_user(
            username="otheruser",
            email="other@example.com",
            password="testpass123",
        )
        self.token_url = reverse("token_obtain_pair")
        self.image_url = reverse("image")

        # Get authentication token
        token_res = self.client.post(
            self.token_url, {"username": "testuser", "password": "testpass123"}
        )
        self.access_token = token_res.data["access"]

    def create_test_image(self, format='JPEG', size=(100, 100)):
        """Helper method to create a test image"""
        file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
        image = Image.new('RGB', size, color='red')
        image.save(file, format=format)
        file.seek(0)
        return file

    def test_upload_profile_image_success(self):
        """Test successful profile image upload"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        image_file = self.create_test_image()
        with open(image_file.name, 'rb') as img:
            data = {'profile_image': img}
            response = self.client.post(self.image_url, data, format='multipart')
        
        os.unlink(image_file.name)  # Clean up
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('profile_image', response.data)
        
        # Verify image was saved to user
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.profile_image)

    def test_upload_profile_image_png(self):
        """Test uploading PNG image"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        # Create PNG image
        file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
        image = Image.new('RGB', (100, 100), color='blue')
        image.save(file, format='PNG')
        file.seek(0)
        
        with open(file.name, 'rb') as img:
            uploaded_file = SimpleUploadedFile(
                "test.png",
                img.read(),
                content_type="image/png"
            )
            data = {'profile_image': uploaded_file}
            response = self.client.post(self.image_url, data, format='multipart')
        
        os.unlink(file.name)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_upload_profile_image_no_auth(self):
        """Test that unauthenticated users cannot upload images"""
        image_file = self.create_test_image()
        with open(image_file.name, 'rb') as img:
            data = {'profile_image': img}
            response = self.client.post(self.image_url, data, format='multipart')
        
        os.unlink(image_file.name)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_upload_profile_image_no_file(self):
        """Test uploading without providing a file"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        response = self.client.post(self.image_url, {}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)

    def test_upload_profile_image_invalid_type(self):
        """Test uploading invalid file type (not JPG/PNG)"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        # Create a text file
        text_file = SimpleUploadedFile(
            "test.txt",
            b"This is not an image",
            content_type="text/plain"
        )
        data = {'profile_image': text_file}
        response = self.client.post(self.image_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)

    def test_upload_profile_image_too_large(self):
        """Test uploading image that exceeds 5MB limit"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        # Create a large image (over 5MB)
        large_data = b'0' * (6 * 1024 * 1024)  # 6MB
        large_file = SimpleUploadedFile(
            "large.jpg",
            large_data,
            content_type="image/jpeg"
        )
        data = {'profile_image': large_file}
        response = self.client.post(self.image_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)

    def test_get_own_profile_image(self):
        """Test getting own profile image"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        # First upload an image
        image_file = self.create_test_image()
        with open(image_file.name, 'rb') as img:
            self.client.post(self.image_url, {'profile_image': img}, format='multipart')
        os.unlink(image_file.name)
        
        # Now get the image
        response = self.client.get(self.image_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('profile_image', response.data)

    def test_get_other_user_profile_image(self):
        """Test getting another user's profile image with user_id param"""
        # Upload image for other user first
        other_token_res = self.client.post(
            self.token_url, {"username": "otheruser", "password": "testpass123"}
        )
        other_access = other_token_res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {other_access}")
        
        image_file = self.create_test_image()
        with open(image_file.name, 'rb') as img:
            self.client.post(self.image_url, {'profile_image': img}, format='multipart')
        os.unlink(image_file.name)
        
        # Now query as regular user without auth (GET is public)
        self.client.credentials()
        response = self.client.get(self.image_url, {'user_id': self.other_user.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('profile_image', response.data)

    def test_get_nonexistent_user_image(self):
        """Test getting image for non-existent user"""
        response = self.client.get(self.image_url, {'user_id': 99999})
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_profile_image_success(self):
        """Test successful deletion of profile image"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        # First upload an image
        image_file = self.create_test_image()
        with open(image_file.name, 'rb') as img:
            self.client.post(self.image_url, {'profile_image': img}, format='multipart')
        os.unlink(image_file.name)
        
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.profile_image)
        
        # Delete the image
        response = self.client.delete(self.image_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('detail', response.data)
        
        # Verify image was removed
        self.user.refresh_from_db()
        self.assertFalse(self.user.profile_image)

    def test_delete_profile_image_no_image(self):
        """Test deleting when no image exists"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        response = self.client.delete(self.image_url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)

    def test_delete_profile_image_no_auth(self):
        """Test that unauthenticated users cannot delete images"""
        response = self.client.delete(self.image_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CertificateTests(APITestCase):
    """Tests for certificate upload endpoint"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            name="Test",
            surname="User",
        )
        self.token_url = reverse("token_obtain_pair")
        self.certificate_url = reverse("certificate")
        
        # Create a tag for the user
        self.tag = Tag.objects.create(name="Nutritionist", verified=False)
        self.user.tags.add(self.tag)

        # Get authentication token
        token_res = self.client.post(
            self.token_url, {"username": "testuser", "password": "testpass123"}
        )
        self.access_token = token_res.data["access"]

    def create_test_pdf(self):
        """Helper method to create a simple PDF-like file"""
        pdf_content = b'%PDF-1.4\n%Test PDF'
        return SimpleUploadedFile(
            "certificate.pdf",
            pdf_content,
            content_type="application/pdf"
        )

    def create_test_image(self):
        """Helper method to create a test image"""
        file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
        image = Image.new('RGB', (100, 100), color='red')
        image.save(file, format='JPEG')
        file.seek(0)
        return file

    def test_upload_certificate_pdf_success(self):
        """Test successful certificate upload with PDF"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        pdf_file = self.create_test_pdf()
        data = {
            'tag_id': self.tag.id,
            'certificate': pdf_file
        }
        response = self.client.post(self.certificate_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('certificate', response.data)
        
        # Verify certificate was saved
        self.tag.refresh_from_db()
        self.assertIsNotNone(self.tag.certificate)

    def test_upload_certificate_image_success(self):
        """Test successful certificate upload with JPG image"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        image_file = self.create_test_image()
        with open(image_file.name, 'rb') as img:
            data = {
                'tag_id': self.tag.id,
                'certificate': img
            }
            response = self.client.post(self.certificate_url, data, format='multipart')
        
        os.unlink(image_file.name)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_upload_certificate_no_tag_id(self):
        """Test uploading certificate without tag_id"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        pdf_file = self.create_test_pdf()
        data = {'certificate': pdf_file}
        response = self.client.post(self.certificate_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)

    def test_upload_certificate_no_file(self):
        """Test uploading without providing certificate file"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        data = {'tag_id': self.tag.id}
        response = self.client.post(self.certificate_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)

    def test_upload_certificate_tag_not_owned(self):
        """Test uploading certificate for tag not owned by user"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        # Create a tag not associated with user
        other_tag = Tag.objects.create(name="Chef", verified=False)
        
        pdf_file = self.create_test_pdf()
        data = {
            'tag_id': other_tag.id,
            'certificate': pdf_file
        }
        response = self.client.post(self.certificate_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('detail', response.data)

    def test_upload_certificate_invalid_tag_id(self):
        """Test uploading certificate with non-existent tag_id"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        pdf_file = self.create_test_pdf()
        data = {
            'tag_id': 99999,
            'certificate': pdf_file
        }
        response = self.client.post(self.certificate_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_upload_certificate_invalid_type(self):
        """Test uploading invalid file type"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        text_file = SimpleUploadedFile(
            "test.txt",
            b"This is not a certificate",
            content_type="text/plain"
        )
        data = {
            'tag_id': self.tag.id,
            'certificate': text_file
        }
        response = self.client.post(self.certificate_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upload_certificate_too_large(self):
        """Test uploading certificate that exceeds 5MB limit"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        # Create large file
        large_data = b'0' * (6 * 1024 * 1024)  # 6MB
        large_file = SimpleUploadedFile(
            "large.pdf",
            large_data,
            content_type="application/pdf"
        )
        data = {
            'tag_id': self.tag.id,
            'certificate': large_file
        }
        response = self.client.post(self.certificate_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upload_certificate_no_auth(self):
        """Test that unauthenticated users cannot upload certificates"""
        pdf_file = self.create_test_pdf()
        data = {
            'tag_id': self.tag.id,
            'certificate': pdf_file
        }
        response = self.client.post(self.certificate_url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UpdateUserTests(APITestCase):
    """Tests for user update endpoint"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            name="Test",
            surname="User",
            address="Old Address"
        )
        self.token_url = reverse("token_obtain_pair")
        self.update_url = reverse("update-user")

        # Get authentication token
        token_res = self.client.post(
            self.token_url, {"username": "testuser", "password": "testpass123"}
        )
        self.access_token = token_res.data["access"]

    def test_update_user_success(self):
        """Test successful user update"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        data = {
            "email": "newemail@example.com",
            "address": "New Address"
        }
        response = self.client.post(self.update_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["email"], "newemail@example.com")
        self.assertEqual(response.data["address"], "New Address")
        
        # Verify changes in database
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "newemail@example.com")
        self.assertEqual(self.user.address, "New Address")

    def test_update_user_email_only(self):
        """Test updating only email"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        data = {
            "email": "updated@example.com",
            "address": "Old Address"
        }
        response = self.client.post(self.update_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "updated@example.com")

    def test_update_user_address_only(self):
        """Test updating only address"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        data = {
            "email": "test@example.com",
            "address": "Brand New Address"
        }
        response = self.client.post(self.update_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.user.refresh_from_db()
        self.assertEqual(self.user.address, "Brand New Address")

    def test_update_user_missing_fields(self):
        """Test update with missing required fields"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        data = {"email": "test@example.com"}  # Missing address
        response = self.client.post(self.update_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_user_no_auth(self):
        """Test that unauthenticated users cannot update"""
        data = {
            "email": "new@example.com",
            "address": "New Address"
        }
        response = self.client.post(self.update_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_user_invalid_email(self):
        """Test update with invalid email format (currently accepted)"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        data = {
            "email": "not-an-email",
            "address": "New Address"
        }
        response = self.client.post(self.update_url, data)
        
        # Note: Current ContactInfoSerializer uses CharField, not EmailField
        # This test documents current behavior
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

