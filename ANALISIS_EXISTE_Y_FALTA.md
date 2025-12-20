# 📊 ANÁLISIS COMPLETO - QUÉ EXISTE Y QUÉ FALTA

**Fecha:** 2025-12-17  
**Estado:** REVISIÓN COMPLETADA  

---

## ✅ LO QUE YA EXISTE

### 🗄️ BACKEND (Django)

#### Modelos Existentes:

1. **`CargueID1` - `CargueID6`** (6 modelos)
   - ✅ `dia` (CharField)
   - ✅ `fecha` (DateField)
   - ✅ `v` (BooleanField) - Checkbox vendedor
   - ✅ `d` (BooleanField) - Checkbox despachador
   - ✅ `producto` CharField
   - ✅ `cantidad, dctos, adicional, devoluciones, vencidas`
   - ✅ `lotes_vencidos` (TextField como JSON)
   - ✅ `lotes_produccion` (TextField como JSON)
   - ✅ `total, valor, neto`
   - ✅ `base_caja, total_despacho, total_pedidos`
   - ✅ `nequi, daviplata, descuentos`
   - ✅ `venta` (DecimalField)
   - ✅ **Control de cumplimiento** (9 campos)
   - ✅ `responsable` CharField
   - ✅ `ruta` CharField
   - ✅ `activo` BooleanField
   - ✅ `fecha_creacion, fecha_actualizacion`
   
   ❌ **FALTA:**
   - Estado del cargue (SUGERIDO, ALISTAMIENTO, etc.)
   - Timestamps de checks (cuándo se marcó V/D)
   - Usuario que marcó cada check
   - Campo `inventario_afectado`

2. **`VentaRuta`** ✅ YA EXISTE
   ```python
   vendedor = ForeignKey(Vendedor)
   ruta = ForeignKey(Ruta)
   cliente_nombre = CharField
   nombre_negocio = CharField
   cliente = ForeignKey(ClienteRuta)
   fecha = DateTimeField
   total = DecimalField
   metodo_pago = CharField
   detalles = JSONField  # [{producto, cantidad, precio, subtotal}]
   productos_vencidos = JSONField
   foto_vencidos = ImageField
   sincronizado = BooleanField
   ```

3. **Otros modelos relevantes:**
   - ✅ `Producto`
   - ✅ `Stock`
   - ✅ `MovimientoInventario`
   - ✅ `Pedido` / `DetallePedido`
   - ✅ `Vendedor`
   - ✅ `Ruta` / `ClienteRuta`
   - ✅ `Planeacion`

#### API/Endpoints Existentes:

1. **VentaRutaViewSet** ✅
   - GET `/api/ventas-ruta/` (con filtros)
   - POST `/api/ventas-ruta/` 
   - GET `/api/ventas-ruta/{id}/`
   - PUT/PATCH `/api/ventas-ruta/{id}/`
   - DELETE `/api/ventas-ruta/{id}/`
   - GET `/api/ventas-ruta/reportes/` - Reportes con agregaciones

   Filtros disponibles:
   - `vendedor_id`
   - `fecha`

❌ **FALTA:**
   - Endpoint para actualizar check despachador
   - Endpoint para actualizar check vendedor
   - Endpoint para actualizar ADICIONAL
   - Endpoint para actualizar DCTOS
   - Endpoint para calcular devoluciones automáticamente
   - Endpoint para obtener estado del cargue
   - Endpoint para cambiar estado (SUGERIDO → ALISTAMIENTO → etc.)

---

### 🖥️ FRONTEND WEB (React)

#### Componentes Cargue Existentes:

1. **`BotonLimpiar.jsx`** (92KB) ✅
   - Maneja estados del botón
   - Validaciones
   - Guardado en BD
   - Estados actuales:
     - ALISTAMIENTO
     - ALISTAMIENTO_ACTIVO
     - FINALIZAR
     - COMPLETADO
   
   ❌ **PROBLEMAS:**
   - Descuenta inventario en ALISTAMIENTO_ACTIVO (debe ser en COMPLETADO)
   - No usa ventas de app para calcular devoluciones
   - No tiene transición automática cuando V+D están marcados

2. **`PlantillaOperativa.jsx`** ✅
   - Plantilla principal del cargue
   - Tabla de productos
   - Checkboxes V y D
   - Campos editables (cantidad, dctos, adicional, etc.)

3. **`ResumenVentas.jsx`** ✅
   - Muestra resumen de ventas
   - Base caja, nequi, daviplata

4. **`ControlCumplimiento.jsx`** ✅
   - Tabla de control de cumplimiento

5. **`LotesVencidos.jsx`** ✅
   - Registro de lotes vencidos

6. **`VerificarGuardado.jsx`** ✅
   - Verifica datos guardados

7. **Otros componentes:**
   - `Produccion.jsx` ✅
   - `MenuSheets.jsx` ✅
   - `BotonVerPedidos.jsx` ✅

❌ **FALTA:**
   - Componente para mostrar ventas en tiempo real (desde app)
   - Funcionalidad para calcular devoluciones automáticamente
   - Integración con VentaRuta
   - Actualizar lógica de descuento de inventario

