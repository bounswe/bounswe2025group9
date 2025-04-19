from django.http import JsonResponse, HttpRequest
from datetime import datetime
from django.contrib.auth import login
from django.views.decorators.csrf import csrf_exempt
from django.db import IntegrityError
from django.contrib.auth.models import User


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
def signup_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)

    data = {
        key: request.POST.get(key, "").strip()
        for key in ["username", "email", "password1", "password2"]
    }

    if not all(data.values()):
        return JsonResponse({"error": "All fields are required"}, status=400)

    if data["password1"] != data["password2"]:
        return JsonResponse({"error": "Passwords do not match"}, status=400)

    if User.objects.filter(username=data["username"]).exists():
        return JsonResponse({"error": "Username already taken"}, status=400)

    if User.objects.filter(email=data["email"]).exists():
        return JsonResponse({"error": "Email already in use"}, status=400)

    try:
        user = User.objects.create_user(
            username=data["username"], email=data["email"], password=data["password1"]
        )
        login(request, user)
        return JsonResponse({"success": "User created", "user_id": user.id})
    except IntegrityError:
        return JsonResponse({"error": "Failed to create user"}, status=500)
