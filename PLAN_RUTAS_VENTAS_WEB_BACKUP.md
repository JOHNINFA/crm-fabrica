# 📋 PLAN RUTAS Y VENTAS WEB - DOCUMENTACIÓN COMPLETA

## 🎯 OBJETIVO
Sistema completo de gestión de rutas de vendedores con:
- Administración de rutas y clientes desde web
- Visualización de rutas en app móvil
- Registro de ventas desde app móvil
- Reportes avanzados en web
- Auto-creación de clientes desde ventas

---

## ✅ IMPLEMENTACIÓN COMPLETADA - 28 NOV 2025

### 📊 Resumen

| Componente | Estado | Descripción |
|------------|--------|-------------|
| **Backend Django** | ✅ Completado | Modelos, API, reportes y auto-creación de clientes |
| **Frontend Web** | ✅ Completado | 3 pestañas: Ventas, Clientes, Reportes |
| **App Móvil** | ✅ Completado | Integración completa con backend |
| **Base de Datos** | ✅ PostgreSQL | Todas las tablas creadas y migraciones aplicadas |

---

## 🏗️ ARQUITECTURA

### 1. BACKEND (Django REST Framework)

#### Modelos (`api/models.py`)

**VentaRuta** (Actualizado)
```python
class VentaRuta(models.Model):
    vendedor = models.ForeignKey(Vendedor, on_delete=models.CASCADE)
    ruta = models.ForeignKey(Ruta, on_delete=models.SET_NULL, null=True, blank=True)
    cliente_nombre = models.CharField(max_length=200)
    nombre_negocio = models.CharField(max_length=255, blank=True, default='')  # ✅ NUEVO
    cliente = models.ForeignKey(ClienteRuta, on_delete=models.SET_NULL, null=True, blank=True)
    fecha = models.DateTimeField(default=timezone.now)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    metodo_pago = models.CharField(max_length=50, default='EFECTIVO')
    detalles = models.JSONField(default=list)
    productos_vencidos = models.JSONField(default=list, blank=True)
    foto_vencidos = models.ImageField(upload_to='vencidos/%Y/%m/%d/', null=True, blank=True)
    sincronizado = models.BooleanField(default=False)
```

**EvidenciaVenta** (Nuevo)
```python
class EvidenciaVenta(models.Model):
    venta = models.ForeignKey(VentaRuta, on_delete=models.CASCADE, related_name='evidencias')
    producto_id = models.IntegerField(null=True, blank=True)
    imagen = models.ImageField(upload_to='vencidos/%Y/%m/%d/')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
```

#### API Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/ventas-ruta/reportes/` | GET | Reportes por período (día, mes, trimestre, semestre, año) |
| `/api/ventas-ruta/` | GET | Listar ventas con filtros |
| `/api/ventas-ruta/` | POST | Crear venta (auto-crea cliente si no existe) |

**Parámetros de Reportes:**
- `periodo`: dia, semana, mes, trimestre, semestre, año
- `vendedor_id`: Filtrar por vendedor
- `fecha_inicio`: Fecha inicio personalizada
- `fecha_fin`: Fecha fin personalizada

**Respuesta de Reportes:**
```json
{
    "periodo": "mes",
    "fecha_inicio": "2025-11-01",
    "fecha_fin": "2025-11-28",
    "total_general": 960300,
    "cantidad_ventas": 19,
    "ventas_por_vendedor": [...],
    "ventas_por_cliente": [...],
    "ventas_por_producto": [...],
    "ventas_por_dia": [...]
}
```

#### Lógica de Auto-Creación de Clientes (`api/views.py`)

```python
# En VentaRutaViewSet.create()
nombre_negocio = data.get('nombre_negocio', '')

if nombre_negocio and nombre_negocio.strip():
    # Buscar si ya existe
    cliente_existente = ClienteRuta.objects.filter(
        nombre_negocio__iexact=nombre_negocio.strip()
    ).first()
    
    if not cliente_existente:
        # Buscar ruta del vendedor
        ruta_vendedor = Ruta.objects.filter(vendedor=vendedor_obj).first()
        
        if ruta_vendedor:
            # Crear cliente automáticamente
            nuevo_cliente = ClienteRuta.objects.create(
                ruta=ruta_vendedor,
                nombre_negocio=nombre_negocio.strip(),
                nombre_contacto=cliente_nombre.strip(),
                orden=ClienteRuta.objects.filter(ruta=ruta_vendedor).count() + 1
            )
            venta.cliente = nuevo_cliente
            venta.save()
```

---

### 2. FRONTEND WEB (React)

#### Componente Principal: ReporteVentasRuta.jsx

