# 🌬️ Breathing App

Uma aplicação de respiração guiada desenvolvida com FastAPI (backend) e Hotwire/Turbo (frontend), com suporte para aplicativos móveis via Turbo Native.

## ✨ Funcionalidades

- **Seleção de Rounds**: Escolha entre 2, 3, 4 ou 5 rounds de respiração
- **Respiração Guiada**: Cada round contém 30 respirações com duração de 3,55 segundos cada
- **Animação Visual**: Hexágono animado que simula a respiração (expandir/contrair)
- **Controles**: Pausar, continuar e parar a sessão
- **Estatísticas**: Resumo da sessão ao final (rounds, respirações totais, tempo)
- **Design Responsivo**: Interface adaptada para desktop e mobile
- **Apps Nativos**: Suporte para Android e iOS via Turbo Native

## 🏗️ Arquitetura

### Backend (FastAPI)
- **API RESTful** para gerenciar sessões de respiração
- **Endpoints**:
  - `POST /sessions` - Criar nova sessão
  - `GET /sessions/{id}` - Obter detalhes da sessão
  - `GET /health` - Verificação de saúde

### Frontend (Hotwire/Turbo)
- **Interface web** responsiva com HTML, CSS e JavaScript
- **Turbo** para navegação rápida sem recarregamento
- **Animações CSS** para o hexágono de respiração
- **Fallback offline** quando o backend não está disponível

### Mobile (Turbo Native)
- **WebView otimizada** para Android e iOS
- **Integração nativa** via React Native
- **Performance nativa** com interface web

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
   - Instalar dependências do backend
   - Iniciar o backend FastAPI (porta 8000)
   - Iniciar o frontend (porta 3000)

3. **Acesse a aplicação**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

### Execução Manual

#### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

#### Frontend
```bash
cd frontend
python3 -m http.server 3000
```

### Aplicativos Móveis (React Native)

#### Pré-requisitos
- Node.js 18+
- React Native CLI
- Android Studio (para Android)
- Xcode (para iOS, apenas macOS)

#### Setup
```bash
cd turbo-native
npm install

# Para Android
npm run android

# Para iOS
npm run ios
```

## 📱 Como Usar

1. **Tela Inicial**:
   - Selecione o número de rounds (2-5)
   - Clique em "Iniciar Sessão"

2. **Durante a Respiração**:
   - Acompanhe a animação do hexágono
   - O hexágono expande na inspiração e contrai na expiração
   - Use os controles para pausar ou parar

3. **Conclusão**:
   - Veja as estatísticas da sua sessão
   - Inicie uma nova sessão se desejar

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
- **FastAPI**: Framework web moderno para Python
- **Pydantic**: Validação de dados
- **Uvicorn**: Servidor ASGI
- **CORS**: Suporte para requisições cross-origin

### Frontend
- **HTML5**: Estrutura semântica
- **CSS3**: Animações, gradientes, backdrop-filter
- **JavaScript ES6+**: Programação assíncrona, classes
- **Hotwire Turbo**: Navegação SPA-like

### Mobile
- **React Native**: Framework para apps nativos
- **WebView**: Renderização da interface web
- **Navigation**: Navegação entre telas

## 📝 API Endpoints

### POST /sessions
Cria uma nova sessão de respiração.

**Body:**
```json
{
  "rounds": 3,
  "breaths_per_round": 30,
  "breath_duration": 3.55
}
```

**Response:**
```json
{
  "session_id": "1695830400",
  "rounds": 3,
  "breaths_per_round": 30,
  "breath_duration": 3.55,
  "total_duration": 319.5
}
```

### GET /sessions/{session_id}
Obtém detalhes de uma sessão específica.

### GET /health
Verificação de saúde do servidor.

## 🎯 Próximos Passos

- [ ] **Persistência**: Banco de dados para histórico de sessões
- [ ] **Usuários**: Sistema de autenticação e perfis
- [ ] **Configurações**: Personalizar duração e número de respirações
- [ ] **Sons**: Áudio guiado opcional
- [ ] **Estatísticas**: Gráficos de progresso ao longo do tempo
- [ ] **Notificações**: Lembretes para praticar
- [ ] **Temas**: Diferentes visuais e animações
- [ ] **Offline**: Cache completo para uso sem internet

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.
