#!/bin/bash

echo "🌬️ Testando Frontend Hotwire Simples"
echo "======================================"

# Iniciar backend em background
echo "🔧 Iniciando backend Django..."
cd backend

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate
python manage.py migrate --noinput > /dev/null 2>&1
python manage.py runserver 0.0.0.0:8000 > /dev/null 2>&1 &
BACKEND_PID=$!

echo "✅ Backend rodando na porta 8000"

# Aguardar backend
sleep 3

# Iniciar frontend
echo "🌐 Iniciando frontend..."
cd ../frontend
python3 server.py &
FRONTEND_PID=$!

echo "✅ Frontend rodando na porta 3000"
echo ""
echo "🎉 Pronto para testar!"
echo "=================================="
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8000/api"
echo ""
echo "🎯 Fluxo correto agora:"
echo "   Round 1: 30 respirações → Hold (cronômetro) → Recovery (15s) → Round 2"
echo "   Round 2: 30 respirações → Hold (cronômetro) → Recovery (15s) → Round 3"
echo "   etc..."
echo ""
echo "💡 Cada round salva 2 tempos: retenção + recuperação"
echo ""
echo "Pressione Ctrl+C para parar tudo..."

# Cleanup
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Serviços parados"
    exit 0
}

trap cleanup INT
wait
