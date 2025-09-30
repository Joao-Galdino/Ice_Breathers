# 🌬️ Breathing App

Uma aplicação de respiração guiada desenvolvida com Django REST Framework (backend) e JavaScript vanilla (frontend), com sistema completo de usuários, amizades e rastreamento de sessões.

## ✨ Funcionalidades

### 👤 Sistema de Usuários
- **Registro e Login**: Autenticação completa com JWT
- **Perfis**: Informações pessoais e estatísticas
- **Amizades**: Sistema para adicionar e gerenciar amigos
- **Segurança**: Tokens JWT para autenticação segura

### 🌬️ Sessões de Respiração
- **Seleção de Rounds**: Escolha entre 2, 3, 4 ou 5 rounds de respiração
- **Respiração Guiada**: Cada round contém 30 respirações com duração de 3,55 segundos cada
- **Animação Visual**: Hexágono animado que simula a respiração (expandir/contrair)
- **Controles**: Pausar, continuar e parar a sessão
- **Rastreamento de Tempo**: Duração real vs planejada de cada sessão

### 📊 Estatísticas Avançadas
- **Histórico Completo**: Todas as sessões são salvas no banco de dados
- **Métricas Pessoais**: Total de sessões, tempo acumulado, média por sessão
- **Estatísticas Periódicas**: Sessões desta semana e deste mês
- **Dados Opcionais**: Frequência cardíaca, níveis de stress, humor

### 🎨 Interface Moderna
- **Design Responsivo**: Interface adaptada para desktop e mobile
- **Autenticação Visual**: Telas de login e registro integradas
- **Dashboard Pessoal**: Perfil com estatísticas e histórico
- **Fallback Offline**: Funciona mesmo sem conexão com o servidor

## 🏗️ Arquitetura

### Backend (Django REST Framework)
- **API RESTful** completa com autenticação JWT
- **Modelos de Dados**:
  - `User` - Usuários do sistema (Django padrão)
  - `UserProfile` - Perfil estendido com estatísticas
  - `Friendship` - Sistema de amizades
  - `BreathingSession` - Sessões de respiração
  - `SessionStats` - Estatísticas detalhadas das sessões

### Frontend Mobile (React Native)
- **App nativo** para Android e iOS
- **Navegação fluida** com React Navigation
- **Autenticação JWT** com AsyncStorage
- **Animações nativas** com Animated API
- **Círculos orgânicos** com gradientes e efeitos visuais
- **Offline-first** com fallback local

### Frontend Web (JavaScript - DEPRECATED)
- Interface web básica (não recomendada, usar mobile)
- Bugs conhecidos na lógica de rounds
- Substituída pelo React Native

## 🚀 Como Executar

### Desenvolvimento Rápido

1. **Clone o repositório**:
   ```bash
   git clone <repo-url>
   cd Ice_Breathers
   ```

2. **Execute o script de desenvolvimento**:
   ```bash
   ./start-dev.sh
   ```

   Este script irá:
   - Configurar o ambiente virtual Python
   - Instalar dependências do Django/DRF
   - Executar migrações do banco de dados
   - Iniciar o backend Django (porta 8000)
   - Iniciar o frontend (porta 3000)

3. **Acesse a aplicação**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Django Admin: http://localhost:8000/admin

### Execução Manual

#### Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # No Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Frontend
```bash
cd frontend
python3 server.py  # ou python3 -m http.server 3000
```

### Aplicativo Mobile (React Native) - RECOMENDADO

#### Pré-requisitos
- Node.js 18+
- React Native CLI (`npm install -g @react-native-community/cli`)
- Android Studio (para Android)
- Xcode (para iOS, apenas macOS)
- CocoaPods (para iOS: `sudo gem install cocoapods`)

#### Setup Automático
```bash
# Script completo de configuração
./setup-react-native.sh

# Ou manualmente:
cd turbo-native
npm install

# iOS (apenas macOS)
cd ios && pod install && cd ..

# Android
npm run android

# iOS  
npm run ios
```

#### Desenvolvimento
```bash
# 1. Iniciar backend Django
cd backend && source .venv/bin/activate && python manage.py runserver

# 2. Iniciar Metro (React Native)
cd turbo-native && npm start

# 3. Rodar no dispositivo/emulador
npm run android  # ou npm run ios
```

## 📱 Como Usar

### 🔐 **Autenticação**
1. **Primeiro Acesso**: Registre-se com username, email e senha
2. **Login**: Entre com suas credenciais
3. **Persistência**: App lembra do login automaticamente

### 🏠 **Tela Principal**
1. **Estatísticas**: Veja seu progresso (sessões totais, tempo acumulado)
2. **Seleção de Rounds**: Escolha entre 2, 3, 4 ou 5 rounds
3. **Técnica Wim Hof**: Informações sobre os benefícios

### 🌬️ **Sessão de Respiração**
1. **30 Respirações**: Círculos orgânicos animados expandem/contraem
2. **Fase de Retenção**: 
   - Cronômetro conta o tempo sem respirar
   - Círculos crescem progressivamente
   - Botão "Respirar" quando quiser parar
