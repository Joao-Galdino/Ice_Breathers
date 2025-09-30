from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView, LoginView, UserProfileViewSet, FriendshipViewSet,
    BreathingSessionViewSet, UserSearchView, HealthCheckView
)

# Router para ViewSets
router = DefaultRouter()
router.register(r'profiles', UserProfileViewSet, basename='userprofile')
router.register(r'friendships', FriendshipViewSet, basename='friendship')
router.register(r'sessions', BreathingSessionViewSet, basename='breathingsession')

urlpatterns = [
    # Autenticação
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Busca de usuários
    path('users/search/', UserSearchView.as_view(), name='user_search'),
    
    # Health check
    path('health/', HealthCheckView.as_view(), name='health_check'),
    
    # URLs dos ViewSets
    path('', include(router.urls)),
]
