# 📱 REFERENCIA COMPLETA - FRONTEND REACT

## 📅 Fecha: 2026-01-05
## 🎯 Propósito: Documentación técnica del frontend

---

## 📊 **ESTRUCTURA GENERAL**

```
frontend/src/
├── pages/ (40 páginas)
├── components/ (141 componentes)
├── context/ (13 contextos)
├── services/ (24 servicios API)
├── styles/ (CSS)
├── hooks/ (5 hooks personalizados)
└── utils/
```

---

## 📄 **PÁGINAS PRINCIPALES (40)**

### **1. CARGUE / RUTAS**
```
PlantillaOperativa.jsx (76KB) - Página principal de Cargue
├─ Función: Gestión completa del cargue diario
├─ Componentes usados: 15+
├─ Features:
   - Selección de día y vendedor
   - Asignación de lotes
   - Checks de cumplimiento
   - Estados (NO_INICIADO, ALISTAMIENTO, FINALIZAR, COMPLETADO)

BotonLimpiar.jsx (121KB) - El componente más grande
├─ Función: Cierre de turno vendedor
├─ Features:
   - Validación de vencidas
   - Confirmación de descuentos
   - Registro de devoluciones
   - Cálculo de totales
   - Afectación de inventario

ResumenVentas.jsx (30KB)
├─ Función: Visualización de ventas por vendedor
```

### **2. PLANEACIÓN / PRODUCCIÓN**
```
InventarioPlaneacion.jsx (42KB) - 🧠 CON IA
├─ Función: Planeación de producción con IA
├─ Features:
   - Consulta predicciones de IA
   - Campo "IA" editable
   - Sincronización con Cargue
   - Sincronización con Pedidos
   - Cache inteligente (30s)
   - Congelación de edición (si ALISTAMIENTO activo)
├─ Endpoints:
   - POST /api/planeacion/prediccion_ia/
   - GET /api/planeacion/
   - GET /api/stock/
   - GET /api/pedidos/
   - GET /api/cargue-id1/ (hasta ID6)

InventarioProduccion.jsx
├─ Función: Registro de producción diaria

Produccion.jsx (27KB)
├─ Función: Producción con lotes
```

### **3. POS / CAJA**
```
CajaScreen.jsx (160KB) - POS COMPLETO
├─ Función: Punto de venta
├─ Features:
   - Carrito de compras
   - Múltiples métodos de pago
   - Impresión de tickets
   - Búsqueda de productos
   - Cliente: CONSUMIDOR FINAL o seleccionar
├─ Contextos: CajeroContext, ProductosContext
├─ Servicios: cajaService, cajeroService

PosScreen.jsx
├─ Función: PoS alternativo
├─ Similar a CajaScreen

TurnoScreen.jsx
├─ Función: Gestión de turnos de caja
├─ Features:
   - Abrir turno (monto base)
   - Cerrar turno
   - Arqueo de caja
   - Cálculo de diferencias

CajerosScreen.jsx
├─ Función: CRUD de cajeros
```

### **4. PEDIDOS**
```
PedidosScreen.jsx
├─ Función: Creación y gestión de pedidos
├─ Features:
   - Buscar/Crear cliente
   - Seleccionar productos
   - Asignar a vendedor/domiciliario
   - Afectar inventario (inmediato o manual)
   - Tipo pedido: ENTREGA, TRASLADO, DEVOLUCION, MUESTRA

InformePedidosScreen.jsx
├─ Función: Visualización de pedidos
├─ Features:
   - Filtros por fecha, estado, vendedor
   - Anular pedidos
   - Imprimir remisión

PedidosDiaScreen.jsx
├─ Función: Pedidos del día específico
```

### **5. INVENTARIO**
```
InventarioScreen.jsx
├─ Función: Gestión general de inventario
├─ Features:
   - Filtro PRODUCCION/MAQUILA
   - Ajustes manuales
   - Ver movimientos

TrazabilidadScreen.jsx (34KB)
├─ Función: Trazabilidad de lotes
├─ Features:
   - Buscar por lote
   - Buscar por fecha
   - Buscar por mes
   - Ver despachos
   - Ver vencidas (con fotos)
```

