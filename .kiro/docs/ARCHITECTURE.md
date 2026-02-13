# 🏗️ ARQUITECTURA - CRM FÁBRICA

## Visión General

CRM Fábrica es un sistema integral de gestión para empresas de producción y distribución. Consta de 3 capas principales:

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│              Web Dashboard + POS System                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  API REST (Django)                       │
│            Backend + Business Logic                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              DATABASE (PostgreSQL)                       │
│            Datos Centralizados                           │
└─────────────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│            APP MÓVIL (React Native)                      │
│         Cargue, Ventas, Rutas, Sincronización           │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 BACKEND (Django/Python)

### Ubicación
- `backend_crm/` - Configuración Django
- `api/` - Aplicación principal

### Estructura de Carpetas
```
backend_crm/
├── settings.py          # Configuración Django
├── urls.py              # Rutas principales
├── wsgi.py              # WSGI para producción
└── asgi.py              # ASGI para WebSockets

api/
├── models.py            # Modelos de datos
├── views.py             # Vistas/Endpoints
├── serializers.py       # Serializadores DRF
├── urls.py              # Rutas de API
├── signals.py           # Señales Django
├── admin.py             # Admin Django
├── services/            # Servicios de negocio
│   ├── ai_agent_service.py
│   ├── ia_service.py
│   └── session_manager.py
└── ml_models/           # Modelos ML para predicciones
    ├── AREPA_*.keras
    └── *_scaler.pkl
```

### Modelos Principales

#### Producto
```python
- nombre (CharField, unique)
- descripcion (TextField)
- precio (DecimalField)
- precio_compra (DecimalField)
- precio_cargue (DecimalField)
- stock_total (IntegerField)
- categoria (ForeignKey → Categoria)
- imagen (ImageField)
- disponible_pos (BooleanField)
- disponible_cargue (BooleanField)
- disponible_app_* (BooleanField) - Múltiples módulos
```

#### Cliente
```python
- identificacion (CharField, unique)
- nombre_completo (CharField)
- tipo_negocio (CharField)
- telefono_1, movil (CharField)
- email_1 (EmailField)
- direccion (TextField)
- ciudad, departamento (CharField)
- permite_venta_credito (BooleanField)
- cupo_endeudamiento (DecimalField)
- productos_frecuentes (Relación → ProductosFrecuentes)
```

#### Venta
```python
- numero_factura (CharField, unique)
- fecha (DateTimeField)
- vendedor (CharField)
- cliente (CharField)
- metodo_pago (CharField) - EFECTIVO, TARJETA, QR, etc.
- subtotal, impuestos, descuentos, total (DecimalField)
- estado (CharField) - PAGADO, PENDIENTE, CANCELADO, ANULADA
- detalles (Relación → DetalleVenta)
```

#### Cargue (ID1, ID2, ID3, ID4, ID5)
```python
- dia (CharField)
- fecha (DateField)
- v, d (BooleanField) - Vendedor, Despachador
- producto (CharField)
- cantidad, dctos, adicional, devoluciones, vendidas, vencidas (IntegerField)
- total, valor, neto (DecimalField)
- lotes_vencidos, lotes_produccion (TextField - JSON)
- responsable (CharField)
- ruta (CharField)
```

#### Stock
```python
- producto (OneToOneField → Producto)
- cantidad_actual (IntegerField)
- fecha_actualizacion (DateTimeField, auto_now)
```

### Endpoints Principales

```
GET    /api/productos/                    # Listar productos
POST   /api/productos/                    # Crear producto
GET    /api/productos/{id}/               # Detalle producto
PUT    /api/productos/{id}/               # Actualizar producto

GET    /api/clientes/                     # Listar clientes
POST   /api/clientes/                     # Crear cliente
GET    /api/clientes/{id}/                # Detalle cliente

GET    /api/ventas/                       # Listar ventas
POST   /api/ventas/                       # Crear venta
GET    /api/ventas/{id}/                  # Detalle venta

GET    /api/cargue/                       # Listar cargues
POST   /api/cargue/                       # Crear cargue
GET    /api/cargue/{id}/                  # Detalle cargue

GET    /api/stock/                        # Estado de stock
PUT    /api/stock/{id}/                   # Actualizar stock
```

