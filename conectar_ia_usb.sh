#!/bin/bash

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔌 INICIANDO AGENTE INTELIGENTE (MODO USB)...${NC}"
echo ""

# 1. Verificar Disco USB
USB_PATH="/media/john/E2B/ollama_models"
if [ ! -d "$USB_PATH" ]; then
    echo -e "${RED}❌ Error: No encuentro el disco USB en: $USB_PATH ${NC}"
    echo "   👉 Por favor conecta el disco USB y vuelve a intentarlo."
    exit 1
fi

echo -e "${GREEN}✅ Disco USB detectado correctamente.${NC}"

# 2. Detener cualquier ollama previo para evitar conflictos
pkill ollama 2>/dev/null

# 3. Configurar variable de entorno y arrancar
echo -e "${BLUE}🧠 Cargando cerebro desde la USB...${NC}"
export OLLAMA_MODELS="$USB_PATH"

# Arrancar Ollama en segundo plano y guardar su PID
ollama serve > /dev/null 2>&1 &
OLLAMA_PID=$!

echo "⏳ Esperando a que el cerebro despierte (5 seg)..."
sleep 5

# 4. Verificar si respondió
if ps -p $OLLAMA_PID > /dev/null; then
    echo -e "${GREEN}✅ ¡SISTEMA IA ONLINE!${NC}"
    echo "---------------------------------------------------"
    echo "🤖 Modelos Disponibles:"
    ollama list
    echo "---------------------------------------------------"
    echo "🚀 LISTO PARA TRABAJAR."
    echo "   (No cierres esta ventana mientras uses la IA)"
    
    # Mantener el script corriendo
    wait $OLLAMA_PID
else
    echo -e "${RED}❌ Error al iniciar Ollama.${NC}"
    exit 1
fi