---

### 📱 APP MÓVIL (React Native - AP GUERRERO)

#### Componentes Existentes:

1. **`Cargue.js`** ✅
   - Muestra productos del cargue
   - Checkboxes V
   - Sincronización básica

2. **`VentasScreen.js`** ✅ (33KB)
   - Pantalla principal de ventas
   - Registro de ventas
   - Múltiples métodos de pago
   - Guarda en VentaRuta

3. **`DevolucionesVencidas.js`** ✅
   - Registro de devoluciones y vencidas
   - Foto de vencidos

4. **`ClienteSelector.js`** ✅
   - Selección de clientes

5. **`ResumenVentaModal.js`** ✅
   - Modal con resumen de venta

6. **Carpeta Rutas:**
   - Gestión de rutas
   - Clientes por ruta

❌ **FALTA:**
   - Sincronización de checkbox V con BD
   - Indicador de estado del cargue (SUGERIDO, ALISTAMIENTO, etc.)
   - Mostrar sugerencias de IA
   - Alertas cuando sobre-carga o falta producto
   - Conexión VentasScreen → calcular devoluciones automáticamente

---

## ❌ LO QUE FALTA IMPLEMENTAR

### 1. BACKEND

#### Campos nuevos en CargueIDx:
```python
# Agregar a todos (ID1-ID6)
estado = models.CharField(
    max_length=30,
    choices=[
        ('SUGERIDO', 'Sugerido'),
        ('ALISTAMIENTO_ACTIVO', 'Alistamiento Activo'),
        ('DESPACHO', 'Despacho'),
        ('COMPLETADO', 'Completado'),
    ],
    default='SUGERIDO'
)

# Timestamps de checks
despachador_timestamp = models.DateTimeField(null=True, blank=True)
despachador_usuario = models.CharField(max_length=100, blank=True)
vendedor_timestamp = models.DateTimeField(null=True, blank=True)

# Control de inventario
inventario_afectado = models.BooleanField(default=False)
fecha_inventario_afectado = models.DateTimeField(null=True, blank=True)
```

#### Endpoints nuevos:
```python
# En api/views.py

@api_view(['POST'])
def actualizar_check_despachador(request):
    """Actualiza checkbox D"""
    pass

@api_view(['POST'])
def actualizar_check_vendedor(request):
    """Actualiza checkbox V (desde app)"""
    pass

@api_view(['POST'])
def actualizar_adicional(request):
    """Actualiza campo ADICIONAL"""
    pass

@api_view(['POST'])
def actualizar_dctos(request):
    """Actualiza campo DCTOS"""
    pass

@api_view(['GET'])
def calcular_devoluciones(request, id_vendedor, fecha):
    """
    Calcula devoluciones automáticamente:
    devol = (cantidad - dctos + adicional) - ventas_app - vencidas
    """
    pass

@api_view(['GET'])
def obtener_estado_cargue(request, id_vendedor, fecha):
    """Obtiene estado actual del cargue"""
    pass

@api_view(['POST'])
def cambiar_estado_cargue(request):
    """Cambia estado del cargue"""
    pass

@api_view(['GET'])
def obtener_ventas_tiempo_real(request, id_vendedor, fecha):
    """
    Obtiene ventas actuales del día desde VentaRuta.
    Agrupado por producto, método de pago, total.
    """
    pass
```

### 2. FRONTEND WEB

#### Modificaciones a BotonLimpiar.jsx:

1. **Renombrar a** `BotonCargue.jsx`

2. **Agregar lógica de transición automática:**
```javascript
useEffect(() => {
  if (estado === 'ALISTAMIENTO_ACTIVO') {
    // Verificar si todos tienen V + D
    const todosConChecks = productosConCantidad.every(p => 
      p.v && p.d
    );
    
    if (todosConChecks) {
      setEstado('DESPACHO');
      guardarEstadoEnBD('DESPACHO');
    }
  }
}, [productosConCantidad, estado]);
```

3. **Modificar `manejarCompletar` para afectar inventario al final:**
```javascript
const manejarCompletar = async () => {
  // 1. Obtener ventas desde VentaRuta
  const ventasApp = await obtenerVentasDesdeApp(idVendedor, fecha);
  
  // 2. Calcular devoluciones automáticamente
  const devoluciones = await calcularDevoluciones(idVendedor, fecha);
  
  // 3. AFECTAR INVENTARIO (solo aquí)
  for (const producto of productos) {
    // Descontar ventas
    await actualizarInventario(producto.id, ventasApp[producto.nombre], 'RESTAR');
    
    // Descontar vencidas
    await actualizarInventario(producto.id, producto.vencidas, 'RESTAR');
    
    // Sumar devoluciones
    await actualizarInventario(producto.id, devoluciones[producto.nombre], 'SUMAR');
  }
  
  // 4. Descontar pedidos
  await descontarPedidos();
  
  // 5. Cambiar estado a COMPLETADO
  setEstado('COMPLETADO');
};
```

