# 🚀 PRÓXIMOS PASOS - DOCKERIZACIÓN CRM FÁBRICA

**Fecha:** 3 de Diciembre de 2025  
**Estado Actual:** Archivos Docker creados ✅ | Implementación pendiente ⏳

---

## 📊 ESTADO ACTUAL

### ✅ **LO QUE YA ESTÁ HECHO:**
- ✅ Dockerfile (Backend Django)
- ✅ frontend/Dockerfile (Frontend React)
- ✅ docker-compose.yml (Orquestación completa)
- ✅ docker-entrypoint.sh (Script de inicio)
- ✅ .dockerignore (Optimización)
- ✅ Documentación completa (ANALISIS, PLAN, RESUMEN, ÍNDICE)
- ✅ Docker instalado en tu sistema (versión 28.2.2)

### ⏳ **LO QUE FALTA:**
- ⏳ Construir las imágenes Docker
- ⏳ Levantar los contenedores
- ⏳ Probar que todo funcione
- ⏳ (Opcional) Crear scripts de automatización

---

## 🎯 PRÓXIMOS PASOS (EN ORDEN)

### **PASO 1: Configurar Permisos de Docker** ⚠️ IMPORTANTE

Docker en Linux requiere permisos especiales. Tienes 2 opciones:

#### **Opción A: Usar sudo (Más rápido)**
Simplemente agrega `sudo` antes de cada comando docker:
```bash
sudo docker-compose build
sudo docker-compose up -d
```

#### **Opción B: Agregar tu usuario al grupo docker (Recomendado)**
Esto te permite usar docker sin sudo:
```bash
# Agregar tu usuario al grupo docker
sudo usermod -aG docker $USER

# Reiniciar sesión o ejecutar:
newgrp docker

# Verificar que funciona
docker ps
```

**Recomendación:** Usa la Opción B para mayor comodidad.

---

### **PASO 2: Verificar el Backup de la Base de Datos**

Antes de construir, asegúrate de tener el backup SQL:

```bash
# Verificar que existe el archivo
ls -lh BASE_DATOS_BACKUP_COMPLETO.sql
```

**Si NO existe el archivo:**
1. Exporta la base de datos actual:
   ```bash
   pg_dump -U postgres -d fabrica -F p -f BASE_DATOS_BACKUP_COMPLETO.sql
   ```

2. O usa el backup que ya tienes en el proyecto

**Nota:** El `docker-compose.yml` está configurado para cargar este archivo automáticamente.

---

### **PASO 3: Construir las Imágenes Docker** 🔨

Este paso crea las imágenes de tus contenedores (solo se hace una vez):

```bash
# Ir a la carpeta del proyecto
cd /home/john/Escritorio/crm-fabrica

# Construir las imágenes (tarda 5-10 minutos la primera vez)
sudo docker-compose build

# O si configuraste los permisos:
docker-compose build
```

**Qué esperar:**
- Descargará imágenes base (Python, Node, PostgreSQL)
- Instalará dependencias de Python (requirements.txt)
- Instalará dependencias de Node (package.json)
- Creará las imágenes personalizadas

**Tiempo estimado:** 5-10 minutos (primera vez)

---

### **PASO 4: Levantar los Contenedores** 🚀

Una vez construidas las imágenes, inicia los servicios:

```bash
# Iniciar todos los servicios en segundo plano
sudo docker-compose up -d

# Ver los logs en tiempo real
sudo docker-compose logs -f
```

**Qué esperar:**
- PostgreSQL se iniciará primero
- Backend esperará a que PostgreSQL esté listo
- Se ejecutarán las migraciones automáticamente
- Se creará el superusuario admin/admin
- Frontend se iniciará último

**Tiempo estimado:** 2-3 minutos

---

### **PASO 5: Verificar que Todo Funciona** ✅

#### **5.1 Verificar Estado de Contenedores**
```bash
sudo docker-compose ps
```

**Deberías ver:**
```
NAME              STATUS          PORTS
crm_postgres      Up (healthy)    0.0.0.0:5432->5432/tcp
crm_backend       Up              0.0.0.0:8000->8000/tcp
crm_frontend      Up              0.0.0.0:3000->3000/tcp
```

#### **5.2 Probar el Backend**
Abre en tu navegador:
- **API REST:** http://localhost:8000/api/
- **Admin Django:** http://localhost:8000/admin
  - Usuario: `admin`
  - Contraseña: `admin`

#### **5.3 Probar el Frontend**
Abre en tu navegador:
- **Frontend React:** http://localhost:3000

#### **5.4 Verificar Base de Datos**
```bash
# Conectar a PostgreSQL
sudo docker-compose exec postgres psql -U postgres -d fabrica

# Dentro de psql:
\dt                          # Ver tablas
SELECT COUNT(*) FROM api_producto;  # Contar productos
\q                           # Salir
```

---

### **PASO 6: Comandos Útiles** 💡

#### **Ver Logs**
```bash
# Todos los servicios
sudo docker-compose logs -f

# Solo backend
sudo docker-compose logs -f backend

# Solo frontend
sudo docker-compose logs -f frontend

# Solo postgres
sudo docker-compose logs -f postgres
```

