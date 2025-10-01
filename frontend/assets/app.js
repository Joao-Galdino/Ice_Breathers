// 🌬️ Breathing App - Versão Simples e Sem Bugs
class BreathingApp {
    constructor() {
        // Estados básicos
        this.selectedRounds = 0;
        this.currentRound = 1;
        this.currentBreath = 1;
        this.sessionPhase = 'selection'; // selection, breathing, holding, recovery, complete
        this.isRunning = false;
        this.isPaused = false;
        
        // Configurações
        this.breathsPerRound = 30;
        this.breathDuration = 3550; // 3.55 segundos
        
        // Timers
        this.breathTimer = null;
        this.holdTimer = null;
        this.recoveryTimer = null;
        
        // Dados da sessão
        this.holdStartTime = null;
        this.recoveryStartTime = null;
        this.currentHoldTime = 0;
        this.currentRecoveryTime = 0;
        this.roundTimes = []; // Array para armazenar {round, holdTime, recoveryTime}
        
        // Backend
        this.apiUrl = 'http://localhost:8000/api';
        this.sessionId = null;
        
        this.init();
    }

    init() {
        console.log('🚀 Breathing App iniciado');
        this.setupEventListeners();
        this.showScreen('round-selection');
    }

    setupEventListeners() {
        // Seleção de rounds
        document.querySelectorAll('.round-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rounds = parseInt(e.target.dataset.rounds);
                this.selectRounds(rounds);
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

        document.getElementById('breathe-btn').addEventListener('click', () => {
            this.endHold();
        });

        document.getElementById('release-btn').addEventListener('click', () => {
            this.endRecovery();
        });
        
        document.getElementById('new-session-btn').addEventListener('click', () => {
            this.resetToStart();
        });
    }

    selectRounds(rounds) {
        this.selectedRounds = rounds;
        
        // Atualizar visual
        document.querySelectorAll('.round-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-rounds="${rounds}"]`).classList.add('selected');
        
        // Habilitar botão
        document.getElementById('start-btn').disabled = false;
        
        console.log(`Rounds selecionados: ${rounds}`);
    }

    async startSession() {
        console.log(`🎯 INICIANDO SESSÃO: ${this.selectedRounds} rounds`);
        console.log(`📋 Estado inicial: Round ${this.currentRound} de ${this.selectedRounds}`);
        
        // Resetar estados
        this.currentRound = 1;
        this.currentBreath = 1;
        this.sessionPhase = 'breathing';
        this.isRunning = true;
        this.roundTimes = [];
        this.currentHoldTime = 0;
        this.currentRecoveryTime = 0;
        
        console.log(`✅ Estados resetados: Round ${this.currentRound}, Rounds selecionados: ${this.selectedRounds}`);
        
        // Criar sessão no backend (opcional)
        try {
            const response = await fetch(`${this.apiUrl}/sessions/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rounds: this.selectedRounds,
                    breaths_per_round: this.breathsPerRound,
                    breath_duration: this.breathDuration / 1000
                })
            });
            const data = await response.json();
            this.sessionId = data.id;
            console.log('✅ Sessão criada no backend:', data.id);
        } catch (error) {
            console.log('🔄 Modo offline');
        }
        
        // Ir para tela de respiração
        this.showScreen('breathing-screen');
        this.updateDisplay();
        this.startBreathingCycle();
    }

    startBreathingCycle() {
        if (!this.isRunning || this.isPaused) return;
        
        console.log(`💨 Respiração ${this.currentBreath}/${this.breathsPerRound} - Round ${this.currentRound}`);
        
        // Atualizar display
        this.updateDisplay();
        
        // Animação de inspiração
        const circleStack = document.querySelector('.circle-stack');
        circleStack.classList.remove('exhale');
        circleStack.classList.add('inhale');
        
        // Meio do ciclo - expiração
        setTimeout(() => {
            if (!this.isRunning || this.isPaused) return;
            circleStack.classList.remove('inhale');
            circleStack.classList.add('exhale');
        }, this.breathDuration / 2);
        
        // Próxima respiração
        this.breathTimer = setTimeout(() => {
            if (!this.isRunning || this.isPaused) return;
            
            if (this.currentBreath >= this.breathsPerRound) {
                // Round completado - iniciar hold
                this.startHoldPhase();
            } else {
                // Próxima respiração
                this.currentBreath++;
                this.startBreathingCycle();
            }
        }, this.breathDuration);
    }

    startHoldPhase() {
        console.log(`🔵 HOLD: Iniciando retenção Round ${this.currentRound}`);
        
        this.sessionPhase = 'holding';
        this.currentHoldTime = 0;
        this.holdStartTime = Date.now();
        
        // Atualizar interface
        this.updateDisplay();
        this.showHoldControls();
        
        // Animar círculos para modo hold
        const circleStack = document.querySelector('.circle-stack');
        circleStack.classList.remove('inhale', 'exhale');
        circleStack.classList.add('holding');
        
        // Atualizar número no círculo
        document.getElementById('breath-number').textContent = '⏱️';
        
        // Iniciar cronômetro
        this.holdTimer = setInterval(() => {
            this.currentHoldTime = Math.floor((Date.now() - this.holdStartTime) / 1000);
            this.updateTimerDisplay();
            this.updateCircleGrowth();
        }, 1000);
    }

    updateCircleGrowth() {
        // Crescimento progressivo dos círculos baseado no tempo
        const growthFactor = Math.min(1 + (this.currentHoldTime * 0.01), 1.5);
        
        const circles = document.querySelectorAll('.circle');
        circles.forEach((circle, index) => {
            const baseScale = [1, 0.88, 0.76][index];
            const newScale = baseScale * growthFactor;
            circle.style.setProperty('--base-scale', newScale);
        });
    }

    endHold() {
        console.log(`🟢 END HOLD: Round ${this.currentRound} - Tempo de retenção: ${this.currentHoldTime}s`);
        
        // Parar cronômetro de hold
        if (this.holdTimer) {
            clearInterval(this.holdTimer);
            this.holdTimer = null;
        }
        
        // Salvar no backend (opcional)
        this.saveHoldTime();
        
        // Iniciar fase de recuperação
        this.startRecoveryPhase();
    }

    startRecoveryPhase() {
        console.log(`🫁 RECOVERY: Iniciando recuperação Round ${this.currentRound}`);
        
        this.sessionPhase = 'recovery';
        this.currentRecoveryTime = 0;
        this.recoveryStartTime = Date.now();
        
        // Atualizar interface para recovery
        this.updateDisplay();
        this.showRecoveryControls();
        
        // Animar círculos para modo recovery
        const circleStack = document.querySelector('.circle-stack');
        circleStack.classList.remove('holding');
        circleStack.classList.add('recovery');
        
        // Atualizar ícone
        document.getElementById('breath-number').textContent = '🫁';
        
        // Iniciar cronômetro de recovery
        this.recoveryTimer = setInterval(() => {
            this.currentRecoveryTime = Math.floor((Date.now() - this.recoveryStartTime) / 1000);
            this.updateTimerDisplay();
        }, 1000);
    }

    endRecovery() {
        console.log(`🏁 END RECOVERY: Round ${this.currentRound} - Hold: ${this.currentHoldTime}s, Recovery: ${this.currentRecoveryTime}s`);
        
        // Parar cronômetro de recovery
        if (this.recoveryTimer) {
            clearInterval(this.recoveryTimer);
            this.recoveryTimer = null;
        }
        
        // Salvar tempos completos do round
        this.roundTimes.push({
            round: this.currentRound,
            holdTime: this.currentHoldTime,
            recoveryTime: this.currentRecoveryTime
        });
        
        console.log(`📊 Round ${this.currentRound} completo:`, {
            hold: this.currentHoldTime,
            recovery: this.currentRecoveryTime
        });
        
        // Verificar se é o último round
        console.log(`🔍 VERIFICAÇÃO: Round atual: ${this.currentRound}, Rounds selecionados: ${this.selectedRounds}`);
        
        if (this.currentRound >= this.selectedRounds) {
            // Sessão completa
            console.log(`🏁 SESSÃO FINALIZADA: Completou ${this.currentRound} de ${this.selectedRounds} rounds`);
            this.completeSession();
        } else {
            // Próximo round
            console.log(`➡️ CONTINUANDO: Próximo round ${this.currentRound + 1} de ${this.selectedRounds}`);
            this.nextRound();
        }
    }

    nextRound() {
        const oldRound = this.currentRound;
        
        // Incrementar round
        this.currentRound++;
        this.currentBreath = 1;
        this.sessionPhase = 'breathing';
        
        console.log(`🚀 PRÓXIMO ROUND: ${oldRound} → ${this.currentRound} (de ${this.selectedRounds} total)`);
        
        // Resetar interface
        this.hideAllControls();
        this.showBreathingControls();
        this.resetCircles();
        
        // Atualizar display
        this.updateDisplay();
        
        // Pequena pausa antes do próximo round
        setTimeout(() => {
            if (this.isRunning) {
                console.log(`🔄 Retomando respiração no Round ${this.currentRound}`);
                this.startBreathingCycle();
            }
        }, 2000);
    }

    completeSession() {
        console.log('🏁 SESSÃO COMPLETA');
        
        this.isRunning = false;
        this.sessionPhase = 'complete';
        
        // Limpar timers
        this.clearAllTimers();
        
        // Mostrar tela de conclusão
        this.showCompletionScreen();
    }

    // Métodos de Interface
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    updateDisplay() {
        document.getElementById('current-round').textContent = this.currentRound;
        document.getElementById('total-rounds').textContent = this.selectedRounds;
        document.getElementById('breath-number').textContent = this.currentBreath;
        
        // Atualizar contadores de respiração
        const breathCounter = document.getElementById('breath-counter');
        if (this.sessionPhase === 'breathing') {
            breathCounter.textContent = `Respiração ${this.currentBreath} de ${this.breathsPerRound}`;
        }
        
        // Atualizar fase
        const phaseText = document.getElementById('phase-text');
        const timerDisplay = document.getElementById('timer-display');
        
        switch (this.sessionPhase) {
            case 'breathing':
                phaseText.textContent = 'Respiração';
                breathCounter.classList.remove('hidden');
                timerDisplay.classList.add('hidden');
                break;
            case 'holding':
                phaseText.textContent = 'Retenção';
                breathCounter.classList.add('hidden');
                timerDisplay.classList.remove('hidden');
                break;
            case 'recovery':
                phaseText.textContent = 'Recuperação';
                breathCounter.classList.add('hidden');
                timerDisplay.classList.remove('hidden');
                break;
        }
    }

    updateTimerDisplay() {
        let timeToShow = 0;
        
        if (this.sessionPhase === 'holding') {
            timeToShow = this.currentHoldTime;
        } else if (this.sessionPhase === 'recovery') {
            timeToShow = this.currentRecoveryTime;
        }
        
        const minutes = Math.floor(timeToShow / 60);
        const seconds = timeToShow % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timer-display').textContent = timeString;
    }

    showHoldControls() {
        this.hideAllControls();
        document.getElementById('hold-controls').classList.add('active');
        
        // Mostrar lista de tempos
        document.getElementById('round-times').classList.remove('hidden');
        this.updateRoundTimesList();
    }

    showRecoveryControls() {
        this.hideAllControls();
        document.getElementById('recovery-controls').classList.add('active');
        
        // Mostrar lista de tempos
        document.getElementById('round-times').classList.remove('hidden');
        this.updateRoundTimesList();
    }

    showBreathingControls() {
        this.hideAllControls();
        document.getElementById('breathing-controls').classList.add('active');
        
        // Esconder lista de tempos
        document.getElementById('round-times').classList.add('hidden');
    }

    hideAllControls() {
        document.getElementById('breathing-controls').classList.remove('active');
        document.getElementById('hold-controls').classList.remove('active');
        document.getElementById('recovery-controls').classList.remove('active');
    }

    resetCircles() {
        const circleStack = document.querySelector('.circle-stack');
        circleStack.classList.remove('inhale', 'exhale', 'holding', 'recovery', 'growing');
        
        // Resetar escalas
        document.querySelectorAll('.circle').forEach(circle => {
            circle.style.removeProperty('--base-scale');
        });
        
        // Resetar número
        document.getElementById('breath-number').textContent = '1';
    }

    updateRoundTimesList() {
        const timesList = document.getElementById('times-list');
        timesList.innerHTML = '';
        
        this.roundTimes.forEach(round => {
            const holdMinutes = Math.floor(round.holdTime / 60);
            const holdSeconds = round.holdTime % 60;
            const holdString = `${holdMinutes}:${holdSeconds.toString().padStart(2, '0')}`;
            
            let recoveryString = '';
            if (round.recoveryTime > 0) {
                const recMinutes = Math.floor(round.recoveryTime / 60);
                const recSeconds = round.recoveryTime % 60;
                recoveryString = ` | Recuperação: ${recMinutes}:${recSeconds.toString().padStart(2, '0')}`;
            }
            
            const timeDiv = document.createElement('div');
            timeDiv.className = 'round-time';
            timeDiv.textContent = `Round ${round.round}: ${holdString}${recoveryString}`;
            timesList.appendChild(timeDiv);
        });
        
        // Mostrar round atual se ainda em progresso
        if (this.sessionPhase === 'holding' || this.sessionPhase === 'recovery') {
            const currentDiv = document.createElement('div');
            currentDiv.className = 'round-time current-round';
            
            if (this.sessionPhase === 'holding') {
                const minutes = Math.floor(this.currentHoldTime / 60);
                const seconds = this.currentHoldTime % 60;
                const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                currentDiv.textContent = `Round ${this.currentRound}: ${timeString} (em progresso...)`;
            } else if (this.sessionPhase === 'recovery') {
                const holdMinutes = Math.floor(this.currentHoldTime / 60);
                const holdSeconds = this.currentHoldTime % 60;
                const holdString = `${holdMinutes}:${holdSeconds.toString().padStart(2, '0')}`;
                
                const recMinutes = Math.floor(this.currentRecoveryTime / 60);
                const recSeconds = this.currentRecoveryTime % 60;
                const recString = `${recMinutes}:${recSeconds.toString().padStart(2, '0')}`;
                
                currentDiv.textContent = `Round ${this.currentRound}: ${holdString} | Recuperação: ${recString}`;
            }
            
            timesList.appendChild(currentDiv);
        }
    }

    showCompletionScreen() {
        this.showScreen('completion-screen');
        
        // Estatísticas básicas
        document.getElementById('summary-rounds').textContent = this.selectedRounds;
        document.getElementById('summary-breaths').textContent = this.selectedRounds * this.breathsPerRound;
        
        // Lista de hold times
        const holdList = document.getElementById('hold-list');
        holdList.innerHTML = '';
        
        let totalHoldTime = 0;
        
        this.roundTimes.forEach(round => {
            totalHoldTime += round.holdTime;
            
            const holdMinutes = Math.floor(round.holdTime / 60);
            const holdSeconds = round.holdTime % 60;
            const holdString = `${holdMinutes}m ${holdSeconds}s`;
            
            let recoveryString = '';
            if (round.recoveryTime > 0) {
                const recMinutes = Math.floor(round.recoveryTime / 60);
                const recSeconds = round.recoveryTime % 60;
                recoveryString = ` | Recuperação: ${recMinutes}m ${recSeconds}s`;
            }
            
            const item = document.createElement('div');
            item.className = 'hold-time-item';
            item.innerHTML = `
                <span>Round ${round.round}:</span>
                <span class="hold-time-value">${holdString}${recoveryString}</span>
            `;
            holdList.appendChild(item);
        });
        
        // Totais
        const avgHoldTime = this.roundTimes.length > 0 ? totalHoldTime / this.roundTimes.length : 0;
        
        const totalMinutes = Math.floor(totalHoldTime / 60);
        const totalSeconds = totalHoldTime % 60;
        document.getElementById('total-hold-time').textContent = `${totalMinutes}m ${totalSeconds}s`;
        
        const avgMinutes = Math.floor(avgHoldTime / 60);
        const avgSecondsRounded = Math.round(avgHoldTime % 60);
        document.getElementById('avg-hold-time').textContent = `${avgMinutes}m ${avgSecondsRounded}s`;
    }

    // Controles
    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        
        if (this.isPaused) {
            pauseBtn.textContent = 'Continuar';
            this.clearAllTimers();
            console.log('⏸️ Pausado');
        } else {
            pauseBtn.textContent = 'Pausar';
            if (this.sessionPhase === 'breathing') {
                this.startBreathingCycle();
            } else if (this.sessionPhase === 'holding') {
                this.resumeHoldTimer();
            }
            console.log('▶️ Retomado');
        }
    }

    resumeHoldTimer() {
        // Retomar timer de hold considerando tempo já passado
        this.holdStartTime = Date.now() - (this.currentHoldTime * 1000);
        this.holdTimer = setInterval(() => {
            this.currentHoldTime = Math.floor((Date.now() - this.holdStartTime) / 1000);
            this.updateTimerDisplay();
            this.updateCircleGrowth();
        }, 1000);
    }

    stopSession() {
        console.log('🛑 Sessão parada');
        this.isRunning = false;
        this.clearAllTimers();
        this.resetToStart();
    }

    resetToStart() {
        console.log('🔄 Reset para início');
        
        // Resetar todos os estados
        this.selectedRounds = 0;
        this.currentRound = 1;
        this.currentBreath = 1;
        this.sessionPhase = 'selection';
        this.isRunning = false;
        this.isPaused = false;
        this.currentHoldTime = 0;
        this.currentRecoveryTime = 0;
        this.roundTimes = [];
        
        // Limpar timers
        this.clearAllTimers();
        
        // Resetar interface
        document.querySelectorAll('.round-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').textContent = 'Pausar';
        
        this.resetCircles();
        this.showScreen('round-selection');
    }

    clearAllTimers() {
        if (this.breathTimer) {
            clearTimeout(this.breathTimer);
            this.breathTimer = null;
        }
        if (this.holdTimer) {
            clearInterval(this.holdTimer);
            this.holdTimer = null;
        }
        if (this.recoveryTimer) {
            clearInterval(this.recoveryTimer);
            this.recoveryTimer = null;
        }
    }

    // Backend (opcional)
    async saveHoldTime() {
        if (!this.sessionId) return;
        
        try {
            await fetch(`${this.apiUrl}/sessions/${this.sessionId}/end_hold/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    round_number: this.currentRound,
                    hold_seconds: this.currentHoldTime
                })
            });
            console.log('✅ Hold time salvo no backend');
        } catch (error) {
            console.log('❌ Erro ao salvar hold time');
        }
    }
}

// Inicializar quando página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.breathingApp = new BreathingApp();
    console.log('✅ App inicializado');
});
