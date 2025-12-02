# 📋 PLAN DE TRABAJO - DOCKERIZACIÓN CRM FÁBRICA

**Fecha:** 30 de Noviembre de 2025  
**Objetivo:** Implementar Docker para replicar el sistema en Windows  
**Duración Estimada:** 3-4 horas (primera vez)  
**Nivel de Dificultad:** Medio

---

## 🎯 OBJETIVOS DEL PROYECTO

### Objetivo Principal:
Dockerizar completamente el sistema CRM Fábrica para que pueda ejecutarse en Windows con un solo comando, garantizando portabilidad y facilidad de despliegue.

### Objetivos Específicos:
1. ✅ Crear Dockerfiles para Backend y Frontend
2. ✅ Configurar Docker Compose para orquestar todos los servicios
3. ✅ Configurar volúmenes para persistencia de datos
4. ✅ Optimizar para rendimiento en Windows
5. ✅ Crear scripts de automatización
6. ✅ Documentar el proceso completo
7. ✅ Probar la app móvil conectándose al backend dockerizado

---

## 📅 CRONOGRAMA DE IMPLEMENTACIÓN

### FASE 1: PREPARACIÓN (30 minutos)
**Objetivo:** Preparar el entorno y archivos necesarios

#### Tarea 1.1: Instalar Docker Desktop en Windows
- [ ] Descargar Docker Desktop desde https://www.docker.com/products/docker-desktop
- [ ] Instalar con configuración por defecto
- [ ] Habilitar WSL2 backend
- [ ] Reiniciar Windows si es necesario
- [ ] Verificar instalación: `docker --version` y `docker-compose --version`
- [ ] Configurar recursos (Settings → Resources):
  - CPU: Mínimo 2 cores, recomendado 4
  - RAM: Mínimo 4GB, recomendado 6-8GB
  - Swap: 1GB
  - Disk: 20GB

**Entregables:**
- Docker Desktop instalado y funcionando
- WSL2 configurado
- Recursos asignados correctamente

---

#### Tarea 1.2: Preparar el Proyecto
- [ ] Hacer backup completo del proyecto actual
- [ ] Exportar base de datos:
  ```bash
  pg_dump -U postgres -d fabrica -F p -f BASE_DATOS_BACKUP_COMPLETO.sql
  ```
- [ ] Copiar carpeta `media/` completa
- [ ] Verificar que `api/ml_models/` tenga los modelos .keras
- [ ] Crear carpeta de trabajo en Windows (ej: `C:\Proyectos\crm-fabrica`)

**Entregables:**
- Backup de base de datos (.sql)
- Backup de carpeta media/
- Proyecto copiado a Windows

---

### FASE 2: CREACIÓN DE ARCHIVOS DOCKER (1 hora)

#### Tarea 2.1: Crear Dockerfile para Backend
**Archivo:** `Dockerfile.backend`

```dockerfile
FROM python:3.10-slim

# Metadatos
LABEL maintainer="CRM Fabrica"
LABEL description="Backend Django con ML y PostgreSQL"

# Variables de entorno
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV TZ=America/Bogota
ENV DEBIAN_FRONTEND=noninteractive

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    gcc \
    g++ \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    libfreetype6-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar requirements e instalar
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Crear directorios necesarios
RUN mkdir -p media/productos media/configuracion api/ml_models

# Exponer puerto
EXPOSE 8000

# Script de inicio
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

**Checklist:**
- [ ] Archivo creado
- [ ] Sintaxis verificada
- [ ] Dependencias del sistema correctas
- [ ] Rutas de directorios correctas

---

#### Tarea 2.2: Crear Dockerfile para Frontend
**Archivo:** `Dockerfile.frontend`

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiar package.json
COPY frontend/package*.json ./

# Instalar dependencias
RUN npm install --legacy-peer-deps

# Copiar código
COPY frontend/ .

# Crear directorios
RUN mkdir -p public/images/productos

# Exponer puerto
EXPOSE 3000

# Variables de entorno
ENV REACT_APP_API_URL=http://localhost:8000/api
ENV NODE_ENV=development

CMD ["npm", "start"]
```

**Checklist:**
- [ ] Archivo creado
- [ ] Sintaxis verificada
- [ ] Flag `--legacy-peer-deps` incluido (para React 19)
- [ ] Variables de entorno correctas

