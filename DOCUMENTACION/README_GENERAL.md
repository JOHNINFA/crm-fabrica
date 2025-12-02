# 📱 Sistema Integrado de Gestión - Documentación General

## 🎯 Visión General

Este es un **sistema empresarial completo** construido con **Django REST Framework** (backend) y **React** (frontend) que integra múltiples módulos de negocio para una fábrica/distribuidora de productos.

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │   POS    │ CARGUE   │INVENTARIO│ PEDIDOS  │TRAZABIL. │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↕ (REST API)
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Django REST Framework)                │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ Productos│ Ventas   │ Cargue   │ Pedidos  │Inventario│  │
│  │ Clientes │ Cajeros  │ Lotes    │ Remisión │Producción│  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│           BASE DE DATOS (PostgreSQL)                        │
│  Tablas: Productos, Ventas, Clientes, Cargue, Pedidos...  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Estructura del Proyecto

### Backend (Django)
```
backend_crm/
├── settings.py          # Configuración de Django
├── urls.py              # Rutas principales
├── wsgi.py              # Servidor WSGI
└── asgi.py              # Servidor ASGI

api/
├── models.py            # Modelos de datos (Producto, Venta, Cargue, etc.)
├── views.py             # Vistas/Endpoints API
├── serializers.py       # Serializadores para API
├── urls.py              # Rutas de API
├── admin.py             # Panel administrativo
└── migrations/          # Migraciones de BD
```

### Frontend (React)
```
frontend/src/
├── pages/               # Pantallas principales (POS, Cargue, Inventario, etc.)
├── components/          # Componentes reutilizables
│   ├── Pos/            # Módulo POS
│   ├── Cargue/         # Módulo Cargue
│   ├── inventario/     # Módulo Inventario
│   ├── Pedidos/        # Módulo Pedidos
│   └── common/         # Componentes comunes
├── services/           # Servicios API
├── context/            # Context API para estado global
├── hooks/              # Custom hooks
├── utils/              # Utilidades
└── styles/             # Estilos CSS
```

---

## 🔌 Flujo de Comunicación

### 1. **Frontend → Backend**
```javascript
// Ejemplo: Crear una venta
const response = await fetch('http://localhost:8000/api/ventas/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    vendedor: 'Juan',
    cliente: 'CONSUMIDOR FINAL',
    metodo_pago: 'EFECTIVO',
    detalles: [
      { producto: 1, cantidad: 2, precio_unitario: 5000 }
    ]
  })
});
```

### 2. **Backend Procesa**
```python
# views.py - VentaViewSet.create()
# 1. Valida datos con serializer
# 2. Crea registro de Venta
# 3. Crea DetalleVenta (items)
# 4. Actualiza stock del producto
# 5. Retorna venta completa
```

### 3. **Backend → Frontend**
```json
{
  "id": 1,
  "numero_factura": "F12345678",
  "fecha": "2025-11-17T10:30:00Z",
  "total": 10000,
  "detalles": [
    {
      "id": 1,
      "producto": 1,
      "cantidad": 2,
      "precio_unitario": 5000,
      "subtotal": 10000
    }
  ]
}
```

---

## 📊 Módulos Principales

### 1. **POS (Punto de Venta)**
- **Propósito**: Registrar ventas en tiempo real
- **Usuarios**: Cajeros, vendedores
- **Funcionalidades**:
  - Búsqueda y selección de productos
  - Carrito de compras
  - Múltiples métodos de pago
  - Generación de facturas
  - **Gestión de Caja**: Apertura/cierre de turno, arqueo de caja
  - **Historial de Ventas**: Registro de todas las transacciones

**Documentación**: Ver `DOCUMENTACION/README_POS.md`

### 2. **CARGUE**
- **Propósito**: Registro operativo de vendedores en ruta
- **Usuarios**: Vendedores, supervisores
- **Funcionalidades**:
  - Registro de productos despachados
  - Control de devoluciones y vencidas
  - Registro de pagos (efectivo, Nequi, Daviplata)
  - Control de cumplimiento (uniforme, documentos, etc.)
  - Múltiples rutas (ID1-ID6)
  - Resumen de ventas operativas

**Documentación**: Ver `DOCUMENTACION/README_CARGUE.md`

### 3. **INVENTARIO**
- **Propósito**: Gestión de stock, movimientos y trazabilidad
- **Usuarios**: Almacenistas, supervisores
- **Funcionalidades**:
  - Visualización de stock por ubicación (Producción/Maquila)
  - Registro de movimientos (entrada/salida/ajuste)
  - Gestión de lotes y vencimientos
  - **Kardex**: Historial de movimientos (trazabilidad de productos)
  - Planeación de producción

**Documentación**: Ver `DOCUMENTACION/README_INVENTARIO.md`

