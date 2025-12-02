# 🚀 GUÍA DE INSTALACIÓN - CRM FÁBRICA AP GUERRERO

Esta guía te permitirá instalar el sistema completo en una nueva máquina.

---

## 📋 REQUISITOS DEL SISTEMA

### Sistema Operativo
- **Ubuntu 22.04 LTS** (recomendado) o cualquier distribución Linux basada en Debian
- También funciona en Windows con WSL2

### Software Necesario
| Software | Versión Mínima | Comando para verificar |
|----------|---------------|----------------------|
| Python | 3.10+ | `python3 --version` |
| Node.js | 18+ (recomendado 20) | `node --version` |
| npm | 8+ | `npm --version` |
| PostgreSQL | 14+ | `psql --version` |
| Git | 2.0+ | `git --version` |

---

## 🔧 PASO 1: INSTALAR DEPENDENCIAS DEL SISTEMA

### En Ubuntu/Debian:

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Python y pip
sudo apt install -y python3 python3-pip python3-venv

# Instalar Node.js 20 (usando NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar dependencias adicionales para compilación
sudo apt install -y build-essential libpq-dev python3-dev
```

---

## 🐘 PASO 2: CONFIGURAR POSTGRESQL

### 2.1 Iniciar el servicio
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2.2 Crear la base de datos y usuario
```bash
# Acceder a PostgreSQL como superusuario
sudo -u postgres psql
```

Dentro de PostgreSQL, ejecutar:
```sql
-- Crear usuario (cambiar '12345' por una contraseña segura)
CREATE USER postgres WITH PASSWORD '12345';

-- Crear base de datos
CREATE DATABASE fabrica;

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE fabrica TO postgres;

-- Salir
\q
```

### 2.3 Restaurar la base de datos (SI TIENES EL BACKUP)
```bash
# Opción 1: Restaurar desde el archivo SQL incluido
sudo -u postgres psql fabrica < BASE_DATOS_SQL_COMPLETA.sql

# Opción 2: Si tienes un backup .dump
pg_restore -U postgres -d fabrica backup.dump
```

---

## 🐍 PASO 3: CONFIGURAR EL BACKEND (Django)

### 3.1 Crear entorno virtual
```bash
# Ir a la carpeta del proyecto
cd /ruta/al/proyecto/crm-fabrica

# Crear entorno virtual
python3 -m venv venv

# Activar entorno virtual
source venv/bin/activate
```

### 3.2 Instalar dependencias de Python
```bash
pip install --upgrade pip

# Instalar las dependencias principales
pip install Django==4.2.2
pip install djangorestframework==3.14.0
pip install django-cors-headers==4.1.0
pip install django-filter==25.1
pip install psycopg2==2.9.6
pip install Pillow==9.0.1

# Dependencias para IA/ML (opcional, para predicciones)
pip install numpy==1.26.0
pip install pandas==2.3.3
pip install scikit-learn==1.7.2
pip install tensorflow==2.20.0
pip install keras==3.12.0
```

### 3.3 Configurar la base de datos
Editar el archivo `backend_crm/settings.py` si es necesario:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'fabrica',
        'USER': 'postgres',
        'PASSWORD': '12345',  # Cambiar por tu contraseña
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### 3.4 Ejecutar migraciones
```bash
# Asegúrate de tener el entorno virtual activado
source venv/bin/activate

# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario (opcional)
python manage.py createsuperuser
```

### 3.5 Iniciar el servidor backend
```bash
python manage.py runserver 0.0.0.0:8000
```

El backend estará disponible en: `http://localhost:8000`

---

## ⚛️ PASO 4: CONFIGURAR EL FRONTEND (React)

### 4.1 Instalar dependencias
```bash
# Ir a la carpeta del frontend
cd frontend

# Instalar dependencias
npm install
```

### 4.2 Configurar la URL del backend
Editar el archivo `frontend/.env` (crear si no existe):
```env
REACT_APP_API_URL=http://localhost:8000/api
```

### 4.3 Iniciar el servidor frontend
```bash
npm start
```

El frontend estará disponible en: `http://localhost:3000`

---

## 📱 PASO 5: CONFIGURAR LA APP MÓVIL (React Native/Expo) - OPCIONAL

### 5.1 Instalar Expo CLI
```bash
npm install -g expo-cli
```

### 5.2 Instalar dependencias de la app
```bash
# Ir a la carpeta de la app móvil
cd "AP GUERRERO"

# Instalar dependencias
npm install
```

### 5.3 Configurar la URL del backend
Editar los archivos de servicios en `AP GUERRERO/services/` para apuntar a tu servidor:
```javascript
const API_URL = 'http://TU_IP_LOCAL:8000/api';
```

### 5.4 Iniciar la app
```bash
npx expo start
```

---

## 🔄 PASO 6: VERIFICAR LA INSTALACIÓN

