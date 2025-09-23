# 🏭 Sistema CRM Fábrica de Arepas - Proyecto Total

## 📋 Índice
1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Backend Django](#backend-django)
4. [Frontend React](#frontend-react)
5. [Base de Datos](#base-de-datos)
6. [Módulos del Sistema](#módulos-del-sistema)
7. [Flujo de Datos](#flujo-de-datos)
8. [Instalación y Configuración](#instalación-y-configuración)
9. [Uso del Sistema](#uso-del-sistema)
10. [Estructura de Archivos](#estructura-de-archivos)

---

## 🎯 Descripción General

Este es un **Sistema CRM completo** diseñado específicamente para una **fábrica de arepas**. El sistema integra múltiples módulos para gestionar toda la operación del negocio, desde la producción hasta la venta final.

### ✨ Características Principales
- **Sistema POS (Punto de Venta)** completo con facturación
- **Gestión de Inventario** en tiempo real
- **Módulo de Cargue Operativo** para vendedores
- **Control de Producción** y lotes
- **Gestión de Clientes** y listas de precios
- **Reportes y análisis** de ventas
- **Sincronización automática** entre módulos
- **Interfaz responsive** y moderna

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
```
Frontend: React 19.1.0 + Bootstrap 5.3.6
Backend: Django 5.1.7 + Django REST Framework
Base de Datos: PostgreSQL
Almacenamiento: Local Storage + API REST
```

### Estructura de Comunicación
```
┌─────────────────┐    HTTP/REST API    ┌─────────────────┐
│   Frontend      │◄──────────────────►│   Backend       │
│   React         │    JSON/FormData    │   Django        │
│   (Puerto 3000) │                     │   (Puerto 8000) │
└─────────────────┘                     └─────────────────┘
                                                │
                                                ▼
                                        ┌─────────────────┐
                                        │   PostgreSQL    │
                                        │   Database      │
                                        │   (Puerto 5432) │
                                        └─────────────────┘
```

---

## 🔧 Backend Django

### Configuración Principal
**Archivo:** `backend_crm/settings.py`

```python
# Base de datos PostgreSQL
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

# CORS para React
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React en desarrollo
]
```

### Aplicaciones Instaladas
```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',      # API REST
    'corsheaders',         # CORS
    'api',                 # Nuestra aplicación principal
]
```

### Modelos de Datos

#### 1. **Producto** - Modelo central del sistema
```python
class Producto(models.Model):
    nombre = models.CharField(max_length=255, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock_total = models.IntegerField(default=0)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True)
    imagen = models.ImageField(upload_to='productos/', null=True, blank=True)
    codigo_barras = models.CharField(max_length=100, blank=True, null=True)
    marca = models.CharField(max_length=100, default="GENERICA")
    impuesto = models.CharField(max_length=20, default="IVA(0%)")
    fecha_creacion = models.DateTimeField(default=timezone.now)
    activo = models.BooleanField(default=True)
```

#### 2. **CargueOperativo** - Gestión de vendedores
```python
class CargueOperativo(models.Model):
    DIAS_CHOICES = [
        ('LUNES', 'Lunes'), ('MARTES', 'Martes'),
        ('MIERCOLES', 'Miércoles'), ('JUEVES', 'Jueves'),
        ('VIERNES', 'Viernes'), ('SABADO', 'Sábado'),
        ('DOMINGO', 'Domingo'),
    ]
    
    dia = models.CharField(max_length=10, choices=DIAS_CHOICES)
    vendedor = models.ForeignKey(Vendedor, on_delete=models.CASCADE)
    fecha = models.DateField(default=timezone.now)
    usuario = models.CharField(max_length=100, default='Sistema')
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
```

#### 3. **Venta** - Sistema POS
```python
class Venta(models.Model):
    ESTADO_CHOICES = [
        ('PAGADO', 'Pagado'),
        ('PENDIENTE', 'Pendiente'),
        ('CANCELADO', 'Cancelado'),
    ]
    
    METODO_PAGO_CHOICES = [
        ('EFECTIVO', 'Efectivo'), ('TARJETA', 'Tarjeta'),
        ('T_CREDITO', 'T. Crédito'), ('QR', 'Qr'),
        ('TRANSF', 'Transf'), ('RAPPIPAY', 'RAPPIPAY'),
        ('BONOS', 'Bonos'), ('OTROS', 'Otros'),
    ]
    
    numero_factura = models.CharField(max_length=50, unique=True, blank=True)
    fecha = models.DateTimeField(default=timezone.now)
    vendedor = models.CharField(max_length=100, default='Sistema')
    cliente = models.CharField(max_length=255, default='CONSUMIDOR FINAL')
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PAGADO')
```

### API REST Endpoints

**Archivo:** `api/urls.py`

```python
# Endpoints principales
router.register(r'productos', ProductoViewSet, basename='producto')
router.register(r'ventas', VentaViewSet, basename='venta')
router.register(r'cargues', CargueOperativoViewSet, basename='cargue')
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'vendedores', VendedorViewSet, basename='vendedor')
router.register(r'movimientos', MovimientoInventarioViewSet, basename='movimiento')
router.register(r'lotes', LoteViewSet, basename='lote')
```

### ViewSets Principales

#### ProductoViewSet - Gestión de productos
```python
class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    
    @action(detail=True, methods=['post'])
    def actualizar_stock(self, request, pk=None):
        """Actualiza stock y registra movimiento"""
        # Lógica de actualización de stock
```

#### CargueOperativoViewSet - Cargue con datos anidados
```python
class CargueOperativoViewSet(viewsets.ModelViewSet):
    def create(self, request, *args, **kwargs):
        """Crear cargue operativo con datos anidados"""
        with transaction.atomic():
            # 1. Crear CargueOperativo principal
            # 2. Crear DetalleCargue para cada producto
            # 3. Crear ResumenPagos si existen
            # 4. Crear ResumenTotales si existe
            # 5. Manejo de errores completo
```

---

## ⚛️ Frontend React

### Estructura de Componentes

```
src/
├── components/
│   ├── Cargue/           # Módulo de cargue operativo
│   ├── Pos/              # Sistema punto de venta
│   ├── inventario/       # Gestión de inventario
│   ├── Clientes/         # Gestión de clientes
│   ├── common/           # Componentes reutilizables
│   └── modals/           # Modales del sistema
├── pages/                # Páginas principales
├── services/             # Servicios de API
├── context/              # Context API de React
├── hooks/                # Custom hooks
├── styles/               # Estilos CSS
└── utils/                # Utilidades
```

### Context API - Gestión de Estado

#### ProductContext - Estado global de productos
```javascript
export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sincronización con backend
  const syncWithBackend = async () => {
    setIsSyncing(true);
    try {
      const result = await sincronizarConBD();
      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  // Inicialización y sincronización automática
  useEffect(() => {
    const initialize = async () => {
      await sync.fromBackend(setProducts, setCategories);
      sync.withInventory(setProducts);
    };
    initialize();
    
    const syncInterval = setInterval(() => sincronizarConBD(), 60000);
    return () => clearInterval(syncInterval);
  }, []);
};
```

### Servicios de API

#### api.js - Servicio principal
```javascript
const API_URL = 'http://localhost:8000/api';

export const productoService = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/productos/`);
    return await response.json();
  },
  
  create: async (productoData) => {
    // Manejo de imágenes base64 y FormData
    if (productoData.imagen && productoData.imagen.startsWith('data:')) {
      const formData = new FormData();
      const imageFile = base64ToFile(productoData.imagen, 'producto.jpg');
      formData.append('imagen', imageFile);
      // ... resto de campos
    }
  },
  
  updateStock: async (id, cantidad, usuario, nota) => {
    // Actualización de stock con validaciones
  }
};
```

#### 🚀 responsableStorage.js - Gestión sin rebote
```javascript
// Utilidad centralizada para manejo de responsables
export const responsableStorage = {
  get: (idSheet) => {
    // Obtener responsable específico con logging
    const responsables = JSON.parse(localStorage.getItem('responsables_cargue') || '{}');
    const responsable = responsables[idSheet];
    
    if (responsable && responsable !== 'RESPONSABLE') {
      console.log(`📦 ResponsableStorage.get(${idSheet}): "${responsable}"`);
      return responsable;
    }
    return null;
  },
  
  set: (idSheet, nombre) => {
    // Guardar y disparar evento automático
    const responsables = responsableStorage.getAll();
    responsables[idSheet] = nombre;
    localStorage.setItem('responsables_cargue', JSON.stringify(responsables));
    
    // Evento automático para sincronización
    window.dispatchEvent(new CustomEvent('responsableActualizado', {
      detail: { idSheet, nuevoNombre: nombre }
    }));
    
    return true;
  }
};
```

#### cargueApiUtils.js - Utilidades de cargue
```javascript
// Funciones especializadas para el módulo de cargue
export const cargueApiUtils = {
  enviarCargueCompleto: async (datosCompletos) => {
    // Envío de datos completos con manejo de errores
  },
  
  procesarRespuestaServidor: (datosServidor) => {
    // Procesamiento de respuestas del servidor
  },
  
  validarDatosCargue: (datos) => {
    // Validaciones específicas del cargue
  }
};
```

### Páginas Principales

#### 1. MainMenu - Menú principal
```javascript
export default function MainMenu() {
  const navigate = useNavigate();
  
  return (
    <div className="main-menu">
      <div className="menu-grid">
        <div onClick={() => navigate("/pos")} className="menu-card">
          <i className="bi bi-cart"></i>
          <h3>Punto de Venta (POS)</h3>
        </div>
        <div onClick={() => navigate("/inventario")} className="menu-card">
          <i className="bi bi-box"></i>
          <h3>Inventario</h3>
        </div>
        <div onClick={() => navigate("/cargue")} className="menu-card">
          <i className="bi bi-people"></i>
          <h3>Cargue</h3>
        </div>
        {/* ... más opciones */}
      </div>
    </div>
  );
}
```

#### 2. PosScreen - Sistema de ventas
```javascript
export default function PosScreen() {
  const [cart, setCart] = useState([]);
  const [selectedTab, setSelectedTab] = useState("Remisión");
  const [client, setClient] = useState("CONSUMIDOR FINAL");
  
  const addProduct = (product, currentPrice = null) => {
    setCart((prev) => {
      const found = prev.find((item) => item.id === product.id);
      if (found) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, price: currentPrice || product.price, qty: 1 }];
    });
  };
  
  return (
    <ProductProvider>
      <ModalProvider>
        <div className="d-flex">
          <Sidebar />
          <div className="flex-grow-1">
            <Topbar />
            <main>
              <ProductList addProduct={addProduct} />
              <Cart cart={cart} clearCart={clearCart} />
            </main>
          </div>
        </div>
      </ModalProvider>
    </ProductProvider>
  );
}
```

---

## 🗄️ Base de Datos

### Esquema de Tablas Principales

```sql
-- Tabla de productos (núcleo del sistema)
CREATE TABLE api_producto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) DEFAULT 0,
    precio_compra DECIMAL(10,2) DEFAULT 0,
    stock_total INTEGER DEFAULT 0,
    categoria_id INTEGER REFERENCES api_categoria(id),
    imagen VARCHAR(100),
    codigo_barras VARCHAR(100),
    marca VARCHAR(100) DEFAULT 'GENERICA',
    impuesto VARCHAR(20) DEFAULT 'IVA(0%)',
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla de cargues operativos
CREATE TABLE api_cargueoperativo (
    id SERIAL PRIMARY KEY,
    dia VARCHAR(10) NOT NULL,
    vendedor_id INTEGER REFERENCES api_vendedor(id),
    fecha DATE DEFAULT CURRENT_DATE,
    usuario VARCHAR(100) DEFAULT 'Sistema',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    UNIQUE(dia, vendedor_id, fecha)
);

-- Tabla de detalles de cargue
CREATE TABLE api_detallecargue (
    id SERIAL PRIMARY KEY,
    cargue_id INTEGER REFERENCES api_cargueoperativo(id),
    producto_id INTEGER REFERENCES api_producto(id),
    vendedor_check BOOLEAN DEFAULT FALSE,
    despachador_check BOOLEAN DEFAULT FALSE,
    cantidad INTEGER DEFAULT 0,
    dctos INTEGER DEFAULT 0,
    adicional INTEGER DEFAULT 0,
    devoluciones INTEGER DEFAULT 0,
    vencidas INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    valor DECIMAL(10,2) DEFAULT 0,
    neto DECIMAL(12,2) DEFAULT 0
);

-- Tabla de ventas
CREATE TABLE api_venta (
    id SERIAL PRIMARY KEY,
    numero_factura VARCHAR(50) UNIQUE,
    fecha TIMESTAMP DEFAULT NOW(),
    vendedor VARCHAR(100) DEFAULT 'Sistema',
    cliente VARCHAR(255) DEFAULT 'CONSUMIDOR FINAL',
    metodo_pago VARCHAR(20) DEFAULT 'EFECTIVO',
    subtotal DECIMAL(10,2) DEFAULT 0,
    impuestos DECIMAL(10,2) DEFAULT 0,
    descuentos DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'PAGADO'
);
```

### Relaciones Principales

```
Producto (1) ←→ (N) DetalleCargue
Producto (1) ←→ (N) DetalleVenta
Producto (1) ←→ (N) MovimientoInventario
CargueOperativo (1) ←→ (N) DetalleCargue
CargueOperativo (1) ←→ (N) ResumenPagos
CargueOperativo (1) ←→ (1) ResumenTotales
Vendedor (1) ←→ (N) CargueOperativo
Venta (1) ←→ (N) DetalleVenta
```

---

## 📦 Módulos del Sistema

### 1. 🛒 Sistema POS (Punto de Venta)

**Ubicación:** `frontend/src/pages/PosScreen.jsx`

**Funcionalidades:**
- ✅ Catálogo de productos con imágenes
- ✅ Carrito de compras dinámico
- ✅ Cálculo automático de totales
- ✅ Múltiples métodos de pago
- ✅ Generación de facturas
- ✅ Gestión de clientes
- ✅ Descuentos e impuestos
- ✅ Sincronización con inventario

**Componentes principales:**
```javascript
// Estructura del POS
<PosScreen>
  <Sidebar />           // Navegación lateral
  <Topbar />           // Barra superior
  <ProductList />      // Lista de productos
  <Cart />             // Carrito de compras
  <ConsumerForm />     // Formulario de cliente
</PosScreen>
```

**Flujo de venta:**
1. Seleccionar productos → Agregar al carrito
2. Configurar cliente y vendedor
3. Aplicar descuentos/impuestos
4. Seleccionar método de pago
5. Procesar venta → Actualizar inventario
6. Generar factura

### 2. 📦 Gestión de Inventario

**Ubicación:** `frontend/src/pages/InventarioScreen.jsx`

**Funcionalidades:**
- ✅ Control de stock en tiempo real
- ✅ Movimientos de inventario (entrada/salida/ajuste)
- ✅ Gestión de lotes y fechas de vencimiento
- ✅ Kardex completo de productos
- ✅ Planeación de producción
- ✅ Control de maquilas
- ✅ Sincronización automática

**Pestañas del módulo:**
```javascript
// Pestañas de inventario
- Producción:    Ingreso de productos nuevos
- Maquilas:      Gestión de productos externos
- Planeación:    Planificación de producción
- Kardex:        Historial de movimientos
```

**Lógica de actualización de stock:**
```python
# En el backend (views.py)
def actualizar_stock(self, request, pk=None):
    producto = self.get_object()
    cantidad = int(request.data.get('cantidad', 0))
    
    # Actualizar stock directamente
    stock_anterior = producto.stock_total
    producto.stock_total += cantidad
    producto.save()
    
    return Response({
        'success': True,
        'stock_actual': producto.stock_total
    })
```

### 3. 🚛 Cargue Operativo

**Ubicación:** `frontend/src/components/Cargue/`

**Funcionalidades:**
- ✅ Gestión por días de la semana
- ✅ Control de 6 vendedores (ID1-ID6)
- ✅ Registro de productos por vendedor
- ✅ Control de cantidades, descuentos, devoluciones
- ✅ Checkboxes de vendedor/despachador
- ✅ Resumen de pagos (Nequi, Daviplata)
- ✅ Totales automáticos
- ✅ Persistencia en localStorage
- ✅ Sincronización con API
- ✅ **SOLUCIÓN ANTI-REBOTE** para nombres de responsables
- ✅ Sistema de eventos personalizados para actualizaciones
- ✅ Utilidad centralizada para manejo de responsables

**Estructura de datos:**
```javascript
// Estructura del cargue
{
  dia: "LUNES",
  vendedor_id: "ID1",
  fecha: "2025-01-20",
  productos: [
    {
      producto_nombre: "AREPA TIPO OBLEAS",
      cantidad: 50,
      dctos: 2,
      adicional: 0,
      devoluciones: 1,
      vencidas: 0,
      valor: 1600,
      vendedor_check: true,
      despachador_check: true
    }
  ],
  pagos: [
    {
      concepto: "Efectivo",
      descuentos: 0,
      nequi: 50000,
      daviplata: 25000
    }
  ],
  resumen: {
    total_despacho: 150000,
    venta: 140000,
    total_efectivo: 125000
  }
}
```

**Flujo de cargue:**
1. Seleccionar día de la semana
2. Elegir vendedor (ID1-ID6)
3. Configurar fecha
4. Registrar productos y cantidades
5. Marcar checkboxes de control
6. Registrar pagos y descuentos
7. Calcular totales automáticamente
8. Guardar en localStorage
9. Sincronizar con API

**🚀 SOLUCIÓN ANTI-REBOTE IMPLEMENTADA:**
- **Problema resuelto:** Eliminado el rebote visual del nombre "RAUL" → "RESPONSABLE" → "RAUL"
- **Solución:** Inicialización directa desde localStorage sin useEffect que cause rebote
- **Utilidad:** `responsableStorage.js` centraliza toda la lógica
- **Eventos:** Sistema de eventos personalizados para actualizaciones inmediatas
- **Resultado:** Nombres aparecen correctamente desde la primera carga

### 4. 👥 Gestión de Clientes

**Ubicación:** `frontend/src/pages/ClientesScreen.jsx`

**Funcionalidades:**
- ✅ Registro completo de clientes
- ✅ Tipos de identificación (CC, NIT, CE, Pasaporte)
- ✅ Información de contacto
- ✅ Direcciones y ubicación
- ✅ Configuración de crédito
- ✅ Historial de compras
- ✅ Estados activo/inactivo

### 5. 💰 Listas de Precios

**Ubicación:** `frontend/src/pages/ListaPreciosScreen.jsx`

**Funcionalidades:**
- ✅ Múltiples listas de precios
- ✅ Precios por cliente/proveedor/empleado
- ✅ Cálculo de utilidades
- ✅ Precios especiales por producto
- ✅ Fechas de vigencia

### 6. 🚚 Gestión de Vendedores

**Ubicación:** `frontend/src/pages/VendedoresScreen.jsx`

**Funcionalidades:**
- ✅ Registro de vendedores
- ✅ Asignación de rutas
- ✅ IDs únicos (ID1-ID6)
- ✅ Control de estados
- ✅ Historial de cargues

---

## 🚀 SOLUCIÓN ANTI-REBOTE DE RESPONSABLES

### ❌ Problema Original
El sistema mostraba un rebote visual molesto donde el nombre "RAUL" aparecía como "RESPONSABLE" por un momento al cargar la página, luego cambiaba a "RAUL". Esto se debía a:

1. `useState` inicializaba con el prop "RESPONSABLE"
2. `useEffect` ejecutaba y cambiaba a "RAUL" desde localStorage
3. Causaba un flash visual desagradable

### ✅ Solución Implementada

#### 1. **Inicialización Directa desde localStorage**
```javascript
// ANTES (con rebote)
const [nombreResponsable, setNombreResponsable] = useState(responsable || "RESPONSABLE");

// DESPUÉS (sin rebote)
const [nombreResponsable, setNombreResponsable] = useState(() => {
    const responsableGuardado = responsableStorage.get(idSheet);
    return responsableGuardado || responsable || "RESPONSABLE";
});
```

#### 2. **Utilidad Centralizada (`responsableStorage.js`)**
```javascript
export const responsableStorage = {
    get: (idSheet) => {
        // Obtener responsable específico desde localStorage
        // Con logging detallado para debugging
    },
    
    set: (idSheet, nombre) => {
        // Guardar responsable y disparar evento automático
        window.dispatchEvent(new CustomEvent('responsableActualizado', {
            detail: { idSheet, nuevoNombre: nombre }
        }));
    },
    
    getAll: () => { /* Obtener todos los responsables */ },
    clear: () => { /* Limpiar storage */ }
};
```

#### 3. **Sistema de Eventos Personalizados**
```javascript
// Listener en PlantillaOperativa.jsx
useEffect(() => {
    const handleResponsableUpdate = (e) => {
        if (e.detail && e.detail.idSheet === idSheet) {
            setNombreResponsable(e.detail.nuevoNombre);
        }
    };
    
    window.addEventListener('responsableActualizado', handleResponsableUpdate);
    return () => window.removeEventListener('responsableActualizado', handleResponsableUpdate);
}, [idSheet]);
```

#### 4. **Archivos Modificados**
- ✅ `PlantillaOperativa.jsx` - Inicialización sin rebote
- ✅ `MenuSheets.jsx` - Uso de utilidad centralizada
- ✅ `responsableStorage.js` - Nueva utilidad (CREADA)

### 🎯 Resultado Final
```
ANTES: Carga → "RESPONSABLE" → "RAUL" (REBOTE VISIBLE)
DESPUÉS: Carga → "RAUL" (SIN REBOTE)
```

### 🧪 Archivos de Prueba
- `test_responsable_storage.html` - Simulación interactiva
- `verificar_sin_rebote.js` - Script de verificación automática
- `SOLUCION_REBOTE_RESPONSABLES.md` - Documentación detallada

---

## 🔄 Flujo de Datos

### 1. Sincronización Frontend ↔ Backend

```javascript
// Flujo de sincronización
localStorage ←→ React State ←→ API REST ←→ Django Views ←→ PostgreSQL

// Ejemplo de flujo completo:
1. Usuario actualiza producto en React
2. Estado se actualiza en React Context
3. Datos se guardan en localStorage (inmediato)
4. API call se envía a Django (async)
5. Django actualiza PostgreSQL
6. Respuesta confirma sincronización
7. Estado local se marca como sincronizado
```

### 2. Gestión de Imágenes

```javascript
// Flujo de imágenes
1. Usuario selecciona imagen → Base64
2. Frontend convierte a File object
3. FormData se envía al backend
4. Django guarda en /media/productos/
5. URL se retorna al frontend
6. Imagen se muestra desde servidor
```

### 3. Control de Stock

```python
# Flujo de actualización de stock
1. Venta en POS → DetalleVenta.save()
2. Automáticamente crea MovimientoInventario
3. MovimientoInventario.save() actualiza Producto.stock_total
4. Frontend sincroniza cambios
5. Inventario se actualiza en tiempo real
```

---

## 🚀 Instalación y Configuración

### Prerrequisitos
```bash
# Sistema operativo: Linux
# Python 3.10+
# Node.js 18+
# PostgreSQL 12+
```

### 1. Configuración del Backend

```bash
# Clonar repositorio
git clone <repository-url>
cd proyecto

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install django djangorestframework django-cors-headers psycopg2-binary pillow

# Configurar base de datos PostgreSQL
sudo -u postgres createdb fabrica
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '12345';"

# Ejecutar migraciones
python manage.py makemigrations
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Ejecutar servidor
python manage.py runserver
```

### 2. Configuración del Frontend

```bash
# Navegar a frontend
cd frontend

# Instalar dependencias
npm install

# Dependencias principales instaladas:
# - react: 19.1.0
# - react-dom: 19.1.0
# - react-router-dom: 7.5.0
# - bootstrap: 5.3.6
# - react-bootstrap: 2.10.1
# - react-icons: 5.5.0
# - uuid: 11.1.0

# Ejecutar aplicación
npm start
```

### 3. Configuración de la Base de Datos

```sql
-- Conectar a PostgreSQL
psql -U postgres -d fabrica

-- Verificar tablas creadas
\dt

-- Insertar datos de prueba
INSERT INTO api_categoria (nombre) VALUES ('Arepas'), ('Almojábanas'), ('Servicios');

INSERT INTO api_vendedor (nombre, id_vendedor, ruta) VALUES 
('Juan Pérez', 'ID1', 'Ruta Norte'),
('María García', 'ID2', 'Ruta Sur'),
('Carlos López', 'ID3', 'Ruta Centro');
```

---

## 💻 Uso del Sistema

### 1. Acceso al Sistema

```
URL Frontend: http://localhost:3000
URL Backend Admin: http://localhost:8000/admin
URL API: http://localhost:8000/api
```

### 2. Flujo de Trabajo Típico

#### Día de Producción:
1. **Inventario** → Pestaña "Producción"
   - Registrar productos fabricados
   - Actualizar stock automáticamente

2. **Cargue** → Seleccionar día y vendedores
   - Asignar productos a cada vendedor (ID1-ID6)
   - Marcar checkboxes de control
   - Registrar cantidades y devoluciones

3. **POS** → Ventas durante el día
   - Procesar ventas de mostrador
   - Actualizar inventario automáticamente

4. **Reportes** → Análisis de fin de día
   - Revisar ventas totales
   - Verificar movimientos de inventario

#### Gestión de Clientes:
1. **Clientes** → Registrar nuevos clientes
2. **Lista de Precios** → Configurar precios especiales
3. **POS** → Aplicar precios según cliente

### 3. Funciones Avanzadas

#### Sincronización Manual:
```javascript
// En cualquier módulo, forzar sincronización
await syncWithBackend();
```

#### Backup de Datos:
```bash
# Backup de base de datos
pg_dump -U postgres fabrica > backup_fabrica.sql

# Backup de imágenes
tar -czf media_backup.tar.gz media/
```

#### Limpieza de Tablas:
```bash
# Ejecutar script de limpieza
./clean_tables.sh
```

---

## 📁 Estructura de Archivos

### Backend (Django)
```
backend_crm/
├── backend_crm/
│   ├── __init__.py
│   ├── settings.py          # Configuración principal
│   ├── urls.py              # URLs principales
│   ├── wsgi.py              # WSGI config
│   └── asgi.py              # ASGI config
├── api/
│   ├── __init__.py
│   ├── models.py            # 📊 Modelos de datos
│   ├── serializers.py       # 🔄 Serializers REST
│   ├── views.py             # 🎯 Lógica de negocio
│   ├── urls.py              # 🛣️ URLs de API
│   ├── admin.py             # 👨‍💼 Admin interface
│   └── migrations/          # 📈 Migraciones DB
├── media/                   # 🖼️ Archivos multimedia
│   └── productos/           # Imágenes de productos
├── manage.py                # 🔧 Comando Django
└── requirements.txt         # 📦 Dependencias Python
```

### Frontend (React)
```
frontend/
├── public/
│   ├── index.html           # 🏠 HTML principal
│   ├── favicon.ico          # 🎨 Icono
│   └── images/              # 🖼️ Imágenes públicas
├── src/
│   ├── components/          # 🧩 Componentes React
│   │   ├── Cargue/          # 🚛 Módulo cargue
│   │   │   ├── PlantillaOperativa.jsx    # 📋 Plantilla principal
│   │   │   ├── MenuSheets.jsx            # 📅 Menú de hojas
│   │   │   ├── ResponsableManager.jsx    # 👤 Gestor responsables
│   │   │   ├── TablaProductos.jsx        # 📊 Tabla productos
│   │   │   ├── ControlCumplimiento.jsx   # ✅ Control cumplimiento
│   │   │   └── ResumenVentas.jsx         # 💰 Resumen ventas
│   │   ├── Pos/             # 🛒 Sistema POS
│   │   ├── inventario/      # 📦 Inventario
│   │   ├── Clientes/        # 👥 Clientes
│   │   ├── common/          # 🔄 Reutilizables
│   │   └── modals/          # 🪟 Modales
│   ├── pages/               # 📄 Páginas principales
│   │   ├── MainMenu.jsx     # 🏠 Menú principal
│   │   ├── PosScreen.jsx    # 🛒 Pantalla POS
│   │   ├── InventarioScreen.jsx # 📦 Inventario
│   │   ├── ClientesScreen.jsx   # 👥 Clientes
│   │   └── SelectorDia.jsx  # 📅 Selector días
│   ├── services/            # 🔌 Servicios API
│   │   ├── api.js           # 🌐 API principal
│   │   ├── cargueApiService.js # 🚛 API cargue
│   │   ├── syncService.js   # 🔄 Sincronización
│   │   └── clienteService.js # 👥 API clientes
│   ├── context/             # 🗂️ Context API
│   │   ├── ProductContext.jsx   # 📦 Estado productos
│   │   ├── VendedoresContext.jsx # 🚚 Estado vendedores
│   │   └── ModalContext.jsx     # 🪟 Estado modales
│   ├── hooks/               # 🎣 Custom hooks
│   ├── styles/              # 🎨 Estilos CSS
│   ├── utils/               # 🛠️ Utilidades
│   │   ├── responsableStorage.js     # 🚀 Gestión responsables sin rebote
│   │   ├── cargueApiUtils.js         # 🚛 Utilidades API cargue
│   │   ├── inventarioUtils.js        # 📦 Utilidades inventario
│   │   ├── syncInventoryToPOS.js     # 🔄 Sincronización POS
│   │   ├── consultaProductos.js      # 🔍 Consulta productos
│   │   └── exportImages.js           # 🖼️ Exportación imágenes
│   ├── App.js               # ⚛️ Componente principal
│   └── index.js             # 🚀 Punto de entrada
├── package.json             # 📦 Dependencias Node
└── package-lock.json        # 🔒 Lock de dependencias
```

### Archivos de Configuración y Utilidades
```
proyecto/
├── .gitignore                        # 🚫 Archivos ignorados
├── README.md                         # 📖 Documentación básica
├── PROYECTO_TOTAL.md                 # 📚 Esta documentación completa
├── SOLUCION_REBOTE_RESPONSABLES.md   # 🚀 Documentación solución rebote
├── clean_tables.sh                   # 🧹 Script limpieza
├── clean_tables.sql                  # 🗑️ SQL limpieza
├── manage.py                         # 🔧 Django management
├── test_responsable_storage.html     # 🧪 Test anti-rebote HTML
├── verificar_sin_rebote.js           # 🔍 Script verificación rebote
├── test_despacho.html                # 🚛 Test módulo despacho
├── revisar_localStorage.js           # 📦 Revisar localStorage
└── venv/                             # 🐍 Entorno virtual Python
```

---

## 🔧 Configuraciones Especiales

### CORS Configuration
```python
# backend_crm/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React development
]

CORS_ALLOW_CREDENTIALS = True
```

### Media Files
```python
# Configuración de archivos multimedia
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# En urls.py
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### API Permissions
```python
# Todas las APIs están configuradas con AllowAny para desarrollo
permission_classes = [permissions.AllowAny]
```

---

## 🚨 Consideraciones de Seguridad

### Para Producción:
1. **Cambiar SECRET_KEY** en settings.py
2. **Configurar DEBUG = False**
3. **Configurar ALLOWED_HOSTS**
4. **Implementar autenticación** en APIs
5. **Usar HTTPS** para comunicación
6. **Configurar CORS** restrictivo
7. **Validar inputs** en frontend y backend

### Backup y Recuperación:
```bash
# Backup automático diario
0 2 * * * pg_dump -U postgres fabrica > /backups/fabrica_$(date +\%Y\%m\%d).sql

# Backup de media files
0 3 * * * tar -czf /backups/media_$(date +\%Y\%m\%d).tar.gz /path/to/media/
```

---

## 📊 Métricas y Monitoreo

### Logs del Sistema:
- **Django logs:** `django_server.log`
- **Frontend logs:** Console del navegador
- **Database logs:** PostgreSQL logs

### Puntos de Monitoreo:
1. **API Response Times**
2. **Database Query Performance**
3. **Stock Levels**
4. **Sales Volume**
5. **User Activity**

---

## 🔮 Roadmap y Mejoras Futuras

### Próximas Funcionalidades:
- [ ] **Módulo de Reportes Avanzados**
- [ ] **Integración con React Native**
- [ ] **Sistema de Notificaciones**
- [ ] **Dashboard Ejecutivo**
- [ ] **Integración con Facturación Electrónica**
- [ ] **Sistema de Roles y Permisos**
- [ ] **API de Terceros (Bancos, Pagos)**
- [ ] **Módulo de Contabilidad**

### Optimizaciones Técnicas:
- [x] **✅ Solución Anti-Rebote Responsables** - COMPLETADO
- [x] **✅ Sistema de Eventos Personalizados** - COMPLETADO  
- [x] **✅ Utilidades Centralizadas** - COMPLETADO
- [x] **✅ Logging Detallado para Debugging** - COMPLETADO
- [ ] **Implementar Redis para Cache**
- [ ] **Optimizar Queries de Base de Datos**
- [ ] **Implementar WebSockets para Real-time**
- [ ] **Migrar a TypeScript**
- [ ] **Implementar Tests Automatizados**
- [ ] **CI/CD Pipeline**

---

## 🤝 Contribución y Soporte

### Para Desarrolladores:
1. Fork del repositorio
2. Crear branch para feature
3. Implementar cambios
4. Escribir tests
5. Crear Pull Request

### Estructura de Commits:
```
feat: nueva funcionalidad
fix: corrección de bug
docs: actualización documentación
style: cambios de formato
refactor: refactorización de código
test: agregar tests
```

---

## 📞 Contacto y Soporte

**Desarrollado para:** Fábrica de Arepas  
**Tecnologías:** Django + React + PostgreSQL  
**Versión:** 1.1.0  
**Fecha:** Enero 2025  
**Última actualización:** Solución Anti-Rebote Responsables implementada  

---

## 📝 CHANGELOG

### Versión 1.1.0 (Enero 2025)
#### 🚀 NUEVAS CARACTERÍSTICAS
- **✅ Solución Anti-Rebote Responsables:** Eliminado rebote visual en nombres de responsables
- **✅ Sistema de Eventos Personalizados:** Actualizaciones inmediatas entre componentes
- **✅ Utilidad responsableStorage.js:** Gestión centralizada de responsables
- **✅ Logging Detallado:** Mejor debugging y monitoreo
- **✅ Archivos de Prueba:** Tests interactivos para verificar funcionamiento

#### 🔧 MEJORAS TÉCNICAS
- Inicialización directa desde localStorage sin useEffect
- Eventos automáticos para sincronización
- Código más limpio y mantenible
- Mejor experiencia de usuario (UX)

#### 📁 ARCHIVOS NUEVOS
- `frontend/src/utils/responsableStorage.js`
- `test_responsable_storage.html`
- `verificar_sin_rebote.js`
- `SOLUCION_REBOTE_RESPONSABLES.md`

#### 🔄 ARCHIVOS MODIFICADOS
- `frontend/src/components/Cargue/PlantillaOperativa.jsx`
- `frontend/src/components/Cargue/MenuSheets.jsx`
- `PROYECTO_TOTAL.md` (esta documentación)

### Versión 1.0.0 (Enero 2025)
#### 🎯 LANZAMIENTO INICIAL
- Sistema CRM completo para fábrica de arepas
- Módulos: POS, Inventario, Cargue, Clientes, Vendedores
- Backend Django + Frontend React
- Base de datos PostgreSQL
- Sincronización automática entre módulos

---

*Este sistema está diseñado específicamente para optimizar las operaciones de una fábrica de arepas, integrando todos los procesos desde la producción hasta la venta final, con un enfoque en la eficiencia, confiabilidad y facilidad de uso.*

**🚀 ÚLTIMA MEJORA:** Solución definitiva para el rebote de responsables - Los nombres aparecen correctamente desde la primera carga sin efectos visuales molestos.