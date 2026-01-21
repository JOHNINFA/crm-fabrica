#!/bin/bash

# Script de Actualización Automática para VPS
# Uso: ./update_vps.sh

echo "=========================================="
echo "🚀 INICIANDO ACTUALIZACIÓN DEL CRM"
echo "=========================================="

# 1. Actualizar Código
echo "📥 Descargando cambios de git..."
git pull
if [ $? -ne 0 ]; then
    echo "❌ Error al hacer git pull. Revisa conflictos."
    exit 1
fi

# 2. Reconstruir Contenedores (Frontend y Backend)
echo "🏗️  Reconstruyendo contenedores..."
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Mantenimiento Backend
echo "🛠️  Ejecutando migraciones y estáticos..."
# Esperar unos segundos a que el backend inicie
sleep 5
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput

echo "=========================================="
echo "✅ ACTUALIZACIÓN COMPLETADA CON ÉXITO"
echo "=========================================="
