#!/bin/bash

echo "🚀 Iniciando Breathing App..."

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Por favor, instale Python 3."
    exit 1
fi

# Criar e ativar ambiente virtual para o backend
echo "📦 Configurando ambiente virtual..."
cd backend

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate

# Instalar dependências
echo "📋 Instalando dependências do backend..."
pip install -r requirements.txt

# Executar migrações se necessário
echo "🗄️ Executando migrações do banco de dados..."
python manage.py migrate --noinput

# Iniciar backend Django
echo "🔧 Iniciando backend Django..."
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

# Aguardar backend inicializar
sleep 5

# Verificar se o backend está rodando
if curl -s http://localhost:8000/api/health/ > /dev/null; then
    echo "✅ Backend rodando em http://localhost:8000"
else
    echo "❌ Erro ao iniciar backend"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Iniciar servidor frontend
echo "🌐 Iniciando frontend..."
cd ../frontend

# Verificar se Python tem módulo http.server
if python3 -c "import http.server" 2>/dev/null; then
    echo "✅ Iniciando servidor frontend em http://localhost:3000"
    python3 server.py &
    FRONTEND_PID=$!
else
    echo "❌ Módulo http.server não encontrado"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 Aplicação iniciada com sucesso!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8000"
echo ""
echo "Pressione Ctrl+C para parar todos os serviços..."

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Serviços parados"
    exit 0
}

# Capturar Ctrl+C
trap cleanup INT

# Aguardar indefinidamente
wait
