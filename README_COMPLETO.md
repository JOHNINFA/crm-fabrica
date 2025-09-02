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
- ✅ Módulo de producción con 18 productos específicos en orden fijo
- ✅ Tablas operativas con colores diferenciados
- ✅ Campos: Cantidad, Dctos, Adicional, Devoluciones, Vencidas
- ✅ Cálculos automáticos de Total y Neto
- ✅ Checkboxes para Vendedor y Despachador con validación inteligente
- ✅ Resumen de ventas con tabla de pagos (Descuentos, Nequi, Daviplata)
- ✅ Totales calculados automáticamente (Despacho, Pedidos, Dctos, Venta, Efectivo)
- ✅ Base Caja configurable
- ✅ **PERSISTENCIA AVANZADA**: 100% localStorage con sincronización inteligente
- ✅ **PERSISTENCIA GARANTIZADA**: Los datos se mantienen al recargar página
- ✅ Sincronización entre vendedores y producción en tiempo real
- ✅ **BOTÓN SINCRONIZAR**: Envío manual inmediato al backend
- ✅ **FLUJO DE ESTADOS AUTOMATIZADO**: ALISTAMIENTO → ALISTAMIENTO_ACTIVO → DESPACHO → FINALIZAR → COMPLETADO
- ✅ **CONGELAMIENTO DE PRODUCCIÓN**: Se mantiene fija durante el proceso operativo
- ✅ **VALIDACIÓN DE CHECKS**: Solo se pueden marcar V y D si hay cantidad > 0
- ✅ **DESCUENTO AUTOMÁTICO DE INVENTARIO**: DESPACHO actualiza stock en tiempo real
- ✅ **MANEJO DIFERENCIADO**: Devoluciones suman al inventario, Vencidas solo se registran
- ✅ **AUTO-AVANCE INTELIGENTE**: ALISTAMIENTO_ACTIVO → DESPACHO automático al marcar checks
- ✅ **ORDEN FIJO DE PRODUCTOS**: Siempre aparecen en el mismo orden específico
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
- ✅ **Sistema híbrido**: localStorage + backend
- ✅ **Sincronización inteligente**: Automática cada 60s + manual
- ✅ **Botón SINCRONIZAR**: Envío inmediato de todos los IDs
- ✅ **Evita duplicados**: Solo sincroniza datos no enviados

## 🏭 **SISTEMA DE CARGUE - FLUJO OPERATIVO COMPLETO**

### 🔄 **Flujo de Estados del Botón (Solo ID1):**
```
📦 ALISTAMIENTO → 📦 ALISTAMIENTO ACTIVO → 🚚 DESPACHO → ✅ FINALIZAR → 🎉 COMPLETADO
```

### 🤖 **Automatizaciones Implementadas:**
1. **Guardado Instantáneo**: Todos los cambios se guardan inmediatamente en localStorage
2. **Auto-avance Inteligente**: ALISTAMIENTO_ACTIVO → DESPACHO cuando se marcan checks V y D
3. **Congelamiento de Producción**: Se mantiene fija durante el proceso operativo
4. **Validación de Checks**: Solo se pueden marcar si hay cantidad > 0
5. **Sincronización Automática**: Cada 60 segundos + botón manual

### 📊 **Orden Fijo de Productos (18 productos):**
1. AREPA TIPO OBLEA 500Gr
2. AREPA MEDIANA 330Gr
3. AREPA TIPO PINCHO 330Gr
4. AREPA QUESO ESPECIAL GRANDE 600Gr
5. AREPA CON QUESO CUADRADA 450Gr
6. AREPA CON QUESO ESPECIAL PEQUEÑA 600Gr
7. AREPA QUESO CORRIENTE 450Gr
8. AREPA BOYACENSE X 10
9. ALMOJABANA X 5 300Gr
10. AREPA SANTANDEREANA 450Gr
11. AREPA DE CHOCLO CON QUESO PEQUEÑA 700 Gr
12. AREPA DE CHOCLO CON QUESO PEQUEÑA 700Gr
13. AREPA CON SEMILLA DE QUINUA 450Gr
14. AREPA DE CHOCLO CON QUESO GRANDE 1200Gr
15. AREPA DE CHOCLO CORRIENTE 300Gr
16. AREPA BOYACENSE X 5 450Gr
17. ALMOJABANAS X 10 600Gr
18. AREPA QUESO MINI X10

