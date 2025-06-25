# 🏭 CRM-FÁBRICA - Sistema de Gestión Integral

## 📋 ¿Qué es este proyecto?
Un sistema completo para gestionar una fábrica de arepas que incluye:
- **POS (Punto de Venta)** - Para vender productos
- **Inventario** - Para controlar existencias y producción
- **Kardex** - Para ver movimientos de productos
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
    └─────────┘             └─────────┘             │Categorías│
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
│   ├── models.py           # 🗃️ Modelos de datos (Producto, Categoria, Lote)
│   ├── views.py            # 🔧 Lógica de negocio (CRUD operations)
│   ├── serializers.py      # 🔄 Conversión JSON ↔ Python
│   └── urls.py             # 🛣️ Rutas de la API
│
├── 📂 frontend/             # Interfaz de Usuario (React)
│   ├── 📂 src/
│   │   ├── 📂 components/   # Componentes UI
│   │   │   ├── 📂 Pos/      # 🛒 Punto de Venta
│   │   │   │   ├── ProductList.jsx    # Lista de productos
│   │   │   │   ├── Cart.jsx           # Carrito de compras
│   │   │   │   └── ProductCard.jsx    # Tarjeta de producto
│   │   │   │
│   │   │   └── 📂 inventario/         # 📦 Control de Inventario
│   │   │       ├── InventarioProduccion.jsx  # Registro de producción
│   │   │       ├── TablaKardex.jsx           # Historial de movimientos
│   │   │       └── TablaInventario.jsx       # Tabla de existencias
│   │   │
│   │   ├── 📂 context/      # 🌐 Estados Globales
│   │   │   ├── ProductContext.jsx     # Estado de productos
│   │   │   └── 📂 product/            # Módulos del contexto
│   │   │       ├── 📂 hooks/          # Lógica de operaciones
│   │   │       ├── 📂 services/       # Sincronización
│   │   │       └── 📂 utils/          # Utilidades
│   │   │
│   │   ├── 📂 services/     # 🔗 Comunicación con API
│   │   │   ├── api.js              # Servicios REST
│   │   │   ├── syncService.js      # Sincronización
│   │   │   └── loteService.js      # Gestión de lotes
│   │   │
│   │   └── 📂 pages/        # 📄 Páginas principales
│   │       ├── PosScreen.jsx       # Pantalla POS
│   │       ├── InventarioScreen.jsx # Pantalla Inventario
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

### 🔄 Sincronización
- ✅ Datos en tiempo real entre POS e Inventario
- ✅ Respaldo en localStorage
- ✅ Sincronización automática con backend

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

¡Este README te da una visión completa de cómo funciona y cómo recrear el sistema! 🚀