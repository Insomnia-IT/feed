from django.conf import settings
from django.http import FileResponse
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

import os

class FileServeView(APIView):
    def get(self, request, filename):
        filepath = os.path.join(settings.PHOTO_STORAGE_PATH, filename)

        if not os.path.exists(filepath):
            return Response({"error": f"File does not exist"}, status=status.HTTP_404_NOT_FOUND)
        return FileResponse(open(filepath, 'rb'), content_type='image/jpeg')