3. **Fase de Recuperação**:
   - Inspiração profunda por ~15 segundos  
   - Botão "Soltar" para finalizar
4. **Próximo Round**: Repetir até completar todos os rounds

### 🎉 **Conclusão**
1. **Estatísticas Detalhadas**: Tempo de retenção por round
2. **Progresso**: Tempo total, médio, número de respirações
3. **Motivação**: Dicas para próximas sessões
4. **Ações**: Nova sessão ou voltar ao início

## 🎨 Design

### Cores
- **Gradiente principal**: Azul/Roxo (#667eea → #764ba2)
- **Elementos**: Branco com transparência
- **Botão iniciar**: Gradiente laranja/vermelho (#ff6b6b → #ee5a24)

### Animações
- **Hexágono**: Transição suave de 3,55s entre expansão/contração
- **Backdrop blur**: Efeito de vidro fosco nos elementos
- **Hover effects**: Elevação dos botões ao passar o mouse

### Responsividade
- **Desktop**: Layout com grid 2x2 para botões
- **Tablet**: Adaptação automática dos elementos
- **Mobile**: Layout em coluna única, controles empilhados

## 🔧 Tecnologias

### Backend
- **Django 5.2**: Framework web robusto para Python
- **Django REST Framework**: API RESTful poderosa
- **Simple JWT**: Autenticação JWT segura
- **Django CORS Headers**: Suporte para requisições cross-origin
- **SQLite**: Banco de dados (pode ser trocado por PostgreSQL/MySQL)

### Mobile (React Native)
- **React Native 0.73**: Framework para apps nativos
- **React Navigation**: Navegação fluida entre telas
- **Animated API**: Animações nativas de alta performance
- **Linear Gradient**: Gradientes suaves e orgânicos
- **AsyncStorage**: Persistência de dados local
- **Axios**: Cliente HTTP para API
- **Context API**: Gerenciamento de estado global

### Web (Deprecated)
- **JavaScript Vanilla**: Interface web básica
- **CSS3**: Animações e layouts responsivos
- ⚠️ **Não recomendado**: Bugs na lógica de rounds

## 📝 API Endpoints

### Autenticação
- `POST /api/auth/register/` - Registrar novo usuário
- `POST /api/auth/login/` - Login de usuário
- `POST /api/auth/refresh/` - Renovar token JWT

### Perfis
- `GET /api/profiles/me/` - Obter perfil do usuário atual
- `PATCH /api/profiles/me/` - Atualizar perfil

### Sessões de Respiração
- `POST /api/sessions/` - Criar nova sessão
- `GET /api/sessions/` - Listar sessões do usuário
- `GET /api/sessions/{id}/` - Obter detalhes da sessão
- `POST /api/sessions/{id}/complete/` - Completar sessão
- `POST /api/sessions/{id}/cancel/` - Cancelar sessão
- `GET /api/sessions/active/` - Obter sessão ativa
- `GET /api/sessions/stats/` - Estatísticas do usuário
- `GET /api/sessions/recent/` - Últimas 10 sessões

### Amizades
- `GET /api/friendships/` - Listar amizades
- `POST /api/friendships/send_request/` - Enviar solicitação
- `GET /api/friendships/friends/` - Listar amigos aceitos
- `GET /api/friendships/pending_requests/` - Solicitações pendentes
- `POST /api/friendships/{id}/accept/` - Aceitar solicitação
- `POST /api/friendships/{id}/reject/` - Rejeitar solicitação

### Utilitários
- `GET /api/users/search/?q=username` - Buscar usuários
- `GET /api/health/` - Verificação de saúde

### Exemplo: Criar Sessão
**POST /api/sessions/**
```json
{
  "rounds": 3,
  "breaths_per_round": 30,
  "breath_duration": 3.55,
  "notes": "Sessão matinal"
}
```

**Response:**
```json
{
  "id": 1,
  "user": {"id": 1, "username": "joao"},
  "rounds": 3,
  "breaths_per_round": 30,
  "breath_duration": 3.55,
  "planned_duration_formatted": "5m 19s",
  "status": "in_progress",
  "started_at": "2024-01-01T10:00:00Z"
}
```

## 🎯 Próximos Passos

- [x] **Persistência**: Banco de dados para histórico de sessões ✅
- [x] **Usuários**: Sistema de autenticação e perfis ✅
- [x] **Amizades**: Sistema social para conectar usuários ✅
- [x] **Estatísticas**: Métricas detalhadas e progresso ✅
- [ ] **Interface de Amigos**: Tela para gerenciar amizades
- [ ] **Configurações**: Personalizar duração e número de respirações
- [ ] **Sons**: Áudio guiado opcional
- [ ] **Gráficos**: Visualizações de progresso ao longo do tempo
- [ ] **Notificações**: Lembretes para praticar
- [ ] **Temas**: Diferentes visuais e animações
- [ ] **Compartilhamento**: Compartilhar sessões com amigos
- [ ] **Desafios**: Metas e conquistas
- [ ] **Exportação**: Dados em CSV/JSON

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.
