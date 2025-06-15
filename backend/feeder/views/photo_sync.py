from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from feeder.models import Volunteer
from feeder.utils import download_and_save_photo

class DownloadVolunteerPhotos(APIView):
    permission_classes = [permissions.AllowAny, ]

    def post(self, request):
        limit = int(getattr(settings, 'PHOTO_DOWNLOAD_LIMIT', 100))
        volunteers = Volunteer.objects.filter(is_photo_updated=True)
        total = len(volunteers)
        volunteers_for_download = volunteers[:limit]
        count = 0
        for vol in volunteers_for_download:
            if not vol.photo:
                vol.is_photo_updated = False
                vol.save(update_fields=["is_photo_updated"])
                continue
            photo_path = download_and_save_photo(vol.photo, vol.id)
            if photo_path:
                vol.photo_local = photo_path
            vol.is_photo_updated = False
            vol.save(update_fields=["photo_local", "is_photo_updated"])
            count += 1
        return Response({"downloaded": count, "total": total}, status=status.HTTP_200_OK)