### **6. CLIENTES**
```
ClientesScreen.jsx
├─ Función: CRUD de clientes
├─ Features:
   - Crear/Editar cliente
   - Asignar lista de precios
   - Cliente de ruta (día visita, orden)

ListaClientesScreen.jsx
├─ Función: Vista lista de clientes

ClienteIAScreen.jsx (18KB)
├─ Función: Asistente IA para crear clientes
├─ ⚠️ NOTA: NO relacionado con IA de planeación
├─ Es un chatbot para guiar creación de clientes
```

### **7. PRODUCTOS**
```
ProductFormScreen.jsx
├─ Function: CRUD de productos
├─ Features:
   - Campos completos (40+ campos)
   - Disponibilidad por módulo (web + app)
   - Orden personalizado
   - Categoría
   - Imágenes

PreciosCargueScreen.jsx
├─ Función: Precios específicos para cargue

ListaPreciosScreen.jsx
├─ Función: Gestión de listas de precios

MaestroListaPreciosScreen.jsx
├─ Función: Maestro de listas
```

### **8. CONFIGURACIÓN**
```
ConfiguracionScreen.jsx
├─ Función: Configuración general

ConfiguracionImpresionScreen.jsx
├─ Función: Configuración de impresora
├─ Features:
   - Datos del negocio
   - Logo
   - Formato ticket (58mm/80mm)
   - Fuente y mensajes

VendedoresScreen.jsx
├─ Función: CRUD de vendedores (ID1-ID6)

DomiciliariosScreen.jsx
├─ Función: CRUD de domiciliarios (DOM1, DOM2)

SucursalesScreen.jsx
├─ Función: CRUD de sucursales
```

### **9. REPORTES**
```
ReportesAvanzadosScreen.jsx
├─ Función: Reportes generales

InformeVentasGeneral.jsx
├─ Función: Informe de ventas

InformeListaPreciosScreen.jsx
├─ Función: Informe de listas

ReporteTransferenciasScreen.jsx
├─ Función: Transferencias entre sucursales
```

### **10. OTROS**
```
OtrosScreen.jsx (16KB)
├─ Función: Menú de utilidades
├─ Enlaces a:
   - Vendedores
   - Domiciliarios
   - Configuración
   - Listas de precios
   - Sucursales
   - Reportes
```

---

## 🧩 **COMPONENTES PRINCIPALES (141 total)**

### **Cargue (28 componentes)**
```
components/Cargue/
├── PlantillaOperativa.jsx (76KB) - Principal
├── BotonLimpiar.jsx (121KB) - Cierre
├── ResumenVentas.jsx (30KB) - Estadísticas
├── Produccion.jsx (27KB) - Producción
├── MenuSheets.jsx (29KB) - Menú de hojas
├── ControlCumplimiento.jsx (12KB) - Checks
├── ApiStatusIndicator.jsx (7KB) - Estado API
├── ApiIntegrationWrapper.jsx (5KB)
├── BotonCorreccion.jsx
├── BotonCorreccionNuevo.jsx
├── BotonSincronizar.jsx
├── BotonVerPedidos.jsx (37KB)
├── LotesVencidos.jsx (6KB)
├── ModalCorreccionSimple.jsx (8KB)
├── TablaProductos.jsx (8KB)
├── VerificarGuardado.jsx (5KB)
├── FechasDisponibles.jsx (5KB)
├── RegistroForm.jsx
├── RegistroLotes.jsx (10KB)
├── ResponsableManager.jsx
├── SelectorFecha.jsx
└── README_API_INTEGRATION.md
```

