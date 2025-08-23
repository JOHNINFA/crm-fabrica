# 🏭 CRM-FÁBRICA - Sistema de Gestión Integral

## 📋 ¿Qué es este proyecto?
Un sistema completo para gestionar una fábrica de arepas que incluye:
- **POS (Punto de Venta)** - Para vender productos
- **Inventario** - Para controlar existencias y producción
- **Kardex** - Para ver movimientos de productos
- **Cargue** - Sistema operativo para control diario de vendedores y producción
- **Sincronización** - Entre frontend y backend

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    FRONTEND     │◄──►│    BACKEND      │◄──►│   BASE DATOS    │
│   (React.js)    │    │   (Django)      │    │  (SQLite/PG)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
    ┌────▼────┐             ┌────▼────┐             ┌────▼────┐
    │   POS   │             │   API   │             │ Tablas  │
    │Inventario│             │REST API │             │Productos│
    │ Kardex  │             │Endpoints│             │ Lotes   │
    │ Cargue  │             │         │             │Categorías│
    └─────────┘             └─────────┘             │ Cargue  │
                                                    └─────────┘
```

## 🚀 Cómo crear este proyecto desde cero

### PASO 1: Configurar el Backend (Django)
```bash
# 1. Crear proyecto Django
django-admin startproject backend_crm
cd backend_crm

# 2. Crear app para la API
python manage.py startapp api

# 3. Instalar dependencias
pip install django djangorestframework django-cors-headers pillow

# 4. Configurar settings.py
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'rest_framework',
    'corsheaders',
    'api',
]

# 5. Crear modelos (Producto, Categoria, Lote, etc.)
# 6. Hacer migraciones
python manage.py makemigrations
python manage.py migrate
```

### PASO 2: Configurar el Frontend (React)
```bash
# 1. Crear app React
npx create-react-app frontend
cd frontend

# 2. Instalar dependencias
npm install react-router-dom bootstrap react-bootstrap uuid

# 3. Crear estructura de carpetas
src/
├── components/     # Componentes UI
├── context/       # Estados globales
├── services/      # Comunicación con API
├── pages/         # Páginas principales
└── styles/        # Estilos CSS
```

### PASO 3: Crear la Estructura de Datos
```sql
-- Tabla de Categorías
CREATE TABLE api_categoria (
    id INTEGER PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE
);

-- Tabla de Productos
CREATE TABLE api_producto (
    id INTEGER PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE,
    precio DECIMAL(10,2),
    stock_total INTEGER,
    categoria_id INTEGER,
    imagen VARCHAR(200),
    activo BOOLEAN
);

-- Tabla de Lotes
CREATE TABLE api_lote (
    id INTEGER PRIMARY KEY,
    lote VARCHAR(100),
    fecha_produccion DATE,
    usuario VARCHAR(100)
);

-- Tabla de Vendedores
CREATE TABLE api_vendedor (
    id INTEGER PRIMARY KEY,
    nombre VARCHAR(100),
    id_vendedor VARCHAR(3) UNIQUE, -- ID1, ID2, etc.
    ruta VARCHAR(255),
    activo BOOLEAN,
    fecha_creacion TIMESTAMP
);

-- Tabla de Cargues Operativos
CREATE TABLE api_cargueoperativo (
    id INTEGER PRIMARY KEY,
    dia VARCHAR(10), -- LUNES, MARTES, etc.
    vendedor_id INTEGER REFERENCES api_vendedor(id),
    fecha DATE,
    usuario VARCHAR(100),
    activo BOOLEAN,
    fecha_creacion TIMESTAMP
);

