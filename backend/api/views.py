from django.http import JsonResponse, HttpRequest
from datetime import datetime


def get_time(request: HttpRequest):
    """ "
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