**Estructura con 3 Pestañas:**

```jsx
<Tabs>
    {/* PESTAÑA 1: VENTAS DEL DÍA */}
    <Tab eventKey="ventas" title="Ventas del Día">
        - Filtros: Fecha, Vendedor
        - Resumen: Total ventas, Cantidad de pedidos
        - Tabla: Hora, Vendedor, Negocio, Cliente, Total
        - Botón Recargar (con spinner)
        - Modal detalle con productos y vencidos
    </Tab>
    
    {/* PESTAÑA 2: CLIENTES POR VENDEDOR */}
    <Tab eventKey="clientes" title="Clientes por Vendedor">
        - Lista de vendedores (izquierda)
        - Clientes del vendedor seleccionado (derecha)
        - CRUD completo: Agregar, Editar, Eliminar
        - Campos: Negocio, Contacto, Teléfono, Días, Orden
    </Tab>
    
    {/* PESTAÑA 3: REPORTES */}
    <Tab eventKey="reportes" title="Reportes">
        - Filtros: Período, Vendedor, Fechas personalizadas
        - Resumen: Total general, Cantidad de ventas
        - Ventas por Vendedor (tabla)
        - Top Clientes (tabla)
        - Ventas por Producto (tabla)
    </Tab>
</Tabs>
```

#### Servicios (`frontend/src/services/rutasService.js`)

```javascript
rutasService = {
    // Reportes (NUEVO)
    obtenerReportesVentas: async (periodo, vendedorId, fechaInicio, fechaFin) => {
        let url = `${API_URL}/ventas-ruta/reportes/?periodo=${periodo}`;
        if (vendedorId) url += `&vendedor_id=${vendedorId}`;
        if (fechaInicio) url += `&fecha_inicio=${fechaInicio}`;
        if (fechaFin) url += `&fecha_fin=${fechaFin}`;
        return await axios.get(url);
    },
    
    // Existentes
    obtenerVentasRuta(vendedorId, fecha),
    obtenerRutas(),
    obtenerClientesRuta(rutaId, dia),
    crearClienteRuta(cliente),
    actualizarClienteRuta(id, cliente),
    eliminarClienteRuta(id),
    obtenerVendedores()
}
```

#### Cambios en OtrosScreen.jsx

```jsx
// Título dinámico según módulo activo
<h2>
    <span className="material-icons">
        {activeModule === 'ventas_ruta' ? 'point_of_sale' : 'settings'}
    </span>
    {activeModule === 'ventas_ruta' ? 'Ventas de Ruta' : 'Otros - Configuraciones'}
</h2>
```

---

### 3. APP MÓVIL (React Native - AP GUERRERO)

#### Cambios en ventasService.js

```javascript
// Envío de venta al backend
const ventaBackend = {
    vendedor_id: venta.vendedor,
    cliente_nombre: venta.cliente_nombre,
    nombre_negocio: venta.cliente_negocio || '',  // ✅ NUEVO
    total: venta.total,
    detalles: venta.productos,
    metodo_pago: 'EFECTIVO',
    productos_vencidos: productosVencidosFormateados,
    foto_vencidos: venta.fotoVencidas || {}
};

await enviarVentaRuta(ventaBackend);
```

#### Cambios en rutasApiService.js

```javascript
export const enviarVentaRuta = async (ventaData) => {
    const formData = new FormData();
    
    formData.append('vendedor', ventaData.vendedor || ventaData.vendedor_id);
    formData.append('cliente_nombre', ventaData.cliente_nombre);
    formData.append('nombre_negocio', ventaData.nombre_negocio);  // ✅ NUEVO
    formData.append('total', ventaData.total);
    formData.append('metodo_pago', ventaData.metodo_pago);
    formData.append('detalles', JSON.stringify(ventaData.detalles || []));
    formData.append('productos_vencidos', JSON.stringify(ventaData.productos_vencidos || []));
    
    // Fotos de evidencia por producto
    if (ventaData.foto_vencidos) {
        for (const productoId in ventaData.foto_vencidos) {
            const fotosProducto = ventaData.foto_vencidos[productoId];
            if (Array.isArray(fotosProducto)) {
                fotosProducto.forEach((fotoUri, index) => {
                    formData.append(`evidencia_${productoId}_${index}`, {
                        uri: fotoUri,
                        type: 'image/jpeg',
                        name: `evidencia_${productoId}_${index}_${Date.now()}.jpg`,
                    });
                });
            }
        }
    }
    
    const response = await fetch(`${API_BASE}/ventas-ruta/`, {
        method: 'POST',
        body: formData,
    });
    
    return await response.json();
};
```

