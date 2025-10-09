# 🏭 DOCUMENTACIÓN COMPLETA - SISTEMA CRM FÁBRICA DE AREPAS

## 📋 TABLA DE CONTENIDOS

1. [RESUMEN EJECUTIVO](#resumen-ejecutivo)
2. [ARQUITECTURA DEL SISTEMA](#arquitectura-del-sistema)
3. [TECNOLOGÍAS Y DEPENDENCIAS](#tecnologías-y-dependencias)
4. [CONFIGURACIÓN DE BASE DE DATOS](#configuración-de-base-de-datos)
5. [BACKEND DJANGO - CONFIGURACIÓN](#backend-django-configuración)
6. [BACKEND DJANGO - MODELOS](#backend-django-modelos)
7. [BACKEND DJANGO - APIS](#backend-django-apis)
8. [FRONTEND REACT - CONFIGURACIÓN](#frontend-react-configuración)
9. [FRONTEND REACT - ESTRUCTURA](#frontend-react-estructura)
10. [MÓDULO POS](#módulo-pos)
11. [MÓDULO REMISIONES](#módulo-remisiones)
12. [MÓDULO PEDIDOS](#módulo-pedidos)
13. [MÓDULO CARGUE](#módulo-cargue)
14. [MÓDULO INVENTARIO](#módulo-inventario)
15. [MÓDULO CLIENTES](#módulo-clientes)
16. [MÓDULO CAJA](#módulo-caja)
17. [ESTILOS Y DISEÑO](#estilos-y-diseño)
18. [INSTRUCCIONES DE INSTALACIÓN](#instrucciones-de-instalación)

---

## RESUMEN EJECUTIVO

### ¿Qué es este sistema?
Sistema CRM completo para gestión de una fábrica de arepas que incluye:
- **POS**: Punto de venta con facturación y control de cajeros
- **Remisiones**: Sistema de generación de remisiones sin afectar inventario
- **Pedidos**: Gestión de pedidos por día de entrega y cliente
- **Cargue**: Control operativo de 6 vendedores independientes (ID1-ID6)
- **Inventario**: Control de stock, producción y movimientos
- **Clientes**: Gestión de clientes con listas de precios
- **Caja**: Arqueo de caja y control de turnos

### Características Principales
- ✅ Sistema multi-módulo integrado
- ✅ Control de inventario en tiempo real
- ✅ Gestión de 6 vendedores independientes
- ✅ Sistema de cajeros con turnos y arqueos
- ✅ Listas de precios personalizadas
- ✅ Remisiones y pedidos separados de ventas
- ✅ Sincronización frontend-backend
- ✅ Interfaz moderna con React y Bootstrap

---

## ARQUITECTURA DEL SISTEMA

### Diagrama de Arquitectura
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React 19.1.0)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   POS    │  │Remisiones│  │ Pedidos  │  │  Cargue  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Inventario│  │ Clientes │  │   Caja   │  │ Reportes │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST API
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Django 5.1.7 + DRF)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Django REST Framework                    │   │
│  │  - ViewSets  - Serializers  - URLs  - Permissions   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ ORM
┌─────────────────────────────────────────────────────────────┐
│                  BASE DE DATOS (PostgreSQL)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Productos │  │  Ventas  │  │ Clientes │  │  Cargue  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Inventario│  │ Cajeros  │  │Remisiones│  │  Turnos  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos
```
Usuario → React Component → Service API → Django View → 
PostgreSQL → Django Serializer → JSON Response → React State → UI Update
```

---

## TECNOLOGÍAS Y DEPENDENCIAS

### Backend - Python/Django

#### Versiones Principales
```
Python: 3.11+
Django: 5.1.7
Django REST Framework: 3.14.0
PostgreSQL: 14+
```

#### requirements.txt
```txt
Django==5.1.7
djangorestframework==3.14.0
django-cors-headers==4.3.1
psycopg2-binary==2.9.9
Pillow==10.2.0
python-decouple==3.8
```

### Frontend - React

#### Versiones Principales
```
React: 19.1.0
React DOM: 19.1.0
React Router DOM: 7.1.1
Bootstrap: 5.3.6
```

#### package.json
```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.17.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "bootstrap": "^5.3.6",
    "bootstrap-icons": "^1.11.3",
    "react": "^19.1.0",
    "react-bootstrap": "^2.10.7",
    "react-calendar": "^5.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.1.1",
    "react-scripts": "5.0.1",
    "uuid": "^11.0.4",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

---

## CONFIGURACIÓN DE BASE DE DATOS

### PostgreSQL - Configuración

#### Crear Base de Datos
```sql
-- Conectarse a PostgreSQL
psql -U postgres

-- Crear base de datos
CREATE DATABASE fabrica;

-- Conectarse a la base de datos
\c fabrica

-- Verificar conexión
SELECT current_database();
```

#### Credenciales
```
Host: localhost
Port: 5432
Database: fabrica
User: postgres
Password: 12345
```

### Estructura de Tablas Principales

#### Tabla: api_producto
```sql
CREATE TABLE api_producto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) DEFAULT 0,
    precio_compra DECIMAL(10,2) DEFAULT 0,
    stock_total INTEGER DEFAULT 0,
    categoria_id INTEGER REFERENCES api_categoria(id),
    imagen VARCHAR(200),
    codigo_barras VARCHAR(100),
    marca VARCHAR(100) DEFAULT 'GENERICA',
    impuesto VARCHAR(20) DEFAULT 'IVA(0%)',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);
```

#### Tabla: api_venta
```sql
CREATE TABLE api_venta (
    id SERIAL PRIMARY KEY,
    numero_factura VARCHAR(50) UNIQUE NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vendedor VARCHAR(100) DEFAULT 'Sistema',
    cliente VARCHAR(255) DEFAULT 'CONSUMIDOR FINAL',
    metodo_pago VARCHAR(20) DEFAULT 'EFECTIVO',
    subtotal DECIMAL(10,2) DEFAULT 0,
    impuestos DECIMAL(10,2) DEFAULT 0,
    descuentos DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    dinero_entregado DECIMAL(10,2) DEFAULT 0,
    devuelta DECIMAL(10,2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'PAGADO',
    nota TEXT,
    banco VARCHAR(100) DEFAULT 'Caja General',
    centro_costo VARCHAR(100),
    bodega VARCHAR(100) DEFAULT 'Principal'
);
```

#### Tabla: api_cliente
```sql
CREATE TABLE api_cliente (
    id SERIAL PRIMARY KEY,
    regimen VARCHAR(20) DEFAULT 'SIMPLIFICADO',
    tipo_persona VARCHAR(20) DEFAULT 'NATURAL',
    tipo_identificacion VARCHAR(20) DEFAULT 'CC',
    identificacion VARCHAR(50) UNIQUE NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    alias VARCHAR(100),
    primer_nombre VARCHAR(100),
    segundo_nombre VARCHAR(100),
    primer_apellido VARCHAR(100),
    segundo_apellido VARCHAR(100),
    telefono_1 VARCHAR(20),
    movil VARCHAR(20),
    email_1 VARCHAR(254),
    contacto VARCHAR(255),
    telefono_contacto VARCHAR(20),
    pais VARCHAR(100) DEFAULT 'Colombia',
    departamento VARCHAR(100),
    ciudad VARCHAR(100),
    direccion TEXT,
    zona_barrio VARCHAR(255),
    tipo_contacto VARCHAR(50) DEFAULT 'CLIENTE',
    sucursal VARCHAR(100) DEFAULT 'Todas',
    medio_pago_defecto VARCHAR(50),
    nota TEXT,
    tipo_lista_precio VARCHAR(100),
    vendedor_asignado VARCHAR(100),
    centro_costo VARCHAR(100),
    dia_entrega VARCHAR(20),
    notificar_cartera BOOLEAN DEFAULT FALSE,
    notificar_rotacion BOOLEAN DEFAULT FALSE,
    cliente_predeterminado BOOLEAN DEFAULT FALSE,
    permite_venta_credito BOOLEAN DEFAULT FALSE,
    cupo_endeudamiento DECIMAL(12,2) DEFAULT 0,
    dias_vencimiento_cartera INTEGER DEFAULT 30,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: api_cargueid1 (y ID2-ID6 similar)
```sql
CREATE TABLE api_cargueid1 (
    id SERIAL PRIMARY KEY,
    dia VARCHAR(10) NOT NULL,
    fecha DATE NOT NULL,
    v BOOLEAN DEFAULT FALSE,
    d BOOLEAN DEFAULT FALSE,
    producto VARCHAR(255),
    cantidad INTEGER DEFAULT 0,
    dctos INTEGER DEFAULT 0,
    adicional INTEGER DEFAULT 0,
    devoluciones INTEGER DEFAULT 0,
    vencidas INTEGER DEFAULT 0,
    lotes_vencidos TEXT,
    total INTEGER DEFAULT 0,
    valor DECIMAL(10,2) DEFAULT 0,
    neto DECIMAL(12,2) DEFAULT 0,
    concepto VARCHAR(255),
    descuentos DECIMAL(10,2) DEFAULT 0,
    nequi DECIMAL(10,2) DEFAULT 0,
    daviplata DECIMAL(10,2) DEFAULT 0,
    base_caja DECIMAL(10,2) DEFAULT 0,
    total_despacho DECIMAL(12,2) DEFAULT 0,
    total_pedidos DECIMAL(10,2) DEFAULT 0,
    total_dctos DECIMAL(10,2) DEFAULT 0,
    venta DECIMAL(12,2) DEFAULT 0,
    total_efectivo DECIMAL(12,2) DEFAULT 0,
    licencia_transporte VARCHAR(2),
    soat VARCHAR(2),
    uniforme VARCHAR(2),
    no_locion VARCHAR(2),
    no_accesorios VARCHAR(2),
    capacitacion_carnet VARCHAR(2),
    higiene VARCHAR(2),
    estibas VARCHAR(2),
    desinfeccion VARCHAR(2),
    usuario VARCHAR(100) DEFAULT 'Sistema',
    responsable VARCHAR(100) DEFAULT 'RESPONSABLE',
    ruta VARCHAR(100) DEFAULT '',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: api_remision
```sql
CREATE TABLE api_remision (
    id SERIAL PRIMARY KEY,
    numero_remision VARCHAR(50) UNIQUE NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vendedor VARCHAR(100) NOT NULL,
    destinatario VARCHAR(255) NOT NULL,
    direccion_entrega TEXT NOT NULL,
    telefono_contacto VARCHAR(20),
    fecha_entrega DATE,
    tipo_remision VARCHAR(20) DEFAULT 'ENTREGA',
    transportadora VARCHAR(100) DEFAULT 'Propia',
    subtotal DECIMAL(10,2) DEFAULT 0,
    impuestos DECIMAL(10,2) DEFAULT 0,
    descuentos DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    nota TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## BACKEND DJANGO - CONFIGURACIÓN

### settings.py COMPLETO
```python
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-^zvl@rxk@+w1^4-s!ncx9dhopbzmvry0a1ybp0k#h8vha^&px3'

DEBUG = True

ALLOWED_HOSTS = []

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

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

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

ROOT_URLCONF = 'backend_crm.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend_crm.wsgi.application'

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

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'es-co'
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:19006",
]
```

### urls.py Principal (backend_crm/urls.py)
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

---

*Continúa en la siguiente sección...*
