#!/bin/bash
# Script para iniciar Ollama usando modelos del disco USB E2B

# Detener Ollama si está corriendo
pkill -f "ollama serve"
sleep 2

# Configurar variable de entorno para que Ollama use los modelos del USB
export OLLAMA_MODELS="/media/john/E2B/ollama_models"

# Iniciar Ollama
echo "🚀 Iniciando Ollama con modelos desde USB..."
nohup ollama serve > /tmp/ollama.log 2>&1 &

sleep 3

# Verificar que esté corriendo
if pgrep -f "ollama serve" > /dev/null; then
    echo "✅ Ollama está corriendo"
    echo "📂 Usando modelos de: $OLLAMA_MODELS"
    
    # Listar modelos disponibles
    echo ""
    echo "Modelos disponibles:"
    ollama list
else
    echo "❌ Error: Ollama no pudo iniciarse"
    cat /tmp/ollama.log
fi