#### Cambios en ResumenVentaModal.js

```jsx
// Modal de confirmación de venta
<View style={styles.seccion}>
    {cliente_negocio && (
        <>
            <Text style={styles.label}>Negocio:</Text>
            <Text style={styles.valor}>{cliente_negocio}</Text>
        </>
    )}
    <Text style={[styles.label, cliente_negocio && { marginTop: 8 }]}>Cliente:</Text>
    <Text style={styles.valor}>{cliente_nombre}</Text>
</View>
```

---

## 🔄 FLUJO COMPLETO

### 1. Desde la App Móvil (Vendedor)

**Realizar Venta:**
1. Seleccionar cliente (ej: "Tienda El Sol")
2. Agregar productos
3. (Opcional) Agregar productos vencidos con foto
4. Confirmar venta
5. ✅ Se envía al backend con `nombre_negocio`

**Lo que sucede en el backend:**
- Si "Tienda El Sol" NO existe → Se crea automáticamente en `ClienteRuta`
- Si ya existe → Se asocia a la venta
- Queda vinculado a la ruta del vendedor

### 2. Desde el Web (Administrador)

**Ver Ventas:**
1. Ir a: Otros → Ventas de Ruta
2. Pestaña "Ventas del Día"
3. Ver listado con: Negocio, Cliente, Total
4. Click en "Ver" para detalle completo

**Gestionar Clientes:**
1. Pestaña "Clientes por Vendedor"
2. Seleccionar vendedor
3. Ver clientes (incluyendo los auto-creados)
4. Editar: Agregar teléfono, dirección, días de visita, etc.

**Ver Reportes:**
1. Pestaña "Reportes"
2. Seleccionar período (día, mes, trimestre, etc.)
3. Ver:
   - Total de ventas
   - Ventas por vendedor
   - Top clientes
   - Ventas por producto

---

## 📦 BASE DE DATOS

### Migraciones Aplicadas

```bash
# Migración 0047: Agregar nombre_negocio a VentaRuta
python manage.py makemigrations api --name add_nombre_negocio_to_ventaruta
python manage.py migrate api
```

### Estructura Final

```sql
-- Tabla VentaRuta (actualizada)
api_ventaruta (
    id SERIAL PRIMARY KEY,
    vendedor_id VARCHAR(10) REFERENCES api_vendedor(id_vendedor),
    ruta_id INTEGER REFERENCES api_ruta(id),
    cliente_nombre VARCHAR(200),
    nombre_negocio VARCHAR(255) DEFAULT '',  -- ✅ NUEVO
    cliente_id INTEGER REFERENCES api_clienteruta(id),
    fecha TIMESTAMP,
    total DECIMAL(12,2),
    metodo_pago VARCHAR(50),
    detalles JSONB,
    productos_vencidos JSONB,
    foto_vencidos VARCHAR(100),
    sincronizado BOOLEAN DEFAULT FALSE
)

-- Tabla EvidenciaVenta (nueva)
api_evidenciaventa (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER REFERENCES api_ventaruta(id),
    producto_id INTEGER,
    imagen VARCHAR(100),
    fecha_creacion TIMESTAMP
)
```

---

## 🎨 INTERFAZ WEB

### Pestaña 1: Ventas del Día

```
┌─────────────────────────────────────────────────────────┐
│ 📅 Fecha: [28/11/2025]  👤 Vendedor: [Todos ▼]  [🔍 Buscar] │
├─────────────────────────────────────────────────────────┤
│ 💰 $960.300          📦 19                              │
│ Total Ventas         Cantidad de Pedidos                │
├─────────────────────────────────────────────────────────┤
│ Listado de Ventas                        [🔄 Recargar]  │
├──────┬──────────┬─────────────┬─────────┬──────────────┤
│ Hora │ Vendedor │ Negocio     │ Cliente │ Total        │
├──────┼──────────┼─────────────┼─────────┼──────────────┤
│ 12:20│ CARLOS   │ Tienda Sol  │ Jose    │ $26.000 [Ver]│
│ 12:38│ CARLOS   │ Tienda Sol  │ Juan    │ $77.200 [Ver]│
└──────┴──────────┴─────────────┴─────────┴──────────────┘
```

### Pestaña 2: Clientes por Vendedor

```
┌──────────────────┬──────────────────────────────────────┐
│ Vendedores       │ Clientes de: CARLOS                  │
├──────────────────┼──────────────────────────────────────┤
│ ▶ CARLOS    ID1  │ # │ Negocio      │ Contacto │ Días  │
│   MARIA     ID2  ├───┼──────────────┼──────────┼───────┤
│   PEDRO     ID3  │ 1 │ Tienda Sol   │ Jose     │ LU-MI │
│                  │ 2 │ Super Ahorro │ Ana      │ MA-JU │
│                  │                    [+ Agregar Cliente]│
└──────────────────┴──────────────────────────────────────┘
```

