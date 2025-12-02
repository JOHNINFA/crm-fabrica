# 🚀 GUÍA DE INSTALACIÓN EN WINDOWS - CRM FÁBRICA AP GUERRERO

---

## 📋 REQUISITOS DEL SISTEMA

- **Windows 10/11** (64 bits)
- **8 GB RAM** mínimo (16 GB recomendado)
- **10 GB** de espacio en disco

---

## 🔧 PASO 1: DESCARGAR E INSTALAR SOFTWARE

### 1.1 Python 3.10+
1. Ir a: https://www.python.org/downloads/
2. Descargar **Python 3.10** o superior
3. **IMPORTANTE:** Marcar ✅ **"Add Python to PATH"** durante la instalación
4. Verificar instalación:
```cmd
python --version
pip --version
```

### 1.2 Node.js 20
1. Ir a: https://nodejs.org/
2. Descargar versión **LTS (20.x)**
3. Instalar con opciones por defecto
4. Verificar instalación:
```cmd
node --version
npm --version
```

### 1.3 PostgreSQL 14+
1. Ir a: https://www.postgresql.org/download/windows/
2. Descargar el instalador de **EnterpriseDB**
3. Durante la instalación:
   - **Puerto:** 5432 (dejar por defecto)
   - **Contraseña del superusuario:** `12345` (o la que prefieras)
   - **Locale:** Spanish, Colombia (o dejar por defecto)
4. Instalar **pgAdmin 4** (viene incluido)
5. Verificar instalación:
```cmd
psql --version
```

### 1.4 Git (Opcional pero recomendado)
1. Ir a: https://git-scm.com/download/win
2. Instalar con opciones por defecto

---

## 🐘 PASO 2: CREAR LA BASE DE DATOS

### Opción A: Usando pgAdmin 4 (Interfaz gráfica)
1. Abrir **pgAdmin 4** desde el menú inicio
2. Conectar al servidor local (contraseña: la que pusiste en instalación)
3. Click derecho en **Databases** → **Create** → **Database**
4. Nombre: `fabrica`
5. Click **Save**

### Opción B: Usando línea de comandos
```cmd
# Abrir CMD como administrador
psql -U postgres

# Dentro de PostgreSQL:
CREATE DATABASE fabrica;
\q
```

### Restaurar datos (si tienes el backup)
```cmd
psql -U postgres -d fabrica -f BASE_DATOS_SQL_COMPLETA.sql
```

---

## 🐍 PASO 3: CONFIGURAR EL BACKEND (Django)

### 3.1 Abrir CMD en la carpeta del proyecto
```cmd
cd C:\ruta\al\proyecto\crm-fabrica
```

### 3.2 Crear entorno virtual
```cmd
python -m venv venv
```

### 3.3 Activar entorno virtual
```cmd
venv\Scripts\activate
```
Verás `(venv)` al inicio de la línea de comandos.

### 3.4 Instalar dependencias
```cmd
pip install --upgrade pip
pip install -r requirements.txt
```

Si hay errores con `psycopg2`, instalar la versión binaria:
```cmd
pip install psycopg2-binary
```

### 3.5 Configurar conexión a la base de datos
Editar `backend_crm\settings.py` con Notepad o VS Code:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'fabrica',
        'USER': 'postgres',
        'PASSWORD': '12345',  # Tu contraseña de PostgreSQL
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### 3.6 Ejecutar migraciones
```cmd
python manage.py makemigrations
python manage.py migrate
```

### 3.7 Crear superusuario (opcional)
```cmd
python manage.py createsuperuser
```

### 3.8 Iniciar el servidor
```cmd
python manage.py runserver
```

✅ Backend disponible en: http://localhost:8000

---

## ⚛️ PASO 4: CONFIGURAR EL FRONTEND (React)

### 4.1 Abrir OTRA ventana de CMD
```cmd
cd C:\ruta\al\proyecto\crm-fabrica\frontend
```

### 4.2 Instalar dependencias
```cmd
npm install
```

### 4.3 Iniciar el servidor
```cmd
npm start
```

✅ Frontend disponible en: http://localhost:3000

---

## 📱 PASO 5: APP MÓVIL (Opcional)

### 5.1 Instalar Expo CLI
```cmd
npm install -g expo-cli
```

### 5.2 Configurar la app
```cmd
cd "C:\ruta\al\proyecto\crm-fabrica\AP GUERRERO"
npm install
```

### 5.3 Iniciar
```cmd
npx expo start
```

---

## 🖥️ INICIAR TODO EL SISTEMA

### Crear archivo `iniciar.bat` en la carpeta del proyecto:

```batch
@echo off
title CRM Fabrica AP Guerrero
color 0A

echo ==========================================
echo    CRM FABRICA AP GUERRERO
echo    Iniciando sistema...
echo ==========================================

:: Iniciar Backend en nueva ventana
start "Backend Django" cmd /k "cd /d %~dp0 && venv\Scripts\activate && python manage.py runserver"

:: Esperar 3 segundos
timeout /t 3 /nobreak > nul

:: Iniciar Frontend en nueva ventana
start "Frontend React" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ==========================================
echo    SISTEMA INICIADO
echo ==========================================
echo    Backend:  http://localhost:8000
echo    Frontend: http://localhost:3000
echo ==========================================
echo.
echo Cierra las ventanas de CMD para detener.
pause
```

