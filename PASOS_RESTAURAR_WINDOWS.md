# 🚀 PASOS PARA RESTAURAR EL PROYECTO EN WINDOWS

## REQUISITOS PREVIOS
Descargar e instalar:
- **Python 3.10+**: https://www.python.org/downloads/ (marcar "Add to PATH")
- **Node.js 20**: https://nodejs.org/
- **PostgreSQL 14+**: https://www.postgresql.org/download/windows/
- **Visual Studio Code**: https://code.visualstudio.com/

---

## PASO 1: CREAR LA BASE DE DATOS

1. Abrir **pgAdmin 4** (buscar en menú inicio)
2. Conectar al servidor PostgreSQL (contraseña que pusiste al instalar)
3. Click derecho en **"Databases"** → **"Create"** → **"Database..."**
4. Nombre: `fabrica`
5. Click **"Save"**

---

## PASO 2: RESTAURAR LOS DATOS

1. En pgAdmin, click derecho en la base de datos **"fabrica"**
2. Click en **"Query Tool"**
3. Click en el icono de carpeta 📁 (Open File)
4. Buscar y abrir: `BASE_DATOS_BACKUP_COMPLETO.sql`
5. Click en **"Execute"** (botón ▶️ o presionar F5)
6. Esperar a que termine

### Verificar que funcionó:
- Expandir: **fabrica** → **Schemas** → **public** → **Tables**
- Debes ver tablas como: `api_producto`, `api_cliente`, `api_venta`, etc.

---

## PASO 3: ABRIR EL PROYECTO EN VS CODE

1. Abrir **Visual Studio Code**
2. **File** → **Open Folder** → Seleccionar la carpeta `crm-fabrica`

---

## PASO 4: CONFIGURAR EL BACKEND

1. Abrir terminal en VS Code: **Terminal** → **New Terminal** (o Ctrl + `)
2. Ejecutar estos comandos uno por uno:

```cmd
python -m venv venv
```

```cmd
venv\Scripts\activate
```

```cmd
pip install -r requirements.txt
```

```cmd
python manage.py migrate
```

```cmd
python manage.py runserver
```

3. Dejar esta terminal abierta (el backend queda corriendo)
4. Abrir en navegador: http://localhost:8000/api/

---

## PASO 5: CONFIGURAR EL FRONTEND

1. Abrir **OTRA** terminal en VS Code: Click en el **+** de la terminal
2. Ejecutar:

```cmd
cd frontend
```

```cmd
npm install
```

```cmd
npm start
```

3. Se abrirá automáticamente: http://localhost:3000

---

## ✅ LISTO!

El sistema debería estar funcionando con todos tus datos.

### URLs:
- **Frontend (CRM)**: http://localhost:3000
- **Backend (API)**: http://localhost:8000
- **Admin Django**: http://localhost:8000/admin

---

## 🚨 PROBLEMAS COMUNES

### "python no se reconoce"
- Reinstalar Python marcando **"Add Python to PATH"**

### "npm no se reconoce"
- Reinstalar Node.js y reiniciar VS Code

### Error de conexión a PostgreSQL
- Verificar que el servicio esté corriendo (buscar "Servicios" en Windows)
- Verificar contraseña en `backend_crm/settings.py`

### Error al restaurar SQL
- Asegurarse de que la base de datos `fabrica` esté creada y vacía
- Si da error de permisos, ejecutar pgAdmin como administrador

---

## 📝 RESUMEN DE COMANDOS

```cmd
:: Terminal 1 - Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

:: Terminal 2 - Frontend
cd frontend
npm install
npm start
```