### 4. **PEDIDOS**
- **Propósito**: Gestión de pedidos de clientes
- **Usuarios**: Vendedores, despachadores
- **Funcionalidades**:
  - Creación de pedidos
  - **Gestión de Clientes**: Información de contacto, datos geográficos, configuración
  - **Historial de Pedidos**: Seguimiento de estado y cambios
  - Generación de remisiones
  - Integración con inventario
  - Actualización de planeación

**Documentación**: Ver `DOCUMENTACION/README_PEDIDOS.md`

### 5. **OTROS (Administración y Configuración)**
- **Propósito**: Administración y configuración del sistema
- **Usuarios**: Administradores
- **Funcionalidades**:
  - **Gestión de Sucursales**: Crear, editar, eliminar sucursales
  - **Gestión de Usuarios**: Crear, editar, eliminar usuarios (cajeros, vendedores)
  - **Configuración de Impresión**: Personalizar tickets y facturas
  - **Configuración General**: Parámetros del sistema
  - **Reportes Avanzados**: Análisis por cajero y sucursal

**Documentación**: Ver `DOCUMENTACION/README_OTROS.md`

---

## 🗄️ Modelos de Datos Principales

### Producto
```python
class Producto(models.Model):
    nombre: str                    # Nombre único
    descripcion: str               # Descripción
    precio: decimal                # Precio de venta
    precio_compra: decimal         # Precio de compra
    stock_total: int               # Stock disponible
    categoria: ForeignKey          # Categoría
    imagen: ImageField             # Imagen del producto
    codigo_barras: str             # Código de barras
    marca: str                     # Marca
    ubicacion_inventario: str      # PRODUCCION o MAQUILA
    orden: int                     # Orden de visualización
    activo: bool                   # Activo/Inactivo
```

### Venta
```python
class Venta(models.Model):
    numero_factura: str            # Identificador único
    fecha: datetime                # Fecha de venta
    vendedor: str                  # Nombre del vendedor
    cliente: str                   # Nombre del cliente
    metodo_pago: str               # EFECTIVO, TARJETA, etc.
    subtotal: decimal              # Subtotal
    impuestos: decimal             # Impuestos
    descuentos: decimal            # Descuentos
    total: decimal                 # Total
    estado: str                    # PAGADO, PENDIENTE, ANULADA
    detalles: OneToMany            # Items de la venta
```

### Cargue (ID1-ID6)
```python
class CargueID1(models.Model):
    dia: str                       # Día de la semana
    fecha: date                    # Fecha del cargue
    responsable: str               # Nombre del vendedor
    ruta: str                      # Ruta asignada
    producto: str                  # Producto
    cantidad: int                  # Cantidad
    dctos: int                     # Descuentos
    devoluciones: int              # Devoluciones
    vencidas: int                  # Productos vencidos
    total: int                     # Total calculado
    valor: decimal                 # Valor unitario
    neto: decimal                  # Neto (total * valor)
    # ... más campos de control
```

### Pedido
```python
class Pedido(models.Model):
    numero_pedido: str             # Identificador único
    fecha: datetime                # Fecha de creación
    vendedor: str                  # Vendedor
    destinatario: str              # Cliente
    fecha_entrega: date            # Fecha de entrega
    tipo_pedido: str               # NORMAL, URGENTE, etc.
    subtotal: decimal              # Subtotal
    total: decimal                 # Total
    estado: str                    # PENDIENTE, ENTREGADO, etc.
    detalles: OneToMany            # Items del pedido
```

---

## 🔄 Flujos de Negocio Principales

### Flujo 1: Venta en POS
```
1. Cajero abre sesión (login)
2. Selecciona productos
3. Aplica descuentos si aplica
4. Selecciona método de pago
5. Genera factura
6. Sistema actualiza:
   - Stock del producto (SALIDA)
   - Registro de venta
   - Movimiento de caja
7. Imprime ticket
```

### Flujo 2: Cargue de Vendedor
```
1. Vendedor abre formulario de cargue
2. Selecciona día y fecha
3. Registra productos despachados
4. Registra devoluciones y vencidas
5. Registra pagos recibidos
6. Completa control de cumplimiento
7. Guarda cargue
8. Sistema actualiza:
   - Resumen de ventas
   - Movimientos de caja
   - Planeación
```

### Flujo 3: Gestión de Inventario
```
1. Almacenista visualiza stock
2. Registra entrada de producción
3. Sistema actualiza:
   - Stock total
   - Movimiento de inventario
   - Lotes
4. Visualiza kardex de movimientos
```

### Flujo 4: Creación de Pedido
```
1. Vendedor crea pedido
2. Selecciona cliente
3. Agrega productos
4. Define fecha de entrega
5. Guarda pedido
6. Sistema actualiza:
   - Planeación (suma a solicitadas)
   - Cargue (suma a total_pedidos)
   - Reserva de stock
```