### Base de Datos

**Motor**: PostgreSQL
**Tablas principales**:
- api_producto
- api_cliente
- api_venta
- api_detalleventa
- api_cargue* (ID1, ID2, ID3, ID4, ID5)
- api_stock
- api_lote
- api_movimientoinventario

---

## 🎨 FRONTEND (React)

### Ubicación
- `frontend/src/` - Código fuente

### Estructura de Carpetas
```
frontend/src/
├── components/          # Componentes reutilizables
│   ├── Navbar.js
│   ├── ProductList.js
│   ├── ClienteSelector.js
│   └── ...
├── pages/               # Páginas principales
│   ├── Dashboard.js
│   ├── Productos.js
│   ├── Clientes.js
│   ├── Ventas.js
│   └── ...
├── services/            # Servicios API
│   ├── api.js
│   ├── productService.js
│   ├── clienteService.js
│   └── ...
├── context/             # Context API
│   ├── AuthContext.js
│   ├── ProductContext.js
│   └── ...
├── styles/              # Estilos CSS/SCSS
│   ├── App.css
│   ├── components.css
│   └── ...
├── utils/               # Utilidades
│   ├── helpers.js
│   ├── validators.js
│   └── ...
├── App.js               # Componente raíz
└── index.js             # Punto de entrada
```

### Componentes Principales

- **Navbar**: Navegación principal
- **Dashboard**: Panel de control
- **ProductList**: Listado de productos
- **ClienteSelector**: Selector de clientes
- **VentasScreen**: Pantalla de ventas/POS
- **CargueForm**: Formulario de cargue
- **ReportesView**: Visualización de reportes

### Flujos Principales

1. **Gestión de Productos**
   - Listar → Crear → Editar → Eliminar
   - Actualizar precios
   - Gestionar disponibilidad por módulo

2. **Gestión de Clientes**
   - Crear cliente
   - Asignar productos frecuentes
   - Configurar crédito

3. **Ventas/POS**
   - Seleccionar cliente
   - Agregar productos
   - Aplicar descuentos
   - Procesar pago
   - Generar factura

4. **Cargue**
   - Registrar productos cargados
   - Registrar vendidos
   - Registrar devoluciones
   - Resumen de pagos

---

## 📱 APP MÓVIL (React Native)

### Ubicación
- `AP GUERRERO/` - Código fuente

### Estructura de Carpetas
```
AP GUERRERO/
├── components/          # Componentes
│   ├── Cargue.js
│   ├── ProductList.js
│   ├── Navbar.js
│   └── Ventas/
│       ├── VentasScreen.js
│       ├── ClienteSelector.js
│       └── ResumenVentaModal.js
├── services/            # Servicios
│   ├── rutasApiService.js
│   ├── syncService.js
│   ├── ventasService.js
│   └── printerService.js
├── App.js               # Componente raíz
├── MainScreen.js        # Pantalla principal
├── LoginScreen.js       # Autenticación
└── package.json         # Dependencias
```

### Funcionalidades Principales

1. **Cargue**
   - Registrar productos cargados
   - Escanear códigos de barras
   - Sincronizar con backend

2. **Ventas**
   - Seleccionar cliente
   - Agregar productos
   - Aplicar descuentos
   - Procesar pago
   - Imprimir recibo

3. **Rutas**
   - Ver clientes asignados
   - Navegar entre clientes
   - Registrar visitas

4. **Sincronización**
   - Sincronizar datos con backend
   - Caché local con AsyncStorage
   - Manejo de conexión offline

### Tecnologías

- **React Native**: Framework
- **Expo**: Herramienta de desarrollo
- **Firebase**: Autenticación y datos
- **AsyncStorage**: Almacenamiento local
- **React Navigation**: Navegación

