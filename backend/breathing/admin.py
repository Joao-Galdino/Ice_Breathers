from django.contrib import admin
from .models import UserProfile, Friendship, BreathingSession, SessionStats


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_sessions', 'total_breathing_time', 'created_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['total_sessions', 'total_breathing_time', 'created_at', 'updated_at']


@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display = ['requester', 'addressee', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['requester__username', 'addressee__username']
    readonly_fields = ['created_at', 'updated_at']


class SessionStatsInline(admin.StackedInline):
    model = SessionStats
    extra = 0


@admin.register(BreathingSession)
class BreathingSessionAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'rounds', 'breaths_per_round', 'status', 
        'started_at', 'completed_at', 'duration_formatted'
    ]
    list_filter = ['status', 'started_at', 'completed_at']
    search_fields = ['user__username']
    readonly_fields = [
        'started_at', 'completed_at', 'actual_duration', 
        'planned_duration', 'duration_formatted'
    ]
    inlines = [SessionStatsInline]

    def duration_formatted(self, obj):
        return obj.duration_formatted
    duration_formatted.short_description = 'Duração'


@admin.register(SessionStats)
class SessionStatsAdmin(admin.ModelAdmin):
    list_display = [
        'session', 'avg_heart_rate', 'stress_level_before', 
        'stress_level_after', 'mood_before', 'mood_after'
    ]
    list_filter = ['mood_before', 'mood_after']
    search_fields = ['session__user__username']