### 6.1 Verificar el backend
```bash
# En una terminal
source venv/bin/activate
python manage.py runserver

# Abrir en navegador: http://localhost:8000/api/
# Deberías ver la interfaz de Django REST Framework
```

### 6.2 Verificar el frontend
```bash
# En otra terminal
cd frontend
npm start

# Abrir en navegador: http://localhost:3000
# Deberías ver la interfaz del CRM
```

### 6.3 Verificar la conexión a la base de datos
```bash
# Activar entorno virtual
source venv/bin/activate

# Probar conexión
python manage.py dbshell
```

---

## 📦 ESTRUCTURA DEL PROYECTO

```
crm-fabrica/
├── api/                    # App Django con modelos y vistas
│   ├── models.py          # Modelos de la base de datos
│   ├── views.py           # Vistas/Endpoints de la API
│   ├── serializers.py     # Serializadores
│   └── urls.py            # Rutas de la API
├── backend_crm/           # Configuración de Django
│   ├── settings.py        # Configuración principal
│   └── urls.py            # Rutas principales
├── frontend/              # Aplicación React (CRM Web)
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas
│   │   ├── services/      # Servicios de API
│   │   └── hooks/         # Hooks personalizados
│   └── package.json
├── AP GUERRERO/           # App móvil React Native
├── media/                 # Archivos subidos
├── venv/                  # Entorno virtual Python
├── manage.py              # CLI de Django
└── BASE_DATOS_SQL_COMPLETA.sql  # Backup de la BD
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "psycopg2 not found"
```bash
pip install psycopg2-binary
```

### Error: "CORS blocked"
Verificar que en `backend_crm/settings.py` esté:
```python
CORS_ALLOW_ALL_ORIGINS = True
```

### Error: "Port 8000 already in use"
```bash
# Matar proceso en el puerto
sudo kill -9 $(sudo lsof -t -i:8000)
```

### Error: "Port 3000 already in use"
```bash
# Matar proceso en el puerto
sudo kill -9 $(sudo lsof -t -i:3000)
```

### Error: "PostgreSQL connection refused"
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Reiniciar si es necesario
sudo systemctl restart postgresql
```

### Error: "Module not found" en Python
```bash
# Asegúrate de tener el entorno virtual activado
source venv/bin/activate
pip install -r requirements.txt
```

---

## 🔐 CREDENCIALES POR DEFECTO

| Servicio | Usuario | Contraseña |
|----------|---------|------------|
| PostgreSQL | postgres | 12345 |
| Django Admin | (crear con createsuperuser) | - |

**⚠️ IMPORTANTE:** Cambiar estas credenciales en producción.

---

## 📝 COMANDOS ÚTILES

### Backend
```bash
# Activar entorno virtual
source venv/bin/activate

# Iniciar servidor
python manage.py runserver

# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Shell de Django
python manage.py shell

# Shell de la base de datos
python manage.py dbshell
```

### Frontend
```bash
# Iniciar en desarrollo
npm start

# Crear build de producción
npm run build

# Instalar dependencias
npm install
```

### PostgreSQL
```bash
# Acceder a PostgreSQL
sudo -u postgres psql

# Conectar a la base de datos
\c fabrica

# Listar tablas
\dt

# Salir
\q

# Backup de la base de datos
pg_dump -U postgres fabrica > backup.sql

# Restaurar backup
psql -U postgres fabrica < backup.sql
```

---

## 🖥️ INICIAR TODO EL SISTEMA

Crear un script `iniciar_sistema.sh`:
```bash
#!/bin/bash

echo "🚀 Iniciando CRM Fábrica AP Guerrero..."

# Terminal 1: Backend
gnome-terminal --tab --title="Backend Django" -- bash -c "
cd /ruta/al/proyecto/crm-fabrica
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000
exec bash"

# Terminal 2: Frontend
gnome-terminal --tab --title="Frontend React" -- bash -c "
cd /ruta/al/proyecto/crm-fabrica/frontend
npm start
exec bash"

echo "✅ Sistema iniciado!"
echo "   Backend: http://localhost:8000"
echo "   Frontend: http://localhost:3000"
```

Dar permisos y ejecutar:
```bash
chmod +x iniciar_sistema.sh
./iniciar_sistema.sh
```

---

## ✅ CHECKLIST DE INSTALACIÓN

- [ ] Python 3.10+ instalado
- [ ] Node.js 18+ instalado
- [ ] PostgreSQL 14+ instalado y corriendo
- [ ] Base de datos `fabrica` creada
- [ ] Entorno virtual creado y activado
- [ ] Dependencias de Python instaladas
- [ ] Migraciones aplicadas
- [ ] Dependencias de Node.js instaladas
- [ ] Backend corriendo en puerto 8000
- [ ] Frontend corriendo en puerto 3000
- [ ] Conexión frontend-backend funcionando

---

**Fecha de creación:** Noviembre 2025  
**Versión:** 1.0