---

#### Tarea 2.3: Crear docker-compose.yml
**Archivo:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  # Base de datos PostgreSQL
  db:
    image: postgres:14-alpine
    container_name: crm-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: fabrica
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 12345
      TZ: America/Bogota
      PGTZ: America/Bogota
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./BASE_DATOS_SQL_COMPLETA.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "5432:5432"
    networks:
      - crm-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d fabrica"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  # Backend Django
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: crm-backend
    restart: unless-stopped
    environment:
      DATABASE_HOST: db
      DATABASE_PORT: 5432
      DATABASE_NAME: fabrica
      DATABASE_USER: postgres
      DATABASE_PASSWORD: 12345
      DEBUG: "True"
      ALLOWED_HOSTS: "*"
      TZ: America/Bogota
    volumes:
      - ./media:/app/media
      - ./api/ml_models:/app/api/ml_models
      - ./frontend/public/images:/app/frontend/public/images
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - crm-network

  # Frontend React
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: crm-frontend
    restart: unless-stopped
    environment:
      REACT_APP_API_URL: http://localhost:8000/api
      CHOKIDAR_USEPOLLING: "true"
    volumes:
      - ./frontend/public/images:/app/public/images:ro
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - crm-network
    stdin_open: true
    tty: true

volumes:
  postgres_data:
    name: crm-postgres-data
    driver: local

networks:
  crm-network:
    name: crm-network
    driver: bridge
```

**Checklist:**
- [ ] Archivo creado
- [ ] Sintaxis YAML correcta
- [ ] Healthcheck configurado
- [ ] Volúmenes definidos
- [ ] Red configurada
- [ ] Dependencias entre servicios correctas

---

#### Tarea 2.4: Crear Script de Inicio (docker-entrypoint.sh)
**Archivo:** `docker-entrypoint.sh`

```bash
#!/bin/bash
set -e

echo "🚀 =========================================="
echo "   CRM FÁBRICA - INICIANDO BACKEND"
echo "=========================================="

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando PostgreSQL..."
until pg_isready -h db -p 5432 -U postgres -d fabrica; do
  echo "   PostgreSQL no está listo - esperando..."
  sleep 2
done
echo "✅ PostgreSQL está listo"

# Ejecutar migraciones
echo ""
echo "📦 Ejecutando migraciones de base de datos..."
python manage.py migrate --noinput

# Crear superusuario si no existe
echo ""
echo "👤 Verificando superusuario..."
python manage.py shell << 'EOF'
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@crm.com', 'admin123')
    print('✅ Superusuario creado: admin / admin123')
else:
    print('ℹ️  Superusuario ya existe')
EOF

# Recolectar archivos estáticos (opcional)
# echo ""
# echo "📁 Recolectando archivos estáticos..."
# python manage.py collectstatic --noinput

echo ""
echo "✅ =========================================="
echo "   BACKEND LISTO - Iniciando servidor..."
echo "=========================================="
echo ""

# Ejecutar comando pasado como argumento
exec "$@"
```

**Checklist:**
- [ ] Archivo creado
- [ ] Permisos de ejecución: `chmod +x docker-entrypoint.sh`
- [ ] Sintaxis bash correcta
- [ ] Espera a PostgreSQL implementada
- [ ] Creación de superusuario automática

---

#### Tarea 2.5: Crear .dockerignore
**Archivo:** `.dockerignore`

```
# Python
venv/
env/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.so
*.egg
*.egg-info/
dist/
build/
*.log

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Git
.git/
.gitignore
.gitattributes

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
desktop.ini

# Database
*.sqlite3
*.db

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build
frontend/build/
frontend/.cache/

# Media (se monta como volumen)
# media/

# Logs
logs/
*.log

# Backups
*.sql
*.backup
*.bak

# Temporal
tmp/
temp/
```

**Checklist:**
- [ ] Archivo creado
- [ ] Excluye archivos innecesarios
- [ ] Reduce tamaño de la imagen

---

#### Tarea 2.6: Crear Scripts de Automatización para Windows

**Archivo:** `iniciar_docker.bat`
```batch
@echo off
title CRM Fabrica - Docker
color 0A
cls

