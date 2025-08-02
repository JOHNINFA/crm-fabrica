# 🏭 CRM-FÁBRICA - Sistema de Gestión Integral Completo

## 📋 Estado Actual del Proyecto
Sistema completo de gestión para fábrica de arepas con POS, inventario, clientes, listas de precios, reportes y sistema de cargue operativo.

**Última actualización**: Diciembre 2024
**Estado**: Funcional y operativo
**Tecnologías**: Django + React.js + SQLite

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    FRONTEND     │◄──►│    BACKEND      │◄──►│   BASE DATOS    │
│   (React.js)    │    │   (Django)      │    │  (SQLite/PG)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
    ┌────▼────┐             ┌────▼────┐             ┌────▼────┐
    │   POS   │             │   API   │             │ Tablas  │
    │Clientes │             │REST API │             │Productos│
    │Precios  │             │Endpoints│             │ Ventas  │
    │ Cargue  │             │ViewSets │             │Clientes │
    └─────────┘             └─────────┘             │ Precios │
                                                    └─────────┘
```

---

## 📁 Estructura Completa del Proyecto

```
crm-fabrica/
├── 📂 backend_crm/              # Configuración Django
│   ├── settings.py              # CORS, REST_FRAMEWORK, MEDIA_URL
│   ├── urls.py                  # include('api.urls')
│   └── wsgi.py
│
├── 📂 api/                      # API REST Backend
│   ├── 📄 models.py             # 🗃️ MODELOS COMPLETOS
│   │   ├── Categoria            # Categorías de productos
│   │   ├── Producto             # Productos con stock y precios
│   │   ├── Lote                 # Control de lotes de producción
│   │   ├── MovimientoInventario # Historial de movimientos
│   │   ├── Cliente              # Gestión de clientes
│   │   ├── Venta                # Cabecera de ventas
│   │   ├── DetalleVenta         # Detalle de productos vendidos
│   │   ├── ListaPrecio          # Listas de precios maestras
│   │   └── PrecioProducto       # Precios específicos por lista
│   │
│   ├── 📄 views.py              # 🔧 VIEWSETS COMPLETOS
│   │   ├── ProductoViewSet      # CRUD productos + filtros
│   │   ├── ClienteViewSet       # CRUD clientes + búsqueda
│   │   ├── VentaViewSet         # Procesamiento de ventas
│   │   ├── ListaPrecioViewSet   # Gestión listas de precios
│   │   └── ReporteViewSet       # Reportes y estadísticas
│   │
│   ├── 📄 serializers.py        # 🔄 SERIALIZERS COMPLETOS
│   │   ├── ProductoSerializer   # Incluye categoria_nombre
│   │   ├── ClienteSerializer    # Datos completos cliente
│   │   ├── VentaSerializer      # Con detalles anidados
│   │   └── ListaPrecioSerializer # Con precios de productos
│   │
│   └── 📄 urls.py               # 🛣️ RUTAS API COMPLETAS
│       ├── /api/productos/      # CRUD productos
│       ├── /api/clientes/       # CRUD clientes
│       ├── /api/ventas/         # Procesamiento ventas
│       ├── /api/listas-precios/ # Gestión precios
│       └── /api/reportes/       # Informes y estadísticas
│
├── 📂 frontend/                 # Interfaz React Completa
│   ├── 📂 src/
│   │   ├── 📂 components/       # COMPONENTES ORGANIZADOS
│   │   │   │
│   │   │   ├── 📂 Pos/          # 🛒 SISTEMA POS COMPLETO
│   │   │   │   ├── ProductList.jsx      # Lista productos con precios dinámicos
│   │   │   │   ├── ProductCard.jsx      # Tarjeta producto + agregar carrito
│   │   │   │   ├── Cart.jsx             # Carrito con cálculos automáticos
│   │   │   │   ├── ConsumerForm.jsx     # Autocompletado clientes + lista precios
│   │   │   │   └── SalesSummary.jsx     # Resumen y procesamiento venta
│   │   │   │
│   │   │   ├── 📂 Clientes/     # 👥 GESTIÓN CLIENTES COMPLETA
│   │   │   │   ├── ClientesList.jsx     # Tabla con búsqueda y filtros
│   │   │   │   ├── ClienteForm.jsx      # Formulario CRUD completo
│   │   │   │   ├── ClienteTabs.jsx      # Pestañas información cliente
│   │   │   │   └── ClienteModal.jsx     # Modal detalles cliente
│   │   │   │
│   │   │   ├── 📂 Inventario/   # 📦 CONTROL INVENTARIO
│   │   │   │   ├── InventarioProduccion.jsx # Registro producción
│   │   │   │   ├── TablaKardex.jsx          # Historial movimientos
│   │   │   │   └── TablaInventario.jsx      # Control existencias
│   │   │   │
│   │   │   ├── 📂 Reportes/     # 📊 SISTEMA REPORTES
│   │   │   │   ├── VentasReport.jsx     # Informe ventas con filtros
│   │   │   │   ├── VentaModal.jsx       # Modal detalle venta
│   │   │   │   └── ReportFilters.jsx    # Filtros fecha y cliente
│   │   │   │
│   │   │   ├── 📂 ListaPrecios/ # 💰 GESTIÓN PRECIOS COMPLETA
│   │   │   │   ├── CrearListaPrecios.jsx    # Formulario creación
│   │   │   │   ├── EditarListaPrecios.jsx   # Formulario edición
│   │   │   │   ├── MaestroListaPrecios.jsx  # Tabla maestro
│   │   │   │   ├── InformeAjustes.jsx       # Reporte ajustes
│   │   │   │   └── ProductoPrecioForm.jsx   # Asignación precios
│   │   │   │
│   │   │   └── 📂 Cargue/       # 📋 SISTEMA CARGUE OPERATIVO
│   │   │       ├── PlantillaOperativa.jsx   # Interfaz principal cargue
│   │   │       ├── TablaProductos.jsx       # Tabla productos editables
│   │   │       ├── ResumenVentas.jsx        # Resumen formas pago
│   │   │       ├── BotonLimpiar.jsx         # Reset datos con confirmación
│   │   │       └── MenuSheets.jsx           # Selector días/vendedores
│   │   │
│   │   ├── 📂 context/          # 🌐 ESTADOS GLOBALES
│   │   │   ├── ProductContext.jsx       # Estado productos global
│   │   │   └── 📂 product/              # Módulos contexto
│   │   │       ├── 📂 hooks/            # useProductOperations, useSync
│   │   │       ├── 📂 services/         # Sincronización automática
│   │   │       └── 📂 utils/            # Utilidades y helpers
│   │   │
│   │   ├── 📂 services/         # 🔗 SERVICIOS API COMPLETOS
│   │   │   ├── api.js                   # Servicios base productos
│   │   │   ├── clienteService.js        # CRUD clientes
│   │   │   ├── ventaService.js          # Procesamiento ventas
│   │   │   ├── listaPrecioService.js    # Gestión listas precios
│   │   │   ├── reporteService.js        # Servicios reportes
│   │   │   ├── syncService.js           # Sincronización datos
│   │   │   └── loteService.js           # Gestión lotes
│   │   │
│   │   ├── 📂 pages/            # 📄 PÁGINAS PRINCIPALES
│   │   │   ├── MainMenu.jsx             # Menú principal navegación
│   │   │   ├── PosScreen.jsx            # Pantalla POS completa
│   │   │   ├── InventarioScreen.jsx     # Pantalla inventario
│   │   │   ├── ClientesScreen.jsx       # Pantalla gestión clientes
│   │   │   ├── ReportesScreen.jsx       # Pantalla reportes ventas
│   │   │   ├── MaestroListaPreciosScreen.jsx # Maestro listas precios
│   │   │   ├── CrearListaPreciosScreen.jsx   # Crear lista precios
│   │   │   ├── EditarListaPreciosScreen.jsx  # Editar lista precios
│   │   │   ├── InformeAjustesScreen.jsx      # Informe ajustes precios
│   │   │   └── SelectorDia.jsx               # Selector días cargue
│   │   │
│   │   └── 📂 styles/           # 🎨 ESTILOS PERSONALIZADOS
│   │       ├── App.css                  # Estilos globales
│   │       ├── PosScreen.css            # Estilos POS
│   │       ├── ClientesScreen.css       # Estilos clientes
│   │       ├── MaestroListaPreciosScreen.css # Estilos precios
│   │       └── PlantillaOperativa.css   # Estilos cargue
│   │
│   └── 📂 public/               # Archivos estáticos
│       └── 📂 images/           # Imágenes productos
│
└── 📂 media/                    # Archivos Django
    └── 📂 productos/            # Imágenes subidas