### Pestaña 3: Reportes

```
┌─────────────────────────────────────────────────────────┐
│ Período: [Este Mes ▼] Vendedor: [Todos ▼] [📊 Generar] │
├─────────────────────────────────────────────────────────┤
│ 💰 $960.300    📦 19 ventas    📅 01/11 - 28/11        │
├──────────────────────────┬──────────────────────────────┤
│ 💼 Ventas por Vendedor   │ 🏪 Top Clientes              │
│ CARLOS    15  $720.000   │ Tienda Sol      $250.000     │
│ MARIA     4   $240.300   │ Super Ahorro    $180.000     │
├──────────────────────────┴──────────────────────────────┤
│ 📦 Ventas por Producto                                  │
│ AREPA TIPO OBLEA 500Gr    120 unidades    $312.000     │
│ AREPA MEDIANA 330Gr       95 unidades     $199.500     │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ CARACTERÍSTICAS IMPLEMENTADAS

### ✅ Auto-Creación de Clientes
- Cuando se hace una venta desde la app con un negocio nuevo
- Se crea automáticamente en `ClienteRuta`
- Se asocia a la ruta del vendedor
- Después se puede editar desde el web

### ✅ Título Dinámico
- En "Otros" muestra: "Otros - Configuraciones"
- En "Ventas de Ruta" muestra: "Ventas de Ruta"
- Icono cambia según el módulo

### ✅ Botón Recargar
- Actualiza el listado sin recargar la página
- Muestra spinner mientras carga
- Se deshabilita durante la carga

### ✅ Modal de Detalle Mejorado
- Muestra nombre del negocio primero
- Luego el nombre del cliente
- Scroll habilitado para contenido largo
- Muestra productos vendidos
- Muestra productos vencidos (si hay)

### ✅ Reportes Avanzados
- Filtrar por período predefinido o personalizado
- Ver ventas por vendedor
- Ver top clientes
- Ver ventas por producto
- Totales y cantidades

### ✅ Gestión de Clientes
- Ver clientes por vendedor
- Agregar nuevos clientes
- Editar clientes existentes (incluyendo auto-creados)
- Eliminar clientes
- Configurar días de visita múltiples

---

## 🔧 ARCHIVOS MO

### Backend
- `api/models.py` - Agregado campo `nombre_negocio` a VentaRuta
- `api/serializers.py` - Actualizado VentaRutaSeriali
- `api/views.py` - Agregado endpoint de reportes y lógica de autcreación
- `api/migrations/0047_add_nombre_negocio_to_ventaruta.py` - Nueva ción

### Frontend Web
- `frontend/src/components/rutas/ReporteVentasRuta.jsx` - Reescritoas
- `frontend/src/services/rutasService.js` - Agregado `obtenerR`
- `f

### App Móvil
- `AP GUERRERO/serv
- `AP GUERRERO/serd
- `AP

---

## 📝 DATOS DE EJEMPLO

### Venta Completa

```json
{
    "vendedor_id": "ID1",
    "cliente_nombre": "Jose",
    "nombre_negocio": "Tienda El Sol",
    "total": 26000,

    "detalles": [
        {
            "id": 17,
       ",
            "cantidad": 10,
            "precio": 2600,
    
        }
    ],
    "produ[
        {
            "id": 17,
            "producto": "AREPA TIPO OBLEA 500Gr"
            "cantidad: 1,
            "motivo": "No especificado"
        }
    ]
}
```

### Respuesta de Repoes

```json
{
    "periodo": "mes",
    "fecha_inicio": "2025-11-01",
    "fecha_fin": "2025-11-28",
    "total_general": 90,
    "cantidad_ventas": 19,
    "ventas_po: [
        {
      ",
        ,
   00.0,
": 15
        }
    ],
    "ventas_por_cliente": [
        {
            "cliente_nombre": "Jose",
",
   
ad": 8
        }
,
    "ventas_por_producto": [
{
            "producto": "AREPA TIPO OBLEA 
            ": 120,
            000.0
        }
    ]
}
```

--



### Mejoras Futuras
- [ ] Gráfic)
- [ ] Exportar reportes a Excel/PDF
- [ ] Notificaciones push cuando hay na
- [ ] Mapa de rutas con ubicación 
- [ ] Historial de visitas por cliente
- [ ] Predicción de ventas con IA

---

**F 23:45
NAL
**Desarrolladores**: EICA