echo ==========================================
echo    CRM FABRICA AP GUERRERO
echo    Sistema de Gestion Integral
echo ==========================================
echo.
echo Iniciando con Docker...
echo.

REM Verificar si Docker está corriendo
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Docker no está corriendo
    echo.
    echo Por favor:
    echo 1. Abre Docker Desktop
    echo 2. Espera a que inicie completamente
    echo 3. Ejecuta este script nuevamente
    echo.
    pause
    exit /b 1
)

echo ✅ Docker está corriendo
echo.

REM Verificar si las imágenes existen
docker images | findstr crm-fabrica >nul 2>&1
if errorlevel 1 (
    echo 🔨 Primera ejecución detectada
    echo Construyendo imágenes Docker...
    echo (Esto puede tardar 10-15 minutos)
    echo.
    docker-compose build
    if errorlevel 1 (
        echo ❌ Error construyendo imágenes
        pause
        exit /b 1
    )
)

echo 🚀 Iniciando servicios...
docker-compose up -d

if errorlevel 1 (
    echo ❌ Error iniciando servicios
    pause
    exit /b 1
)

echo.
echo ⏳ Esperando que los servicios estén listos...
timeout /t 15 /nobreak >nul

echo.
echo ==========================================
echo    ✅ SISTEMA INICIADO CORRECTAMENTE
echo ==========================================
echo.
echo 📊 ACCESOS:
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:8000
echo    Admin:     http://localhost:8000/admin
echo    Database:  localhost:5432
echo.
echo 👤 CREDENCIALES ADMIN:
echo    Usuario:   admin
echo    Password:  admin123
echo.
echo 📱 APP MÓVIL:
echo    Configurar API_URL en config.js:
echo    http://TU_IP_LOCAL:8000
echo    (Usa ipconfig para ver tu IP)
echo.
echo ==========================================
echo.
echo 💡 COMANDOS ÚTILES:
echo    Ver logs:     logs_docker.bat
echo    Detener:      detener_docker.bat
echo    Reiniciar:    docker-compose restart
echo    Estado:       docker-compose ps
echo.
pause
```

**Archivo:** `detener_docker.bat`
```batch
@echo off
title CRM Fabrica - Detener
color 0C

echo ==========================================
echo    DETENIENDO SERVICIOS
echo ==========================================
echo.

docker-compose down

if errorlevel 1 (
    echo ❌ Error deteniendo servicios
) else (
    echo ✅ Servicios detenidos correctamente
)

echo.
pause
```

**Archivo:** `logs_docker.bat`
```batch
@echo off
title CRM Fabrica - Logs
color 0E

echo ==========================================
echo    LOGS EN TIEMPO REAL
echo    Presiona Ctrl+C para salir
echo ==========================================
echo.

docker-compose logs -f --tail=100
```

**Archivo:** `reiniciar_docker.bat`
```batch
@echo off
title CRM Fabrica - Reiniciar
color 0B

echo Reiniciando servicios...
docker-compose restart

echo ✅ Servicios reiniciados
timeout /t 3 >nul
```

**Archivo:** `estado_docker.bat`
```batch
@echo off
title CRM Fabrica - Estado
color 0B

echo ==========================================
echo    ESTADO DE LOS SERVICIOS
echo ==========================================
echo.

docker-compose ps

echo.
echo ==========================================
echo    USO DE RECURSOS
echo ==========================================
echo.

docker stats --no-stream

echo.
pause
```

**Checklist:**
- [ ] Todos los .bat creados
- [ ] Sintaxis correcta
- [ ] Permisos de ejecución
- [ ] Mensajes claros y útiles

---

### FASE 3: CONSTRUCCIÓN Y PRUEBAS (1 hora)

#### Tarea 3.1: Construir Imágenes Docker
```bash
# En la carpeta del proyecto
cd C:\Proyectos\crm-fabrica

# Construir imágenes
docker-compose build
```

**Checklist:**
- [ ] Build exitoso del backend
- [ ] Build exitoso del frontend
- [ ] No hay errores en los logs
- [ ] Imágenes creadas: `docker images`

**Problemas Comunes:**
- Error de dependencias Python → Verificar requirements.txt
- Error de npm → Usar `--legacy-peer-deps` en Dockerfile
- Error de permisos → Ejecutar como administrador

---

#### Tarea 3.2: Iniciar Servicios
```bash
# Iniciar en modo detached
docker-compose up -d

