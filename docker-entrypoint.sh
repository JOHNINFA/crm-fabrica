#!/bin/bash
set -e

echo "🚀 Iniciando Backend Django..."

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando PostgreSQL..."
while ! pg_isready -h postgres -U postgres > /dev/null 2>&1; do
    sleep 1
done
echo "✅ PostgreSQL está listo"

# Ejecutar migraciones
echo "🔄 Ejecutando migraciones..."
python manage.py migrate --noinput

# Crear superusuario si no existe
echo "👤 Verificando superusuario..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin')
    print('✅ Superusuario creado: admin/admin')
else:
    print('✅ Superusuario ya existe')
EOF

# Recolectar archivos estáticos
echo "📦 Recolectando archivos estáticos..."
python manage.py collectstatic --noinput || true

echo "✅ Backend listo"

# Ejecutar comando
exec "$@"