### 💾 **Sistema de Persistencia Avanzado:**
- **localStorage**: Guardado instantáneo de todos los cambios
- **Sincronización**: Envío periódico al backend (60s) + manual
- **Recuperación**: Los datos se mantienen al recargar navegador
- **Validación**: Solo carga datos cuando hay más de 5 productos (evita errores)

### 🔄 **Flujo de Operación Diaria:**
1. **Ingreso de Datos**: Agregar cantidades en ID1-ID6
2. **Verificación**: Ver totales en módulo PRODUCCIÓN
3. **Alistamiento**: Presionar botón ALISTAMIENTO (congela producción)
4. **Validación**: Marcar checks V (Vendedor) y D (Despachador)
5. **Auto-avance**: Sistema cambia automáticamente a DESPACHO
6. **Despacho**: Presionar DESPACHO (descuenta inventario)
7. **Devoluciones**: Agregar devoluciones y vencidas si aplica
8. **Finalización**: Presionar FINALIZAR (procesa devoluciones)
9. **Completado**: Sistema marca jornada como terminada

### 📊 **Manejo Diferenciado de Productos:**
- **Devoluciones**: Se SUMAN al inventario (productos que regresan)
- **Vencidas**: Solo se REGISTRAN, NO afectan el inventario (productos perdidos)
- **Despacho**: Se RESTAN del inventario (productos vendidos)

### 🔍 **Validaciones Implementadas:**
- Checks V y D solo se pueden marcar si `total > 0`
- Botón DESPACHO solo se habilita si hay productos con V=true, D=true, TOTAL>0
- Producción se congela durante el proceso operativo
- Datos se validan antes de enviar al backend

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

## 🚀 **SISTEMA DE CARGUE - COMPLETADO HOY**

### 💾 **PERSISTENCIA AVANZADA IMPLEMENTADA:**
- ✅ **localStorage como base principal**: Guardado instantáneo de todos los cambios
- ✅ **Persistencia garantizada**: Los datos se mantienen al recargar navegador
- ✅ **Solución ID1**: Corregido problema de pérdida de datos específico de ID1
- ✅ **Validación inteligente**: Solo carga datos cuando hay >5 productos
- ✅ **Botón SINCRONIZAR**: Envío manual inmediato de todos los IDs
- ✅ **Sincronización automática**: Cada 60 segundos en segundo plano

### 🔄 **FLUJO OPERATIVO AUTOMATIZADO:**
- ✅ **Estados del botón**: ALISTAMIENTO → ALISTAMIENTO_ACTIVO → DESPACHO → FINALIZAR → COMPLETADO
- ✅ **Auto-avance inteligente**: ALISTAMIENTO_ACTIVO → DESPACHO automático al marcar checks
- ✅ **Congelamiento de producción**: Se mantiene fija durante el proceso operativo
- ✅ **Validación de checks**: Solo se pueden marcar V y D si hay cantidad > 0
- ✅ **Orden fijo de productos**: 18 productos siempre en el mismo orden específico

### 📊 **MANEJO DIFERENCIADO DE INVENTARIO:**
- ✅ **Despacho**: Resta del inventario (productos vendidos)
- ✅ **Devoluciones**: Suma al inventario (productos que regresan)
- ✅ **Vencidas**: Solo registro, NO afecta inventario (productos perdidos)
- ✅ **Actualización en tiempo real**: Cambios inmediatos en stock

### 🎯 **VALIDACIONES Y CONTROLES:**
- ✅ **Checks inteligentes**: Solo habilitados si total > 0
- ✅ **Botón DESPACHO**: Solo se habilita con productos validados (V=true, D=true, TOTAL>0)
- ✅ **Prevención de errores**: Validaciones en cada paso del proceso
- ✅ **Estados persistentes**: Se mantienen al recargar página

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