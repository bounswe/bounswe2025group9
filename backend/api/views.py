from django.http import JsonResponse, HttpRequest
from datetime import datetime
from rest_framework.decorators import api_view


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status
from datetime import datetime


class TimeView(APIView):
    permission_classes = []

    def get(self, request: Request) -> Response:
        """
        GET /time?name={name}

        Returns the current time and the provided name.

        Example:
            {
                "time": "2023-10-01T12:00:00",
                "name": "Arda"
            }
        """
        name = request.query_params.get("name")
        if not name:
            return Response(
                {"error": "name is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        return Response({"time": datetime.now().isoformat(), "name": name})
