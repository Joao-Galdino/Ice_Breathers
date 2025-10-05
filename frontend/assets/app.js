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
        this.authToken = localStorage.getItem('auth_token');
        this.currentUser = localStorage.getItem('current_user');
        this.isLoggedIn = !!this.authToken;
        
        this.init();
    }

    init() {
        console.log('🚀 Breathing App iniciado');
        this.setupEventListeners();
        
        if (this.isLoggedIn) {
            this.showMainApp();
        } else {
            this.showScreen('login-screen');
        }
    }

    showMainApp() {
        // Mostrar navegação
        document.querySelector('.main-nav').style.display = 'flex';
        this.showScreen('round-selection');
        this.loadUserData();
        this.testBackendConnection();
    }

    async testBackendConnection() {
        try {
            console.log('🔍 Testando conexão com backend...');
            const response = await fetch(`${this.apiUrl}/health/`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Backend conectado:', data);
            } else {
                console.log('⚠️ Backend respondeu com erro:', response.status);
            }
        } catch (error) {
            console.log('❌ Backend não disponível:', error.message);
            console.log('🔄 App funcionará em modo demo');
        }
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

        // Navegação
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screenId = e.target.dataset.screen;
                this.navigateToScreen(screenId);
            });
        });

        // Amigos
        document.getElementById('search-friend-btn').addEventListener('click', () => {
            this.searchFriend();
        });

        document.getElementById('friend-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchFriend();
            }
        });

        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        // Login
        document.getElementById('login-btn').addEventListener('click', () => {
            this.handleLogin();
        });

        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin();
            }
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
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

    // Navegação
    navigateToScreen(screenId) {
        // Atualizar navegação visual
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-screen="${screenId}"]`).classList.add('active');
        
        // Mostrar tela
        this.showScreen(screenId);
        
        // Carregar dados específicos da tela
        if (screenId === 'history-screen') {
            this.loadHistoryData();
        } else if (screenId === 'friends-screen') {
            this.loadFriendsData();
        }
    }

    // Autenticação
    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        if (!username || !password) {
            alert('Preencha username e senha');
            return;
        }
        
        try {
            // Tentar login real
            const response = await fetch(`${this.apiUrl}/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.authToken = data.access;
                this.currentUser = username;
                localStorage.setItem('auth_token', this.authToken);
                localStorage.setItem('current_user', username);
                this.isLoggedIn = true;
                
                console.log('✅ Login realizado com sucesso');
                this.showMainApp();
            } else {
                throw new Error('Credenciais inválidas');
            }
        } catch (error) {
            console.log('🔄 Modo demo - login offline');
            // Modo demo/offline
            this.authToken = 'demo_token';
            this.currentUser = username;
            localStorage.setItem('auth_token', 'demo_token');
            localStorage.setItem('current_user', username);
            this.isLoggedIn = true;
            
            // Criar dados de teste
            this.createTestData();
            this.showMainApp();
        }
    }

    createTestData() {
        // Criar sessões de teste para demonstração
        const testSessions = [];
        const today = new Date();
        
        // Sessões dos últimos 5 dias
        for (let i = 0; i < 5; i++) {
            const sessionDate = new Date(today);
            sessionDate.setDate(today.getDate() - i);
            sessionDate.setHours(9 + i, 30 + (i * 15), 0, 0);
            
            const rounds = 2 + (i % 4); // 2-5 rounds
            const holdTimes = [];
            
            for (let r = 1; r <= rounds; r++) {
                holdTimes.push({
                    round: r,
                    hold: `${Math.floor(Math.random() * 2) + 1}m ${Math.floor(Math.random() * 60)}s`,
                    hold_seconds: 60 + Math.floor(Math.random() * 120),
                    recovery: `${Math.floor(Math.random() * 10) + 15}s`
                });
            }
            
            testSessions.push({
                id: i + 1,
                rounds: rounds,
                breaths_per_round: 30,
                started_at: sessionDate.toISOString(),
                completed_at: new Date(sessionDate.getTime() + (rounds * 5 * 60 * 1000)).toISOString(),
                actual_duration_formatted: `${rounds * 5}m 30s`,
                planned_duration_formatted: `${rounds * 5}m 19s`,
                hold_times_formatted: holdTimes,
                total_hold_time_formatted: `${Math.floor(Math.random() * 5) + 3}m ${Math.floor(Math.random() * 60)}s`,
                status: 'completed'
            });
        }
        
        localStorage.setItem('demo_sessions', JSON.stringify(testSessions));
        console.log('📊 Dados de teste criados:', testSessions.length, 'sessões');
    }

    handleLogout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        localStorage.removeItem('demo_sessions');
        
        this.authToken = null;
        this.currentUser = null;
        this.isLoggedIn = false;
        
        document.querySelector('.main-nav').style.display = 'none';
        this.showScreen('login-screen');
        
        console.log('👋 Logout realizado');
    }

    // Carregar dados do usuário
    async loadUserData() {
        try {
            if (this.authToken === 'demo_token') {
                // Modo demo
                console.log('📊 Carregando dados demo');
                return;
            }
            
            const response = await fetch(`${this.apiUrl}/sessions/stats/`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });
            const stats = await response.json();
            console.log('📊 Estatísticas carregadas:', stats);
        } catch (error) {
            console.log('❌ Erro ao carregar dados do usuário');
        }
    }

    // Histórico
    async loadHistoryData() {
        console.log('📊 Carregando dados do histórico...');
        console.log('🔑 Token atual:', this.authToken ? 'Presente' : 'Ausente');
        
        try {
            if (this.authToken === 'demo_token') {
                // Usar dados demo
                const demoSessions = JSON.parse(localStorage.getItem('demo_sessions') || '[]');
                const demoStats = {
                    total_sessions: demoSessions.length,
                    total_time: `${demoSessions.length * 15}m`,
                    sessions_this_week: Math.min(demoSessions.length, 7),
                    sessions_this_month: demoSessions.length
                };
                
                console.log('📊 Carregando dados demo para histórico:', demoSessions.length, 'sessões');
                this.displayHistoryData(demoStats, demoSessions);
                return;
            }
            
            // Carregar dados reais da API
            const headers = { 
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            };
            
            console.log('🌐 Fazendo requisição para:', `${this.apiUrl}/sessions/stats/`);
            const statsResponse = await fetch(`${this.apiUrl}/sessions/stats/`, { headers });
            console.log('📈 Stats response status:', statsResponse.status);
            
            if (!statsResponse.ok) {
                throw new Error(`Stats API error: ${statsResponse.status}`);
            }
            
            const stats = await statsResponse.json();
            console.log('📊 Stats recebidas:', stats);
            
            console.log('🌐 Fazendo requisição para:', `${this.apiUrl}/sessions/`);
            const sessionsResponse = await fetch(`${this.apiUrl}/sessions/`, { headers });
            console.log('📋 Sessions response status:', sessionsResponse.status);
            
            if (!sessionsResponse.ok) {
                throw new Error(`Sessions API error: ${sessionsResponse.status}`);
            }
            
            const sessions = await sessionsResponse.json();
            console.log('📋 Sessões recebidas:', sessions.length, 'sessões');
            
            this.displayHistoryData(stats, sessions);
        } catch (error) {
            console.log('❌ Erro ao carregar histórico:', error);
            console.log('🔄 Tentando modo offline...');
            this.displayOfflineHistory();
        }
    }

    displayHistoryData(stats, sessions) {
        // Estatísticas gerais
        document.getElementById('current-streak').textContent = this.calculateStreak(sessions);
        document.getElementById('total-sessions').textContent = stats.total_sessions || 0;
        document.getElementById('total-time').textContent = stats.total_time || '0h 0m';
        
        // Últimos 7 dias
        this.displayWeekView(sessions);
        
        // Sessões de hoje
        this.displayTodaySessions(sessions);
        
        // Histórico completo
        this.displaySessionsHistory(sessions);
    }

    displayOfflineHistory() {
        console.log('🔄 Modo offline - criando dados demo');
        
        // Criar dados demo se não existirem
        if (!localStorage.getItem('demo_sessions')) {
            this.createTestData();
        }
        
        // Usar dados demo
        const demoSessions = JSON.parse(localStorage.getItem('demo_sessions') || '[]');
        const demoStats = {
            total_sessions: demoSessions.length,
            total_time: `${demoSessions.length * 15}m`,
            sessions_this_week: Math.min(demoSessions.length, 7),
            sessions_this_month: demoSessions.length
        };
        
        console.log('📊 Exibindo dados offline:', demoSessions.length, 'sessões');
        this.displayHistoryData(demoStats, demoSessions);
    }

    displayWeekView(sessions) {
        const daysGrid = document.getElementById('days-grid');
        daysGrid.innerHTML = '';
        
        const today = new Date();
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            
            const dayCard = document.createElement('div');
            dayCard.className = 'day-card';
            
            // Verificar se tem sessões neste dia
            const sessionsThisDay = this.getSessionsForDate(sessions, date);
            if (sessionsThisDay.length > 0) {
                dayCard.classList.add('completed');
            }
            
            // Marcar hoje
            if (i === 0) {
                dayCard.classList.add('today');
            }
            
            dayCard.innerHTML = `
                <div class="day-name">${dayNames[date.getDay()]}</div>
                <div class="day-date">${date.getDate()}</div>
                <div class="day-sessions">${sessionsThisDay.length} sessões</div>
            `;
            
            daysGrid.appendChild(dayCard);
        }
    }

    displayTodaySessions(sessions) {
        const todayList = document.getElementById('today-sessions-list');
        todayList.innerHTML = '';
        
        const today = new Date();
        const todaySessions = this.getSessionsForDate(sessions, today);
        
        if (todaySessions.length === 0) {
            todayList.innerHTML = '<p style="opacity: 0.7; text-align: center;">Nenhuma sessão hoje ainda</p>';
            return;
        }
        
        todaySessions.forEach(session => {
            const sessionDiv = document.createElement('div');
            sessionDiv.className = 'session-item';
            
            const startTime = new Date(session.started_at);
            const timeString = startTime.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            sessionDiv.innerHTML = `
                <div class="session-header">
                    <span class="session-time">${timeString}</span>
                    <span class="session-duration">${session.actual_duration_formatted || session.planned_duration_formatted}</span>
                </div>
                <div class="session-details">
                    ${session.rounds} rounds • ${session.breaths_per_round} respirações por round
                </div>
                <div class="session-rounds">
                    ${this.formatSessionRounds(session.hold_times_formatted)}
                </div>
            `;
            
            todayList.appendChild(sessionDiv);
        });
    }

    displaySessionsHistory(sessions) {
        const historyDiv = document.getElementById('sessions-history');
        historyDiv.innerHTML = '';
        
        // Agrupar por data
        const sessionsByDate = this.groupSessionsByDate(sessions);
        
        Object.keys(sessionsByDate).slice(0, 10).forEach(dateStr => {
            const dateSessions = sessionsByDate[dateStr];
            const date = new Date(dateStr);
            
            const dateGroup = document.createElement('div');
            dateGroup.className = 'date-group';
            
            const dateHeader = document.createElement('h4');
            dateHeader.textContent = date.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            dateGroup.appendChild(dateHeader);
            
            dateSessions.forEach(session => {
                const sessionDiv = document.createElement('div');
                sessionDiv.className = 'session-item';
                
                const startTime = new Date(session.started_at);
                const timeString = startTime.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                sessionDiv.innerHTML = `
                    <div class="session-header">
                        <span class="session-time">${timeString}</span>
                        <span class="session-duration">${session.actual_duration_formatted || session.planned_duration_formatted}</span>
                    </div>
                    <div class="session-details">
                        ${session.rounds} rounds • Total: ${session.total_hold_time_formatted || '0s'} retenção
                    </div>
                    <div class="session-rounds">
                        ${this.formatSessionRounds(session.hold_times_formatted)}
                    </div>
                `;
                
                dateGroup.appendChild(sessionDiv);
            });
            
            historyDiv.appendChild(dateGroup);
        });
    }

    // Utilitários para histórico
    getSessionsForDate(sessions, date) {
        const dateStr = date.toISOString().split('T')[0];
        return sessions.filter(session => {
            const sessionDate = new Date(session.started_at).toISOString().split('T')[0];
            return sessionDate === dateStr;
        });
    }

    groupSessionsByDate(sessions) {
        const grouped = {};
        sessions.forEach(session => {
            const date = new Date(session.started_at).toISOString().split('T')[0];
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(session);
        });
        
        // Ordenar por data (mais recente primeiro)
        const sortedKeys = Object.keys(grouped).sort().reverse();
        const sortedGrouped = {};
        sortedKeys.forEach(key => {
            sortedGrouped[key] = grouped[key];
        });
        
        return sortedGrouped;
    }

    calculateStreak(sessions) {
        if (!sessions || sessions.length === 0) return 0;
        
        const today = new Date();
        let streak = 0;
        let currentDate = new Date(today);
        
        // Verificar dias consecutivos a partir de hoje
        while (true) {
            const sessionsThisDay = this.getSessionsForDate(sessions, currentDate);
            if (sessionsThisDay.length > 0) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    }

    formatSessionRounds(holdTimesFormatted) {
        if (!holdTimesFormatted || holdTimesFormatted.length === 0) {
            return '<span style="opacity: 0.6;">Sem dados de retenção</span>';
        }
        
        return holdTimesFormatted.map(round => 
            `<div class="round-detail">R${round.round}: ${round.hold}</div>`
        ).join('');
    }

    // Sistema de Amigos
    async loadFriendsData() {
        try {
            // Carregar amigos
            const friendsResponse = await fetch(`${this.apiUrl}/friendships/friends/`);
            const friends = await friendsResponse.json();
            
            // Carregar solicitações pendentes
            const pendingResponse = await fetch(`${this.apiUrl}/friendships/pending_requests/`);
            const pendingRequests = await pendingResponse.json();
            
            this.displayFriendsData(friends, pendingRequests);
        } catch (error) {
            console.log('❌ Erro ao carregar dados de amigos');
        }
    }

    displayFriendsData(friends, pendingRequests) {
        // Lista de amigos
        const friendsList = document.getElementById('friends-list');
        friendsList.innerHTML = '';
        
        if (friends.length === 0) {
            friendsList.innerHTML = '<p style="opacity: 0.7; text-align: center;">Nenhum amigo ainda</p>';
        } else {
            friends.forEach(friend => {
                const friendDiv = document.createElement('div');
                friendDiv.className = 'friend-item';
                
                friendDiv.innerHTML = `
                    <div class="friend-info">
                        <div class="friend-name">${friend.username}</div>
                        <div class="friend-stats">Membro desde ${new Date(friend.date_joined).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div class="friend-actions">
                        <button class="friend-btn" onclick="breathingApp.viewFriendStats('${friend.username}', ${friend.id})">
                            Ver Stats
                        </button>
                    </div>
                `;
                
                friendsList.appendChild(friendDiv);
            });
        }
        
        // Solicitações pendentes
        const pendingList = document.getElementById('pending-requests-list');
        pendingList.innerHTML = '';
        
        if (pendingRequests.length === 0) {
            pendingList.innerHTML = '<p style="opacity: 0.7; text-align: center;">Nenhuma solicitação pendente</p>';
        } else {
            pendingRequests.forEach(request => {
                const requestDiv = document.createElement('div');
                requestDiv.className = 'friend-item';
                
                requestDiv.innerHTML = `
                    <div class="friend-info">
                        <div class="friend-name">${request.requester.username}</div>
                        <div class="friend-stats">Solicitação enviada em ${new Date(request.created_at).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div class="friend-actions">
                        <button class="friend-btn accept" onclick="breathingApp.acceptFriend(${request.id})">
                            Aceitar
                        </button>
                        <button class="friend-btn reject" onclick="breathingApp.rejectFriend(${request.id})">
                            Rejeitar
                        </button>
                    </div>
                `;
                
                pendingList.appendChild(requestDiv);
            });
        }
    }

    async searchFriend() {
        const searchTerm = document.getElementById('friend-search').value.trim();
        if (!searchTerm) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/users/search/?q=${searchTerm}`);
            const users = await response.json();
            
            const resultsDiv = document.getElementById('search-results');
            resultsDiv.innerHTML = '';
            
            if (users.length === 0) {
                resultsDiv.innerHTML = '<p style="opacity: 0.7;">Nenhum usuário encontrado</p>';
                return;
            }
            
            users.forEach(user => {
                const userDiv = document.createElement('div');
                userDiv.className = 'friend-item';
                
                userDiv.innerHTML = `
                    <div class="friend-info">
                        <div class="friend-name">${user.username}</div>
                        <div class="friend-stats">${user.first_name} ${user.last_name}</div>
                    </div>
                    <div class="friend-actions">
                        <button class="friend-btn" onclick="breathingApp.sendFriendRequest('${user.username}')">
                            Adicionar
                        </button>
                    </div>
                `;
                
                resultsDiv.appendChild(userDiv);
            });
        } catch (error) {
            console.log('❌ Erro ao buscar usuários');
        }
    }

    async sendFriendRequest(username) {
        try {
            await fetch(`${this.apiUrl}/friendships/send_request/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ addressee_username: username })
            });
            
            alert('Solicitação de amizade enviada!');
            document.getElementById('search-results').innerHTML = '';
            document.getElementById('friend-search').value = '';
        } catch (error) {
            alert('Erro ao enviar solicitação');
        }
    }

    async acceptFriend(requestId) {
        try {
            await fetch(`${this.apiUrl}/friendships/${requestId}/accept/`, {
                method: 'POST'
            });
            
            alert('Amizade aceita!');
            this.loadFriendsData();
        } catch (error) {
            alert('Erro ao aceitar amizade');
        }
    }

    async rejectFriend(requestId) {
        try {
            await fetch(`${this.apiUrl}/friendships/${requestId}/reject/`, {
                method: 'POST'
            });
            
            alert('Solicitação rejeitada');
            this.loadFriendsData();
        } catch (error) {
            alert('Erro ao rejeitar solicitação');
        }
    }

    async viewFriendStats(friendName, friendId) {
        try {
            // Carregar estatísticas do amigo
            const response = await fetch(`${this.apiUrl}/sessions/?user=${friendId}`);
            const friendSessions = await response.json();
            
            this.showFriendStatsModal(friendName, friendSessions);
        } catch (error) {
            alert('Erro ao carregar estatísticas do amigo');
        }
    }

    showFriendStatsModal(friendName, sessions) {
        document.getElementById('friend-name').textContent = `Estatísticas de ${friendName}`;
        
        const modalContent = document.getElementById('friend-stats-content');
        
        // Calcular estatísticas
        const totalSessions = sessions.length;
        const totalHoldTime = sessions.reduce((sum, session) => {
            return sum + (session.total_hold_time || 0);
        }, 0);
        
        const streak = this.calculateStreak(sessions);
        
        modalContent.innerHTML = `
            <div class="stats-overview">
                <div class="stat-card">
                    <div class="stat-number">${totalSessions}</div>
                    <div class="stat-label">Sessões Totais</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${streak}</div>
                    <div class="stat-label">Dias Consecutivos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${Math.floor(totalHoldTime / 60)}m</div>
                    <div class="stat-label">Tempo Total Retenção</div>
                </div>
            </div>
            
            <div class="week-view">
                <h4>Últimos 7 Dias</h4>
                <div class="days-grid" id="friend-days-grid"></div>
            </div>
            
            <div class="detailed-history">
                <h4>Sessões Recentes</h4>
                <div id="friend-sessions-history"></div>
            </div>
        `;
        
        // Mostrar modal
        document.getElementById('friend-stats-modal').classList.remove('hidden');
        
        // Preencher dados específicos
        this.displayFriendWeekView(sessions);
        this.displayFriendHistory(sessions);
    }

    displayFriendWeekView(sessions) {
        const daysGrid = document.getElementById('friend-days-grid');
        if (!daysGrid) return;
        
        daysGrid.innerHTML = '';
        
        const today = new Date();
        const dayNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            
            const dayCard = document.createElement('div');
            dayCard.className = 'day-card';
            
            const sessionsThisDay = this.getSessionsForDate(sessions, date);
            if (sessionsThisDay.length > 0) {
                dayCard.classList.add('completed');
            }
            
            dayCard.innerHTML = `
                <div class="day-name">${dayNames[date.getDay()]}</div>
                <div class="day-date">${date.getDate()}</div>
                <div class="day-sessions">${sessionsThisDay.length}</div>
            `;
            
            daysGrid.appendChild(dayCard);
        }
    }

    displayFriendHistory(sessions) {
        const historyDiv = document.getElementById('friend-sessions-history');
        if (!historyDiv) return;
        
        historyDiv.innerHTML = '';
        
        sessions.slice(0, 5).forEach(session => {
            const sessionDiv = document.createElement('div');
            sessionDiv.className = 'session-item';
            
            const startTime = new Date(session.started_at);
            const dateString = startTime.toLocaleDateString('pt-BR');
            const timeString = startTime.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            sessionDiv.innerHTML = `
                <div class="session-header">
                    <span class="session-time">${dateString} ${timeString}</span>
                    <span class="session-duration">${session.actual_duration_formatted || session.planned_duration_formatted}</span>
                </div>
                <div class="session-details">
                    ${session.rounds} rounds • ${session.total_hold_time_formatted || '0s'} retenção total
                </div>
                <div class="session-rounds">
                    ${this.formatSessionRounds(session.hold_times_formatted)}
                </div>
            `;
            
            historyDiv.appendChild(sessionDiv);
        });
    }

    closeModal() {
        document.getElementById('friend-stats-modal').classList.add('hidden');
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