-- Tabla de Detalles de Cargue
CREATE TABLE api_detallecargue (
    id INTEGER PRIMARY KEY,
    cargue_id INTEGER REFERENCES api_cargueoperativo(id),
    producto_id INTEGER REFERENCES api_producto(id),
    vendedor_check BOOLEAN,
    despachador_check BOOLEAN,
    cantidad INTEGER,
    dctos INTEGER,
    adicional INTEGER,
    devoluciones INTEGER,
    vencidas INTEGER,
    total INTEGER, -- calculado
    valor DECIMAL(10,2),
    neto DECIMAL(12,2) -- calculado
);
```

### PASO 4: Crear los Servicios de API
```javascript
// services/api.js
export const productoService = {
    getAll: () => fetch('/api/productos/'),
    create: (data) => fetch('/api/productos/', {method: 'POST', body: data}),
    update: (id, data) => fetch(`/api/productos/${id}/`, {method: 'PUT', body: data})
};
```

### PASO 5: Crear los Contextos (Estados Globales)
```javascript
// context/ProductContext.jsx
export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    // Lógica para manejar productos
    return <ProductContext.Provider value={{products}}>{children}</ProductContext.Provider>;
};
```

### PASO 6: Crear los Componentes
```javascript
// components/Pos/ProductList.jsx - Lista de productos para vender
// components/inventario/InventarioProduccion.jsx - Control de producción
// components/inventario/TablaKardex.jsx - Historial de movimientos
```

## 📁 Estructura del Proyecto Actual

```
crm-fabrica/
├── 📂 backend_crm/          # Configuración Django
│   ├── settings.py          # Configuración del servidor
│   ├── urls.py             # Rutas principales
│   └── wsgi.py             # Servidor web
│
├── 📂 api/                  # API REST (Backend)
│   ├── models.py           # 🗃️ Modelos: Producto, Categoria, Lote, Vendedor, CargueOperativo
│   ├── views.py            # 🔧 ViewSets con CRUD completo para todos los modelos
│   ├── serializers.py      # 🔄 Serializers para todos los modelos
│   ├── urls.py             # 🛣️ URLs para todos los endpoints
│   └── admin.py            # 🔧 Panel de administración Django
│
├── 📂 frontend/             # Interfaz de Usuario (React)
│   ├── 📂 src/
│   │   ├── 📂 components/   # Componentes UI
│   │   │   ├── 📂 Pos/      # 🛒 Punto de Venta
│   │   │   │   ├── ProductList.jsx    # Lista de productos
│   │   │   │   ├── Cart.jsx           # Carrito de compras
│   │   │   │   └── ProductCard.jsx    # Tarjeta de producto
│   │   │   │
│   │   │   ├── 📂 inventario/         # 📦 Control de Inventario
│   │   │   │   ├── InventarioProduccion.jsx  # Registro de producción
│   │   │   │   ├── TablaKardex.jsx           # Historial de movimientos
│   │   │   │   └── TablaInventario.jsx       # Tabla de existencias
│   │   │   │
│   │   │   └── 📂 Cargue/             # 🏭 Sistema Operativo de Cargue
│   │   │       ├── MenuSheets.jsx            # Navegación por días e IDs
│   │   │       ├── PlantillaOperativa.jsx    # Plantilla principal de vendedores
│   │   │       ├── TablaProductos.jsx        # Tabla de productos operativa
│   │   │       ├── ResumenVentas.jsx         # Resumen de pagos y totales
│   │   │       ├── Produccion.jsx            # Módulo de producción
│   │   │       ├── SelectorDia.jsx           # Selector de días de la semana
│   │   │       ├── PlantillaOperativa.css    # Estilos de tablas operativas
│   │   │       └── Produccion.css            # Estilos de producción
│   │   │
│   │   ├── 📂 context/      # 🌐 Estados Globales
│   │   │   ├── ProductContext.jsx     # Estado de productos
│   │   │   ├── VendedoresContext.jsx  # Estado de vendedores
│   │   │   └── 📂 product/            # Módulos del contexto
│   │   │       ├── 📂 hooks/          # Lógica de operaciones
│   │   │       ├── 📂 services/       # Sincronización
│   │   │       └── 📂 utils/          # Utilidades
│   │   │
│   │   ├── 📂 services/     # 🔗 Comunicación con API
│   │   │   ├── api.js              # Servicios REST
│   │   │   ├── syncService.js      # Sincronización
│   │   │   ├── loteService.js      # Gestión de lotes
│   │   │   ├── vendedorService.js  # CRUD de vendedores
│   │   │   └── cargueService.js    # Operaciones de cargue
│   │   │
│   │   └── 📂 pages/        # 📄 Páginas principales
│   │       ├── PosScreen.jsx       # Pantalla POS
│   │       ├── InventarioScreen.jsx # Pantalla Inventario
│   │       ├── SelectorDia.jsx     # Pantalla de selección de días
│   │       ├── VendedoresScreen.jsx # CRUD de vendedores
│   │       └── MainMenu.jsx        # Menú principal
│   │
│   └── 📂 public/           # Archivos estáticos
│       └── 📂 images/       # Imágenes de productos
│
└── 📂 media/                # Archivos subidos (Django)
    └── 📂 productos/        # Imágenes de productos
