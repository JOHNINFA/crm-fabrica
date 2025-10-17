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
- **Pedidos**: Sistema de gestión de pedidos por cliente, día y fecha de entrega con integración a Planeación
- **Cargue**: Control operativo de 6 vendedores independientes (ID1-ID6)
- **Inventario**: Control de stock, producción y movimientos con Planeación integrada
- **Clientes**: Gestión de clientes con listas de precios
- **Caja**: Arqueo de caja y control de turnos

### Características Principales
- ✅ Sistema multi-módulo integrado
- ✅ Control de inventario en tiempo real
- ✅ Gestión de 6 vendedores independientes
- ✅ Sistema de cajeros con turnos y arqueos
- ✅ Listas de precios personalizadas
- ✅ Sistema de pedidos con integración a Planeación de Inventario
- ✅ Pedidos agrupados por día de entrega y cliente
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


---

## MÓDULO PEDIDOS - DOCUMENTACIÓN COMPLETA

### Descripción General
El módulo de Pedidos permite gestionar pedidos de clientes organizados por día de entrega y fecha específica. Los pedidos se integran automáticamente con el módulo de Planeación de Inventario para facilitar la producción.

### Características Principales
- ✅ Gestión de pedidos por cliente y fecha de entrega
- ✅ Integración con módulo de Clientes (precarga de datos)
- ✅ Selector de días de la semana (Lunes-Sábado)
- ✅ Vista de clientes por día con estado de pedido
- ✅ Modal de creación de pedidos con datos del cliente
- ✅ Integración automática con Planeación de Inventario
- ✅ Informe general de pedidos con filtros
- ✅ API REST completa con endpoints `/api/pedidos/`

### Flujo de Trabajo

#### 1. Selección de Día
```
Usuario → Gestión de Pedidos → Selector de Días → Selecciona día (ej: SABADO)
```

#### 2. Vista de Clientes del Día
```
Sistema carga clientes con dia_entrega = SABADO
Muestra tarjetas con:
- Nombre del cliente
- Dirección
- Vendedor asignado
- Lista de precios
- Botón "Crear Pedido" o "Realizado" (si ya tiene pedido)
```

#### 3. Creación de Pedido
```
Usuario hace clic en "Crear Pedido"
→ Navega a formulario con datos precargados del cliente
→ Selecciona productos y cantidades
→ Genera pedido
→ Se guarda en BD con fecha_entrega seleccionada
```

#### 4. Integración con Planeación y Cargue
```
Pedido guardado → Actualiza automáticamente:
  1. Planeación: Suma cantidades en columna "Pedidos"
  2. Cargue: Suma dinero en "Total Pedidos"
→ Total Planeación = Solicitadas + Pedidos
→ Total Efectivo Cargue = Venta - Total Pedidos
```

### Estructura de Base de Datos