# Ver logs
docker-compose logs -f
```

**Checklist:**
- [ ] PostgreSQL iniciado correctamente
- [ ] Backend iniciado correctamente
- [ ] Frontend iniciado correctamente
- [ ] Migraciones ejecutadas
- [ ] Superusuario creado

**Verificar:**
```bash
# Ver estado de contenedores
docker-compose ps

# Debería mostrar:
# crm-postgres   Up (healthy)
# crm-backend    Up
# crm-frontend   Up
```

---

#### Tarea 3.3: Pruebas de Funcionalidad

**Prueba 1: Backend API**
- [ ] Abrir http://localhost:8000/api/
- [ ] Verificar que carga la API REST
- [ ] Probar endpoint: http://localhost:8000/api/productos/
- [ ] Verificar que devuelve JSON

**Prueba 2: Admin Django**
- [ ] Abrir http://localhost:8000/admin
- [ ] Login con admin/admin123
- [ ] Verificar que carga el panel
- [ ] Ver lista de productos

**Prueba 3: Frontend React**
- [ ] Abrir http://localhost:3000
- [ ] Verificar que carga el menú principal
- [ ] Navegar a POS
- [ ] Navegar a Productos
- [ ] Verificar que las imágenes cargan

**Prueba 4: Base de Datos**
```bash
# Conectar a PostgreSQL
docker-compose exec db psql -U postgres -d fabrica

# Verificar tablas
\dt

# Verificar productos
SELECT COUNT(*) FROM api_producto;

# Salir
\q
```

**Checklist:**
- [ ] API funciona
- [ ] Admin funciona
- [ ] Frontend funciona
- [ ] Base de datos accesible
- [ ] Datos cargados correctamente

---

### FASE 4: CONFIGURACIÓN DE APP MÓVIL (30 minutos)

#### Tarea 4.1: Obtener IP de Windows
```bash
# En CMD o PowerShell
ipconfig

# Buscar "Dirección IPv4" de tu adaptador de red
# Ejemplo: 192.168.1.15
```

**Checklist:**
- [ ] IP obtenida
- [ ] IP anotada

---

#### Tarea 4.2: Configurar Firewall de Windows
```bash
# Abrir PowerShell como Administrador

# Permitir puerto 8000
netsh advfirewall firewall add rule name="CRM Backend" dir=in action=allow protocol=TCP localport=8000

# Verificar
netsh advfirewall firewall show rule name="CRM Backend"
```

**Checklist:**
- [ ] Regla de firewall creada
- [ ] Puerto 8000 abierto

---

#### Tarea 4.3: Actualizar Configuración de App Móvil
**Archivo:** `AP GUERRERO/config.js`

```javascript
// Cambiar la IP por la de tu máquina Windows
export const API_URL = 'http://192.168.1.15:8000'; // ← TU IP AQUÍ

export const ENDPOINTS = {
  GUARDAR_SUGERIDO: `${API_URL}/api/guardar-sugerido/`,
  OBTENER_CARGUE: `${API_URL}/api/obtener-cargue/`,
  ACTUALIZAR_CHECK_VENDEDOR: `${API_URL}/api/actualizar-check-vendedor/`,
  VERIFICAR_ESTADO_DIA: `${API_URL}/api/verificar-estado-dia/`,
  RENDIMIENTO_CARGUE: `${API_URL}/api/rendimiento-cargue/`,
};
```

**Checklist:**
- [ ] IP actualizada en config.js
- [ ] Archivo guardado

---

#### Tarea 4.4: Probar App Móvil
```bash
# En la carpeta de la app
cd "AP GUERRERO"

# Iniciar Expo
npx expo start

# Escanear QR con Expo Go en tu celular
```

**Pruebas:**
- [ ] App se conecta al backend
- [ ] Puede cargar productos
- [ ] Puede crear ventas
- [ ] Sincronización funciona

---

### FASE 5: OPTIMIZACIÓN Y DOCUMENTACIÓN (30 minutos)

#### Tarea 5.1: Optimizar Rendimiento

**Ajustar Recursos de Docker:**
1. Abrir Docker Desktop
2. Settings → Resources
3. Configurar:
   - CPU: 4 cores (si tienes 8)
   - RAM: 6-8 GB
   - Swap: 2 GB

**Optimizar docker-compose.yml:**
```yaml
# Agregar límites de recursos
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

