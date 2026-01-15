#!/bin/bash

# Script para copiar archivos modificados para el ejecutable de Electron
# Uso: ./copiar-archivos-modificados.sh [destino]
# Ejemplo: ./copiar-archivos-modificados.sh /media/usb

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Copiando archivos modificados para Electron...${NC}"

# Verificar si se proporcionó destino, si no, usar Escritorio
DESTINO="${1:-$HOME/Escritorio/archivos-electron}"

# Crear carpeta de destino con estructura
echo -e "${BLUE}📁 Creando estructura de carpetas en: $DESTINO${NC}"
mkdir -p "$DESTINO/src/components/Pos"
mkdir -p "$DESTINO/src"

# Copiar archivos modificados
echo -e "${GREEN}✅ Copiando LoginCajeroModal.jsx${NC}"
cp src/components/Pos/LoginCajeroModal.jsx "$DESTINO/src/components/Pos/"

echo -e "${GREEN}✅ Copiando App.js${NC}"
cp src/App.js "$DESTINO/src/"

echo -e "${GREEN}✅ Copiando Sidebar.jsx${NC}"
cp src/components/Pos/Sidebar.jsx "$DESTINO/src/components/Pos/"

# Crear archivo de instrucciones
cat > "$DESTINO/INSTRUCCIONES.txt" << 'EOF'
═══════════════════════════════════════════════════════════
  INSTRUCCIONES PARA ACTUALIZAR FRONTEND EN WINDOWS
═══════════════════════════════════════════════════════════

📁 ARCHIVOS A COPIAR:

1. LoginCajeroModal.jsx
   Desde: src/components/Pos/LoginCajeroModal.jsx
   Hacia: C:\Users\USUARIO\Documents\frontend\src\components\Pos\LoginCajeroModal.jsx

2. App.js
   Desde: src/App.js
   Hacia: C:\Users\USUARIO\Documents\frontend\src\App.js

3. Sidebar.jsx
   Desde: src/components/Pos/Sidebar.jsx
   Hacia: C:\Users\USUARIO\Documents\frontend\src\components\Pos\Sidebar.jsx

═══════════════════════════════════════════════════════════
  CAMBIOS INCLUIDOS:
═══════════════════════════════════════════════════════════

✅ Alerta de corte de caja al hacer logout
✅ Configuración de impresión accesible desde sidebar
✅ Rutas bloqueadas en modo POS_ONLY (solo POS y Config. Impresión)

═══════════════════════════════════════════════════════════
  DESPUÉS DE COPIAR:
═══════════════════════════════════════════════════════════

1. Abrir CMD como Administrador en Windows
2. cd C:\Users\USUARIO\Documents\frontend
3. npm run electron:build
4. Esperar 5-10 minutos
5. El ejecutable estará en: 
   C:\Users\USUARIO\Documents\frontend\dist\POS Setup X.X.X.exe

═══════════════════════════════════════════════════════════
EOF

echo ""
echo -e "${GREEN}✅ ¡Listo! Archivos copiados en: $DESTINO${NC}"
echo -e "${BLUE}📄 Lee INSTRUCCIONES.txt para más detalles${NC}"
echo ""
echo "Archivos copiados:"
ls -lh "$DESTINO/src/components/Pos/"
ls -lh "$DESTINO/src/"
