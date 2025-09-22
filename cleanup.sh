#!/bin/bash

# Script para eliminar los componentes creados

echo "Eliminando componentes creados..."

# Eliminar archivos
rm -f /home/john/Escritorio/crm-fabrica/frontend/src/utils/dbUtils.js
rm -rf /home/john/Escritorio/crm-fabrica/frontend/src/components/admin
rm -f /home/john/Escritorio/crm-fabrica/frontend/src/pages/AdminScreen.jsx

# Restaurar App.js a su estado original
sed -i '/import AdminScreen/d' /home/john/Escritorio/crm-fabrica/frontend/src/App.js
sed -i '/admin/d' /home/john/Escritorio/crm-fabrica/frontend/src/App.js

echo "Limpieza completada."