#!/bin/bash

echo "🌬️ Iniciando Breathing App - Versão Simples"
echo "============================================"

# Função para cleanup
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

# 1. Iniciar Backend Django
echo "🔧 Iniciando backend Django..."
cd backend

if [ ! -d ".venv" ]; then
    echo "📦 Criando ambiente virtual..."
    python3 -m venv .venv
fi

source .venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1

echo "🗄️ Executando migrações..."
python manage.py migrate --noinput > /dev/null 2>&1

echo "✅ Backend Django iniciando na porta 8000..."
python manage.py runserver 0.0.0.0:8000 > /dev/null 2>&1 &
BACKEND_PID=$!

# Aguardar backend inicializar
sleep 3

# Verificar se backend está funcionando
if curl -s http://localhost:8000/api/health/ > /dev/null; then
    echo "✅ Backend funcionando: http://localhost:8000"
else
    echo "❌ Erro no backend"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 2. Iniciar Frontend
echo "🌐 Iniciando frontend simples..."
cd ../frontend

echo "✅ Frontend iniciando na porta 3000..."
python3 server.py > /dev/null 2>&1 &
FRONTEND_PID=$!

sleep 2

echo ""
echo "🎉 Breathing App funcionando!"
echo "================================"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8000"
echo "👑 Admin:    http://localhost:8000/admin"
echo ""
echo "💡 Dicas:"
echo "   • Use Chrome/Safari para melhor experiência"
echo "   • Abra o Console (F12) para ver logs detalhados"
echo "   • A lógica é linear e sem bugs!"
echo ""
echo "Pressione Ctrl+C para parar tudo..."

# Aguardar indefinidamente
wait