```

---

## 🗃️ Modelo de Datos Completo

### Tablas Principales

```sql
-- PRODUCTOS Y CATEGORÍAS
CREATE TABLE api_categoria (
    id INTEGER PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE api_producto (
    id INTEGER PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock_total INTEGER DEFAULT 0,
    categoria_id INTEGER REFERENCES api_categoria(id),
    imagen VARCHAR(200),
    activo BOOLEAN DEFAULT TRUE
);

-- CONTROL DE LOTES
CREATE TABLE api_lote (
    id INTEGER PRIMARY KEY,
    lote VARCHAR(100) NOT NULL,
    fecha_produccion DATE NOT NULL,
    usuario VARCHAR(100) NOT NULL
);

-- MOVIMIENTOS DE INVENTARIO
CREATE TABLE api_movimientoinventario (
    id INTEGER PRIMARY KEY,
    producto_id INTEGER REFERENCES api_producto(id),
    lote_id INTEGER REFERENCES api_lote(id),
    tipo_movimiento VARCHAR(20) NOT NULL, -- 'entrada', 'salida'
    cantidad INTEGER NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT
);

-- GESTIÓN DE CLIENTES
CREATE TABLE api_cliente (
    id INTEGER PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(254),
    direccion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- SISTEMA DE VENTAS
CREATE TABLE api_venta (
    id INTEGER PRIMARY KEY,
    cliente_id INTEGER REFERENCES api_cliente(id),
    lista_precio_id INTEGER REFERENCES api_listaprecio(id),
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL,
    observaciones TEXT
);

CREATE TABLE api_detalleventa (
    id INTEGER PRIMARY KEY,
    venta_id INTEGER REFERENCES api_venta(id),
    producto_id INTEGER REFERENCES api_producto(id),
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- SISTEMA DE PRECIOS
CREATE TABLE api_listaprecio (
    id INTEGER PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    sucursal VARCHAR(100) DEFAULT 'Principal',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE api_precioproducto (
    id INTEGER PRIMARY KEY,
    lista_precio_id INTEGER REFERENCES api_listaprecio(id),
    producto_id INTEGER REFERENCES api_producto(id),
    precio DECIMAL(10,2) NOT NULL,
    UNIQUE(lista_precio_id, producto_id)
);
```

---

## 🔄 Flujos de Datos Implementados

### 1. 🛒 Flujo POS (Punto de Venta)
```
1. Usuario selecciona lista de precios → Se cargan precios específicos
2. Usuario busca/selecciona cliente → Autocompletado con BD
3. Usuario agrega productos → Carrito con precios dinámicos
4. Usuario procesa venta → Se crea Venta + DetalleVenta + MovimientoInventario
5. Stock se actualiza automáticamente → Sincronización en tiempo real
```

### 2. 👥 Flujo Gestión Clientes
```
1. Usuario accede a clientes → Lista con búsqueda y filtros
2. Usuario crea/edita cliente → Formulario con validaciones
3. Usuario ve detalles → Modal con pestañas de información
4. Datos se sincronizan → Disponibles inmediatamente en POS
```

### 3. 💰 Flujo Lista de Precios
```
1. Usuario crea lista → Formulario con tipo y sucursal
2. Usuario asigna precios → Productos con precios específicos
3. Lista se activa → Disponible en selector POS
4. Precios se aplican → Dinámicamente en carrito
```

### 4. 📊 Flujo Reportes
```
1. Usuario selecciona filtros → Fecha, cliente, etc.
2. Sistema consulta BD → Ventas con detalles
3. Usuario ve resumen → Totales y estadísticas
4. Usuario ve detalles → Modal con productos vendidos
```

### 5. 📋 Flujo Cargue Operativo
```
1. Usuario selecciona día → Navegación a plantilla
2. Usuario selecciona vendedor → ID único con nombre editable
3. Usuario carga productos → Conectado con productos reales POS
4. Sistema calcula totales → Automático con formas de pago
```

---

## 🚀 Funcionalidades Implementadas

### ✅ POS (Punto de Venta) - COMPLETO
- **Catálogo de productos**: Lista con imágenes y precios base
- **Carrito inteligente**: Cálculos automáticos con precios dinámicos
- **Gestión de clientes**: Autocompletado y selección visual
- **Listas de precios**: Selector conectado con BD, precios dinámicos
- **Procesamiento de ventas**: Creación automática de registros
- **Control de stock**: Descuento automático al vender
- **Navegación SPA**: useNavigate en lugar de window.location

### ✅ Gestión de Clientes - COMPLETO
- **CRUD completo**: Crear, leer, actualizar, eliminar
- **Búsqueda avanzada**: Por nombre, teléfono, email
- **Interfaz con pestañas**: Información organizada
- **Modal de detalles**: Vista completa del cliente
- **Integración POS**: Autocompletado en punto de venta
- **Validaciones**: Formularios con validación de datos

### ✅ Sistema de Precios - COMPLETO
- **Listas maestras**: Creación y gestión de listas
- **Precios por producto**: Asignación específica por lista
- **Tipos de lista**: Diferentes categorías de precios
- **Estado activo/inactivo**: Control de disponibilidad
- **Integración POS**: Precios dinámicos según lista seleccionada
- **Informes de ajustes**: Reporte de cambios de precios

### ✅ Reportes de Ventas - COMPLETO
- **Filtros avanzados**: Por fecha, cliente, producto
- **Datos reales**: Conectado con BD de ventas
- **Modal de detalles**: Vista completa de cada venta
- **Totales automáticos**: Cálculos dinámicos
- **Exportación**: Preparado para CSV/Excel

### ✅ Sistema de Cargue - COMPLETO
- **Plantilla operativa**: Interfaz conectada con productos reales
- **Vendedores únicos**: Cada ID representa un vendedor con nombre editable
- **Cálculos automáticos**: Totales, descuentos, devoluciones
- **Formas de pago**: Efectivo, tarjeta, transferencia
- **Navegación integrada**: Selector de días y vendedores
- **Diseño responsive**: Adaptado a diferentes pantallas

### ✅ Inventario y Kardex - FUNCIONAL
- **Control de stock**: Actualización automática
- **Historial de movimientos**: Registro completo
- **Producción diaria**: Registro de lotes
- **Sincronización**: Entre POS e inventario

---

## 🎨 Diseño y UX Implementado

### Colores Corporativos
- **Primario**: `#002149` (Azul corporativo)
- **Secundario**: `#337AB7` (Azul autocompletado)
- **Éxito**: `#28a745` (Verde confirmación)
- **Peligro**: `#dc3545` (Rojo eliminación)

### Patrones de Diseño
- **Navegación consistente**: Botones "Regresar" y "Inicio"
- **Autocompletado visual**: Fondo azul con texto blanco
- **Pestañas activas**: Color corporativo #002149
- **Botones de acción**: Colores consistentes en toda la app
- **Cards y modales**: Bootstrap con personalización
- **Responsive design**: Adaptado a móvil y desktop

---

## 🔧 Configuración Técnica

### Backend Django
```python
# settings.py - Configuración clave
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'rest_framework',
    'corsheaders',
    'api',
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ]
}

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

### Frontend React
```json
// package.json - Dependencias principales
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "bootstrap": "^5.x",
    "react-bootstrap": "^2.x",
    "uuid": "^9.x"
  }
}
```

### Estructura de Contexto
```javascript
// ProductContext.jsx - Estado global
const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Hooks personalizados
    const productOperations = useProductOperations();
    const syncService = useSyncService();
    
    return (
        <ProductContext.Provider value={{
            products, setProducts, loading,
            ...productOperations, ...syncService
        }}>
            {children}
        </ProductContext.Provider>
    );
};
```

---

## 🛠️ Servicios API Implementados

### Servicios Principales
```javascript
// api.js - Productos
export const productoService = {
    getAll: () => fetch('/api/productos/').then(r => r.json()),
    create: (data) => fetch('/api/productos/', {method: 'POST', body: data}),
    update: (id, data) => fetch(`/api/productos/${id}/`, {method: 'PUT', body: data}),
    delete: (id) => fetch(`/api/productos/${id}/`, {method: 'DELETE'})
};

// clienteService.js - Clientes
export const clienteService = {
    getAll: (params) => fetch(`/api/clientes/?${new URLSearchParams(params)}`),
    search: (query) => fetch(`/api/clientes/?search=${query}`),
    create: (data) => fetch('/api/clientes/', {method: 'POST', ...}),
    // ... más métodos
};

// listaPrecioService.js - Precios
export const listaPrecioService = {
    getAll: (filters) => fetch(`/api/listas-precios/?${new URLSearchParams(filters)}`),
    getPreciosProducto: (listaId) => fetch(`/api/precios-producto/?lista_precio=${listaId}`),
    // ... más métodos
};
```

---

## 🚀 Cómo Ejecutar el Proyecto

### 1. Backend Django
```bash
cd backend_crm
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
pip install django djangorestframework django-cors-headers pillow
python manage.py migrate
python manage.py runserver
# Servidor: http://localhost:8000
```

### 2. Frontend React
```bash
cd frontend
npm install
npm start
# Aplicación: http://localhost:3000
```

### 3. Datos de Prueba
```bash
# Crear superusuario Django
python manage.py createsuperuser

# Acceder a admin
http://localhost:8000/admin

# Crear categorías y productos de prueba
# Crear clientes de prueba
# Crear listas de precios de prueba
```

---

## 🔍 Puntos Clave para Desarrolladores

### Arquitectura de Componentes
- **Separación de responsabilidades**: Cada componente tiene una función específica
- **Reutilización**: Componentes modulares y reutilizables
- **Estado global**: Context API para datos compartidos
- **Hooks personalizados**: Lógica reutilizable encapsulada

### Patrones Implementados
- **Service Layer**: Servicios para comunicación con API
- **Context Pattern**: Estado global con React Context
- **Custom Hooks**: Lógica de negocio reutilizable
- **Component Composition**: Componentes compuestos y modulares

### Sincronización de Datos
- **Tiempo real**: Actualizaciones automáticas entre módulos
- **LocalStorage**: Respaldo local de datos críticos
- **Error handling**: Manejo de errores en servicios
- **Loading states**: Estados de carga en componentes

### Navegación SPA
- **React Router**: Navegación sin recarga de página
- **useNavigate**: Hook para navegación programática
- **Rutas protegidas**: Preparado para autenticación
- **Breadcrumbs**: Navegación contextual implementada

---

## 🐛 Problemas Resueltos

### 1. Doble Descuento de Stock
**Problema**: Al procesar venta se descontaba stock dos veces
**Solución**: Eliminar descuento manual, solo MovimientoInventario automático

### 2. Precios No Dinámicos
**Problema**: Carrito mostraba precio base en lugar de precio de lista
**Solución**: Pasar precio específico al agregar producto al carrito

### 3. Navegación con Recarga
**Problema**: window.location.href recargaba toda la página
**Solución**: Migrar a useNavigate para navegación SPA

### 4. Autocompletado Sin Estilo
**Problema**: Sugerencias de clientes sin diseño visual
**Solución**: Fondo azul #337AB7 con texto blanco para sugerencias

---

## 📈 Próximas Funcionalidades Sugeridas

### Corto Plazo
- [ ] **Autenticación**: Login y roles de usuario
- [ ] **Backup automático**: Respaldo programado de BD
- [ ] **Notificaciones**: Alertas de stock bajo
- [ ] **Impresión**: Tickets de venta y reportes

### Mediano Plazo
- [ ] **Dashboard**: Métricas y KPIs visuales
- [ ] **Proveedores**: Gestión de proveedores
- [ ] **Compras**: Módulo de compras y costos
- [ ] **Contabilidad**: Integración contable básica

### Largo Plazo
- [ ] **Multi-sucursal**: Soporte para múltiples ubicaciones
- [ ] **App móvil**: Versión móvil nativa
- [ ] **Integración externa**: APIs de terceros
- [ ] **BI avanzado**: Reportes y análisis avanzados

---

## 📞 Información Técnica para IA

### Contexto de Desarrollo
- **Patrón de trabajo**: Desarrollo incremental con funcionalidades completas
- **Estilo de código**: Componentes funcionales con hooks
- **Gestión de estado**: Context API + useState/useEffect
- **Comunicación API**: Fetch API con async/await
- **Estilos**: Bootstrap + CSS personalizado
- **Navegación**: React Router v6 con useNavigate

### Convenciones de Código
- **Nombres de archivos**: PascalCase para componentes, camelCase para servicios
- **Estructura de carpetas**: Organización por funcionalidad
- **Imports**: Relativos para componentes locales, absolutos para servicios
- **Estados**: useState para local, Context para global
- **Servicios**: Funciones async que retornan promesas

### Datos de Prueba Recomendados
```javascript
// Categorías
["Arepas", "Bebidas", "Acompañamientos", "Postres"]

// Productos ejemplo
[
    {nombre: "Arepa de Queso", precio: 2500, categoria: "Arepas"},
    {nombre: "Arepa Mixta", precio: 3500, categoria: "Arepas"},
    {nombre: "Coca Cola", precio: 2000, categoria: "Bebidas"}
]

// Clientes ejemplo
[
    {nombre: "CONSUMIDOR FINAL", telefono: "", email: ""},
    {nombre: "Juan Pérez", telefono: "3001234567", email: "juan@email.com"},
    {nombre: "María García", telefono: "3007654321", email: "maria@email.com"}
]

// Listas de precios
[
    {nombre: "CLIENTES", tipo: "Precio Normal"},
    {nombre: "MAYORISTAS", tipo: "Precio Mayorista"},
    {nombre: "EMPLEADOS", tipo: "Precio Empleado"}
]
```

---

## 🎯 Resumen Ejecutivo

**CRM-FÁBRICA** es un sistema completo y funcional para gestión de fábrica de arepas que incluye:

✅ **POS completo** con carrito inteligente y precios dinámicos
✅ **Gestión de clientes** con autocompletado y CRUD completo  
✅ **Sistema de precios** con listas maestras y asignación por producto
✅ **Reportes de ventas** con filtros avanzados y datos reales
✅ **Sistema de cargue** operativo conectado con productos reales
✅ **Control de inventario** con sincronización automática
✅ **Diseño consistente** con colores corporativos y UX optimizada

El proyecto está **listo para producción** con arquitectura escalable, código limpio y documentación completa. Ideal para continuar desarrollo con cualquier IA o equipo de desarrollo.

---

**Fecha de documentación**: Diciembre 2024  
**Versión del sistema**: 1.0 Completo  
**Estado**: Funcional y operativo  
**Próximo paso sugerido**: Implementar autenticación y roles de usuario