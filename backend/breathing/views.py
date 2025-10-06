from rest_framework import generics, viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone

from .models import UserProfile, Friendship, BreathingSession, SessionStats
from .serializers import (
    UserSerializer, UserProfileSerializer, UserRegistrationSerializer,
    LoginSerializer, FriendshipSerializer, BreathingSessionSerializer,
    BreathingSessionCreateSerializer, BreathingSessionStatsSerializer,
    SessionStatsSerializer
)


class RegisterView(generics.CreateAPIView):
    """View para registro de novos usuários"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Gerar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Usuário registrado com sucesso!'
        }, status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    """View para login de usuários"""
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # Gerar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Login realizado com sucesso!'
        })


class UserProfileViewSet(viewsets.ModelViewSet):
    """ViewSet para perfis de usuário"""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Retorna o perfil do usuário atual"""
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'])
    def update_me(self, request):
        """Atualiza o perfil do usuário atual"""
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class FriendshipViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar amizades"""
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Friendship.objects.filter(
            Q(requester=user) | Q(addressee=user)
        ).order_by('-created_at')

    @action(detail=False, methods=['get'])
    def friends(self, request):
        """Lista amigos aceitos"""
        user = request.user
        friendships = Friendship.objects.filter(
            (Q(requester=user) | Q(addressee=user)) & Q(status='accepted')
        )
        
        friends = []
        for friendship in friendships:
            friend = friendship.addressee if friendship.requester == user else friendship.requester
            friends.append(UserSerializer(friend).data)
        
        return Response(friends)

    @action(detail=False, methods=['get'])
    def pending_requests(self, request):
        """Lista solicitações pendentes recebidas"""
        pending = Friendship.objects.filter(
            addressee=request.user, 
            status='pending'
        )
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def sent_requests(self, request):
        """Lista solicitações enviadas"""
        sent = Friendship.objects.filter(
            requester=request.user, 
            status='pending'
        )
        serializer = self.get_serializer(sent, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Aceitar solicitação de amizade"""
        friendship = self.get_object()
        
        if friendship.addressee != request.user:
            return Response(
                {'error': 'Você não pode aceitar esta solicitação'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        friendship.status = 'accepted'
        friendship.save()
        
        serializer = self.get_serializer(friendship)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Rejeitar solicitação de amizade"""
        friendship = self.get_object()
        
        if friendship.addressee != request.user:
            return Response(
                {'error': 'Você não pode rejeitar esta solicitação'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        friendship.status = 'rejected'
        friendship.save()
        
        serializer = self.get_serializer(friendship)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def send_request(self, request):
        """Enviar solicitação de amizade"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        friendship = serializer.save()
        return Response(
            self.get_serializer(friendship).data, 
            status=status.HTTP_201_CREATED
        )


class BreathingSessionViewSet(viewsets.ModelViewSet):
    """ViewSet para sessões de respiração"""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BreathingSession.objects.filter(user=self.request.user).order_by('-started_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return BreathingSessionCreateSerializer
        return BreathingSessionSerializer

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Completar uma sessão de respiração"""
        session = self.get_object()
        
        if session.status == 'cancelled':
            return Response(
                {'error': 'Esta sessão foi cancelada'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Se já está completa, apenas retornar os dados
        if session.status == 'completed':
            serializer = BreathingSessionSerializer(session)
            return Response(serializer.data)
        
        # Completar a sessão se ainda não foi
        session.complete_session()
        serializer = BreathingSessionSerializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancelar uma sessão de respiração"""
        session = self.get_object()
        
        if session.status != 'in_progress':
            return Response(
                {'error': 'Esta sessão já foi finalizada'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session.status = 'cancelled'
        session.save()
        
        serializer = BreathingSessionSerializer(session)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Retorna a sessão ativa do usuário (se houver)"""
        active_session = BreathingSession.objects.filter(
            user=request.user, 
            status='in_progress'
        ).first()
        
        if active_session:
            serializer = BreathingSessionSerializer(active_session)
            return Response(serializer.data)
        else:
            return Response({'message': 'Nenhuma sessão ativa'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Retorna estatísticas das sessões do usuário"""
        serializer = BreathingSessionStatsSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Retorna as últimas 10 sessões do usuário"""
        recent_sessions = self.get_queryset()[:10]
        serializer = BreathingSessionSerializer(recent_sessions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def start_hold(self, request, pk=None):
        """Iniciar fase de retenção (breath hold)"""
        session = self.get_object()
        
        if session.status not in ['in_progress', 'breathing']:
            return Response(
                {'error': 'Sessão deve estar em progresso para iniciar retenção'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session.status = 'holding'
        session.save()
        
        serializer = BreathingSessionSerializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def end_hold(self, request, pk=None):
        """Finalizar fase de retenção e salvar tempo"""
        session = self.get_object()
        
        if session.status != 'holding':
            return Response(
                {'error': 'Sessão deve estar em fase de retenção'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obter dados do request
        round_number = request.data.get('round_number')
        hold_seconds = request.data.get('hold_seconds')
        
        if not round_number or hold_seconds is None:
            return Response(
                {'error': 'round_number e hold_seconds são obrigatórios'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Salvar tempo de retenção
        session.add_hold_time(round_number, hold_seconds)
        session.status = 'recovery'
        session.save()
        
        serializer = BreathingSessionSerializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def start_recovery(self, request, pk=None):
        """Iniciar fase de recuperação (breathing in)"""
        session = self.get_object()
        
        if session.status != 'holding':
            return Response(
                {'error': 'Sessão deve estar em retenção para iniciar recuperação'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session.status = 'recovery'
        session.save()
        
        serializer = BreathingSessionSerializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def end_recovery(self, request, pk=None):
        """Finalizar fase de recuperação"""
        session = self.get_object()
        
        if session.status != 'recovery':
            return Response(
                {'error': 'Sessão deve estar em recuperação'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obter dados do request
        round_number = request.data.get('round_number')
        recovery_seconds = request.data.get('recovery_seconds')
        
        if not round_number or recovery_seconds is None:
            return Response(
                {'error': 'round_number e recovery_seconds são obrigatórios'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Atualizar tempo de recuperação no round específico
        if session.hold_times and len(session.hold_times) >= round_number:
            session.hold_times[round_number - 1]['recovery'] = recovery_seconds
            session.save()
        
        # Verificar se é o último round
        if round_number >= session.rounds:
            # Último round - manter status para permitir finalização manual
            session.status = 'in_progress'
        else:
            session.status = 'in_progress'  # Próximo round
        
        session.save()
        
        serializer = BreathingSessionSerializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def next_round(self, request, pk=None):
        """Ir para o próximo round"""
        session = self.get_object()
        
        if session.status not in ['recovery', 'in_progress']:
            return Response(
                {'error': 'Status inválido para próximo round'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session.status = 'breathing'  # Voltar para fase de respiração
        session.save()
        
        serializer = BreathingSessionSerializer(session)
        return Response(serializer.data)


class UserSearchView(generics.ListAPIView):
    """View para buscar usuários por username"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if query:
            return User.objects.filter(
                username__icontains=query
            ).exclude(id=self.request.user.id)[:10]
        return User.objects.none()


class HealthCheckView(generics.GenericAPIView):
    """View para verificar saúde da API"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            'status': 'ok',
            'timestamp': timezone.now(),
            'message': 'Breathing App API está funcionando!'
        })