---

## 🔐 Autenticación y Permisos

### Tipos de Usuarios
- **Cajero**: Acceso a POS y caja
- **Vendedor**: Acceso a Cargue y Pedidos
- **Almacenista**: Acceso a Inventario
- **Supervisor**: Acceso a todos los módulos
- **Admin**: Acceso total + configuración

### Endpoints Públicos (sin autenticación)
```
GET  /api/productos/
GET  /api/categorias/
GET  /api/clientes/
POST /api/ventas/
POST /api/cargue-id1/
```

---

## 🚀 Instalación y Configuración

### Backend
```bash
# 1. Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar base de datos
# Editar backend_crm/settings.py con credenciales PostgreSQL

# 4. Ejecutar migraciones
python manage.py migrate

# 5. Crear superusuario
python manage.py createsuperuser

# 6. Ejecutar servidor
python manage.py runserver
```

### Frontend
```bash
# 1. Instalar dependencias
cd frontend
npm install

# 2. Configurar API
# Editar frontend/src/config/api.js con URL del backend

# 3. Ejecutar servidor de desarrollo
npm start

# 4. Build para producción
npm run build
```

---

## 📡 Endpoints API Principales

### Productos
```
GET    /api/productos/                    # Listar todos
POST   /api/productos/                    # Crear
GET    /api/productos/{id}/               # Obtener uno
PUT    /api/productos/{id}/               # Actualizar
DELETE /api/productos/{id}/               # Eliminar
POST   /api/productos/{id}/actualizar_stock/  # Actualizar stock
```

### Ventas
```
GET    /api/ventas/                       # Listar
POST   /api/ventas/                       # Crear venta
GET    /api/ventas/{id}/                  # Obtener
PUT    /api/ventas/{id}/                  # Actualizar
```

### Cargue
```
GET    /api/cargue-id1/                   # Listar cargues ID1
POST   /api/cargue-id1/                   # Crear cargue
GET    /api/cargue-id1/{id}/              # Obtener
PUT    /api/cargue-id1/{id}/              # Actualizar
```

### Pedidos
```
GET    /api/pedidos/                      # Listar
POST   /api/pedidos/                      # Crear
GET    /api/pedidos/{id}/                 # Obtener
PUT    /api/pedidos/{id}/                 # Actualizar
```

### Inventario
```
GET    /api/movimientos-inventario/       # Listar movimientos
POST   /api/movimientos-inventario/       # Crear movimiento
GET    /api/lotes/                        # Listar lotes
```

---

## 🎨 Estilos y Temas

### Colores Principales
- **Primario**: #007bff (Azul)
- **Éxito**: #28a745 (Verde)
- **Peligro**: #dc3545 (Rojo)
- **Advertencia**: #ffc107 (Amarillo)
- **Info**: #17a2b8 (Cian)

### Framework CSS
- **Bootstrap 5**: Framework principal
- **Bootstrap Icons**: Iconografía
- **CSS Personalizado**: Estilos específicos por módulo

---

## 📈 Reportes y Análisis

### Reportes Disponibles
1. **Reporte de Ventas**: Por período, vendedor, método de pago
2. **Reporte de Cargue**: Resumen operativo por vendedor
3. **Reporte de Inventario**: Stock actual, movimientos
4. **Reporte de Pedidos**: Estado, entregas, pendientes
5. **Reporte de Trazabilidad**: Historial de lotes

---

## 🔧 Configuración Avanzada

### Variables de Entorno Backend
```
DEBUG=True
SECRET_KEY=tu-clave-secreta
DATABASE_URL=postgresql://user:pass@localhost/fabrica
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Variables de Entorno Frontend
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=30000
```

---

## 🐛 Troubleshooting

### Error: "CORS policy"
**Solución**: Verificar `CORS_ALLOWED_ORIGINS` en `settings.py`

### Error: "Database connection refused"
**Solución**: Verificar credenciales PostgreSQL en `settings.py`

### Error: "Module not found"
**Solución**: Ejecutar `npm install` en frontend o `pip install -r requirements.txt` en backend

---

## 📚 Documentación Adicional

- [README_POS.md](README_POS.md) - Módulo de Punto de Venta
- [README_CARGUE.md](README_CARGUE.md) - Módulo de Cargue
- [README_INVENTARIO.md](README_INVENTARIO.md) - Módulo de Inventario
- [README_PEDIDOS.md](README_PEDIDOS.md) - Módulo de Pedidos
- [README_TRAZABILIDAD.md](README_TRAZABILIDAD.md) - Módulo de Trazabilidad

---

## 📞 Soporte

Para reportar bugs o sugerencias, contactar al equipo de desarrollo.

**Última actualización**: 17 de Noviembre de 2025