---

## 🗄️ BASE DE DATOS

### Esquema Principal

```sql
-- Productos
CREATE TABLE api_producto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2),
    precio_compra DECIMAL(10,2),
    precio_cargue DECIMAL(10,2),
    stock_total INTEGER DEFAULT 0,
    categoria_id INTEGER REFERENCES api_categoria(id),
    imagen VARCHAR(100),
    disponible_pos BOOLEAN DEFAULT TRUE,
    disponible_cargue BOOLEAN DEFAULT TRUE,
    disponible_app_cargue BOOLEAN DEFAULT TRUE,
    disponible_app_ventas BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Clientes
CREATE TABLE api_cliente (
    id SERIAL PRIMARY KEY,
    identificacion VARCHAR(50) UNIQUE NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    tipo_negocio VARCHAR(100),
    telefono_1 VARCHAR(20),
    movil VARCHAR(100),
    email_1 VARCHAR(254),
    direccion TEXT,
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    permite_venta_credito BOOLEAN DEFAULT FALSE,
    cupo_endeudamiento DECIMAL(12,2) DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT NOW()
);

-- Ventas
CREATE TABLE api_venta (
    id SERIAL PRIMARY KEY,
    numero_factura VARCHAR(50) UNIQUE NOT NULL,
    fecha TIMESTAMP DEFAULT NOW(),
    vendedor VARCHAR(100),
    cliente VARCHAR(255),
    metodo_pago VARCHAR(20),
    subtotal DECIMAL(10,2),
    impuestos DECIMAL(10,2),
    descuentos DECIMAL(10,2),
    total DECIMAL(10,2),
    estado VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE
);

-- Stock
CREATE TABLE api_stock (
    producto_id INTEGER PRIMARY KEY REFERENCES api_producto(id),
    cantidad_actual INTEGER DEFAULT 0,
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);
```

### Relaciones Principales

```
Producto ──┬─→ Categoria
           ├─→ Stock (1:1)
           ├─→ DetalleVenta (1:N)
           └─→ MovimientoInventario (1:N)

Cliente ──→ ProductosFrecuentes (1:N)

Venta ────→ DetalleVenta (1:N)

Cargue ───→ Lote (N:1)
```

---

## 🔄 FLUJOS DE DATOS

### Flujo de Cargue
```
1. Vendedor carga productos en app
2. App registra en AsyncStorage
3. App sincroniza con backend
4. Backend crea registro en CargueID*
5. Backend actualiza Stock
6. Frontend muestra confirmación
```

### Flujo de Venta
```
1. Vendedor selecciona cliente
2. Vendedor agrega productos
3. Sistema calcula total
4. Vendedor procesa pago
5. Sistema genera factura
6. Stock se actualiza automáticamente
7. Datos se sincronizan a app
```

### Flujo de Sincronización
```
1. App detecta cambios locales
2. App envía datos a backend
3. Backend valida y procesa
4. Backend responde con confirmación
5. App actualiza estado local
6. App notifica al usuario
```

---

## 🔐 Seguridad

- **Autenticación**: Token-based (JWT)
- **CORS**: Configurado para dominios permitidos
- **HTTPS**: SSL/TLS en producción
- **Validación**: Serializers DRF
- **Permisos**: Role-based access control

---

## 📊 Monitoreo y Logs

- **Backend**: Logs en `server.log`
- **Errores**: Capturados en `error_log.txt`
- **Base de datos**: Logs de PostgreSQL
- **Frontend**: Console logs en navegador

---

## 🚀 Despliegue

### Desarrollo
```bash
# Backend
python manage.py runserver

# Frontend
npm start

# Mobile
expo start
```

### Producción
```bash
# Docker
docker-compose -f docker-compose.prod.yml up

# Nginx
nginx -s reload

# Gunicorn
gunicorn backend_crm.wsgi:application
```

---

**Última actualización**: Generada automáticamente por RAG
