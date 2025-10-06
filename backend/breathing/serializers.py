from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import UserProfile, Friendship, BreathingSession, SessionStats


class UserSerializer(serializers.ModelSerializer):
    """Serializer para o modelo User"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer para o perfil do usuário"""
    user = UserSerializer(read_only=True)
    total_breathing_time_formatted = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'user', 'bio', 'avatar', 'total_sessions', 
            'total_breathing_time', 'total_breathing_time_formatted',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['total_sessions', 'total_breathing_time', 'created_at', 'updated_at']

    def get_total_breathing_time_formatted(self, obj):
        """Retorna o tempo total formatado"""
        if obj.total_breathing_time:
            total_seconds = int(obj.total_breathing_time.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            return f"{hours}h {minutes}m {seconds}s"
        return "0h 0m 0s"


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer para registro de usuário"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("As senhas não coincidem.")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        # Criar perfil automaticamente
        UserProfile.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer para login"""
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Credenciais inválidas.')
            if not user.is_active:
                raise serializers.ValidationError('Conta de usuário desabilitada.')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Deve incluir "username" e "password".')


class FriendshipSerializer(serializers.ModelSerializer):
    """Serializer para amizades"""
    requester = UserSerializer(read_only=True)
    addressee = UserSerializer(read_only=True)
    addressee_username = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Friendship
        fields = [
            'id', 'requester', 'addressee', 'addressee_username', 
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'requester', 'created_at', 'updated_at']

    def create(self, validated_data):
        addressee_username = validated_data.pop('addressee_username', None)
        if addressee_username:
            try:
                addressee = User.objects.get(username=addressee_username)
                validated_data['addressee'] = addressee
            except User.DoesNotExist:
                raise serializers.ValidationError({'addressee_username': 'Usuário não encontrado.'})
        
        # Verificar se já existe amizade
        requester = self.context['request'].user
        addressee = validated_data['addressee']
        
        if requester == addressee:
            raise serializers.ValidationError("Você não pode enviar solicitação de amizade para si mesmo.")
        
        existing_friendship = Friendship.objects.filter(
            requester=requester, addressee=addressee
        ).first() or Friendship.objects.filter(
            requester=addressee, addressee=requester
        ).first()
        
        if existing_friendship:
            raise serializers.ValidationError("Já existe uma solicitação de amizade entre estes usuários.")
        
        validated_data['requester'] = requester
        return super().create(validated_data)


class SessionStatsSerializer(serializers.ModelSerializer):
    """Serializer para estatísticas da sessão"""
    class Meta:
        model = SessionStats
        fields = [
            'avg_heart_rate', 'max_heart_rate', 'min_heart_rate',
            'stress_level_before', 'stress_level_after',
            'mood_before', 'mood_after'
        ]


class BreathingSessionSerializer(serializers.ModelSerializer):
    """Serializer para sessões de respiração"""
    user = UserSerializer(read_only=True)
    stats = SessionStatsSerializer(required=False)
    duration_formatted = serializers.ReadOnlyField()
    planned_duration_formatted = serializers.SerializerMethodField()
    actual_duration_formatted = serializers.SerializerMethodField()
    hold_times_formatted = serializers.SerializerMethodField()
    total_hold_time_formatted = serializers.SerializerMethodField()
    average_hold_time_formatted = serializers.SerializerMethodField()

    class Meta:
        model = BreathingSession
        fields = [
            'id', 'user', 'rounds', 'breaths_per_round', 'breath_duration',
            'started_at', 'completed_at', 'actual_duration', 'planned_duration',
            'duration_formatted', 'planned_duration_formatted', 'actual_duration_formatted',
            'status', 'notes', 'stats', 'hold_times', 'hold_times_formatted',
            'total_hold_time_formatted', 'average_hold_time_formatted'
        ]
        read_only_fields = [
            'id', 'user', 'started_at', 'completed_at', 
            'actual_duration', 'planned_duration'
        ]

    def get_planned_duration_formatted(self, obj):
        if obj.planned_duration:
            total_seconds = int(obj.planned_duration.total_seconds())
            minutes = total_seconds // 60
            seconds = total_seconds % 60
            return f"{minutes}m {seconds}s"
        return "0m 0s"

    def get_actual_duration_formatted(self, obj):
        if obj.actual_duration:
            total_seconds = int(obj.actual_duration.total_seconds())
            minutes = total_seconds // 60
            seconds = total_seconds % 60
            return f"{minutes}m {seconds}s"
        return None

    def get_hold_times_formatted(self, obj):
        return obj.get_hold_times_formatted()

    def get_total_hold_time_formatted(self, obj):
        total_seconds = obj.total_hold_time
        if total_seconds > 0:
            minutes = total_seconds // 60
            seconds = total_seconds % 60
            return f"{minutes}m {seconds}s"
        return "0s"

    def get_average_hold_time_formatted(self, obj):
        avg_seconds = int(obj.average_hold_time)
        if avg_seconds > 0:
            minutes = avg_seconds // 60
            seconds = avg_seconds % 60
            return f"{minutes}m {seconds}s"
        return "0s"

    def create(self, validated_data):
        stats_data = validated_data.pop('stats', None)
        validated_data['user'] = self.context['request'].user
        session = super().create(validated_data)
        
        if stats_data:
            SessionStats.objects.create(session=session, **stats_data)
        
        return session

    def update(self, instance, validated_data):
        stats_data = validated_data.pop('stats', None)
        session = super().update(instance, validated_data)
        
        if stats_data:
            stats, created = SessionStats.objects.get_or_create(
                session=session,
                defaults=stats_data
            )
            if not created:
                for attr, value in stats_data.items():
                    setattr(stats, attr, value)
                stats.save()
        
        return session


class BreathingSessionCreateSerializer(serializers.ModelSerializer):
    """Serializer simplificado para criação de sessões"""
    class Meta:
        model = BreathingSession
        fields = ['id', 'rounds', 'breaths_per_round', 'breath_duration', 'notes', 'status', 'started_at']
        read_only_fields = ['id', 'status', 'started_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class BreathingSessionStatsSerializer(serializers.ModelSerializer):
    """Serializer para estatísticas resumidas das sessões do usuário"""
    total_sessions = serializers.SerializerMethodField()
    total_time = serializers.SerializerMethodField()
    average_session_duration = serializers.SerializerMethodField()
    sessions_this_week = serializers.SerializerMethodField()
    sessions_this_month = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'total_sessions', 'total_time', 'average_session_duration',
            'sessions_this_week', 'sessions_this_month'
        ]

    def get_total_sessions(self, obj):
        return obj.breathing_sessions.filter(status='completed').count()

    def get_total_time(self, obj):
        sessions = obj.breathing_sessions.filter(status='completed', actual_duration__isnull=False)
        total = sum([s.actual_duration.total_seconds() for s in sessions], 0)
        hours = int(total // 3600)
        minutes = int((total % 3600) // 60)
        return f"{hours}h {minutes}m"

    def get_average_session_duration(self, obj):
        sessions = obj.breathing_sessions.filter(status='completed', actual_duration__isnull=False)
        if sessions:
            total = sum([s.actual_duration.total_seconds() for s in sessions], 0)
            avg = total / sessions.count()
            minutes = int(avg // 60)
            seconds = int(avg % 60)
            return f"{minutes}m {seconds}s"
        return "0m 0s"

    def get_sessions_this_week(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        week_ago = timezone.now() - timedelta(days=7)
        return obj.breathing_sessions.filter(
            status='completed', 
            completed_at__gte=week_ago
        ).count()

    def get_sessions_this_month(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        month_ago = timezone.now() - timedelta(days=30)
        return obj.breathing_sessions.filter(
            status='completed', 
            completed_at__gte=month_ago
        ).count()