4. **Agregar componente VentasEnTiempoReal:**
```jsx
const VentasEnTiempoReal = ({ idVendedor, fecha }) => {
  const [ventas, setVentas] = useState(null);
  
  useEffect(() => {
    const cargarVentas = async () => {
      const response = await fetch(
        `http://localhost:8000/api/ventas-ruta/?vendedor_id=${idVendedor}&fecha=${fecha}`
      );
      const data = await response.json();
      
      // Procesar detalles por producto
      const ventasPorProducto = {};
      data.forEach(venta => {
        venta.detalles.forEach(detalle => {
          const nombre = detalle.nombre || detalle.producto;
          if (!ventasPorProducto[nombre]) {
            ventasPorProducto[nombre] = 0;
          }
          ventasPorProducto[nombre] += detalle.cantidad;
        });
      });
      
      setVentas(ventasPorProducto);
    };
    
    cargarVentas();
    const interval = setInterval(cargarVentas, 30000); // cada 30s
    
    return () => clearInterval(interval);
  }, [idVendedor, fecha]);
  
  return (
    <Card>
      <Card.Header>📊 Ventas en Tiempo Real</Card.Header>
      <Card.Body>
        {ventas && Object.keys(ventas).map(producto => (
          <div key={producto}>
            <strong>{producto}:</strong> {ventas[producto]} und
          </div>
        ))}
      </Card.Body>
    </Card>
  );
};
```

#### Modificaciones a PlantillaOperativa.jsx:

1. **Guardar en BD cuando se marca check D:**
```javascript
const handleCheckDChange = async (producto, checked) => {
  // Actualizar local
  setProductos(prev => ...);
  
  // Guardar en BD
  await fetch('http://localhost:8000/api/cargue/check-despachador/', {
    method: 'POST',
    body: JSON.stringify({
      id_vendedor: idVendedor,
      fecha: fecha,
      producto: producto.nombre,
      checked: checked,
      usuario: usuarioActual
    })
  });
};
```

2. **Similar para ADICIONAL y DCTOS**

### 3. APP MÓVIL

#### Modificaciones a Cargue.js:

1. **Sincronizar checkbox V con BD:**
```javascript
const marcarCheckVendedor = async (producto) => {
  try {
    const response = await fetch(
      'http://192.168.1.100:8000/api/cargue/check-vendedor/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_vendedor: idVendedor,
          fecha: fecha,
          producto: producto.nombre,
          checked: true
        })
      }
    );
    
    if (response.ok) {
      Alert.alert('✅', 'Producto marcado');
      // Recargar cargue
      cargarCargue();
    }
  } catch (error) {
    Alert.alert('Error', 'No se pudo sincronizar');
  }
};
```

2. **Agregar indicador de estado:**
```jsx
const EstadoBadge = ({ estado }) => {
  const colores = {
    'SUGERIDO': '#6c757d',
    'ALISTAMIENTO_ACTIVO': '#17a2b8',
    'DESPACHO': '#28a745',
    'COMPLETADO': '#007bff'
  };
  
  return (
    <View style={{ backgroundColor: colores[estado], padding: 10 }}>
      <Text style={{ color: 'white' }}>Estado: {estado}</Text>
    </View>
  );
};
```

#### Modificaciones a VentasScreen.js:

Ya está registrando en VentaRuta ✅

Solo necesita:
- Mostrar alertas si sobre-vende (más de lo que tiene en cargue)

---

## 🎯 RESUMEN DE TAREAS

### BACKEND (1-2 días)
- [ ] Migración: Agregar campos a CargueID1-6
- [ ] Crear 8 endpoints nuevos
- [ ] Probar con Postman

### FRONTEND WEB (1-2 días)
- [ ] Renombrar: BotonLimpiar → BotonCargue
- [ ] Agregar transición automática
- [ ] Modificar manejarCompletar
- [ ] Agregar VentasEnTiempoReal
- [ ] Actualizar guardado de checks
- [ ] Probar flujo completo

### APP MÓVIL (1 día)
- [ ] Sincronizar checkbox V
- [ ] Agregar indicador de estado
- [ ] Validaciones de sobre-venta
- [ ] Probar sincronización

---

## 💡 CONCLUSIÓN

**Lo que ya existe:**
- ✅ Modelos base (CargueIDx, VentaRuta)
- ✅ API de VentaRuta (completa)
- ✅ Componentes frontend web (completos pero necesitan ajustes)
- ✅ App móvil con ventas (funcionando)
- ✅ Checkboxes V y D (pero no sincronizados con BD)

**Lo que falta:**
- ❌ Campo `estado` en CargueIDx
- ❌ Endpoints de actualización de checks y campos
- ❌ Endpoint de cálculo de devoluciones
- ❌ Lógica de transición automática
- ❌ Afectar inventario en COMPLETADO (no en ALISTAMIENTO)
- ❌ Sincronización checks con BD
- ❌ Componente ventas tiempo real

**Tiempo estimado:** 3-4 días de trabajo

---

**¿Empezamos con la migración de BD?** 🚀