**Checklist:**
- [ ] Recursos optimizados
- [ ] Límites configurados
- [ ] Sistema responde rápido

---

#### Tarea 5.2: Crear Backup Automático

**Archivo:** `backup_docker.bat`
```batch
@echo off
set FECHA=%date:~-4,4%%date:~-7,2%%date:~-10,2%
set HORA=%time:~0,2%%time:~3,2%

echo Creando backup...

REM Backup de base de datos
docker-compose exec -T db pg_dump -U postgres fabrica > backups\db_%FECHA%_%HORA%.sql

REM Backup de media
tar -czf backups\media_%FECHA%_%HORA%.tar.gz media\

echo ✅ Backup completado: backups\db_%FECHA%_%HORA%.sql
pause
```

**Checklist:**
- [ ] Script creado
- [ ] Carpeta backups/ creada
- [ ] Backup funciona

---

#### Tarea 5.3: Documentar Instalación

**Archivo:** `INSTALACION_DOCKER.md`
```markdown
# Instalación con Docker - CRM Fábrica

## Requisitos
- Windows 10/11 (64-bit)
- Docker Desktop instalado
- 8GB RAM mínimo
- 20GB espacio en disco

## Instalación Rápida

1. Instalar Docker Desktop
2. Clonar/copiar el proyecto
3. Ejecutar: `iniciar_docker.bat`
4. Acceder a http://localhost:3000

## Comandos Útiles

- Iniciar: `iniciar_docker.bat`
- Detener: `detener_docker.bat`
- Logs: `logs_docker.bat`
- Estado: `estado_docker.bat`

## Troubleshooting

### Docker no inicia
- Verificar que Docker Desktop esté corriendo
- Reiniciar Docker Desktop

### Puerto en uso
```bash
docker-compose down
netstat -ano | findstr :8000
taskkill /PID [PID] /F
```

### Base de datos no conecta
```bash
docker-compose logs db
docker-compose restart db
```
```

**Checklist:**
- [ ] Documentación creada
- [ ] Instrucciones claras
- [ ] Troubleshooting incluido

---

## ✅ CHECKLIST FINAL

### Archivos Creados:
- [ ] Dockerfile.backend
- [ ] Dockerfile.frontend
- [ ] docker-compose.yml
- [ ] docker-entrypoint.sh
- [ ] .dockerignore
- [ ] iniciar_docker.bat
- [ ] detener_docker.bat
- [ ] logs_docker.bat
- [ ] reiniciar_docker.bat
- [ ] estado_docker.bat
- [ ] backup_docker.bat
- [ ] INSTALACION_DOCKER.md

### Funcionalidad:
- [ ] Backend funciona correctamente
- [ ] Frontend funciona correctamente
- [ ] Base de datos persiste datos
- [ ] Imágenes se guardan correctamente
- [ ] Admin Django accesible
- [ ] API REST funciona
- [ ] App móvil se conecta

### Optimización:
- [ ] Recursos de Docker configurados
- [ ] Límites de contenedores establecidos
- [ ] Backups automatizados
- [ ] Logs configurados

### Documentación:
- [ ] README actualizado
- [ ] Guía de instalación creada
- [ ] Troubleshooting documentado
- [ ] Comandos útiles listados

---

## 🎓 CONOCIMIENTOS ADQUIRIDOS

Al completar este plan, habrás aprendido:
- ✅ Cómo dockerizar una aplicación Django
- ✅ Cómo dockerizar una aplicación React
- ✅ Cómo usar Docker Compose
- ✅ Cómo configurar volúmenes persistentes
- ✅ Cómo optimizar contenedores
- ✅ Cómo hacer backups de contenedores
- ✅ Cómo conectar apps móviles a backends dockerizados

---

## 📞 SOPORTE

Si encuentras problemas:
1. Revisar logs: `docker-compose logs -f`
2. Verificar estado: `docker-compose ps`
3. Reiniciar servicios: `docker-compose restart`
4. Reconstruir: `docker-compose build --no-cache`

---

**¡Éxito en la implementación! 🚀**