**Doble click en `iniciar.bat`** para iniciar todo.

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### "python no se reconoce como comando"
- Reinstalar Python marcando **"Add Python to PATH"**
- O agregar manualmente a PATH:
  1. Buscar "Variables de entorno" en Windows
  2. Editar PATH del sistema
  3. Agregar: `C:\Users\TuUsuario\AppData\Local\Programs\Python\Python310\`

### "npm no se reconoce como comando"
- Reinstalar Node.js
- Reiniciar la terminal después de instalar

### "psql no se reconoce como comando"
- Agregar PostgreSQL al PATH:
  1. Buscar "Variables de entorno"
  2. Agregar a PATH: `C:\Program Files\PostgreSQL\14\bin\`

### Error "ENOENT" al instalar npm
```cmd
npm cache clean --force
npm install
```

### Error de conexión a PostgreSQL
1. Verificar que el servicio esté corriendo:
   - Buscar "Servicios" en Windows
   - Buscar "postgresql-x64-14"
   - Debe estar en "En ejecución"
2. Si no está corriendo, click derecho → Iniciar

### Puerto 8000 o 3000 en uso
```cmd
:: Ver qué usa el puerto 8000
netstat -ano | findstr :8000

:: Matar el proceso (reemplazar PID por el número)
taskkill /PID 12345 /F
```

---

## 📦 QUÉ COPIAR AL DISCO DURO

### 🔴 MUY IMPORTANTE - ANTES DE COPIAR:

**Exportar la base de datos** (contiene productos, clientes, ventas, TODO):
```cmd
pg_dump -U postgres -d fabrica -F p -f BASE_DATOS_BACKUP_COMPLETO.sql
```
Te pedirá la contraseña de PostgreSQL (12345).

### ✅ SÍ COPIAR (OBLIGATORIO):
```
crm-fabrica/
├── api/                              # Código del backend
├── backend_crm/                      # Configuración Django
├── frontend/                         # Código del frontend (SIN node_modules)
├── AP GUERRERO/                      # App móvil (SIN node_modules)
├── media/                            # 🖼️ IMÁGENES DE PRODUCTOS
│   └── productos/                    # Todas las fotos de productos
├── scripts/
├── manage.py
├── requirements.txt
├── BASE_DATOS_BACKUP_COMPLETO.sql    # 🗄️ BACKUP DE LA BASE DE DATOS
├── INSTALACION_WINDOWS.md
└── iniciar.bat
```

### ❌ NO COPIAR (se regeneran con comandos):
```
- venv/                    → Se crea con: python -m venv venv
- frontend/node_modules/   → Se crea con: npm install
- AP GUERRERO/node_modules/→ Se crea con: npm install
- __pycache__/             → Se genera automáticamente
- .git/                    → Opcional (historial de git)
```

### 📊 Tamaño aproximado:
- **Con** node_modules y venv: ~2-3 GB
- **Sin** node_modules y venv: ~100-200 MB (+ imágenes)

### ⚠️ NO PERDERÁS NADA SI COPIAS:
1. ✅ **BASE_DATOS_BACKUP_COMPLETO.sql** → Todos los datos (productos, clientes, ventas, cargues, etc.)
2. ✅ **media/** → Todas las imágenes de productos
3. ✅ **Todo el código** → La aplicación completa

---

## ✅ CHECKLIST DE INSTALACIÓN

- [ ] Python 3.10+ instalado y en PATH
- [ ] Node.js 20 instalado
- [ ] PostgreSQL 14+ instalado y corriendo
- [ ] Base de datos `fabrica` creada
- [ ] Datos restaurados desde SQL (si aplica)
- [ ] Entorno virtual creado (`python -m venv venv`)
- [ ] Entorno virtual activado (`venv\Scripts\activate`)
- [ ] Dependencias Python instaladas (`pip install -r requirements.txt`)
- [ ] Migraciones ejecutadas (`python manage.py migrate`)
- [ ] Dependencias Node instaladas (`npm install` en frontend)
- [ ] Backend corriendo en http://localhost:8000
- [ ] Frontend corriendo en http://localhost:3000

---

## 🔐 CREDENCIALES POR DEFECTO

| Servicio | Usuario | Contraseña |
|----------|---------|------------|
| PostgreSQL | postgres | 12345 |
| Django Admin | (crear con createsuperuser) | - |

---

## 📝 RESUMEN DE COMANDOS

```cmd
:: BACKEND
cd crm-fabrica
venv\Scripts\activate
python manage.py runserver

:: FRONTEND (otra ventana)
cd crm-fabrica\frontend
npm start

:: BASE DE DATOS
psql -U postgres -d fabrica
```

---

**Fecha:** Noviembre 2025 | **Versión:** 1.0
