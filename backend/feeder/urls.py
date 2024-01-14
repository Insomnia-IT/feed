from django.urls import include, path
from rest_framework import routers, serializers, viewsets
from feeder import views
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

router = routers.DefaultRouter()
router.register(r'departments', views.DepartmentViewSet)
router.register(r'volunteers', views.VolunteerViewSet)
router.register(r'locations', views.LocationViewSet)
router.register(r'colors', views.ColorViewSet)
router.register(r'feed-types', views.FeedTypeViewSet)
router.register(r'feed-transaction', views.FeedTransactionViewSet)
router.register(r'kitchens', views.KitchenViewSet)
router.register(r'group-badges', views.GroupBadgeViewSet)
router.register(r'volunteer-custom-fields', views.VolunteerCustomFieldViewSet)

urlpatterns = [
    path('', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('auth/', include('dj_rest_auth.urls')),

    path('', include(router.urls)),
    # path('update-balance', views.UpdateBalance.as_view()),
    path('feed-transaction/bulk', views.FeedTransactionBulk.as_view()), 
    path('statistics/', views.Statistics.as_view()),
    path('notion-sync', views.SyncWithNotion.as_view()),
]

