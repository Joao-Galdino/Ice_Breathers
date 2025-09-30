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
        this.currentSessionId = null;
        this.authToken = localStorage.getItem('access_token');
        this.apiBaseUrl = 'http://localhost:8000/api';
        
        // Variáveis para as fases de retenção
        this.sessionPhase = 'breathing'; // breathing, holding, recovery
        this.holdStartTime = null;
        this.recoveryStartTime = null;
        this.holdTimer = null;
        this.recoveryTimer = null;
        this.currentHoldTime = 0;
        this.currentRecoveryTime = 0;
        this.roundHoldTimes = []; // Array para armazenar tempos de cada round
        
        this.initializeApp();
    }

    async initializeApp() {
        // Verificar se usuário está logado
        if (this.authToken) {
            try {
                await this.checkAuthStatus();
                this.showMainApp();
            } catch (error) {
                console.log('Token inválido, mostrando tela de login');
                this.showAuthScreen();
            }
        } else {
            this.showAuthScreen();
        }
        
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
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startSession();
            });
        }

        // Controles da sessão de respiração
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.togglePause();
            });
        }

        const stopBtn = document.getElementById('stop-btn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopSession();
            });
        }

        // Botão para iniciar retenção (Respirar)
        const breatheBtn = document.getElementById('breathe-btn');
        if (breatheBtn) {
            // Remover listeners anteriores
            breatheBtn.replaceWith(breatheBtn.cloneNode(true));
            const newBreatheBtn = document.getElementById('breathe-btn');
            newBreatheBtn.addEventListener('click', () => {
                console.log(`🔘 BOTÃO RESPIRAR clicado no Round ${this.currentRound}`);
                this.startRecovery();
            });
        }

        // Botão para finalizar recuperação (Soltar)
        const releaseBtn = document.getElementById('release-btn');
        if (releaseBtn) {
            // Remover listeners anteriores
            releaseBtn.replaceWith(releaseBtn.cloneNode(true));
            const newReleaseBtn = document.getElementById('release-btn');
            newReleaseBtn.addEventListener('click', () => {
                console.log(`🔘 BOTÃO SOLTAR clicado no Round ${this.currentRound}`);
                this.endRecovery();
            });
        }

        // Nova sessão
        const newSessionBtn = document.getElementById('new-session-btn');
        if (newSessionBtn) {
            newSessionBtn.addEventListener('click', () => {
                this.resetToHome();
            });
        }
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

    // Métodos de autenticação
    async checkAuthStatus() {
        const response = await fetch(`${this.apiBaseUrl}/profiles/me/`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Token inválido');
        }

        const userData = await response.json();
        this.currentUser = userData;
        return userData;
    }

    showAuthScreen() {
        document.getElementById('main-content').innerHTML = `
            <div class="auth-screen">
                <div class="auth-container">
                    <div class="auth-tabs">
                        <button class="auth-tab active" onclick="app.showLogin()">Login</button>
                        <button class="auth-tab" onclick="app.showRegister()">Registrar</button>
                    </div>
                    
                    <div id="login-form" class="auth-form">
                        <h2>Entrar na sua conta</h2>
                        <input type="text" id="login-username" placeholder="Nome de usuário" required>
                        <input type="password" id="login-password" placeholder="Senha" required>
                        <button onclick="app.login()" class="auth-btn">Entrar</button>
                    </div>
                    
                    <div id="register-form" class="auth-form hidden">
                        <h2>Criar nova conta</h2>
                        <input type="text" id="register-username" placeholder="Nome de usuário" required>
                        <input type="email" id="register-email" placeholder="Email" required>
                        <input type="text" id="register-firstname" placeholder="Nome">
                        <input type="text" id="register-lastname" placeholder="Sobrenome">
                        <input type="password" id="register-password" placeholder="Senha" required>
                        <input type="password" id="register-password-confirm" placeholder="Confirmar senha" required>
                        <button onclick="app.register()" class="auth-btn">Registrar</button>
                    </div>
                </div>
            </div>
        `;
    }

    showLogin() {
        document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.auth-tab')[0].classList.add('active');
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
    }

    showRegister() {
        document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.auth-tab')[1].classList.add('active');
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
    }

    async login() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                this.authToken = data.access;
                this.currentUser = data.user;
                this.showMainApp();
            } else {
                alert('Erro no login: ' + (data.detail || 'Credenciais inválidas'));
            }
        } catch (error) {
            console.error('Erro no login:', error);
            alert('Erro ao conectar com o servidor');
        }
    }

    async register() {
        const formData = {
            username: document.getElementById('register-username').value,
            email: document.getElementById('register-email').value,
            first_name: document.getElementById('register-firstname').value,
            last_name: document.getElementById('register-lastname').value,
            password: document.getElementById('register-password').value,
            password_confirm: document.getElementById('register-password-confirm').value
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                this.authToken = data.access;
                this.currentUser = data.user;
                this.showMainApp();
            } else {
                alert('Erro no registro: ' + JSON.stringify(data));
            }
        } catch (error) {
            console.error('Erro no registro:', error);
            alert('Erro ao conectar com o servidor');
        }
    }

    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        this.authToken = null;
        this.currentUser = null;
        this.showAuthScreen();
    }

    showMainApp() {
        document.getElementById('main-content').innerHTML = `
            <div class="user-header">
                <div class="user-info">
                    <span>Olá, ${this.currentUser.user?.username || this.currentUser.username}!</span>
                    <button onclick="app.showProfile()" class="profile-btn">Perfil</button>
                    <button onclick="app.logout()" class="logout-btn">Sair</button>
                </div>
            </div>
            
            <div class="home-screen" id="home-screen">
                <div class="rounds-selection">
                    <h2>Selecione o número de rounds:</h2>
                    <div class="rounds-buttons">
                        <button class="round-btn" data-rounds="2">2 Rounds</button>
                        <button class="round-btn" data-rounds="3">3 Rounds</button>
                        <button class="round-btn" data-rounds="4">4 Rounds</button>
                        <button class="round-btn" data-rounds="5">5 Rounds</button>
                    </div>
                    <button id="start-btn" class="start-btn" disabled>Iniciar Sessão</button>
                </div>
            </div>

            <div class="breathing-screen hidden" id="breathing-screen">
                <div class="session-info">
                    <div class="round-counter">
                        Round <span id="current-round">1</span> de <span id="total-rounds">0</span>
                    </div>
                    <div class="phase-info">
                        <span id="phase-indicator">Respiração</span>
                        <span id="breath-counter">Respiração <span id="current-breath">1</span> de 30</span>
                        <span id="hold-timer" class="hidden">Retenção: <span id="hold-time">0:00</span></span>
                        <span id="recovery-timer" class="hidden">Recuperação: <span id="recovery-time">0:00</span></span>
                    </div>
                </div>

                <div class="breathing-animation">
                    <div class="hexagon-stack" id="hexagon-stack">
                        <div class="hexagon hexagon-layer-3" id="breathing-hexagon-3">
                            <div class="hexagon-inner"></div>
                        </div>
                        <div class="hexagon hexagon-layer-2" id="breathing-hexagon-2">
                            <div class="hexagon-inner"></div>
                        </div>
                        <div class="hexagon hexagon-layer-1" id="breathing-hexagon">
                            <div class="hexagon-inner">
                                <span id="breath-number">1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="breathing-controls">
                    <div id="breathing-controls" class="control-group">
                        <button id="pause-btn" class="control-btn">Pausar</button>
                        <button id="stop-btn" class="control-btn">Parar</button>
                    </div>
                    
                    <div id="hold-controls" class="control-group hidden">
                        <div class="hold-instructions">
                            <h3>Prenda a respiração!</h3>
                            <p>Segure o ar e mantenha-se relaxado</p>
                        </div>
                        <button id="breathe-btn" class="control-btn primary">Respirar</button>
                    </div>
                    
                    <div id="recovery-controls" class="control-group hidden">
                        <div class="recovery-instructions">
                            <h3>Respire fundo!</h3>
                            <p>Inspire profundamente e segure por 15 segundos</p>
                        </div>
                        <button id="release-btn" class="control-btn primary">Soltar</button>
                    </div>
                </div>
                
                <div id="round-times" class="round-times hidden">
                    <h3>Tempos dos Rounds:</h3>
                    <div id="times-list"></div>
                </div>
            </div>

            <div class="completion-screen hidden" id="completion-screen">
                <div class="completion-content">
                    <h2>🎉 Sessão Concluída!</h2>
                    <p>Parabéns! Você completou sua sessão de respiração.</p>
                    <div class="session-summary">
                        <div class="summary-item">
                            <strong>Rounds:</strong> <span id="completed-rounds">0</span>
                        </div>
                        <div class="summary-item">
                            <strong>Total de respirações:</strong> <span id="total-breaths">0</span>
                        </div>
                        <div class="summary-item">
                            <strong>Tempo total:</strong> <span id="total-time">0</span>
                        </div>
                        <div id="hold-times-summary" class="hold-times-summary">
                            <h4>Tempos de Retenção:</h4>
                            <div id="hold-times-list"></div>
                        </div>
                    </div>
                    <button id="new-session-btn" class="start-btn">Nova Sessão</button>
                </div>
            </div>
        `;
        
        // Reativar event listeners após recriar o conteúdo
        this.initializeEventListeners();
    }

    async startSession() {
        try {
            // Criar sessão no backend
            const response = await fetch(`${this.apiBaseUrl}/sessions/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
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
            this.currentSessionId = sessionData.id;

            // Inicializar variáveis da sessão
            this.currentRound = 1;
            this.currentBreath = 1;
            this.isRunning = true;
            this.isPaused = false;
            this.sessionStartTime = Date.now();
            this.sessionPhase = 'breathing';
            this.roundHoldTimes = [];

            console.log(`Iniciando sessão - Round ${this.currentRound} de ${this.selectedRounds}`);

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
        if (!this.isRunning || this.isPaused) {
            console.log(`⏸️ BREATHING CYCLE PARADO: isRunning=${this.isRunning}, isPaused=${this.isPaused}`);
            return;
        }

        console.log(`💨 BREATHING CYCLE: Iniciando respiração ${this.currentBreath} do Round ${this.currentRound}`);

        const hexagons = ['breathing-hexagon', 'breathing-hexagon-2', 'breathing-hexagon-3'];
        const breathNumber = document.getElementById('breath-number');
        
        // Atualizar número da respiração
        if (breathNumber) breathNumber.textContent = this.currentBreath;
        
        // Animação de inspiração para todos os hexágonos
        hexagons.forEach(id => {
            const hexagon = document.getElementById(id);
            if (hexagon) {
                hexagon.classList.remove('exhale');
                hexagon.classList.add('inhale');
            }
        });
        
        // Depois de metade do tempo, trocar para expiração
        setTimeout(() => {
            if (!this.isRunning || this.isPaused) return;
            
            hexagons.forEach(id => {
                const hexagon = document.getElementById(id);
                if (hexagon) {
                    hexagon.classList.remove('inhale');
                    hexagon.classList.add('exhale');
                }
            });
        }, this.breathDuration / 2);

        // Próxima respiração
        this.breathingTimer = setTimeout(() => {
            if (!this.isRunning || this.isPaused) return;
            
            this.nextBreath();
        }, this.breathDuration);
    }

    nextBreath() {
        this.currentBreath++;
        console.log(`NextBreath: Round ${this.currentRound}, Respiração ${this.currentBreath}/${this.totalBreaths}`);
        
        if (this.currentBreath > this.totalBreaths) {
            // Round completado
            console.log(`Round ${this.currentRound} completado! Iniciando retenção...`);
            this.nextRound();
        } else {
            // Próxima respiração
            this.updateDisplay();
            this.startBreathingCycle();
        }
    }

    nextRound() {
        // Após completar 30 respirações, iniciar fase de retenção
        this.startHoldPhase();
    }

    async startHoldPhase() {
        console.log(`🔵 HOLD PHASE: Iniciando retenção do Round ${this.currentRound}`);
        
        this.sessionPhase = 'holding';
        this.holdStartTime = Date.now();
        this.currentHoldTime = 0;
        
        // Atualizar interface
        this.updatePhaseDisplay();
        
        // Notificar backend sobre início da retenção
        if (this.currentSessionId && this.authToken) {
            try {
                await fetch(`${this.apiBaseUrl}/sessions/${this.currentSessionId}/start_hold/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`,
                        'Content-Type': 'application/json',
                    }
                });
                console.log(`✅ Backend notificado: hold iniciado para Round ${this.currentRound}`);
            } catch (error) {
                console.error('Erro ao notificar início da retenção:', error);
            }
        }
        
        // Iniciar cronômetro de retenção
        this.startHoldTimer();
    }

    startHoldTimer() {
        this.holdTimer = setInterval(() => {
            this.currentHoldTime = Math.floor((Date.now() - this.holdStartTime) / 1000);
            this.updateHoldDisplay();
        }, 1000);
    }

    async startRecovery() {
        // Proteção contra chamadas duplas
        if (this.sessionPhase !== 'holding') {
            console.log(`⚠️ PROTEÇÃO: startRecovery chamado mas fase é '${this.sessionPhase}', ignorando...`);
            return;
        }

        console.log(`🟢 RECOVERY PHASE: Iniciando recuperação do Round ${this.currentRound} - Tempo de retenção: ${this.currentHoldTime}s`);
        
        // Parar cronômetro de retenção e crescimento dos hexágonos
        if (this.holdTimer) {
            clearInterval(this.holdTimer);
            this.holdTimer = null;
        }
        this.stopHexagonGrowth();
        
        // Salvar tempo de retenção
        const holdTime = this.currentHoldTime;
        this.roundHoldTimes.push({
            round: this.currentRound,
            hold: holdTime,
            recovery: 0
        });
        
        // Notificar backend sobre fim da retenção
        if (this.currentSessionId && this.authToken) {
            try {
                await fetch(`${this.apiBaseUrl}/sessions/${this.currentSessionId}/end_hold/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        round_number: this.currentRound,
                        hold_seconds: holdTime
                    })
                });
            } catch (error) {
                console.error('Erro ao salvar tempo de retenção:', error);
            }
        }
        
        // Iniciar fase de recuperação
        this.sessionPhase = 'recovery';
        this.recoveryStartTime = Date.now();
        this.currentRecoveryTime = 0;
        
        this.updatePhaseDisplay();
        this.startRecoveryTimer();
    }

    startRecoveryTimer() {
        this.recoveryTimer = setInterval(() => {
            this.currentRecoveryTime = Math.floor((Date.now() - this.recoveryStartTime) / 1000);
            this.updateRecoveryDisplay();
        }, 1000);
    }

    async endRecovery() {
        // Proteção contra chamadas duplas
        if (this.sessionPhase !== 'recovery') {
            console.log(`⚠️ PROTEÇÃO: endRecovery chamado mas fase é '${this.sessionPhase}', ignorando...`);
            return;
        }

        console.log(`🏁 END RECOVERY: Finalizando recuperação do Round ${this.currentRound} - Tempo de recuperação: ${this.currentRecoveryTime}s`);
        
        // Marcar como processando para evitar chamadas duplas
        this.sessionPhase = 'processing';
        
        // Parar cronômetro de recuperação
        if (this.recoveryTimer) {
            clearInterval(this.recoveryTimer);
            this.recoveryTimer = null;
        }
        
        // Atualizar tempo de recuperação
        const recoveryTime = this.currentRecoveryTime;
        if (this.roundHoldTimes[this.currentRound - 1]) {
            this.roundHoldTimes[this.currentRound - 1].recovery = recoveryTime;
        }
        
        // Notificar backend sobre fim da recuperação
        if (this.currentSessionId && this.authToken) {
            try {
                await fetch(`${this.apiBaseUrl}/sessions/${this.currentSessionId}/end_recovery/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        round_number: this.currentRound,
                        recovery_seconds: recoveryTime
                    })
                });
            } catch (error) {
                console.error('Erro ao salvar tempo de recuperação:', error);
            }
        }
        
        // Verificar se é o último round
        console.log(`🔍 VERIFICANDO: Round atual: ${this.currentRound}, Rounds selecionados: ${this.selectedRounds}`);
        
        if (this.currentRound >= this.selectedRounds) {
            // Sessão completada
            console.log(`🏁 SESSÃO COMPLETA: Finalizando após Round ${this.currentRound}`);
            this.completeSession();
        } else {
            // Próximo round - incrementar ANTES de atualizar display
            const oldRound = this.currentRound;
            this.currentRound++;
            this.currentBreath = 1;
            this.sessionPhase = 'breathing';
            
            console.log(`🚀 PRÓXIMO ROUND: ${oldRound} → ${this.currentRound} de ${this.selectedRounds}`);
            
            this.updateDisplay();
            this.updatePhaseDisplay();
            
            // Pequena pausa entre rounds
            setTimeout(() => {
                if (this.isRunning && !this.isPaused) {
                    console.log(`🔄 Retomando respiração no Round ${this.currentRound}`);
                    this.startBreathingCycle();
                }
            }, 2000);
        }
    }

    updateDisplay() {
        const currentRoundEl = document.getElementById('current-round');
        const currentBreathEl = document.getElementById('current-breath');
        
        if (currentRoundEl) {
            currentRoundEl.textContent = this.currentRound;
            console.log(`📱 DISPLAY: Atualizando Round para ${this.currentRound}`);
        }
        if (currentBreathEl) {
            currentBreathEl.textContent = this.currentBreath;
            console.log(`📱 DISPLAY: Atualizando Respiração para ${this.currentBreath}`);
        }
    }

    updatePhaseDisplay() {
        const phaseIndicator = document.getElementById('phase-indicator');
        const breathCounter = document.getElementById('breath-counter');
        const holdTimer = document.getElementById('hold-timer');
        const recoveryTimer = document.getElementById('recovery-timer');
        
        const breathingControls = document.getElementById('breathing-controls');
        const holdControls = document.getElementById('hold-controls');
        const recoveryControls = document.getElementById('recovery-controls');
        const roundTimes = document.getElementById('round-times');
        const hexagonStack = document.getElementById('hexagon-stack');
        const breathNumber = document.getElementById('breath-number');
        
        // Resetar visibilidade
        if (breathCounter) breathCounter.classList.add('hidden');
        if (holdTimer) holdTimer.classList.add('hidden');
        if (recoveryTimer) recoveryTimer.classList.add('hidden');
        
        if (breathingControls) breathingControls.classList.add('hidden');
        if (holdControls) holdControls.classList.add('hidden');
        if (recoveryControls) recoveryControls.classList.add('hidden');
        
        // Resetar classes do hexágono
        if (hexagonStack) {
            hexagonStack.classList.remove('holding', 'recovery', 'hexagon-growing');
        }
        
        // Resetar hexágonos individuais
        ['breathing-hexagon', 'breathing-hexagon-2', 'breathing-hexagon-3'].forEach(id => {
            const hex = document.getElementById(id);
            if (hex) {
                hex.classList.remove('inhale', 'exhale');
            }
        });
        
        switch (this.sessionPhase) {
            case 'breathing':
                if (phaseIndicator) phaseIndicator.textContent = 'Respiração';
                if (breathCounter) breathCounter.classList.remove('hidden');
                if (breathingControls) breathingControls.classList.remove('hidden');
                if (roundTimes) roundTimes.classList.add('hidden');
                break;
                
            case 'holding':
                if (phaseIndicator) phaseIndicator.textContent = 'Retenção';
                if (holdTimer) holdTimer.classList.remove('hidden');
                if (holdControls) holdControls.classList.remove('hidden');
                if (roundTimes) roundTimes.classList.remove('hidden');
                if (hexagonStack) {
                    hexagonStack.classList.add('holding', 'hexagon-growing');
                }
                if (breathNumber) breathNumber.textContent = '⏱️';
                this.updateRoundTimesDisplay();
                this.startHexagonGrowth();
                break;
                
            case 'recovery':
                if (phaseIndicator) phaseIndicator.textContent = 'Recuperação';
                if (recoveryTimer) recoveryTimer.classList.remove('hidden');
                if (recoveryControls) recoveryControls.classList.remove('hidden');
                if (roundTimes) roundTimes.classList.remove('hidden');
                if (hexagonStack) {
                    hexagonStack.classList.add('recovery');
                }
                if (breathNumber) breathNumber.textContent = '🫁';
                this.updateRoundTimesDisplay();
                break;
        }
    }

    updateHoldDisplay() {
        const holdTimeEl = document.getElementById('hold-time');
        if (holdTimeEl) {
            const minutes = Math.floor(this.currentHoldTime / 60);
            const seconds = this.currentHoldTime % 60;
            holdTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    updateRecoveryDisplay() {
        const recoveryTimeEl = document.getElementById('recovery-time');
        if (recoveryTimeEl) {
            const minutes = Math.floor(this.currentRecoveryTime / 60);
            const seconds = this.currentRecoveryTime % 60;
            recoveryTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    updateRoundTimesDisplay() {
        const timesListEl = document.getElementById('times-list');
        if (!timesListEl) return;
        
        let html = '';
        this.roundHoldTimes.forEach(roundTime => {
            const holdMinutes = Math.floor(roundTime.hold / 60);
            const holdSeconds = roundTime.hold % 60;
            const holdFormatted = `${holdMinutes}:${holdSeconds.toString().padStart(2, '0')}`;
            
            let recoveryFormatted = '';
            if (roundTime.recovery > 0) {
                const recMinutes = Math.floor(roundTime.recovery / 60);
                const recSeconds = roundTime.recovery % 60;
                recoveryFormatted = ` | Recuperação: ${recMinutes}:${recSeconds.toString().padStart(2, '0')}`;
            }
            
            html += `<div class="round-time">Round ${roundTime.round}: ${holdFormatted}${recoveryFormatted}</div>`;
        });
        
        timesListEl.innerHTML = html;
    }

    startHexagonGrowth() {
        // Crescimento progressivo dos hexágonos durante a retenção
        this.hexagonGrowthTimer = setInterval(() => {
            this.updateHexagonSize();
        }, 2000); // A cada 2 segundos
    }

    updateHexagonSize() {
        if (this.sessionPhase !== 'holding') return;

        const layers = [
            { id: 'breathing-hexagon', baseScale: 1.0 },
            { id: 'breathing-hexagon-2', baseScale: 0.85 },
            { id: 'breathing-hexagon-3', baseScale: 0.7 }
        ];

        // Calcular escala baseada no tempo (máximo de 1.4x após 60 segundos)
        const growthFactor = Math.min(1 + (this.currentHoldTime * 0.007), 1.4);

        layers.forEach((layer, index) => {
            const element = document.getElementById(layer.id);
            if (element) {
                const layerGrowth = growthFactor - (index * 0.03); // Cada camada cresce um pouco menos
                const finalScale = layer.baseScale * Math.max(1, layerGrowth);
                
                // Aplicar transformação orgânica
                element.style.transform = `translate(-50%, -50%) scale(${finalScale})`;
                
                // Adicionar efeito de brilho conforme cresce
                const glowIntensity = (layerGrowth - 1) * 0.5;
                const hexagonInner = element.querySelector('.hexagon-inner');
                if (hexagonInner) {
                    hexagonInner.style.boxShadow = `
                        0 ${8 + glowIntensity * 20}px ${32 + glowIntensity * 40}px rgba(52, 152, 219, ${0.2 + glowIntensity * 0.3}),
                        inset 0 ${2 + glowIntensity * 4}px ${8 + glowIntensity * 8}px rgba(255, 255, 255, ${0.3 + glowIntensity * 0.2})
                    `;
                }
            }
        });
    }

    stopHexagonGrowth() {
        if (this.hexagonGrowthTimer) {
            clearInterval(this.hexagonGrowthTimer);
            this.hexagonGrowthTimer = null;
        }
        
        // Resetar tamanhos para o design orgânico
        const layers = [
            { id: 'breathing-hexagon', scale: 1.0 },
            { id: 'breathing-hexagon-2', scale: 0.85 },
            { id: 'breathing-hexagon-3', scale: 0.7 }
        ];
        
        layers.forEach(layer => {
            const element = document.getElementById(layer.id);
            if (element) {
                element.style.transform = `translate(-50%, -50%) scale(${layer.scale})`;
                
                // Resetar box-shadow
                const hexagonInner = element.querySelector('.hexagon-inner');
                if (hexagonInner) {
                    hexagonInner.style.boxShadow = `
                        0 8px 32px rgba(0, 0, 0, 0.1),
                        inset 0 2px 8px rgba(255, 255, 255, 0.3)
                    `;
                }
            }
        });
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

    async completeSession() {
        this.isRunning = false;
        
        if (this.breathingTimer) {
            clearTimeout(this.breathingTimer);
        }
        
        // Calcular estatísticas
        const totalTime = Math.round((Date.now() - this.sessionStartTime) / 1000);
        const totalBreaths = this.selectedRounds * this.totalBreaths;
        
        // Completar sessão no backend se tiver ID de sessão
        if (this.currentSessionId && this.authToken) {
            try {
                await fetch(`${this.apiBaseUrl}/sessions/${this.currentSessionId}/complete/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`,
                        'Content-Type': 'application/json',
                    }
                });
                console.log('Sessão completada no backend');
            } catch (error) {
                console.error('Erro ao completar sessão no backend:', error);
            }
        }
        
        // Mostrar tela de conclusão
        this.showCompletionScreen(totalBreaths, totalTime);
    }

    showCompletionScreen(totalBreaths, totalTime) {
        document.getElementById('breathing-screen').classList.add('hidden');
        document.getElementById('completion-screen').classList.remove('hidden');
        
        // Atualizar estatísticas básicas
        const completedRoundsEl = document.getElementById('completed-rounds');
        const totalBreathsEl = document.getElementById('total-breaths');
        const totalTimeEl = document.getElementById('total-time');
        
        if (completedRoundsEl) completedRoundsEl.textContent = this.selectedRounds;
        if (totalBreathsEl) totalBreathsEl.textContent = totalBreaths;
        if (totalTimeEl) totalTimeEl.textContent = this.formatTime(totalTime);
        
        // Mostrar tempos de retenção
        this.showHoldTimesSummary();
    }

    showHoldTimesSummary() {
        const holdTimesListEl = document.getElementById('hold-times-list');
        if (!holdTimesListEl) return;
        
        let html = '';
        let totalHoldTime = 0;
        
        this.roundHoldTimes.forEach(roundTime => {
            const holdMinutes = Math.floor(roundTime.hold / 60);
            const holdSeconds = roundTime.hold % 60;
            const holdFormatted = `${holdMinutes}m ${holdSeconds}s`;
            
            totalHoldTime += roundTime.hold;
            
            html += `
                <div class="hold-time-item">
                    <span class="round-label">Round ${roundTime.round}:</span>
                    <span class="hold-time-value">${holdFormatted}</span>
                </div>
            `;
        });
        
        // Adicionar tempo total e médio
        if (this.roundHoldTimes.length > 0) {
            const avgHoldTime = totalHoldTime / this.roundHoldTimes.length;
            const totalMinutes = Math.floor(totalHoldTime / 60);
            const totalSeconds = totalHoldTime % 60;
            const avgMinutes = Math.floor(avgHoldTime / 60);
            const avgSeconds = Math.floor(avgHoldTime % 60);
            
            html += `
                <div class="hold-stats">
                    <div class="stat-item">
                        <strong>Tempo total de retenção:</strong> ${totalMinutes}m ${totalSeconds}s
                    </div>
                    <div class="stat-item">
                        <strong>Tempo médio por round:</strong> ${avgMinutes}m ${avgSeconds}s
                    </div>
                </div>
            `;
        }
        
        holdTimesListEl.innerHTML = html;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }

    async showProfile() {
        try {
            // Buscar estatísticas do usuário
            const [profileResponse, statsResponse] = await Promise.all([
                fetch(`${this.apiBaseUrl}/profiles/me/`, {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }),
                fetch(`${this.apiBaseUrl}/sessions/stats/`, {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                })
            ]);

            const profile = await profileResponse.json();
            const stats = await statsResponse.json();

            document.getElementById('main-content').innerHTML = `
                <div class="profile-screen">
                    <div class="profile-header">
                        <button onclick="app.showMainApp()" class="back-btn">← Voltar</button>
                        <h2>Meu Perfil</h2>
                    </div>
                    
                    <div class="profile-content">
                        <div class="profile-info">
                            <h3>Informações Pessoais</h3>
                            <p><strong>Nome:</strong> ${profile.user.first_name} ${profile.user.last_name}</p>
                            <p><strong>Email:</strong> ${profile.user.email}</p>
                            <p><strong>Usuário desde:</strong> ${new Date(profile.user.date_joined).toLocaleDateString()}</p>
                        </div>
                        
                        <div class="profile-stats">
                            <h3>Estatísticas</h3>
                            <div class="stats-grid">
                                <div class="stat-item">
                                    <span class="stat-number">${stats.total_sessions}</span>
                                    <span class="stat-label">Sessões Totais</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">${stats.total_time}</span>
                                    <span class="stat-label">Tempo Total</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">${stats.sessions_this_week}</span>
                                    <span class="stat-label">Esta Semana</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">${stats.sessions_this_month}</span>
                                    <span class="stat-label">Este Mês</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            alert('Erro ao carregar dados do perfil');
        }
    }

    resetToHome() {
        // Resetar estado
        this.selectedRounds = 0;
        this.currentRound = 1;
        this.currentBreath = 1;
        this.isRunning = false;
        this.isPaused = false;
        this.currentSessionId = null;
        
        // Resetar variáveis das novas fases
        this.sessionPhase = 'breathing';
        this.holdStartTime = null;
        this.recoveryStartTime = null;
        this.currentHoldTime = 0;
        this.currentRecoveryTime = 0;
        this.roundHoldTimes = [];
        
        // Limpar todos os timers
        if (this.breathingTimer) {
            clearTimeout(this.breathingTimer);
        }
        if (this.holdTimer) {
            clearInterval(this.holdTimer);
            this.holdTimer = null;
        }
        if (this.recoveryTimer) {
            clearInterval(this.recoveryTimer);
            this.recoveryTimer = null;
        }
        this.stopHexagonGrowth();
        
        // Resetar UI
        const roundBtns = document.querySelectorAll('.round-btn');
        if (roundBtns.length > 0) {
            roundBtns.forEach(btn => {
                btn.classList.remove('selected');
            });
        }
        
        const startBtn = document.getElementById('start-btn');
        if (startBtn) startBtn.disabled = true;
        
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) pauseBtn.textContent = 'Pausar';
        
        const hexagon = document.getElementById('breathing-hexagon');
        if (hexagon) hexagon.classList.remove('inhale', 'exhale');
        
        // Mostrar tela inicial
        const homeScreen = document.getElementById('home-screen');
        const breathingScreen = document.getElementById('breathing-screen');
        const completionScreen = document.getElementById('completion-screen');
        
        if (homeScreen) homeScreen.classList.remove('hidden');
        if (breathingScreen) breathingScreen.classList.add('hidden');
        if (completionScreen) completionScreen.classList.add('hidden');
    }
}

// Inicializar aplicação quando DOM estiver carregado
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new BreathingApp();
});