#### Tabla: api_pedido (antes api_remision)
```sql
CREATE TABLE api_pedido (
    id SERIAL PRIMARY KEY,
    numero_remision VARCHAR(50) UNIQUE NOT NULL,  -- Formato: PED-000001
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vendedor VARCHAR(100) NOT NULL,
    destinatario VARCHAR(255) NOT NULL,
    direccion_entrega TEXT NOT NULL,
    telefono_contacto VARCHAR(20),
    fecha_entrega DATE NOT NULL,  -- Fecha de entrega del pedido
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

#### Tabla: api_detallepedido (antes api_detalleremision)
```sql
CREATE TABLE api_detallepedido (
    id SERIAL PRIMARY KEY,
    remision_id INTEGER REFERENCES api_pedido(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES api_producto(id),
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);
```

### API Endpoints

#### GET /api/pedidos/
Obtiene todos los pedidos

**Respuesta:**
```json
[
  {
    "id": 1,
    "numero_remision": "PED-000001",
    "numero_pedido": "PED-000001",
    "fecha": "2025-01-10T14:30:00",
    "vendedor": "Carlos",
    "destinatario": "Prueba5",
    "direccion_entrega": "Cll135 45-89",
    "telefono_contacto": "85623447",
    "fecha_entrega": "2025-10-11",
    "tipo_remision": "ENTREGA",
    "tipo_pedido": "ENTREGA",
    "transportadora": "Propia",
    "subtotal": 5200.00,
    "impuestos": 0.00,
    "descuentos": 0.00,
    "total": 5200.00,
    "estado": "PENDIENTE",
    "nota": "",
    "detalles": [
      {
        "id": 1,
        "producto": 1,
        "producto_nombre": "AREPA TIPO OBLEA 500Gr",
        "cantidad": 1,
        "precio_unitario": 2700.00,
        "subtotal": 2700.00
      },
      {
        "id": 2,
        "producto": 2,
        "producto_nombre": "AREPA MEDIANA 330Gr",
        "cantidad": 1,
        "precio_unitario": 2500.00,
        "subtotal": 2500.00
      }
    ]
  }
]
```

#### POST /api/pedidos/
Crea un nuevo pedido

**Request Body:**
```json
{
  "fecha": "2025-01-10T14:30:00",
  "vendedor": "Carlos",
  "destinatario": "PRUEBA4",
  "direccion_entrega": "Calle 123",
  "telefono_contacto": "3001234567",
  "fecha_entrega": "2025-10-11",
  "tipo_remision": "ENTREGA",
  "transportadora": "Propia",
  "subtotal": 5400.00,
  "impuestos": 0.00,
  "descuentos": 0.00,
  "total": 5400.00,
  "estado": "PENDIENTE",
  "nota": "",
  "detalles": [
    {
      "producto": 1,
      "cantidad": 2,
      "precio_unitario": 2700.00
    }
  ]
}
```

**Respuesta:**
```json
{
  "id": 2,
  "numero_remision": "PED-000002",
  "numero_pedido": "PED-000002",
  "fecha": "2025-01-10T14:30:00",
  "vendedor": "Carlos",
  "destinatario": "PRUEBA4",
  "total": 5400.00,
  "estado": "PENDIENTE"
}
```

### Componentes Frontend

#### 1. SelectorDiasPedidosScreen.jsx
**Ubicación:** `frontend/src/pages/SelectorDiasPedidosScreen.jsx`

**Función:** Muestra selector de días de la semana para gestión de pedidos

**Características:**
- Botones para cada día (LUNES-SABADO)
- Navegación a `/pedidos/:dia`
- Botón de regreso

#### 2. PedidosDiaScreen.jsx
**Ubicación:** `frontend/src/pages/PedidosDiaScreen.jsx`

**Función:** Muestra clientes del día seleccionado con estado de pedidos

**Características:**
- Carga clientes filtrados por `dia_entrega`
- Selector de fecha para filtrar pedidos
- Tarjetas de clientes con información resumida
- Botón "Crear Pedido" o "Realizado" según estado
- Modal de detalle de pedido al hacer clic en "Realizado"
- Recarga automática al recuperar foco de ventana

**Código clave:**
```javascript
const cargarPedidos = async () => {
  const response = await fetch(`http://localhost:8000/api/pedidos/`);
  const pedidos = await response.json();
  
  // Filtrar por fecha de entrega
  const pedidosFiltradas = pedidos.filter(r => r.fecha_entrega === fechaSeleccionada);
  
  // Crear mapa de pedidos por cliente
  const pedidosMap = {};
  pedidosFiltradas.forEach(pedido => {
    pedidosMap[pedido.destinatario] = pedido;
  });
  
  setPedidosRealizados(pedidosMap);
};
```

#### 3. PedidosScreen.jsx (antes PedidosRemisionesScreen)
**Ubicación:** `frontend/src/pages/PedidosScreen.jsx`

**Función:** Formulario principal para crear pedidos

**Características:**
- Recibe datos del cliente por URL params
- Precarga: nombre, dirección, vendedor, lista de precios, fecha
- Lista de productos con precios según lista del cliente
- Carrito de productos
- Modal de confirmación con todos los datos
- Reseteo de formulario después de crear pedido

#### 4. PaymentModal.jsx
**Ubicación:** `frontend/src/components/Pedidos/PaymentModal.jsx`

**Función:** Modal de confirmación y creación de pedido

**Características:**
- Muestra resumen del pedido
- Formulario de datos de entrega
- Selector de tipo de pedido (Entrega, Traslado, Devolución, Muestra)
- Selector de transportadora
- Validación de campos requeridos
- Conversión de precios a números con `parseFloat()`
- Llamada a API para crear pedido

**Código clave:**
```javascript
const pedidoData = {
  fecha: getFechaLocal(),
  vendedor: seller,
  destinatario: destinatario,
  direccion_entrega: direccionEntrega,
  telefono_contacto: telefonoContacto,
  fecha_entrega: fechaEntrega,
  tipo_remision: tipoPedido,
  transportadora: transportadora,
  subtotal: subtotal,
  impuestos: impuestos,
  descuentos: descuentos,
  total: safeTotal,
  estado: 'PENDIENTE',
  nota: nota,
  detalles: cart.map(item => ({
    producto: item.id,
    cantidad: item.qty,
    precio_unitario: parseFloat(item.price)  // Importante: convertir a número
  }))
};

// Crear el pedido
const result = await pedidoService.create(pedidoData);
```

---

### LÓGICA DE BACKEND - CREACIÓN Y ANULACIÓN DE PEDIDOS

#### 📝 Creación de Pedidos (PedidoSerializer.create)

**Ubicación:** `api/serializers.py` - Líneas 487-575

**Flujo completo:**

```python
def create(self, validated_data):
    from django.db import transaction
    
    # Extraer detalles del request
    detalles_data = self.context['request'].data.get('detalles', [])
    
    with transaction.atomic():
        # 1️⃣ CREAR EL PEDIDO
        pedido = Pedido.objects.create(**validated_data)
        
        # 2️⃣ CREAR LOS DETALLES
        for detalle_data in detalles_data:
            DetallePedido.objects.create(
                pedido=pedido,
                producto_id=detalle_data['producto'],
                cantidad=detalle_data['cantidad'],
                precio_unitario=detalle_data['precio_unitario']
            )
        
        # 3️⃣ ACTUALIZAR PLANEACIÓN (si hay fecha_entrega)
        if pedido.fecha_entrega:
            for detalle_data in detalles_data:
                producto = Producto.objects.get(id=detalle_data['producto'])
                
                # Buscar o crear registro en Planeación
                planeacion, created = Planeacion.objects.get_or_create(
                    fecha=pedido.fecha_entrega,
                    producto_nombre=producto.nombre,
                    defaults={
                        'existencias': 0,
                        'solicitadas': 0,
                        'pedidos': 0,
                        'orden': 0,
                        'ia': 0,
                        'usuario': 'Sistema'
                    }
                )
                
                # ✅ SUMAR la cantidad del pedido
                planeacion.pedidos += detalle_data['cantidad']
                planeacion.save()  # El total se calcula automáticamente
        
        # 4️⃣ ACTUALIZAR CARGUE (si hay fecha_entrega y vendedor)
        if pedido.fecha_entrega and pedido.vendedor:
            cargue_models = [CargueID1, CargueID2, CargueID3, 
                           CargueID4, CargueID5, CargueID6]
            
            for CargueModel in cargue_models:
                cargues = CargueModel.objects.filter(fecha=pedido.fecha_entrega)
                
                for cargue in cargues:
                    # Verificar si el vendedor coincide con el responsable
                    if pedido.vendedor.lower() in cargue.responsable.lower():
                        # ✅ SUMAR al total_pedidos
                        cargue.total_pedidos = float(cargue.total_pedidos or 0) + float(pedido.total)
                        
                        # Recalcular total_efectivo
                        if cargue.venta and cargue.total_pedidos:
                            cargue.total_efectivo = float(cargue.venta) - float(cargue.total_pedidos)
                        
                        cargue.save()
                        break  # Solo actualizar un cargue por modelo
    
    return pedido
```

**Puntos clave:**
- ✅ Usa transacciones atómicas para garantizar consistencia
- ✅ Crea el pedido y sus detalles
- ✅ Actualiza automáticamente Planeación (suma cantidades)
- ✅ Actualiza automáticamente Cargue (suma dinero)
- ✅ El modelo Planeacion recalcula `total = solicitadas + pedidos` automáticamente

---

#### 🔄 Anulación de Pedidos (PedidoViewSet.anular)

**Ubicación:** `api/views.py` - Líneas 1270-1400

**Endpoint:** `POST /api/pedidos/{id}/anular/`

**Flujo completo:**

```python
@action(detail=True, methods=['post'])
def anular(self, request, pk=None):
    """Anular pedido y revertir en Planeación y Cargue"""
    pedido = self.get_object()
    
    if pedido.estado == 'ANULADA':
        return Response({'detail': 'El pedido ya está anulado'})
    
    with transaction.atomic():
        # 1️⃣ CAMBIAR ESTADO DEL PEDIDO
        estado_anterior = pedido.estado
        pedido.estado = 'ANULADA'
        motivo = request.data.get('motivo', 'Anulado desde gestión de pedidos')
        pedido.nota = f"{pedido.nota or ''}\n[ANULADO] {motivo} - {timezone.now()}"
        pedido.save()
        
        # 2️⃣ REVERTIR EN PLANEACIÓN
        if pedido.fecha_entrega:
            for detalle in pedido.detalles.all():
                planeacion = Planeacion.objects.filter(
                    fecha=pedido.fecha_entrega,
                    producto_nombre=detalle.producto.nombre
                ).first()
                
                if planeacion:
                    # ✅ RESTAR la cantidad del pedido anulado
                    planeacion.pedidos = max(0, planeacion.pedidos - detalle.cantidad)
                    planeacion.save()  # El total se recalcula automáticamente
        
        # 3️⃣ REVERTIR EN CARGUE
        if pedido.fecha_entrega and pedido.vendedor:
            cargue_models = [
                ('ID1', CargueID1), ('ID2', CargueID2), ('ID3', CargueID3),
                ('ID4', CargueID4), ('ID5', CargueID5), ('ID6', CargueID6)
            ]
            
            for id_cargue, CargueModel in cargue_models:
                cargues = CargueModel.objects.filter(fecha=pedido.fecha_entrega)
                
                for cargue in cargues:
                    if pedido.vendedor.lower() in cargue.responsable.lower():
                        # ✅ RESTAR el total_pedidos (devolver el dinero)
                        cargue.total_pedidos = max(0, float(cargue.total_pedidos or 0) - float(pedido.total))
                        
                        # Recalcular total_efectivo
                        if cargue.venta and cargue.total_pedidos:
                            cargue.total_efectivo = float(cargue.venta) - float(cargue.total_pedidos)
                        
                        cargue.save()
                        break
        
        return Response({
            'success': True,
            'message': 'Pedido anulado exitosamente',
            'pedido': serializer.data
        })
```

**Puntos clave:**
- ✅ Cambia el estado a 'ANULADA'
- ✅ Revierte las cantidades en Planeación (resta)
- ✅ Revierte el dinero en Cargue (resta)
- ✅ Usa transacciones atómicas
- ✅ Agrega nota con motivo y fecha de anulación

---

#### 🔍 Filtrado de Pedidos Anulados en Frontend

**Problema resuelto:** Los pedidos anulados se estaban sumando en Planeación y Cargue

**Solución implementada:**

**1. En Planeación (InventarioPlaneacion.jsx):**
```javascript
// Filtrar pedidos por fecha de entrega Y excluir anulados
const pedidosFecha = pedidos.filter(p => 
  p.fecha_entrega === fechaFormateada && p.estado !== 'ANULADA'
);
```

**2. En Cargue (PlantillaOperativa.jsx):**
```javascript
// Filtrar pedidos por fecha de entrega, vendedor Y excluir anulados
const pedidosFiltrados = pedidos.filter(pedido => {
  const coincideFecha = pedido.fecha_entrega === fechaFormateada;
  const noAnulado = pedido.estado !== 'ANULADA';  // ✅ NUEVO
  const coincideVendedor = /* lógica de coincidencia */;
  
  return coincideFecha && coincideVendedor && noAnulado;
});
```

**Resultado:**
- ✅ Planeación solo muestra cantidades de pedidos activos
- ✅ Cargue solo suma dinero de pedidos activos
- ✅ Los pedidos anulados no afectan los cálculos

---

### INTEGRACIÓN COMPLETA: PEDIDOS ↔ PLANEACIÓN ↔ CARGUE

```
┌─────────────────────────────────────────────────────────────┐
│                    CREAR PEDIDO                             │
│                                                             │
│  Frontend (PaymentModal.jsx)                                │
│    ↓                                                        │
│  POST /api/pedidos/                                         │
│    ↓                                                        │
│  Backend (PedidoSerializer.create)                          │
│    ├─→ 1. Crear Pedido en BD                               │
│    ├─→ 2. Crear DetallePedido                              │
│    ├─→ 3. Actualizar Planeación (suma cantidades)          │
│    └─→ 4. Actualizar Cargue (suma dinero)                  │
│                                                             │
│  Resultado:                                                 │
│    ✅ Pedido guardado con estado PENDIENTE                  │
│    ✅ Planeación.pedidos += cantidad                        │
│    ✅ Cargue.total_pedidos += total                         │
│    ✅ Cargue.total_efectivo = venta - total_pedidos         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ANULAR PEDIDO                            │
│                                                             │
│  Frontend (PedidosDiaScreen.jsx)                            │
│    ↓                                                        │
│  POST /api/pedidos/{id}/anular/                             │
│    ↓                                                        │
│  Backend (PedidoViewSet.anular)                             │
│    ├─→ 1. Cambiar estado a ANULADA                         │
│    ├─→ 2. Revertir Planeación (resta cantidades)           │
│    └─→ 3. Revertir Cargue (resta dinero)                   │
│                                                             │
│  Resultado:                                                 │
│    ✅ Pedido.estado = 'ANULADA'                             │
│    ✅ Planeación.pedidos -= cantidad                        │
│    ✅ Cargue.total_pedidos -= total                         │
│    ✅ Cargue.total_efectivo = venta - total_pedidos         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 VISUALIZACIÓN EN PLANEACIÓN                 │
│                                                             │
│  Frontend (InventarioPlaneacion.jsx)                        │
│    ↓                                                        │
│  GET /api/pedidos/?fecha_entrega={fecha}                    │
│    ↓                                                        │
│  Filtrar: estado !== 'ANULADA'  ← ✅ IMPORTANTE             │
│    ↓                                                        │
│  Sumar cantidades por producto                              │
│    ↓                                                        │
│  Mostrar en columna "Pedidos"                               │
│                                                             │
│  Total = Solicitadas + Pedidos                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  VISUALIZACIÓN EN CARGUE                    │
│                                                             │
│  Frontend (PlantillaOperativa.jsx)                          │
│    ↓                                                        │
│  GET /api/pedidos/?fecha_entrega={fecha}                    │
│    ↓                                                        │
│  Filtrar: estado !== 'ANULADA' + vendedor  ← ✅ IMPORTANTE  │
│    ↓                                                        │
│  Sumar totales por vendedor                                 │
│    ↓                                                        │
│  Mostrar en "TOTAL PEDIDOS"                                 │
│                                                             │
│  Total Efectivo = Venta - Total Pedidos                     │
└─────────────────────────────────────────────────────────────┘
```

---

### CASOS DE USO Y EJEMPLOS

#### Caso 1: Crear Pedido Normal
```
1. Usuario selecciona SABADO en selector de días
2. Sistema muestra clientes con dia_entrega = SABADO
3. Usuario hace clic en "Crear Pedido" para PRUEBA3
4. Sistema precarga datos del cliente
5. Usuario agrega productos:
   - AREPA TIPO OBLEA 500Gr x1 = $2,500
   - AREPA MEDIANA 330Gr x1 = $2,000
6. Usuario confirma pedido
7. Sistema:
   ✅ Crea PED-000011 con total $4,500
   ✅ Suma en Planeación: AREPA TIPO OBLEA +1, AREPA MEDIANA +1
   ✅ Suma en Cargue ID1 (Carlos): total_pedidos +$4,500
```

#### Caso 2: Anular Pedido
```
1. Usuario ve pedido PED-000011 en estado "Realizado"
2. Usuario hace clic en botón "Anular"
3. Sistema confirma anulación
4. Sistema:
   ✅ Cambia estado a ANULADA
   ✅ Resta en Planeación: AREPA TIPO OBLEA -1, AREPA MEDIANA -1
   ✅ Resta en Cargue ID1 (Carlos): total_pedidos -$4,500
5. Usuario recarga página
6. Sistema muestra pedido en estado "Pendiente" (porque está anulado)
```

#### Caso 3: Pedido Duplicado (Error Común)
```
Problema: Usuario crea 2 pedidos para el mismo cliente y fecha
Resultado: Ambos se suman en Planeación y Cargue

Solución: Validar en frontend antes de crear
- Verificar si ya existe pedido activo para ese cliente y fecha
- Mostrar advertencia si existe
```

---

### TROUBLESHOOTING

#### Problema: Pedidos anulados se siguen sumando
**Causa:** Frontend no filtra por estado
**Solución:** Agregar filtro `pedido.estado !== 'ANULADA'` en:
- `InventarioPlaneacion.jsx` (línea ~48)
- `PlantillaOperativa.jsx` (línea ~227)

#### Problema: Total de pedidos duplicado en Cargue
**Causa:** Múltiples registros de Cargue para la misma fecha
**Solución:** El código ya tiene `break` para solo actualizar un registro por modelo

#### Problema: Pedido no aparece en Planeación
**Causa:** Fecha de entrega no coincide con fecha seleccionada
**Solución:** Verificar que `pedido.fecha_entrega` sea igual a la fecha en Planeación

#### Problema: Pedido no suma en Cargue
**Causa:** Nombre del vendedor no coincide con responsable
**Solución:** Verificar que `pedido.vendedor` contenga el nombre del responsable en Cargue

---

### MEJORAS FUTURAS

1. **Validación de duplicados:** Evitar crear múltiples pedidos para el mismo cliente y fecha
2. **Historial de anulaciones:** Guardar log de quién anuló y por qué
3. **Notificaciones:** Alertar al vendedor cuando se crea/anula un pedido
4. **Reportes:** Dashboard con estadísticas de pedidos por vendedor/fecha
5. **Exportación:** Generar PDF/Excel de pedidos del día
};

const result = await remisionService.create(pedidoData);
```

#### 5. ModalDetallePedido.jsx
**Ubicación:** `frontend/src/components/Pedidos/ModalDetallePedido.jsx`

**Función:** Modal para ver detalles de un pedido existente

**Características:**
- Muestra información del cliente
- Lista de productos con cantidades y precios
- Total del pedido
- Estado del pedido

#### 6. InformePedidosScreen.jsx
**Ubicación:** `frontend/src/pages/InformePedidosScreen.jsx`

**Función:** Informe general de todos los pedidos

**Características:**
- Tabla con todos los pedidos
- Columnas: N° Pedido, Fecha, Destinatario, Vendedor, Dirección, Teléfono, Fecha Entrega, Tipo, Estado, Total
- Totales al pie de página
- Badges de colores según estado

### Integración con Planeación

#### InventarioPlaneacion.jsx
**Ubicación:** `frontend/src/components/inventario/InventarioPlaneacion.jsx`

**Función:** Carga pedidos y muestra cantidades en columna "Pedidos"

**Código clave:**
```javascript
const cargarPedidosDesdeBD = async (fechaSeleccionada) => {
  const response = await fetch(`http://localhost:8000/api/pedidos/`);
  const pedidos = await response.json();
  
  // Filtrar por fecha de entrega
  const pedidosFecha = pedidos.filter(p => p.fecha_entrega === fechaFormateada);
  
  // Sumar cantidades por producto
  const pedidosMap = {};
  for (const pedido of pedidosFecha) {
    if (pedido.detalles && pedido.detalles.length > 0) {
      for (const detalle of pedido.detalles) {
        const nombreProducto = detalle.producto_nombre;
        if (!pedidosMap[nombreProducto]) {
          pedidosMap[nombreProducto] = 0;
        }
        pedidosMap[nombreProducto] += detalle.cantidad;
      }
    }
  }
  
  return pedidosMap;
};
```

**Resultado en Planeación:**
```
Producto              | Existencias | Solicitadas | Pedidos | Total
---------------------|-------------|-------------|---------|-------
AREPA TIPO OBLEA     |     50      |      10     |    4    |   14
AREPA MEDIANA        |     30      |       8     |    4    |   12
AREPA TIPO PINCHO    |     20      |       5     |    2    |    7
```

### Servicios API Frontend

#### remisionService (api.js)
**Ubicación:** `frontend/src/services/api.js`

```javascript
export const remisionService = {
  // Obtener todos los pedidos
  getAll: async (params = {}) => {
    const url = `${API_URL}/pedidos/?${queryParams.toString()}`;
    const response = await fetch(url);
    return await response.json();
  },

  // Crear nuevo pedido
  create: async (pedidoData) => {
    const response = await fetch(`${API_URL}/pedidos/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedidoData),
    });
    return await response.json();
  },

  // Obtener pedido por ID
  getById: async (id) => {
    const response = await fetch(`${API_URL}/pedidos/${id}/`);
    return await response.json();
  },

  // Actualizar estado de pedido
  updateEstado: async (id, nuevoEstado) => {
    const response = await fetch(`${API_URL}/pedidos/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    return await response.json();
  }
};
```

### Backend - Serializers

#### RemisionSerializer
**Ubicación:** `api/serializers.py`

```python
class RemisionSerializer(serializers.ModelSerializer):
    """Serializer para pedidos"""
    detalles = DetalleRemisionSerializer(many=True, read_only=True)
    numero_pedido = serializers.CharField(source='numero_remision', read_only=True)
    tipo_pedido = serializers.CharField(source='tipo_remision', required=False)
    
    class Meta:
        model = Remision
        fields = [
            'id', 'numero_remision', 'numero_pedido', 'fecha', 'vendedor', 'destinatario',
            'direccion_entrega', 'telefono_contacto', 'fecha_entrega',
            'tipo_remision', 'tipo_pedido', 'transportadora', 'subtotal', 'impuestos',
            'descuentos', 'total', 'estado', 'nota', 'fecha_creacion',
            'fecha_actualizacion', 'detalles'
        ]
        read_only_fields = ('numero_remision', 'numero_pedido', 'fecha_creacion', 'fecha_actualizacion')
    
    def create(self, validated_data):
        # Extraer detalles del request
        detalles_data = self.context['request'].data.get('detalles', [])
        
        # Crear el pedido
        remision = Remision.objects.create(**validated_data)
        
        # Crear los detalles
        for detalle_data in detalles_data:
            DetalleRemision.objects.create(
                remision=remision,
                producto_id=detalle_data['producto'],
                cantidad=detalle_data['cantidad'],
                precio_unitario=detalle_data['precio_unitario']
            )
        
        return remision
```

### Backend - Views

#### RemisionViewSet
**Ubicación:** `api/views.py`

```python
class RemisionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de pedidos"""
    queryset = Remision.objects.all().order_by('-fecha_creacion')
    serializer_class = RemisionSerializer
    
    def create(self, request, *args, **kwargs):
        """Crear nuevo pedido con detalles"""
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
```

### Rutas Backend

#### api/urls.py
```python
from rest_framework.routers import DefaultRouter
from .views import RemisionViewSet, DetalleRemisionViewSet

router = DefaultRouter()

# Rutas de pedidos (ambas apuntan al mismo ViewSet para compatibilidad)
router.register(r'pedidos', RemisionViewSet, basename='pedido')
router.register(r'remisiones', RemisionViewSet, basename='remision')
router.register(r'detalle-pedidos', DetalleRemisionViewSet, basename='detalle-pedido')
router.register(r'detalle-remisiones', DetalleRemisionViewSet, basename='detalle-remision')

urlpatterns = router.urls
```

### Migraciones

#### Renombrar tablas (Migration 0030)
```python
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0029_previous_migration'),
    ]

    operations = [
        migrations.AlterModelTable(
            name='remision',
            table='api_pedido',
        ),
        migrations.AlterModelTable(
            name='detalleremision',
            table='api_detallepedido',
        ),
    ]
```

### Casos de Uso

#### Caso 1: Crear Pedido para Cliente del Sábado
```
1. Usuario va a "Gestión de Pedidos"
2. Selecciona día "SABADO"
3. Sistema muestra clientes con dia_entrega = "SABADO"
4. Usuario hace clic en "Crear Pedido" para cliente "Prueba5"
5. Sistema navega a formulario con datos precargados:
   - Destinatario: Prueba5
   - Dirección: Cll135 45-89
   - Vendedor: Carlos
   - Lista de precios: CLIENTES
   - Fecha de entrega: 2025-10-11
6. Usuario selecciona productos:
   - AREPA TIPO OBLEA: 2 unidades
   - AREPA MEDIANA: 2 unidades
7. Usuario hace clic en "Generar Pedido"
8. Sistema muestra modal de confirmación
9. Usuario confirma
10. Sistema crea pedido en BD
11. Sistema muestra alert con número de pedido: PED-000003
12. Sistema resetea formulario
```

#### Caso 2: Ver Pedidos en Planeación
```
1. Usuario va a "Inventario" → "Planeación"
2. Selecciona fecha: 2025-10-11
3. Sistema carga pedidos con fecha_entrega = 2025-10-11
4. Sistema suma cantidades por producto:
   - AREPA TIPO OBLEA: 4 unidades (de 2 pedidos)
   - AREPA MEDIANA: 4 unidades (de 2 pedidos)
   - AREPA TIPO PINCHO: 2 unidades (de 1 pedido)
5. Sistema muestra en columna "Pedidos"
6. Columna "Total" = Solicitadas + Pedidos
```

#### Caso 3: Ver Detalle de Pedido Realizado
```
1. Usuario va a "Gestión de Pedidos" → "SABADO"
2. Sistema muestra clientes con botón "Realizado" (verde)
3. Usuario hace clic en "Realizado" para cliente "Prueba5"
4. Sistema abre modal con:
   - Número de pedido: PED-000001
   - Cliente: Prueba5
   - Dirección: Cll135 45-89
   - Teléfono: 85623447
   - Fecha de entrega: 10/10/2025
   - Productos:
     * AREPA TIPO OBLEA: 1 x $2,700 = $2,700
     * AREPA MEDIANA: 1 x $2,500 = $2,500
   - Total: $5,200
```

### Solución de Problemas Comunes

#### Problema 1: Precio se duplica como texto
**Error:** `"2700.002700.00": el valor debe ser un número decimal`

**Causa:** El precio se está enviando como string concatenado

**Solución:** Usar `parseFloat()` en el PaymentModal
```javascript
detalles: cart.map(item => ({
  producto: item.id,
  cantidad: item.qty,
  precio_unitario: parseFloat(item.price)  // Convertir a número
}))
```

#### Problema 2: Pedidos no aparecen en Planeación
**Causa:** La fecha de entrega no coincide con la fecha seleccionada

**Solución:** Verificar formato de fecha (YYYY-MM-DD)
```javascript
// Correcto
fecha_entrega: "2025-10-11"

// Incorrecto
fecha_entrega: "11/10/2025"
```

#### Problema 3: Botón "Realizado" no aparece
**Causa:** El nombre del cliente no coincide exactamente

**Solución:** Verificar que `pedido.destinatario === cliente.nombre_completo`
```javascript
// En PedidosDiaScreen.jsx
const pedidosMap = {};
pedidosFiltradas.forEach(pedido => {
  pedidosMap[pedido.destinatario] = pedido;  // Usar destinatario como clave
});

// Verificar coincidencia
{pedidosRealizados[cliente.nombre_completo] ? (
  <button>Realizado</button>
) : (
  <button>Crear Pedido</button>
)}
```

### Mejoras Futuras

1. **Edición de Pedidos**
   - Permitir editar pedidos existentes
   - Cambiar cantidades de productos
   - Actualizar fecha de entrega

2. **Estados de Pedido**
   - PENDIENTE → EN PREPARACIÓN → LISTO → ENTREGADO
   - Flujo de trabajo con cambios de estado
   - Notificaciones por estado

3. **Impresión de Pedidos**
   - Generar PDF con detalles del pedido
   - Formato de remisión imprimible
   - Código QR para tracking

4. **Integración con Cargue**
   - Cargar pedidos del día en tablas de vendedores
   - Sumar cantidades de pedidos a producción solicitada
   - Control de entrega de pedidos

5. **Notificaciones**
   - Email al cliente cuando se crea el pedido
   - SMS de confirmación
   - Recordatorio un día antes de la entrega

6. **Reportes Avanzados**
   - Pedidos por cliente
   - Pedidos por producto
   - Análisis de tendencias
   - Productos más pedidos

### Conclusión

El módulo de Pedidos está completamente funcional e integrado con:
- ✅ Módulo de Clientes (precarga de datos)
- ✅ Módulo de Planeación (suma de cantidades)
- ✅ Base de datos PostgreSQL
- ✅ API REST con endpoints `/api/pedidos/`
- ✅ Frontend React con componentes modulares

**Próximo paso:** Integrar pedidos en el módulo de Cargue para control operativo diario.