#### **Detener Servicios**
```bash
# Detener sin eliminar contenedores
sudo docker-compose stop

# Detener y eliminar contenedores (los datos persisten)
sudo docker-compose down
```

#### **Reiniciar Servicios**
```bash
# Reiniciar todos
sudo docker-compose restart

# Reiniciar solo backend
sudo docker-compose restart backend
```

#### **Ver Estado y Recursos**
```bash
# Estado de contenedores
sudo docker-compose ps

# Uso de recursos (CPU, RAM)
sudo docker stats
```

#### **Reconstruir (si cambias código)**
```bash
# Reconstruir y reiniciar
sudo docker-compose up -d --build
```

---

## 🔧 SOLUCIÓN DE PROBLEMAS COMUNES

### **Problema 1: Puerto ya en uso**
```bash
# Error: port is already allocated

# Solución: Detener el servicio que usa el puerto
# Para PostgreSQL (puerto 5432):
sudo systemctl stop postgresql

# Para backend (puerto 8000):
# Buscar proceso
sudo lsof -i :8000
# Matar proceso
sudo kill -9 <PID>
```

### **Problema 2: Contenedor no inicia**
```bash
# Ver logs detallados
sudo docker-compose logs backend

# Reiniciar contenedor específico
sudo docker-compose restart backend

# Reconstruir desde cero
sudo docker-compose down
sudo docker-compose build --no-cache backend
sudo docker-compose up -d
```

### **Problema 3: Base de datos vacía**
```bash
# Restaurar backup manualmente
sudo docker-compose exec -T postgres psql -U postgres -d fabrica < BASE_DATOS_BACKUP_COMPLETO.sql
```

### **Problema 4: Frontend no carga**
```bash
# Ver logs
sudo docker-compose logs frontend

# Reconstruir frontend
sudo docker-compose build --no-cache frontend
sudo docker-compose up -d frontend
```

---

## 📱 CONFIGURAR APP MÓVIL (Después de que funcione)

Una vez que el backend esté corriendo en Docker:

### **1. Obtener tu IP local**
```bash
# Ver tu IP
ip addr show | grep "inet "
# O más simple:
hostname -I
```

### **2. Configurar la App**
Edita el archivo `AP GUERRERO/config.js`:
```javascript
// Cambiar por tu IP local
export const API_URL = 'http://TU_IP_AQUI:8000';
```

### **3. Abrir puerto en firewall (si es necesario)**
```bash
# Permitir puerto 8000
sudo ufw allow 8000/tcp
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

Marca cada paso a medida que lo completes:

- [ ] **PASO 1:** Configurar permisos de Docker
- [ ] **PASO 2:** Verificar backup de base de datos
- [ ] **PASO 3:** Construir imágenes (`docker-compose build`)
- [ ] **PASO 4:** Levantar contenedores (`docker-compose up -d`)
- [ ] **PASO 5.1:** Verificar estado de contenedores
- [ ] **PASO 5.2:** Probar backend (http://localhost:8000)
- [ ] **PASO 5.3:** Probar frontend (http://localhost:3000)
- [ ] **PASO 5.4:** Verificar base de datos
- [ ] **PASO 6:** Familiarizarse con comandos útiles
- [ ] **EXTRA:** Configurar app móvil (opcional)

---

## 🎯 RESUMEN EJECUTIVO

### **Para empezar AHORA mismo:**

```bash
# 1. Configurar permisos (solo una vez)
sudo usermod -aG docker $USER
newgrp docker

# 2. Ir al proyecto
cd /home/john/Escritorio/crm-fabrica

# 3. Construir
docker-compose build

# 4. Iniciar
docker-compose up -d

# 5. Ver logs
docker-compose logs -f

# 6. Verificar estado
docker-compose ps
```

### **Accesos después de iniciar:**
- 🌐 **Frontend:** http://localhost:3000
- 🔧 **Backend API:** http://localhost:8000/api/
- 👤 **Admin:** http://localhost:8000/admin (admin/admin)
- 🗄️ **PostgreSQL:** localhost:5432

---

## 📚 DOCUMENTACIÓN ADICIONAL

Si necesitas más detalles, consulta:
- **PLAN_DOCKERIZACION.md** - Plan completo paso a paso
- **ANALISIS_DOCKERIZACION.md** - Análisis técnico detallado
- **RESUMEN_EJECUTIVO.md** - Resumen para decisión rápida
- **INDICE_DOCKERIZACION.md** - Índice de toda la documentación

---

## ✅ SIGUIENTE PASO INMEDIATO

**Tu siguiente acción debe ser:**

1. Abrir una terminal
2. Ejecutar:
   ```bash
   cd /home/john/Escritorio/crm-fabrica
   sudo docker-compose build
   ```
3. Esperar 5-10 minutos mientras construye
4. Luego ejecutar:
   ```bash
   sudo docker-compose up -d
   ```

**¡Eso es todo!** El sistema debería estar funcionando en http://localhost:3000

---

*Documento creado: 3 de Diciembre de 2025*  
*Estado: Listo para implementar* 🚀
