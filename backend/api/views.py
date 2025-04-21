from django.http import JsonResponse, HttpRequest
from datetime import datetime
from django.contrib.auth import authenticate
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .auth import generate_jwt_token

def get_time(request: HttpRequest):
    """
    Get the current time.

    GET /time?name={name}

    example:
        {
            "time": "2023-10-01T12:00:00",
            "name": "Arda"
        }
    """
    if request.method == "GET":
        name = request.GET.get("name")
        if name is None:
            return JsonResponse({"error": "name is required"}, status=400)
        return JsonResponse({"time": datetime.now().isoformat(), "name": name})


@csrf_exempt
def login_view(request):
    """
    Login with username and password.
    
    POST /api/login
    Payload: { "username": "user", "password": "pass" }
    
    Response:
    Success: { "token": "jwt_token", "user": {"id": 1, "username": "username"} }
    Error: { "error": "Invalid credentials" }
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
        
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        # Validate input
        if not username or not password:
            return JsonResponse({
                "error": "Missing required fields",
                "message": "Username and password are required"
            }, status=400)
            
        # Authenticate user
        user = authenticate(username=username, password=password)
        
        if user is None:
            return JsonResponse({
                "error": "Invalid credentials",
                "message": "The username or password is incorrect"
            }, status=401)
            
        # Generate JWT token
        token = generate_jwt_token(user)
        
        # Return token and user info
        return JsonResponse({
            'token': token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        })
            
    except json.JSONDecodeError:
        return JsonResponse({
            "error": "Invalid JSON",
            "message": "The request body is not valid JSON"
        }, status=400)