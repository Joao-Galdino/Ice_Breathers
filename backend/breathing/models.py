from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class UserProfile(models.Model):
    """Perfil estendido do usuário"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.URLField(blank=True, null=True)
    total_sessions = models.PositiveIntegerField(default=0)
    total_breathing_time = models.DurationField(default=timezone.timedelta(0))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Perfil de {self.user.username}"

    class Meta:
        verbose_name = "Perfil do Usuário"
        verbose_name_plural = "Perfis dos Usuários"


class Friendship(models.Model):
    """Modelo para gerenciar amizades entre usuários"""
    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('accepted', 'Aceita'),
        ('rejected', 'Rejeitada'),
        ('blocked', 'Bloqueada'),
    ]

    requester = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='friendship_requests_sent'
    )
    addressee = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='friendship_requests_received'
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('requester', 'addressee')
        verbose_name = "Amizade"
        verbose_name_plural = "Amizades"

    def __str__(self):
        return f"{self.requester.username} -> {self.addressee.username} ({self.status})"


class BreathingSession(models.Model):
    """Modelo para sessões de respiração"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='breathing_sessions')
    rounds = models.PositiveIntegerField(help_text="Número de rounds da sessão")
    breaths_per_round = models.PositiveIntegerField(default=30, help_text="Respirações por round")
    breath_duration = models.FloatField(default=3.55, help_text="Duração de cada respiração em segundos")
    
    # Campos para rastrear tempo
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    actual_duration = models.DurationField(null=True, blank=True, help_text="Duração real da sessão")
    
    # Campos calculados
    planned_duration = models.DurationField(help_text="Duração planejada calculada")
    
    # Tempos de retenção por round (em segundos) - JSON field
    hold_times = models.JSONField(
        default=list, 
        blank=True, 
        help_text="Lista com tempos de retenção de cada round em segundos"
    )
    
    # Status da sessão
    STATUS_CHOICES = [
        ('in_progress', 'Em Progresso'),
        ('breathing', 'Respiração'),
        ('holding', 'Retenção'),
        ('recovery', 'Recuperação'),
        ('completed', 'Concluída'),
        ('cancelled', 'Cancelada'),
    ]
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='in_progress')
    
    # Notas opcionais
    notes = models.TextField(blank=True, help_text="Notas sobre a sessão")
    
    class Meta:
        verbose_name = "Sessão de Respiração"
        verbose_name_plural = "Sessões de Respiração"
        ordering = ['-started_at']

    def __str__(self):
        return f"Sessão de {self.user.username} - {self.started_at.strftime('%d/%m/%Y %H:%M')}"

    def save(self, *args, **kwargs):
        # Calcular duração planejada
        if not self.planned_duration:
            total_seconds = self.rounds * self.breaths_per_round * self.breath_duration
            self.planned_duration = timezone.timedelta(seconds=total_seconds)
        
        super().save(*args, **kwargs)

    def complete_session(self):
        """Marcar sessão como concluída e calcular duração real"""
        if self.status == 'in_progress':
            self.completed_at = timezone.now()
            self.actual_duration = self.completed_at - self.started_at
            self.status = 'completed'
            self.save()
            
            # Atualizar estatísticas do usuário
            profile, created = UserProfile.objects.get_or_create(user=self.user)
            profile.total_sessions += 1
            profile.total_breathing_time += self.actual_duration
            profile.save()

    @property
    def duration_formatted(self):
        """Retorna a duração em formato legível"""
        duration = self.actual_duration or self.planned_duration
        if duration:
            total_seconds = int(duration.total_seconds())
            minutes = total_seconds // 60
            seconds = total_seconds % 60
            return f"{minutes}m {seconds}s"
        return "0m 0s"

    def add_hold_time(self, round_number, hold_seconds, recovery_seconds=None):
        """Adiciona tempo de retenção para um round específico"""
        if not self.hold_times:
            self.hold_times = []
        
        # Garantir que a lista tenha tamanho suficiente
        while len(self.hold_times) < round_number:
            self.hold_times.append({'hold': 0, 'recovery': 0})
        
        # Atualizar o round específico
        if len(self.hold_times) >= round_number:
            self.hold_times[round_number - 1] = {
                'hold': hold_seconds,
                'recovery': recovery_seconds or 0
            }
        else:
            self.hold_times.append({
                'hold': hold_seconds,
                'recovery': recovery_seconds or 0
            })
        
        self.save()

    def get_hold_times_formatted(self):
        """Retorna os tempos de retenção formatados"""
        if not self.hold_times:
            return []
        
        formatted_times = []
        for i, times in enumerate(self.hold_times):
            hold_time = times.get('hold', 0)
            recovery_time = times.get('recovery', 0)
            
            hold_minutes = hold_time // 60
            hold_seconds = hold_time % 60
            hold_formatted = f"{hold_minutes}m {hold_seconds}s" if hold_time > 0 else "0s"
            
            recovery_formatted = ""
            if recovery_time > 0:
                rec_minutes = recovery_time // 60
                rec_seconds = recovery_time % 60
                recovery_formatted = f"{rec_minutes}m {rec_seconds}s"
            
            formatted_times.append({
                'round': i + 1,
                'hold': hold_formatted,
                'recovery': recovery_formatted,
                'hold_seconds': hold_time,
                'recovery_seconds': recovery_time
            })
        
        return formatted_times

    @property
    def total_hold_time(self):
        """Retorna o tempo total de retenção"""
        if not self.hold_times:
            return 0
        return sum(times.get('hold', 0) for times in self.hold_times)

    @property
    def average_hold_time(self):
        """Retorna o tempo médio de retenção"""
        if not self.hold_times:
            return 0
        hold_times = [times.get('hold', 0) for times in self.hold_times if times.get('hold', 0) > 0]
        return sum(hold_times) / len(hold_times) if hold_times else 0


class SessionStats(models.Model):
    """Estatísticas detalhadas de uma sessão"""
    session = models.OneToOneField(BreathingSession, on_delete=models.CASCADE, related_name='stats')
    avg_heart_rate = models.PositiveIntegerField(null=True, blank=True)
    max_heart_rate = models.PositiveIntegerField(null=True, blank=True)
    min_heart_rate = models.PositiveIntegerField(null=True, blank=True)
    stress_level_before = models.PositiveIntegerField(
        null=True, blank=True, 
        help_text="Nível de stress antes (1-10)"
    )
    stress_level_after = models.PositiveIntegerField(
        null=True, blank=True, 
        help_text="Nível de stress depois (1-10)"
    )
    mood_before = models.CharField(max_length=20, blank=True)
    mood_after = models.CharField(max_length=20, blank=True)
    
    class Meta:
        verbose_name = "Estatísticas da Sessão"
        verbose_name_plural = "Estatísticas das Sessões"

    def __str__(self):
        return f"Stats - {self.session}"