### **Inventario (14 componentes)**
```
components/inventario/
├── InventarioPlaneacion.jsx (42KB) - 🧠 CON IA
├── InventarioProduccion.jsx
├── InventarioMaquila.jsx
├── InventarioMaquilas.jsx
├── TablaInventario.jsx
├── TablaKardex.jsx
├── TablaMovimientos.jsx
├── TablaMaquilas.jsx
├── TablaConfirmacionProduccion.jsx
├── ModalAgregarProducto.jsx
├── ModalEditarCantidades.jsx
├── ModalEditarExistencias.jsx
├── ModalEditarMaquilas.jsx
└── ModalCambiarUsuario.jsx
```

### **POS/Caja (15+ componentesincluidos en CajaScreen.jsx)**
```
Dentro de CajaScreen.jsx (160KB):
├─ Búsqueda de productos
├─ Carrito de compras
├─ Selector de método de pago
├─ Cálculo de cambio
├─ Impresión de ticket
├─ Cliente selector/creador
└─ Gestión de turnos
```

### **Pedidos (6 componentes)**
```
components/Pedidos/
├── PedidoFormulario.jsx
├── PedidoDetalle.jsx
├── PedidoLista.jsx
├── Sidebar.jsx (con CSS)
├── ClienteModal.jsx
└── ProductoSelector.jsx
```

### **Comunes (15+ componentes)**
```
components/common/
├── DateSelector.jsx - Selector de fecha
├── ProductSearch.jsx - Búsqueda de productos
├── ClienteSearch.jsx - Búsqueda de clientes
├── Table.jsx - Tabla reutilizable
├── Modal.jsx - Modal genérico
├── Button.jsx - Botón personalizado
├── Input.jsx - Input con validación
├── Select.jsx - Select personalizado
├── Loading.jsx - Indicador de carga
├── Alert.jsx - Alertas
└── ...
```

---

## 🔄 **CONTEXTOS (13)**

### **ProductosContext.jsx** (10KB)
```javascript
Propósito: Gestión global de productos
Estado:
- productos: []
- loading: false
- error: null

Funciones:
- fetchProductos()
- addProducto(data)
- updateProducto(id, data)
- deleteProducto(id)
- refreshProductos()

Usado en:
- Todos los módulos que usan productos
- POS, Cargue, Pedidos, Inventario
```

### **UnifiedProductContext.jsx** (29KB)
```javascript
Propósito: Contexto unificado de productos
Características:
- Cache inteligente
- Lazy loading
- Optimización de memoria
- Sincronización automática

Usado en:
- Planeación, Producción, Cargue
```

### **CajeroContext.jsx** (10KB)
```javascript
Propósito: Gestión de caja y turnos
Estado:
- turnoActual: null
- cajeroActual: null
- montoApertura: 0
- carrito: []
- total: 0

Funciones:
- abrirTurno(monto)
- cerrarTurno()
- agregarAlCarrito(producto, cantidad)
- registrarVenta()
- imprimirTicket()

Usado en:
- CajaScreen, PosScreen, TurnoScreen
```

###**VendedoresContext.jsx** (5KB)
```javascript
Propósito: Gestión de vendedores
Estado:
- vendedores: []

Funciones:
- fetchVendedores()
- addVendedor(data)
- updateVendedor(id, data)

Usado en:
- Planeación, Cargue, Pedidos
```

### **Otros Contextos:**
- **CajeroPedidosContext**: Para pedidos desde caja
- **CajeroRemisionesContext**: Para remisiones
- **ModalContext**: Gestión de modales globales
- **ProductContext**: Producto individual
- **UsuariosContext**: Gestión de usuarios

---

## 🛠️ **SERVICIOS (24)**

### **api.js** (34KB) - SERVICIO PRINCIPAL
```javascript
Funcionalidades:
- axiosInstance configurado
- Interceptores de request/response
- Manejo de errores global
- Refresh de token (si aplica)
- Base URL: process.env.REACT_APP_API_URL

Endpoints exportados:
- API.productos.getAll()
- API.productos.create(data)
- API.stock.getAll()
- API.ventas.create(data)
- ... (50+ funciones)

Usado por: Todos los componentes

Ejemplo:
import API from '../services/api';

const productos = await API.productos.getAll();
const venta = await API.ventas.create(ventaData);
```

