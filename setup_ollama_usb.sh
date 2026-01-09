#!/bin/bash

echo "🔧 Configurando Ollama para usar disco USB..."
echo ""

# Detener Ollama
echo "1. Deteniendo Ollama..."
systemctl stop ollama

# Limpiar archivos parciales del disco principal
echo "2. Limpiando archivos parciales..."
rm -rf /usr/share/ollama/.ollama/models/*

# Crear carpeta en USB si no existe
echo "3. Preparando disco USB..."
mkdir -p /media/john/E2B/ollama_models
chown -R john:john /media/john/E2B/ollama_models

# Configurar variable de entorno
echo "4. Configurando Ollama para usar USB..."
mkdir -p /etc/systemd/system/ollama.service.d
cat > /etc/systemd/system/ollama.service.d/override.conf << 'EOF'
[Service]
Environment="OLLAMA_MODELS=/media/john/E2B/ollama_models"
EOF

# Recargar systemd
echo "5. Recargando configuración..."
systemctl daemon-reload

# Iniciar Ollama
echo "6. Iniciando Ollama..."
systemctl start ollama

# Verificar
echo ""
echo "✅ Configuración completada!"
echo ""
echo "Verifica con: ollama list"
echo "Descarga modelo con: ollama pull qwen2.5:7b"