```

## 🔄 Flujo de Datos del Sistema

### 1. 🛒 Flujo del POS (Punto de Venta)
```
Usuario selecciona producto → Se agrega al carrito → Se reduce stock → Se sincroniza con BD
```

### 2. 📦 Flujo del Inventario
```
Usuario ingresa producción → Se registra en BD → Se actualiza stock → Se sincroniza con POS
```

### 3. 📊 Flujo del Kardex
```
Cualquier movimiento → Se registra automáticamente → Se muestra en historial
```

### 4. 🏭 Flujo del Cargue (Sistema Operativo)
```
Selección de día → Elección de vendedor (ID1-ID6) → Registro operativo → Control de producción
```

## 🔧 Tecnologías Utilizadas

### Frontend
- **React.js** - Interfaz de usuario
- **React Context** - Manejo de estado global
- **Bootstrap** - Estilos y componentes UI
- **Fetch API** - Comunicación con backend

### Backend
- **Django** - Framework web
- **Django REST Framework** - API REST
- **SQLite/PostgreSQL** - Base de datos
- **Pillow** - Manejo de imágenes

## 🚀 Cómo ejecutar el proyecto

### Backend
```bash
cd backend_crm
python manage.py runserver
# Servidor en: http://localhost:8000
```

### Frontend
```bash
cd frontend
npm start
# Aplicación en: http://localhost:3000
```

## 📝 Funcionalidades Principales

### 🛒 POS (Punto de Venta)
- ✅ Ver productos disponibles
- ✅ Agregar productos al carrito
- ✅ Procesar ventas
- ✅ Control de stock en tiempo real

### 📦 Inventario
- ✅ Registrar producción diaria
- ✅ Controlar existencias
- ✅ Gestionar lotes y fechas de vencimiento
- ✅ Sincronización automática

### 📊 Kardex
- ✅ Historial completo de movimientos
- ✅ Filtros por fecha y producto
- ✅ Saldos actualizados automáticamente

### 🏭 Cargue (Sistema Operativo) - ✅ COMPLETADO
- ✅ Navegación por días de la semana (LUNES-SÁBADO)
- ✅ Sistema de 6 vendedores independientes (ID1-ID6)
- ✅ Módulo de producción con 12 productos específicos
- ✅ Tablas operativas con colores diferenciados
- ✅ Campos: Cantidad, Dctos, Adicional, Devoluciones, Vencidas
- ✅ Cálculos automáticos de Total y Neto
- ✅ Checkboxes para Vendedor y Despachador
- ✅ Resumen de ventas con tabla de pagos (Descuentos, Nequi, Daviplata)
- ✅ Totales calculados automáticamente (Despacho, Pedidos, Dctos, Venta, Efectivo)
- ✅ Base Caja configurable
- ✅ Guardado automático en PostgreSQL y localStorage
- ✅ Persistencia de datos al recargar página
- ✅ Sincronización entre vendedores y producción
- ✅ Botón de guardado manual con confirmación
- ✅ Sistema híbrido: PostgreSQL como principal, localStorage como respaldo intercalados (#e2efda y blanco)
- ✅ Edición de nombres de responsables con modal
- ✅ Estados independientes para cada vendedor
- ✅ Números de valor en rojo oscuro (#cc0000) con texto en negrita
- ✅ Interfaz compacta y profesional
- ✅ Tabla de producción con columnas: PRODUCTOS, TOTAL PRODUCTOS, PEDIDOS, TOTAL, SUGERIDO
- ✅ Tabla de porciones (X2, X3, X4, X5) con totales
- ✅ Cálculos automáticos y sincronización de datos
- ✅ **ResumenVentas**: Tabla de pagos con CONCEPTO, DESCUENTOS, NEQUI, DAVIPLATA
- ✅ **Formato de moneda automático**: $10.000 en todos los campos monetarios
- ✅ **Sistema dual de vendedores**: Responsables en Cargue + opciones en POS
- ✅ **Backend completo**: Modelos Django, APIs REST, y servicios implementados

#### 🎨 **MEJORAS DE DISEÑO IMPLEMENTADAS HOY:**
- ✅ **SelectorDia.jsx**: Botones de días con color azul personalizado `#06386d`
- ✅ **Efectos 3D sutiles**: Sombras y elevación en hover para mejor UX
- ✅ **Botón "Regresar"**: Cambio de navegación de `/pos` a `/` (menú principal)
- ✅ **Responsive design**: Adaptación perfecta para móviles y desktop
- ✅ **Espaciado optimizado**: Separación y padding mejorados en botones