### **cargueApiService.js** (24KB)
```javascript
Funciones específicas de Cargue:
- getCargue(vendedorId, dia, fecha)
- guardarCargue(data)
- obtenerVentasTiempoReal(vendedorId, fecha)
- cerrarTurnoVendedor(data)
- verificarEstadoDia(vendedorId, dia, fecha)
- actualizarCheckVendedor(data)

Usado en:
- PlantillaOperativa, BotonLimpiar, ResumenVentas
```

### **cargueRealtimeService.js** (12KB)
```javascript
Propósito: Sincronización en tiempo real
Features:
- Polling automático
- WebSocket (si implementado)
- Actualización de vendidas desde app

Funciones:
- startRealTimeSync(vendedorId, fecha, callback)
- stopRealTimeSync()
- getSyncStatus()

Usado en:
- PlantillaOperativa (monitoreo)
```

### **cajeroService.js** (23KB)
```javascript
Funciones POS/Caja:
- abrirTurno(cajeroId, monto)
- cerrarTurno(turnoId, data)
- registrarVenta(ventaData)
- obtenerVentasTurno(turnoId)
- realizarArqueoCaja(arqueoData)
- imprimirTicket(ventaId)

Usado en:
- CajaScreen, PosScreen, TurnoScreen
```

### **cajaService.js** (11KB)
```javascript
Funciones complementarias de caja:
- calcularCambio(total, entregado)
- formatearMoneda(valor)
- validarMetodoPago(metodo)
- obtenerConfiguracionImpresion()

Usado en:
- CajaScreen
```

### **productIntegration.js** (3.6KB)
```javascript
Propósito: Integración de productos entre contextos
Funciones:
- syncProducts()
- mergeProducts(local, remote)
- resolveConflicts()

Usado internamente por ProductosContext
```

### **Servicios de Imagen:**
```
imageService.js (4KB) - Gestión de imágenes
localImageService.js (4KB) - Imágenes locales
sharedImageService.js (3KB) - Imágenes compartidas
fileSystemImageService.js (2KB) - Sistema de archivos
```

### **Servicios de BD Local:**
```
simpleStorage.js (10KB) - Cache localStorage
syncService.js (4KB) - Sincronización
disableSyncService.js (2KB) - Control de sync
```

### **Servicios Específicos:**
```
clienteService.js (3KB) - Gestión de clientes
listaPrecioService.js (3.5KB) - Listas de precios
loteService.js (3KB) - Gestión de lotes
rutasService.js (2.4KB) - Rutas de vendedores
vendedorService.js (5.5KB) - Gestión de vendedores
sucursalService.js (8KB) - Sucursales
registroInventarioService.js (3KB) - Inventario
estadoCompletadoService.js (10KB) - Estados de cargue
```

---

## 🎨 **ESTILOS (CSS)**

```
styles/
├── index.css - Estilos globales
├── TablaKardex.css
├── KardexCompact.css
├── InventarioPlaneacion.css
├── InventarioProduccion.css
├── BorderlessInputs.css
├── ActionButtons.css
├── Pedidos/Sidebar.css
└── ... (más archivos CSS)
```

---

## 🔌 **HOOKS PERSONALIZADOS**

```
hooks/
├── useAuth.js - Autenticación
├── useLocalStorage.js - localStorage
├── useDebounce.js - Debounce
├── useFetch.js - Fetch genérico
└── useForm.js - Gestión de formularios
```

---

## 📡 **FLUJO DE DATOS TÍPICO**

```
EJEMPLO: Crear Venta en POS

Usuario → CajaScreen.jsx
    ↓
Agrega productos al carrito
    ↓
CajeroContext.agregarAlCarrito()
    ↓
Usuario completa venta
    ↓
CajeroContext.registrarVenta()
    ↓
cajeroService.registrarVenta(ventaData)
    ↓
api.js → POST /api/ventas/
    ↓
Backend crea Venta
    ↓
DetalleVenta.save() → MovimientoInventario
    ↓
Stock actualizado automáticamente
    ↓
Response → Success
    ↓
CajeroContext actualiza estado
    ↓
cajeroService.imprimirTicket()
    ↓
Ticket impreso
```

