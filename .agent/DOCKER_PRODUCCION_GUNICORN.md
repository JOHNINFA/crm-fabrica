# 🐳 CONFIGURACIÓN DOCKER PARA PRODUCCIÓN CON GUNICORN

## 📋 ARCHIVOS A ACTUALIZAR

### **1. requirements.txt** - Agregar Gunicorn
```txt
# ... dependencies existentes ...
gunicorn==21.2.0
```

### **2. Dockerfile - VERSION PRODUCCIÓN**
```dockerfile
# Dockerfile para Backend Django - CRM Fábrica (PRODUCCIÓN)
FROM python:3.10-slim

# Variables de entorno
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV TZ=America/Bogota

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

# Crear directorio de trabajo
WORKDIR /app

# Copiar requirements e instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código del proyecto
COPY . .

# Crear directorios necesarios
RUN mkdir -p media/productos media/vencidos api/ml_models

# Exponer puerto
EXPOSE 8000

# Script de entrada
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]

# 🆕 CAMBIO: Usar Gunicorn en lugar de runserver
CMD ["gunicorn", "backend_crm.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--log-level", "info"]
```

### **3. docker-compose.yml - VERSION PRODUCCIÓN**
```yaml
version: '3.8'

services:
  # Base de datos PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: crm_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME:-fabrica}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-CAMBIAR_EN_PRODUCCION}
      TZ: America/Bogota
      PGTZ: America/Bogota
    volumes:
      - postgres_data:/var/lib/postgresql/data
    # ⚠️ NO exponer puerto 5432 en producción (solo acceso interno)
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres} -d ${DB_NAME:-fabrica}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - crm_network

  # 🆕 Redis (para multi-dispositivo - OPCIONAL)
  redis:
    image: redis:7-alpine
    container_name: crm_redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - crm_network

  # Backend Django con Gunicorn
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: crm_backend
    restart: unless-stopped
    environment:
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
      - DATABASE_NAME=${DB_NAME:-fabrica}
      - DATABASE_USER=${DB_USER:-postgres}
      - DATABASE_PASSWORD=${DB_PASSWORD:-CAMBIAR_EN_PRODUCCION}
      - REDIS_URL=redis://redis:6379/0
      - DEBUG=False  # 🔒 Importante para producción
      - ALLOWED_HOSTS=${ALLOWED_HOSTS:-*}
      - SECRET_KEY=${SECRET_KEY:-CAMBIAR_EN_PRODUCCION}
      - TZ=America/Bogota
    volumes:
      - ./media:/app/media
      - ./api/ml_models:/app/api/ml_models
      - static_volume:/app/staticfiles  # 🆕 Para archivos estáticos
    # ⚠️ NO exponer puerto directamente, usar Nginx
    expose:
      - "8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - crm_network

  # Frontend React (BUILD de producción)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod  # 🆕 Dockerfile específico para producción
      args:
        - REACT_APP_API_URL=${API_URL:-https://tu-dominio.com/api}
    container_name: crm_frontend
    restart: unless-stopped
    volumes:
      - frontend_build:/app/build  # 🆕 Archivos estáticos compilados
    networks:
      - crm_network

  # 🆕 Nginx (proxy reverso)
  nginx:
    image: nginx:alpine
    container_name: crm_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro  # Certificados SSL
      - static_volume:/var/www/static:ro
      - ./media:/var/www/media:ro
      - frontend_build:/var/www/frontend:ro
    depends_on:
      - backend
      - frontend
    networks:
      - crm_network

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  static_volume:
    driver: local
  frontend_build:
    driver: local

networks:
  crm_network:
    driver: bridge
```

### **4. .env (NUEVO - Variables de entorno)**
```bash
# Base de datos
DB_NAME=fabrica
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD_SEGURO_AQUI

# Django
SECRET_KEY=GENERA_UN_SECRET_KEY_SEGURO_AQUI
DEBUG=False
ALLOWED_HOSTS=tu-dominio.com,www.tu-dominio.com,IP_DEL_VPS

# API URL para frontend
API_URL=https://tu-dominio.com

# Redis (opcional)
REDIS_URL=redis://redis:6379/0
```

### **5. nginx/nginx.conf (NUEVO)**
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logs
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Optimizaciones
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;  # Para subir fotos

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Upstream para backend
    upstream backend {
        server backend:8000;
    }

    # Servidor principal
    server {
        listen 80;
        server_name tu-dominio.com www.tu-dominio.com;

        # Redirigir HTTP a HTTPS (descomentar cuando tengas SSL)
        # return 301 https://$server_name$request_uri;

        # Archivos estáticos de Django
        location /static/ {
            alias /var/www/static/;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # Media files (fotos de productos, vencidos, etc.)
        location /media/ {
            alias /var/www/media/;
            expires 7d;
        }

        # API Backend (Django + Gunicorn)
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeouts
            proxy_connect_timeout 120;
            proxy_send_timeout 120;
            proxy_read_timeout 120;
        }

        # Admin de Django
        location /admin/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Frontend React (SPA)
        location / {
            root /var/www/frontend;
            try_files $uri $uri/ /index.html;
        }
    }

    # HTTPS (descomentar cuando tengas certificado SSL)
    # server {
    #     listen 443 ssl http2;
    #     server_name tu-dominio.com www.tu-dominio.com;
    #
    #     ssl_certificate /etc/nginx/ssl/fullchain.pem;
    #     ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    #     ssl_protocols TLSv1.2 TLSv1.3;
    #     ssl_ciphers HIGH:!aNULL:!MD5;
    #
    #     # ... (resto de configuración igual que arriba)
    # }
}
```

### **6. frontend/Dockerfile.prod (NUEVO)**
```dockerfile
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copiar package files
COPY package*.json ./
RUN npm ci --only=production

# Copiar código y compilar
COPY . .
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# Production stage (solo archivos compilados)
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🚀 COMANDOS PARA DESPLEGAR EN VPS

### **En el VPS Hostinger:**
```bash
# 1. Clonar proyecto
git clone tu-repositorio.git
cd crm-fabrica

# 2. Crear .env con tus datos
nano .env

# 3. Construir y levantar
docker-compose up -d --build

# 4. Migrar base de datos
docker-compose exec backend python manage.py migrate

# 5. Crear superusuario
docker-compose exec backend python manage.py createsuperuser

# 6. Recolectar static files
docker-compose exec backend python manage.py collectstatic --noinput

# 7. Ver logs
docker-compose logs -f backend
```

---

## ✅ VENTAJAS DE ESTE SETUP

1. **✅ Gunicorn con 4 workers** - Maneja múltiples dispositivos simultáneos
2. **✅ Nginx** - Proxy reverso, SSL, archivos estáticos
3. **✅ Redis** - Listo para Celery (opcional)
4. **✅ PostgreSQL** - Aislado y seguro
5. **✅ Frontend optimizado** - Build de producción
6. **✅ Todo en contenedores** - Fácil de desplegar y mantener
7. **✅ Variables de entorno** - Seguridad (passwords no en código)

---

## ⚠️ IMPORTANTE

**NO aplicaremos estos cambios todavía**. Primero:
1. ✅ Implementamos el sistema multi-dispositivo (Fases 1-4)
2. ✅ Probamos localmente con `python manage.py runserver`
3. ✅ Cuando funcione, actualizamos Docker para producción

**¿Te parece bien este plan?** 👍
