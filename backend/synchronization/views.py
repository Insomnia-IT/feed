from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.status import HTTP_204_NO_CONTENT
from rest_framework.views import APIView

from synchronization.notion import NotionSync


class SyncWithNotion(APIView):
    """
    Синхронизация Volunteer с Notion
    """
    permission_classes = [permissions.IsAuthenticated, ]

    def post(self, request):
        all_data = True if request.query_params.get('all_data') else False
        NotionSync().main(all_data=all_data)
        return Response(status=HTTP_204_NO_CONTENT)
