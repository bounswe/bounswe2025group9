import jwt
from datetime import datetime, timedelta
from django.conf import settings


def generate_jwt_token(user):
    """Generate a JWT token for authentication"""
    payload = {
        "user_id": user.id,
        "username": user.username,
        "exp": datetime.utcnow() + timedelta(days=1),  # Token expires in 1 day
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return token