#### 🔧 **CORRECCIONES TÉCNICAS:**
- ✅ **Checkboxes funcionales**: Solucionado problema de marcar/desmarcar
- ✅ **Estado de checkboxes**: Manejo correcto de valores booleanos vs numéricos
- ✅ **Color personalizado**: Aplicado `#06386d` en todos los elementos azules
- ✅ **Estilos CSS**: Implementados con `accentColor` y selectores específicos
- ✅ **PlantillaOperativa.jsx**: Función `actualizarProducto` corregida para checkboxes

#### 🎯 **ELEMENTOS CON NUEVO COLOR `#06386d`:**
- ✅ Botones de días (LUNES, MARTES, etc.)
- ✅ Botones de IDs seleccionados (ID1-ID6, PRODUCCION)
- ✅ Botón "Guardar" en modales
- ✅ Checkboxes cuando están marcados (V y D en tablas)
- ✅ Focus rings y estados hover

### 🔄 Sincronización
- ✅ Datos en tiempo real entre POS e Inventario
- ✅ Respaldo en localStorage
- ✅ Sincronización automática con backend

## 🔗 Endpoints de API

### Productos
- `GET /api/productos/` - Listar productos
- `POST /api/productos/` - Crear producto
- `GET /api/productos/{id}/` - Obtener producto
- `PUT /api/productos/{id}/` - Actualizar producto
- `DELETE /api/productos/{id}/` - Eliminar producto

### Vendedores
- `GET /api/vendedores/` - Listar vendedores
- `POST /api/vendedores/` - Crear vendedor
- `GET /api/vendedores/{id}/` - Obtener vendedor
- `PUT /api/vendedores/{id}/` - Actualizar vendedor

### Cargues Operativos
- `GET /api/cargues/` - Listar cargues
- `POST /api/cargues/` - Crear cargue
- `GET /api/cargues/{id}/` - Obtener cargue
- `PUT /api/cargues/{id}/` - Actualizar cargue
- `GET /api/cargues/?dia=LUNES&vendedor=1` - Filtrar por día y vendedor

