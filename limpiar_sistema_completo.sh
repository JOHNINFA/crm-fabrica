#!/bin/bash

echo "🧹 LIMPIEZA COMPLETA DEL SISTEMA CARGUE"
echo "======================================="
echo ""

# Paso 1: Detener servidores
echo "1️⃣ Deteniendo servidores..."
pkill -f "python3 manage.py runserver"
pkill -f "npm start"
sleep 2

# Paso 2: Limpiar base de datos
echo "2️⃣ Limpiando base de datos..."
python3 manage.py shell -c "from django.db import connection; cursor = connection.cursor(); cursor.execute('DELETE FROM api_cargueid1'); cursor.execute('DELETE FROM api_cargueid2'); cursor.execute('DELETE FROM api_cargueid3'); cursor.execute('DELETE FROM api_cargueid4'); cursor.execute('DELETE FROM api_cargueid5'); cursor.execute('DELETE FROM api_cargueid6'); print('✅ Tablas limpiadas')"

# Paso 3: Verificar limpieza
echo "3️⃣ Verificando limpieza..."
python3 manage.py shell -c "from api.models import CargueID1; print(f'Registros restantes: {CargueID1.objects.count()}')"

echo ""
echo "✅ LIMPIEZA COMPLETADA"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo "1. Reinicia el servidor Django: python3 manage.py runserver 0.0.0.0:8000"
echo "2. Reinicia el frontend: cd frontend && npm start"
echo "3. Abre el navegador en MODO INCÓGNITO"
echo "4. Ve a http://localhost:3000/cargue/LUNES"
echo ""
