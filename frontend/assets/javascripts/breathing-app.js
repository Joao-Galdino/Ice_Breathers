class BreathingApp {
    constructor() {
        this.selectedRounds = 0;
        this.currentRound = 1;
        this.currentBreath = 1;
        this.totalBreaths = 30;
        this.breathDuration = 3550; // 3.55 segundos em millisegundos
        this.isRunning = false;
        this.isPaused = false;
        this.breathingTimer = null;
        this.sessionStartTime = null;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Botões de seleção de rounds
        document.querySelectorAll('.round-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectRounds(parseInt(e.target.dataset.rounds));
            });
        });

        // Botão iniciar
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startSession();
        });

        // Controles da sessão
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('stop-btn').addEventListener('click', () => {
            this.stopSession();
        });

        // Nova sessão
        document.getElementById('new-session-btn').addEventListener('click', () => {
            this.resetToHome();
        });
    }

    selectRounds(rounds) {
        this.selectedRounds = rounds;
        
        // Atualizar visual dos botões
        document.querySelectorAll('.round-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        document.querySelector(`[data-rounds="${rounds}"]`).classList.add('selected');
        
        // Habilitar botão iniciar
        document.getElementById('start-btn').disabled = false;
    }

    async startSession() {
        try {
            // Criar sessão no backend
            const response = await fetch('http://localhost:8000/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rounds: this.selectedRounds,
                    breaths_per_round: this.totalBreaths,
                    breath_duration: this.breathDuration / 1000
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao criar sessão');
            }

            const sessionData = await response.json();
            console.log('Sessão criada:', sessionData);

            // Inicializar variáveis da sessão
            this.currentRound = 1;
            this.currentBreath = 1;
            this.isRunning = true;
            this.isPaused = false;
            this.sessionStartTime = Date.now();

            // Trocar para tela de respiração
            this.showBreathingScreen();
            
            // Iniciar primeira respiração
            this.startBreathingCycle();

        } catch (error) {
            console.error('Erro ao iniciar sessão:', error);
            alert('Erro ao conectar com o servidor. Iniciando sessão offline.');
            
            // Fallback para modo offline
            this.startOfflineSession();
        }
    }

    startOfflineSession() {
        this.currentRound = 1;
        this.currentBreath = 1;
        this.isRunning = true;
        this.isPaused = false;
        this.sessionStartTime = Date.now();
        this.showBreathingScreen();
        this.startBreathingCycle();
    }

    showBreathingScreen() {
        document.getElementById('home-screen').classList.add('hidden');
        document.getElementById('breathing-screen').classList.remove('hidden');
        document.getElementById('completion-screen').classList.add('hidden');
        
        // Atualizar contadores
        document.getElementById('total-rounds').textContent = this.selectedRounds;
        this.updateDisplay();
    }

    startBreathingCycle() {
        if (!this.isRunning || this.isPaused) return;

        const hexagon = document.getElementById('breathing-hexagon');
        const breathNumber = document.getElementById('breath-number');
        
        // Atualizar número da respiração
        breathNumber.textContent = this.currentBreath;
        
        // Animação de inspiração
        hexagon.classList.remove('exhale');
        hexagon.classList.add('inhale');
        
        // Depois de metade do tempo, trocar para expiração
        setTimeout(() => {
            if (!this.isRunning || this.isPaused) return;
            
            hexagon.classList.remove('inhale');
            hexagon.classList.add('exhale');
        }, this.breathDuration / 2);

        // Próxima respiração
        this.breathingTimer = setTimeout(() => {
            if (!this.isRunning || this.isPaused) return;
            
            this.nextBreath();
        }, this.breathDuration);
    }

    nextBreath() {
        this.currentBreath++;
        
        if (this.currentBreath > this.totalBreaths) {
            // Round completado
            this.nextRound();
        } else {
            // Próxima respiração
            this.updateDisplay();
            this.startBreathingCycle();
        }
    }

    nextRound() {
        this.currentRound++;
        this.currentBreath = 1;
        
        if (this.currentRound > this.selectedRounds) {
            // Sessão completada
            this.completeSession();
        } else {
            // Próximo round
            this.updateDisplay();
            
            // Pequena pausa entre rounds
            setTimeout(() => {
                if (this.isRunning && !this.isPaused) {
                    this.startBreathingCycle();
                }
            }, 1000);
        }
    }

    updateDisplay() {
        document.getElementById('current-round').textContent = this.currentRound;
        document.getElementById('current-breath').textContent = this.currentBreath;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        
        if (this.isPaused) {
            pauseBtn.textContent = 'Continuar';
            if (this.breathingTimer) {
                clearTimeout(this.breathingTimer);
            }
        } else {
            pauseBtn.textContent = 'Pausar';
            this.startBreathingCycle();
        }
    }

    stopSession() {
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.breathingTimer) {
            clearTimeout(this.breathingTimer);
        }
        
        // Resetar animação
        const hexagon = document.getElementById('breathing-hexagon');
        hexagon.classList.remove('inhale', 'exhale');
        
        this.resetToHome();
    }

    completeSession() {
        this.isRunning = false;
        
        if (this.breathingTimer) {
            clearTimeout(this.breathingTimer);
        }
        
        // Calcular estatísticas
        const totalTime = Math.round((Date.now() - this.sessionStartTime) / 1000);
        const totalBreaths = this.selectedRounds * this.totalBreaths;
        
        // Mostrar tela de conclusão
        this.showCompletionScreen(totalBreaths, totalTime);
    }

    showCompletionScreen(totalBreaths, totalTime) {
        document.getElementById('breathing-screen').classList.add('hidden');
        document.getElementById('completion-screen').classList.remove('hidden');
        
        // Atualizar estatísticas
        document.getElementById('completed-rounds').textContent = this.selectedRounds;
        document.getElementById('total-breaths').textContent = totalBreaths;
        document.getElementById('total-time').textContent = this.formatTime(totalTime);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }

    resetToHome() {
        // Resetar estado
        this.selectedRounds = 0;
        this.currentRound = 1;
        this.currentBreath = 1;
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.breathingTimer) {
            clearTimeout(this.breathingTimer);
        }
        
        // Resetar UI
        document.querySelectorAll('.round-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').textContent = 'Pausar';
        
        const hexagon = document.getElementById('breathing-hexagon');
        hexagon.classList.remove('inhale', 'exhale');
        
        // Mostrar tela inicial
        document.getElementById('home-screen').classList.remove('hidden');
        document.getElementById('breathing-screen').classList.add('hidden');
        document.getElementById('completion-screen').classList.add('hidden');
    }
}

// Inicializar aplicação quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new BreathingApp();
});
