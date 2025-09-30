#!/bin/bash

echo "🚀 Configurando React Native App..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js 18+ primeiro."
    exit 1
fi

# Verificar versão do Node
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão $NODE_VERSION encontrada. Precisamos da versão 18 ou superior."
    exit 1
fi

# Ir para diretório do React Native
cd turbo-native

# Instalar dependências
echo "📦 Instalando dependências do React Native..."
npm install

# Verificar se React Native CLI está instalado globalmente
if ! command -v npx react-native &> /dev/null; then
    echo "📦 Instalando React Native CLI..."
    npm install -g @react-native-community/cli
fi

# Para iOS - verificar se CocoaPods está instalado (apenas no macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v pod &> /dev/null; then
        echo "📦 CocoaPods não encontrado. Instalando..."
        sudo gem install cocoapods
    fi
    
    # Instalar pods do iOS
    if [ -d "ios" ]; then
        echo "🍎 Instalando dependências do iOS..."
        cd ios && pod install && cd ..
    fi
fi

echo ""
echo "✅ Setup concluído!"
echo ""
echo "🎯 Para executar o app:"
echo "   • Android: npm run android"
echo "   • iOS: npm run ios"
echo "   • Metro: npm start"
echo ""
echo "📱 Certifique-se de que:"
echo "   • O backend Django está rodando em localhost:8000"
echo "   • Um emulador/dispositivo está conectado"
echo ""
echo "🔧 Para testar a API:"
echo "   • Backend: http://localhost:8000/api/health/"
echo "   • Django Admin: http://localhost:8000/admin/"
