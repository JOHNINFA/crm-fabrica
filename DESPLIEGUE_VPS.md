# 🚀 GUÍA DE DESPLIEGUE EN VPS - CRM FÁBRICA

## 📋 RESUMEN

Este proyecto tiene **DOS configuraciones Docker:**

### **1. Desarrollo (actual)**
```bash
docker-compose up
# Usa: python manage.py runserver
# Para: desarrollo local
```

### **2. Producción (nuevo)**
```bash
docker-compose -f docker-compose.prod.yml up -d
# Usa: Gunicorn + Nginx
# Para: VPS Hostinger
```

---

## 🔧 PREPARACIÓN EN VPS

### **1. Instalar Docker en VPS Hostinger**
```bash
# Conectar por SSH
ssh usuario@IP_DEL_VPS

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose -y

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER
# Cerrar sesión y volver a conectar
```

### **2. Clonar Proyecto**
```bash
cd ~
git clone https://tu-repositorio.git
cd crm-fabrica
```

### **3. Configurar Variables de Entorno**
```bash
# Copiar template
cp .env.example .env

# Editar con tus datos
nano .env
```

### **En el archivo `.env`:**
```bash
# Base de datos
DB_NAME=fabrica
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD_SUPER_SEGURO_AQUI

# Django (generar con: python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
SECRET_KEY=tu-secret-key-generado-seguro
DEBUG=False
ALLOWED_HOSTS=tu-dominio.com,www.tu-dominio.com,IP_DEL_VPS

# Frontend
API_URL=https://tu-dominio.com
```

### **4. Actualizar nginx.conf**
```bash
nano nginx/nginx.conf

# Cambiar línea 33:
server_name _;  
# Por:
server_name tu-dominio.com www.tu-dominio.com;
```

---

## 🚀 DESPLIEGUE

### **Primera vez:**
```bash
# 1. Construir y levantar contenedores
docker-compose -f docker-compose.prod.yml up -d --build

# 2. Esperar a que Postgres esté listo (30 segundos)
sleep 30

# 3. Migrar base de datos
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# 4. Crear superusuario
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# 5. Recolectar archivos estáticos
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

# 6. Verificar que todo funciona
docker-compose -f docker-compose.prod.yml ps
```

### **Ver logs:**
```bash
# Todos los servicios
docker-compose -f docker-compose.prod.yml logs -f

# Solo backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Solo nginx
docker-compose -f docker-compose.prod.yml logs -f nginx
```

---

## 🔒 CONFIGURAR SSL (HTTPS)

### **Opción 1: Certbot (Let's Encrypt - GRATIS)**
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generar certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Renovación automática (ya está configurado por Certbot)
sudo systemctl status certbot.timer
```

### **Opción 2: Certificado Manual**
```bash
# Crear carpeta para certificados
mkdir -p nginx/ssl

# Copiar tus certificados
cp /ruta/a/fullchain.pem nginx/ssl/
cp /ruta/a/privkey.pem nginx/ssl/

# Descomentar sección HTTPS en nginx.conf
nano nginx/nginx.conf
# (Descomentar líneas 90-105)

# Reiniciar Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

---

## 🔄 ACTUALIZAR PROYECTO

```bash
# 1. Detener contenedores
docker-compose -f docker-compose.prod.yml down

# 2. Actualizar código
git pull origin main

# 3. Reconstruir y levantar
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Migrar si hay cambios en modelos
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# 5. Recolectar estáticos si cambiaron
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

---

## 🐛 TROUBLESHOOTING

### **Backend no responde:**
```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs backend

# Reiniciar backend
docker-compose -f docker-compose.prod.yml restart backend
```

### **Nginx error 502:**
```bash
# Verificar que backend está corriendo
docker-compose -f docker-compose.prod.yml ps backend

# Ver logs de Nginx
docker-compose -f docker-compose.prod.yml logs nginx
```

### **Base de datos no conecta:**
```bash
# Verificar salud de Postgres
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres

# Conectar manualmente
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d fabrica
```

---

## 📊 MONITOREO

### **Ver recursos:**
```bash
# CPU, RAM, Disco de contenedores
docker stats

# Espacio en disco
df -h
```

### **Backup de base de datos:**
```bash
# Crear backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres fabrica > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres fabrica < backup_20260117.sql
```

---

## ✅ CHECKLIST DE DESPLIEGUE

- [ ] Docker instalado en VPS
- [ ] Proyecto clonado
- [ ] `.env` configurado
- [ ] `nginx.conf` actualizado con dominio
- [ ] Contenedores levantados
- [ ] Migraciones aplicadas
- [ ] Superusuario creado
- [ ] Static files recolectados
- [ ] SSL configurado (opcional)
- [ ] Backup de BD configurado (cron)
- [ ] Monitoreo activo

---

## 🎯 VENTAJAS DE ESTA CONFIGURACIÓN

✅ **Gunicorn:** 4 workers para manejar múltiples dispositivos  
✅ **Nginx:** Proxy reverso optimizado  
✅ **Docker:** Todo en contenedores aislados  
✅ **PostgreSQL:** Base de datos robusta  
✅ **SSL:** HTTPS seguro (con Certbot)  
✅ **Fácil actualización:** Solo `git pull` y rebuild  

---

**¿Dudas?** Revisa los logs con `docker-compose -f docker-compose.prod.yml logs -f`
