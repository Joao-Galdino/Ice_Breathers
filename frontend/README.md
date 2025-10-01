# 🌬️ Frontend Hotwire Simples

Frontend web limpo e sem bugs para a técnica de respiração Wim Hof.

## 🚀 Como Executar

### Método Rápido:
```bash
# Na pasta raiz do projeto
chmod +x test-frontend.sh
./test-frontend.sh
```

### Método Manual:
```bash
# Terminal 1: Backend Django
cd backend
source .venv/bin/activate
python manage.py runserver

# Terminal 2: Frontend
cd frontend  
python3 server.py
```

## ✨ Funcionalidades

### 🎯 **Fluxo Correto por Round:**
1. **30 Respirações** com círculos animados
2. **Retenção** - cronômetro conta tempo sem respirar
3. **Botão "Respirar"** - inicia recuperação
4. **Recuperação** - inspiração profunda (~15s)
5. **Botão "Soltar"** - finaliza round e vai para próximo

### 📊 **Dados Salvos por Round:**
```
Round 1: Retenção 1m24s | Recuperação 15s
Round 2: Retenção 2m11s | Recuperação 16s  
Round 3: Retenção 1m45s | Recuperação 14s
```

### 🎨 **Visual Orgânico:**
- **3 Círculos empilhados** com gradientes
- **Cores por fase**:
  - 🟡 Dourado - respiração normal
  - 🔵 Azul - retenção (calmante)
  - 🟢 Verde - recuperação (revitalizante)
- **Crescimento progressivo** durante retenção
- **Animações suaves** CSS puras

## 🔧 Arquitetura Simples

```
frontend/
├── index.html       # HTML semântico com Hotwire
├── assets/
│   ├── styles.css   # CSS para círculos orgânicos  
│   └── app.js       # JavaScript linear sem bugs
├── server.py        # Servidor Python simples
└── README.md        # Esta documentação
```

## 🐛 Correções Implementadas

### ✅ **Lógica Linear:**
- **Uma classe** (`BreathingApp`) com estados claros
- **Fluxo sequencial** impossível de quebrar
- **Logs detalhados** para debug completo

### ✅ **Rounds Corretos:**
- Round 1 → Hold + Recovery → Round 2
- Round 2 → Hold + Recovery → Round 3  
- Round 3 → Hold + Recovery → Conclusão
- **Sem pulos** de números

### ✅ **Estados Protegidos:**
- Timers limpos adequadamente
- Event listeners únicos
- Fases controladas por `sessionPhase`

## 📱 Como Usar

1. **Abra**: http://localhost:3000
2. **Selecione**: Número de rounds (2-5)
3. **Inicie**: Clique "Iniciar Sessão"
4. **Respire**: 30 respirações guiadas
5. **Retenha**: Segure a respiração (cronômetro)
6. **Clique "Respirar"**: Inicia recuperação
7. **Recupere**: Inspire fundo por ~15s
8. **Clique "Soltar"**: Próximo round
9. **Repita**: Até completar todos os rounds
10. **Veja**: Estatísticas completas

## 🎯 Logs de Debug

Abra o Console (F12) para ver:
```
🎯 INICIANDO SESSÃO: 3 rounds
💨 Respiração 30/30 - Round 1
🔵 HOLD: Iniciando retenção Round 1
🏁 END RECOVERY: Round 1 - Hold: 84s, Recovery: 15s
🔍 VERIFICAÇÃO: Round atual: 1, Rounds selecionados: 3
➡️ CONTINUANDO: Próximo round 2 de 3
🚀 PRÓXIMO ROUND: 1 → 2 (de 3 total)
💨 Respiração 1/30 - Round 2
```

**Agora funciona perfeitamente!** 🌬️✨
