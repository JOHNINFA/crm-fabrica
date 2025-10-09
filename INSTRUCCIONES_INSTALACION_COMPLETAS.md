# 🚀 INSTRUCCIONES DE INSTALACIÓN COMPLETAS

## 📋 REQUISITOS PREVIOS

### Software Necesario
- **Python 3.11+** - [Descargar](https://www.python.org/downloads/)
- **Node.js 18+** - [Descargar](https://nodejs.org/)
- **PostgreSQL 14+** - [Descargar](https://www.postgresql.org/download/)
- **Git** - [Descargar](https://git-scm.com/)
- **Editor de código** (VS Code recomendado)

---

## PASO 1: CONFIGURAR BASE DE DATOS POSTGRESQL

### 1.1 Instalar PostgreSQL
```bash
# En Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# En macOS con Homebrew
brew install postgresql

# En Windows
# Descargar instalador desde postgresql.org
```

### 1.2 Iniciar PostgreSQL
```bash
# En Ubuntu/Debian
sudo service postgresql start

# En macOS
brew services start postgresql

# En Windows
# Iniciar desde Servicios de Windows
```

### 1.3 Crear Base de Datos
```bash
# Conectarse a PostgreSQL
psql -U postgres

# Dentro de psql, ejecutar:
CREATE DATABASE fabrica;

# Verificar
\l

# Salir
\q
```

### 1.4 Configurar Credenciales
```
Host: localhost
Port: 5432
Database: fabrica
User: postgres
Password: 12345
```

---

## PASO 2: CONFIGURAR BACKEND DJANGO

### 2.1 Crear Directorio del Proyecto
```bash
mkdir crm-fabrica
cd crm-fabrica
```

### 2.2 Crear Entorno Virtual Python
```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate

# En macOS/Linux:
source venv/bin/activate
```

### 2.3 Instalar Dependencias
```bash
# Crear archivo requirements.txt
cat > requirements.txt << EOF
Django==5.1.7
djangorestframework==3.14.0
django-cors-headers==4.3.1
psycopg2-binary==2.9.9
Pillow==10.2.0
python-decouple==3.8
EOF

# Instalar dependencias
pip install -r requirements.txt
```

### 2.4 Crear Proyecto Django
```bash
# Crear proyecto
django-admin startproject backend_crm .

# Crear app
python manage.py startapp api
```

### 2.5 Configurar settings.py
Editar `backend_crm/settings.py`:

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'fabrica',
        'USER': 'postgres',
        'PASSWORD': '12345',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

LANGUAGE_CODE = 'es-co'
TIME_ZONE = 'America/Bogota'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

### 2.6 Copiar Modelos
Copiar el contenido de `DOCUMENTACION_BACKEND_COMPLETA.md` sección "Modelos" a `api/models.py`

### 2.7 Copiar Serializers
Copiar el contenido completo a `api/serializers.py`

### 2.8 Copiar Views
Copiar el contenido completo a `api/views.py`

### 2.9 Copiar URLs
Copiar el contenido completo a `api/urls.py`

### 2.10 Configurar URLs Principal
Editar `backend_crm/urls.py`:

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### 2.11 Crear Migraciones y Migrar
```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario (opcional)
python manage.py createsuperuser
```

### 2.12 Iniciar Servidor Backend
```bash
python manage.py runserver
```

Verificar en: http://localhost:8000/api/productos/

---

## PASO 3: CONFIGURAR FRONTEND REACT

### 3.1 Crear Aplicación React
```bash
# En otra terminal, desde el directorio raíz del proyecto
npx create-react-app frontend
cd frontend
```

### 3.2 Instalar Dependencias
```bash
npm install react-router-dom@7.1.1
npm install bootstrap@5.3.6
npm install react-bootstrap@2.10.7
npm install bootstrap-icons@1.11.3
npm install react-calendar@5.1.0
npm install uuid@11.0.4
```

### 3.3 Crear Estructura de Carpetas
```bash
# Crear carpetas necesarias
mkdir -p src/components/Pos
mkdir -p src/components/Remisiones
mkdir -p src/components/Cargue
mkdir -p src/components/inventario
mkdir -p src/components/Clientes/tabs
mkdir -p src/components/common
mkdir -p src/context
mkdir -p src/pages
mkdir -p src/services
mkdir -p src/styles
mkdir -p src/assets/images
mkdir -p public/images/productos
```

### 3.4 Copiar Archivos de Configuración

#### src/index.js
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### src/App.js
Copiar el contenido de `DOCUMENTACION_FRONTEND_COMPLETA.md` sección "App.js"

#### src/services/api.js
Copiar el contenido completo del archivo de servicios API

### 3.5 Crear Contextos
Crear los siguientes archivos en `src/context/`:
- `ProductContext.jsx`
- `CajeroContext.jsx`
- `CajeroRemisionesContext.jsx`
- `ModalContext.jsx`
- `UsuariosContext.jsx`

Copiar el contenido de cada uno desde la documentación.

### 3.6 Crear Componentes
Para cada módulo, crear los componentes correspondientes:

#### POS
- `src/components/Pos/ProductList.jsx`
- `src/components/Pos/Cart.jsx`
- `src/components/Pos/PaymentModal.jsx`
- `src/components/Pos/ConsumerForm.jsx`
- `src/components/Pos/LoginCajeroModal.jsx`

#### Remisiones
- `src/components/Remisiones/ProductList.jsx`
- `src/components/Remisiones/Cart.jsx`
- `src/components/Remisiones/PaymentModal.jsx`
- `src/components/Remisiones/ConsumerForm.jsx`
- `src/components/Remisiones/Sidebar.jsx`

#### Cargue
- `src/components/Cargue/MenuSheets.jsx`
- `src/components/Cargue/PlantillaOperativa.jsx`
- `src/components/Cargue/TablaProductos.jsx`
- `src/components/Cargue/ResumenVentas.jsx`
- `src/components/Cargue/Produccion.jsx`

### 3.7 Crear Páginas
Crear los siguientes archivos en `src/pages/`:
- `MainMenu.jsx`
- `PosScreen.jsx`
- `RemisionesScreen.jsx`
- `PedidosScreen.jsx`
- `PedidosDiaScreen.jsx`
- `InventarioScreen.jsx`
- `SelectorDia.jsx`
- `ClientesScreen.jsx`
- `VendedoresScreen.jsx`
- `CajaScreen.jsx`
- `InformeVentasGeneral.jsx`
- `InformeRemisionesScreen.jsx`

### 3.8 Iniciar Servidor Frontend
```bash
npm start
```

Verificar en: http://localhost:3000

---

## PASO 4: DATOS INICIALES

### 4.1 Crear Sucursal Principal
```bash
# Desde Django shell
python manage.py shell
```

```python
from api.models import Sucursal

Sucursal.objects.create(
    nombre='Principal',
    direccion='Calle Principal 123',
    ciudad='Bogotá',
    activo=True,
    es_principal=True
)
```

### 4.2 Crear Cajero de Prueba
```python
from api.models import Cajero, Sucursal
import hashlib

sucursal = Sucursal.objects.first()

# Crear cajero con contraseña hasheada
password = hashlib.sha256('12345'.encode()).hexdigest()

Cajero.objects.create(
    nombre='prueba1',
    password=password,
    sucursal=sucursal,
    rol='CAJERO',
    activo=True
)
```

### 4.3 Crear Categorías
```python
from api.models import Categoria

categorias = ['Arepas', 'Almojabanas', 'Semillas', 'Maíz', 'General']

for cat in categorias:
    Categoria.objects.get_or_create(nombre=cat)
```

### 4.4 Crear Productos de Prueba
```python
from api.models import Producto, Categoria

categoria_arepas = Categoria.objects.get(nombre='Arepas')

productos = [
    {
        'nombre': 'AREPA TIPO OBLEA 500Gr',
        'precio': 2500,
        'precio_compra': 1500,
        'stock_total': 100,
        'categoria': categoria_arepas,
        'marca': 'GENERICA',
        'activo': True
    },
    {
        'nombre': 'AREPA MEDIANA 330Gr',
        'precio': 2000,
        'precio_compra': 1200,
        'stock_total': 150,
        'categoria': categoria_arepas,
        'marca': 'GENERICA',
        'activo': True
    },
]

for prod_data in productos:
    Producto.objects.create(**prod_data)
```

### 4.5 Crear Cliente de Prueba
```python
from api.models import Cliente

Cliente.objects.create(
    identificacion='1234567890',
    nombre_completo='Cliente Prueba',
    tipo_identificacion='CC',
    tipo_persona='NATURAL',
    regimen='SIMPLIFICADO',
    telefono_1='3001234567',
    direccion='Calle 123 #45-67',
    ciudad='Bogotá',
    activo=True
)
```

---

## PASO 5: VERIFICACIÓN FINAL

### 5.1 Verificar Backend
```bash
# Verificar que el servidor esté corriendo
curl http://localhost:8000/api/productos/

# Debería retornar JSON con productos
```

### 5.2 Verificar Frontend
1. Abrir http://localhost:3000
2. Verificar que cargue el menú principal
3. Navegar a POS
4. Hacer login con cajero: `prueba1` / `12345`
5. Verificar que carguen los productos

### 5.3 Probar Flujo Completo

#### Venta en POS
1. Login como cajero
2. Seleccionar productos
3. Agregar al carrito
4. Procesar pago
5. Verificar factura generada

#### Remisión
1. Ir a Remisiones
2. Login como cajero
3. Seleccionar productos
4. Generar remisión
5. Verificar en Informes de Pedidos

#### Pedido
1. Ir a Pedidos
2. Seleccionar día
3. Seleccionar cliente
4. Crear pedido
5. Verificar que se precarguen datos en Remisiones

---

## PASO 6: SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "No module named 'psycopg2'"
```bash
pip install psycopg2-binary
```

### Error: "CORS policy"
Verificar en `settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

### Error: "Port 8000 already in use"
```bash
# Matar proceso en puerto 8000
# En Linux/Mac:
lsof -ti:8000 | xargs kill -9

# En Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Error: "Port 3000 already in use"
```bash
# Cambiar puerto en package.json
"scripts": {
  "start": "PORT=3001 react-scripts start"
}
```

### Base de datos no conecta
```bash
# Verificar que PostgreSQL esté corriendo
sudo service postgresql status

# Verificar credenciales
psql -U postgres -d fabrica
```

---

## PASO 7: COMANDOS ÚTILES

### Backend
```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver

# Shell de Django
python manage.py shell

# Limpiar base de datos
python manage.py flush
```

### Frontend
```bash
# Instalar dependencias
npm install

# Iniciar desarrollo
npm start

# Compilar para producción
npm run build

# Limpiar cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## PASO 8: ESTRUCTURA FINAL DEL PROYECTO

```
crm-fabrica/
├── backend_crm/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── api/
│   ├── migrations/
│   ├── __init__.py
│   ├── admin.py
│   ├── models.py
│   ├── serializers.py
│   ├── urls.py
│   └── views.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── media/
│   └── productos/
├── venv/
├── manage.py
├── requirements.txt
├── DOCUMENTACION_COMPLETA_PROYECTO.md
├── DOCUMENTACION_BACKEND_COMPLETA.md
├── DOCUMENTACION_FRONTEND_COMPLETA.md
└── INSTRUCCIONES_INSTALACION_COMPLETAS.md
```

---

## 🎉 ¡PROYECTO COMPLETADO!

Si seguiste todos los pasos correctamente, ahora tienes:

✅ Backend Django funcionando en http://localhost:8000
✅ Frontend React funcionando en http://localhost:3000
✅ Base de datos PostgreSQL configurada
✅ Sistema POS operativo
✅ Sistema de Remisiones operativo
✅ Sistema de Pedidos operativo
✅ Sistema de Cargue operativo
✅ Sistema de Inventario operativo
✅ Sistema de Clientes operativo
✅ Sistema de Caja operativo

### Credenciales de Prueba
- **Cajero**: prueba1 / 12345
- **Admin Django**: (el que creaste con createsuperuser)

### Próximos Pasos
1. Agregar más productos
2. Crear más cajeros
3. Configurar listas de precios
4. Agregar más clientes
5. Configurar vendedores (ID1-ID6)

---

## 📚 DOCUMENTACIÓN ADICIONAL

- `DOCUMENTACION_COMPLETA_PROYECTO.md` - Visión general del sistema
- `DOCUMENTACION_BACKEND_COMPLETA.md` - Detalles del backend Django
- `DOCUMENTACION_FRONTEND_COMPLETA.md` - Detalles del frontend React
- `README.md` - Guía rápida del proyecto

---

## 🆘 SOPORTE

Si encuentras algún problema:
1. Revisa los logs del backend: Terminal donde corre Django
2. Revisa la consola del navegador: F12 → Console
3. Verifica que ambos servidores estén corriendo
4. Verifica las credenciales de la base de datos
5. Asegúrate de que todas las dependencias estén instaladas

---

**¡Felicidades! Has replicado exitosamente el Sistema CRM Fábrica de Arepas** 🎊