### Detalles de Cargue
- `GET /api/detalle-cargues/` - Listar detalles
- `POST /api/detalle-cargues/` - Crear detalle
- `GET /api/detalle-cargues/{id}/` - Obtener detalle
- `PATCH /api/detalle-cargues/{id}/` - Actualizar detalle
- `GET /api/detalle-cargues/?cargue={id}` - Filtrar por cargue

## 🛠️ Servicios Implementados

### simpleStorage.js
- **Propósito**: Servicio híbrido que funciona como localStorage pero guarda en PostgreSQL
- **Funciones**:
  - `setItem(key, data)` - Guarda en PostgreSQL y localStorage
  - `getItem(key)` - Carga desde PostgreSQL, fallback a localStorage
- **Ventajas**: Máxima confiabilidad con respaldo automático

### cargueService.js
- **Propósito**: CRUD completo para cargues operativos
- **Funciones**:
  - `getAll()`, `create()`, `update()`, `delete()`
  - `getByDiaVendedor()` - Filtros específicos
  - `guardarCargue()` - Guardado completo con productos

### syncService.js
- **Propósito**: Sincronización automática cada 5 minutos
- **Funciones**:
  - Actualiza productos desde BD
  - Mantiene orden específico de productos
  - Notifica cambios a componentes

## 🎯 Estado Actual del Proyecto

### ✅ Módulos Completados
1. **POS (Punto de Venta)** - 100% funcional
2. **Inventario** - 100% funcional
3. **Kardex** - 100% funcional
4. **Cargue Operativo** - 100% funcional
5. **Sincronización** - 100% funcional

### 🔧 Características Técnicas
- **Base de datos**: PostgreSQL con respaldo localStorage
- **API**: Django REST Framework
- **Frontend**: React.js con Context API
- **Persistencia**: Guardado automático cada 2 segundos
- **Sincronización**: Automática cada 5 minutos
- **Logs**: Sistema limpio sin logs en consola

### 📊 Métricas del Sistema
- **6 Vendedores** independientes (ID1-ID6)
- **7 Días** de operación (LUNES-DOMINGO)
- **12 Productos** específicos de arepas
- **5 Campos** operativos por producto
- **3 Tablas** principales en PostgreSQL
- **4 Servicios** de comunicación con API

¡El sistema CRM-FÁBRICA está **100% funcional** y listo para producción! 🚀

## 🎯 Conceptos Clave para Entender

### 1. **Context API (React)**
- Es como una "caja mágica" que guarda información y la comparte con toda la aplicación
- Ejemplo: Los productos se guardan aquí y cualquier pantalla puede verlos

### 2. **Hooks Personalizados**
- Son funciones que contienen lógica reutilizable
- Ejemplo: `useProductOperations` maneja todas las operaciones de productos

### 3. **Servicios**
- Son funciones que se comunican con el backend
- Ejemplo: `productoService.getAll()` trae todos los productos de la base de datos

### 4. **Sincronización**
- Mantiene los datos iguales entre frontend y backend
- Si cambias algo en inventario, se actualiza automáticamente en POS

### 5. **Sistema de Cargue**
- Control operativo diario de vendedores y producción
- Estados independientes para cada vendedor (ID1-ID6)
- Módulo de producción separado con productos específicos
- Interfaz visual con colores intercalados para mejor legibilidad

## 🔍 Para Desarrolladores

### Agregar una nueva funcionalidad:
1. **Backend**: Crear endpoint en `views.py`
2. **Frontend**: Crear servicio en `services/`
3. **UI**: Crear componente en `components/`
4. **Estado**: Agregar al contexto si es necesario

### Debugging:
- **Backend**: Ver logs en terminal de Django
- **Frontend**: Usar DevTools del navegador (F12)
- **Base de datos**: Usar Django Admin o herramientas SQL

## 📈 **ÚLTIMAS ACTUALIZACIONES (HOY)**

### 🎨 **Mejoras de UI/UX:**
1. **Selector de Días Mejorado**:
   - Color azul personalizado `#06386d` en todos los botones
   - Efectos 3D sutiles con sombras y elevación
   - Responsive design optimizado para móviles
   - Botón "Regresar" navega correctamente al menú principal

