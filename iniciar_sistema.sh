#!/bin/bash

# ==========================================
# SCRIPT PARA INICIAR CRM FÁBRICA
# ==========================================

echo "🚀 =========================================="
echo "   CRM FÁBRICA AP GUERRERO"
echo "   Iniciando sistema..."
echo "=========================================="

# Obtener directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar si un puerto está en uso
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Verificar PostgreSQL
echo -e "\n${YELLOW}📦 Verificando PostgreSQL...${NC}"
if systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✅ PostgreSQL está corriendo${NC}"
else
    echo -e "${RED}❌ PostgreSQL no está corriendo. Iniciando...${NC}"
    sudo systemctl start postgresql
fi

# Verificar si los puertos están libres
echo -e "\n${YELLOW}🔍 Verificando puertos...${NC}"

if check_port 8000; then
    echo -e "${YELLOW}⚠️  Puerto 8000 en uso. Matando proceso...${NC}"
    kill -9 $(lsof -t -i:8000) 2>/dev/null
fi

if check_port 3000; then
    echo -e "${YELLOW}⚠️  Puerto 3000 en uso. Matando proceso...${NC}"
    kill -9 $(lsof -t -i:3000) 2>/dev/null
fi

# Iniciar Backend
echo -e "\n${YELLOW}🐍 Iniciando Backend Django...${NC}"
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
sleep 3

if check_port 8000; then
    echo -e "${GREEN}✅ Backend iniciado en http://localhost:8000${NC}"
else
    echo -e "${RED}❌ Error iniciando backend${NC}"
fi

# Iniciar Frontend
echo -e "\n${YELLOW}⚛️  Iniciando Frontend React...${NC}"
cd frontend
npm start &
FRONTEND_PID=$!
cd ..
sleep 5

if check_port 3000; then
    echo -e "${GREEN}✅ Frontend iniciado en http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Error iniciando frontend${NC}"
fi

# Resumen
echo -e "\n${GREEN}=========================================="
echo "   ✅ SISTEMA INICIADO"
echo "=========================================="
echo -e "   Backend:  http://localhost:8000"
echo -e "   Frontend: http://localhost:3000"
echo -e "   Admin:    http://localhost:8000/admin"
echo -e "==========================================${NC}"
echo ""
echo "Presiona Ctrl+C para detener todos los servicios"

# Esperar y manejar Ctrl+C
trap "echo -e '\n${YELLOW}Deteniendo servicios...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo -e '${GREEN}✅ Servicios detenidos${NC}'; exit 0" SIGINT SIGTERM

# Mantener el script corriendo
wait