---

## 🔄 **SINCRONIZACIÓN APP ↔ WEB**

### **En Planeación (InventarioPlaneacion.jsx):**
```javascript
// Líneas 379-412: Consulta IA
const iaResponse = await fetch(`${API_URL}/planeacion/prediccion_ia/`, {
  method: 'POST',
  body: JSON.stringify({ fecha, datos_contextuales })
});

// Líneas 224-236: Consulta Cargue
const responses = await Promise.all([
  fetch(`${API_URL}/planeacion/?fecha=${fecha}`),
  fetch(`${API_URL}/stock/`),
  fetch(`${API_URL}/pedidos/`),
  fetch(`${API_URL}/cargue-id1/?fecha=${fecha}`),
  // ... hasta ID6
]);

// Líneas 430: Suma solicitadas
const solicitadoFinal = solicitadasMap[producto] || 0;

// Líneas 589: Guarda con IA
datosPlaneacion = {
  fecha, producto_nombre,
  existencias, solicitadas, pedidos,
  total, orden,
  ia: producto.ia || 0  // 🧠
};
```

### **En Cargue (PlantillaOperativa.jsx):**
```javascript
// Consulta ventas de app en tiempo real
const syncVentas = async () => {
  const response = await cargueApiService.obtenerVentasTiempoReal(
    vendedorId, fecha
  );
  
  // Actualiza vendidas en tabla
  response.forEach(venta => {
    updateVendidas(venta.producto, venta.cantidad);
  });
};

// Se ejecuta cada 30s o al evento
useEffect(() => {
  const interval = setInterval(syncVentas, 30000);
  return () => clearInterval(interval);
}, []);
```

---

## 📊 **RESUMEN RÁPIDO**

### **Páginas: 40**
- Más grande: **CajaScreen.jsx** (160KB)
- Con IA: **InventarioPlaneacion.jsx** (42KB)
- Más compleja: **BotonLimpiar.jsx** (121KB)

### **Componentes: 141**
- Cargue: 28
- Inventario: 14
- POS/Caja: 15+
- Pedidos: 6
- Comunes: 15+
- Otros: 60+

### **Contextos: 13**
- Principales: ProductosContext, CajeroContext
- Unificado: UnifiedProductContext (29KB)

### **Servicios: 24**
- Principal: **api.js** (34KB)
- Específicos: cargueApiService, cajeroService, etc.

### **Estados Globales:**
- Productos (cache)
- Carrito de compras
- Turno actual
- Vendedores
- Clientes

---

## 🎯 **PARA NUEVO DESARROLLADOR**

### **Archivos que DEBES entender:**
1. **api.js** - Todas las llamadas al backend
2. **ProductosContext.jsx** - Gestión de productos
3. **CajeroContext.jsx** - Gestión de POS
4. **InventarioPlaneacion.jsx** - Planeación con IA
5. **PlantillaOperativa.jsx** - Cargue principal

### **Flujos que DEBES conocer:**
1. **POS:** CajaScreen → cajeroService → api.js → Backend
2. **Planeación:** InventarioPlaneacion → IA → Guardar
3. **Cargue:** PlantillaOperativa → Sync → BotonLimpiar
4. **Pedidos:** PedidosScreen → afectarInventario

### **Reglas:**
- ✅ Usar contextos para estado global
- ✅ Usar servicios para llamadas API
- ✅ Usar api.js para endpoints
- ❌ No hacer fetch directo (usar api.js)
- ❌ No mutar estado directamente

---

**FIN - REFERENCIA FRONTEND COMPLETA** ✅  
**Úsalo junto con:** `ARQUITECTURA_SISTEMA_CRM.md`, `REFERENCIA_MODELOS_API.md`