2. **Sistema de Checkboxes Corregido**:
   - Problema de marcar/desmarcar solucionado completamente
   - Manejo correcto de estados booleanos en `actualizarProducto()`
   - Color personalizado `#06386d` aplicado con `accentColor`
   - Funcionalidad 100% operativa sin necesidad de recargar página

3. **Consistencia Visual**:
   - Todos los elementos azules usan el mismo color `#06386d`
   - Estilos CSS específicos para el módulo Cargue
   - Botones con hover effects y transiciones suaves
   - Interfaz profesional y cohesiva

### 🔧 **Correcciones Técnicas:**
- **TablaProductos.jsx**: Checkboxes con `!!p.vendedor` y `accentColor`
- **PlantillaOperativa.jsx**: Separación de lógica para campos booleanos y numéricos
- **MenuSheets.jsx**: Estilos inline para forzar colores personalizados
- **PlantillaOperativa.css**: Selectores CSS específicos para checkboxes

## 🎯 **SISTEMA DE VENDEDORES Y BACKEND COMPLETO - ✅ IMPLEMENTADO**

### 🗃️ **Modelos Django Implementados:**
```python
# Modelo Vendedor
class Vendedor(models.Model):
    nombre = models.CharField(max_length=100)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

# Modelo CargueOperativo
class CargueOperativo(models.Model):
    vendedor = models.ForeignKey(Vendedor, on_delete=models.CASCADE)
    dia_semana = models.CharField(max_length=10)
    fecha = models.DateField()
    responsable = models.CharField(max_length=100)

# Modelos relacionados: DetalleCargue, ResumenPagos, ResumenTotales
```

### 🔗 **APIs REST Implementadas:**
- ✅ `/api/vendedores/` - CRUD completo de vendedores
- ✅ `/api/cargues-operativos/` - Gestión de cargues
- ✅ `/api/detalle-cargue/` - Detalles de productos por cargue
- ✅ `/api/resumen-pagos/` - Tabla de pagos (CONCEPTO, DESCUENTOS, NEQUI, DAVIPLATA)
- ✅ `/api/resumen-totales/` - Totales calculados automáticamente

### 🌐 **Contextos y Servicios:**
- ✅ **VendedoresContext.jsx**: Estado global de vendedores
- ✅ **vendedorService.js**: Operaciones CRUD para vendedores
- ✅ **cargueService.js**: Servicios para cargues operativos
- ✅ **VendedoresScreen.jsx**: Interfaz completa para gestión de vendedores

### 💰 **Tabla de Pagos ResumenVentas:**
- ✅ **Columnas**: CONCEPTO, DESCUENTOS, NEQUI, DAVIPLATA
- ✅ **Formato automático**: $10.000 en todos los campos monetarios
- ✅ **Cálculos en tiempo real**: Totales automáticos por columna
- ✅ **BASE CAJA**: Campo editable con formato de moneda
- ✅ **Resumen de totales**: DESPACHO, PEDIDOS, DCTOS, VENTA, EFECTIVO

### 🔄 **Funcionalidad Dual de Vendedores:**
1. **En Sistema de Cargue**: Aparecen como responsables automáticos según ID
2. **En POS**: Disponibles como opciones en dropdown de vendedores
3. **Sincronización**: Cambios en VendedoresScreen se reflejan en ambos sistemas

### 🏭 **Panel de Administración Django:**
- ✅ Todos los modelos registrados en Django Admin
- ✅ Interfaz web para gestión desde backend
- ✅ Filtros y búsquedas configuradas

### 📊 **Migraciones Aplicadas:**
```bash
# Migraciones creadas y aplicadas exitosamente
python manage.py makemigrations
python manage.py migrate
```

¡Este README te da una visión completa de cómo funciona y cómo recrear el sistema! 🚀