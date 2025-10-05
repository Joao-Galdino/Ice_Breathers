#!/bin/bash

echo "🔍 Debug Frontend - Verificando Histórico"
echo "========================================"

# Função para cleanup
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup INT

# 1. Iniciar Backend
echo "🔧 Iniciando backend Django..."
cd backend
source .venv/bin/activate

echo "🗄️ Executando migrações..."
python manage.py migrate --noinput > /dev/null 2>&1

echo "👤 Criando usuário de teste..."
echo "from django.contrib.auth.models import User; User.objects.get_or_create(username='test', defaults={'password': 'test123', 'email': 'test@test.com'})" | python manage.py shell > /dev/null 2>&1

python manage.py runserver 0.0.0.0:8000 > /dev/null 2>&1 &
BACKEND_PID=$!

sleep 3

# Testar endpoints
echo "🧪 Testando endpoints da API..."
echo "Health check:"
curl -s http://localhost:8000/api/health/ | head -c 100
echo ""

echo "Stats endpoint (sem auth):"
curl -s http://localhost:8000/api/sessions/stats/ | head -c 100
echo ""

# 2. Iniciar Frontend
echo "🌐 Iniciando frontend..."
cd ../frontend
python3 server.py > /dev/null 2>&1 &
FRONTEND_PID=$!

sleep 2

echo ""
echo "✅ Serviços iniciados!"
echo "========================"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8000"
echo ""
echo "🎯 Para debugar o histórico:"
echo "   1. Abra http://localhost:3000"
echo "   2. Faça login com qualquer username/senha"
echo "   3. Clique '📊 Histórico'"
echo "   4. Abra Console (F12) para ver logs detalhados"
echo ""
echo "🔍 Logs esperados:"
echo "   📊 Carregando dados do histórico..."
echo "   🔑 Token atual: Presente"
echo "   📊 Carregando dados demo para histórico: 5 sessões"
echo ""
echo "Pressione Ctrl+C para parar..."

wait

