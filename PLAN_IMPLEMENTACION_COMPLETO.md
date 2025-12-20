# 🚀 PLAN DE IMPLEMENTACIÓN COMPLETO
## CARGUE WEB + APP GUERRERO + IA

**Fecha:** 2025-12-17  
**Objetivo:** Implementar sistema integrado completo  
**Tiempo estimado:** 5-7 días  

---

## 📋 RESUMEN DE CAMBIOS

### BACKEND (Django)
- ✅ Migración de BD: Agregar campos a `CargueIDx`
- ✅ Modelo nuevo: `VentaRuta` (ventas desde app)
- ✅ Endpoints: CRUD de estados de cargue
- ✅ Endpoints: Registro de ventas desde app
- ✅ Endpoints: Consulta de ventas en tiempo real
- ✅ Lógica: Cálculo automático de devoluciones

### FRONTEND WEB (React)
- ✅ Renombrar: `BotonLimpiar.jsx` → `BotonCargue.jsx`
- ✅ Modificar: Transición automática ALISTAMIENTO → DESPACHO
- ✅ Modificar: COMPLETADO afecta inventario (no DESPACHO)
- ✅ Agregar: Consulta de ventas en tiempo real
- ✅ Agregar: Cálculo automático de devoluciones
- ✅ Modificar: Guardado en BD en cada cambio

### APP MÓVIL (React Native - AP GUERRERO)
- ✅ Modificar: Checkbox V sincronizado con BD
- ✅ Mejorar: Módulo de ventas envía a BD
- ✅ Agregar: Registro de vencidas
- ✅ Agregar: Indicador de estado de cargue
- ✅ Agregar: Sugerencias de IA en tiempo real

---

## 🔧 FASE 1: BACKEND (2-3 días)

### PASO 1.1: Modificar modelo CargueIDx

**Archivo:** `api/models.py`

```python
# Línea ~465: Buscar class CargueID1(models.Model)
# Agregar campos a TODOS los modelos (ID1, ID2, ID3, ID4, ID5, ID6)

class CargueID1(models.Model):
    # ... campos existentes ...
    
    # 🆕 NUEVOS CAMPOS - Agregar al final
    
    # Checkboxes de verificación
    check_despachador = models.BooleanField(default=False, verbose_name="Check Despachador")
    despachador_usuario = models.CharField(max_length=100, blank=True, null=True)
    despachador_timestamp = models.DateTimeField(blank=True, null=True)
    
    check_vendedor = models.BooleanField(default=False, verbose_name="Check Vendedor")
    vendedor_timestamp = models.DateTimeField(blank=True, null=True)
    
    # Estado del cargue
    estado = models.CharField(
        max_length=30, 
        default='SUGERIDO',
        choices=[
            ('SUGERIDO', 'Sugerido'),
            ('ALISTAMIENTO_ACTIVO', 'Alistamiento Activo'),
            ('DESPACHO', 'Despacho'),
            ('COMPLETADO', 'Completado'),
        ]
    )
    
    # Control de inventario
    inventario_afectado = models.BooleanField(default=False)
    fecha_inventario_afectado = models.DateTimeField(blank=True, null=True)
    
    # Auditoría
    fecha_modificacion = models.DateTimeField(auto_now=True)
    usuario_modificacion = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        verbose_name = "Cargue ID1"
        verbose_name_plural = "Cargues ID1"
        ordering = ['-fecha', 'producto']
```

**Crear migración:**
```bash
python manage.py makemigrations
python manage.py migrate
```

### PASO 1.2: Crear modelo VentaRuta

**Archivo:** `api/models.py`

```python
class VentaRuta(models.Model):
    """Ventas registradas desde la app móvil por vendedores"""
    
    METODO_PAGO_CHOICES = [
        ('EFECTIVO', 'Efectivo'),
        ('NEQUI', 'Nequi'),
        ('DAVIPLATA', 'DaviPlata'),
        ('TRANSFERENCIA', 'Transferencia'),
    ]
    
    # Identificación
    vendedor_id = models.CharField(max_length=10)  # ID1, ID2, etc.
    fecha = models.DateField()
    hora = models.TimeField(auto_now_add=True)
    
    # Producto
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.IntegerField()
    valor_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Método de pago
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES)
    
    # Ubicación (opcional para análisis de IA)
    latitud = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitud = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    
    # Cliente (opcional)
    nombre_cliente = models.CharField(max_length=255, blank=True, default='Cliente')
    
    # Estado
    sincronizado = models.BooleanField(default=True)
    
    # Auditoría
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.vendedor_id} - {self.producto.nombre} x{self.cantidad} - {self.fecha}"
    
    class Meta:
        verbose_name = "Venta de Ruta"
        verbose_name_plural = "Ventas de Ruta"
        ordering = ['-fecha', '-hora']
```

### PASO 1.3: Crear endpoints de API

**Archivo:** `api/views.py`

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum, Count
from datetime import datetime

# ==========================================
# ENDPOINTS PARA CARGUE
# ==========================================

@api_view(['POST'])
def actualizar_check_despachador(request):
    """Actualiza checkbox de despachador"""
    data = request.data
    
    # Obtener modelo correcto
    modelo = obtener_modelo_cargue(data['id_vendedor'])
    
    cargue = modelo.objects.get(
        fecha=data['fecha'],
        producto__nombre=data['producto']
    )
    
    cargue.check_despachador = data['checked']
    cargue.despachador_usuario = data.get('usuario', 'Sistema')
    cargue.despachador_timestamp = datetime.now()
    cargue.save()
    
    # Verificar si ambos checks están activos
    if cargue.check_despachador and cargue.check_vendedor:
        cargue.estado = 'DESPACHO'
        cargue.save()
    
    return Response({
        'success': True,
        'estado': cargue.estado
    })

@api_view(['POST'])
def actualizar_check_vendedor(request):
    """Actualiza checkbox de vendedor (desde app)"""
    data = request.data
    
    modelo = obtener_modelo_cargue(data['id_vendedor'])
    
    cargue = modelo.objects.get(
        fecha=data['fecha'],
        producto__nombre=data['producto']
    )
    
    cargue.check_vendedor = data['checked']
    cargue.vendedor_timestamp = datetime.now()
    cargue.save()
    
    # Verificar transición automática
    if cargue.check_despachador and cargue.check_vendedor:
        cargue.estado = 'DESPACHO'
        cargue.save()
    
    return Response({
        'success': True,
        'estado': cargue.estado
    })

@api_view(['POST'])
def actualizar_adicional(request):
    """Actualiza campo ADICIONAL"""
    data = request.data
    
    modelo = obtener_modelo_cargue(data['id_vendedor'])
    
    cargue = modelo.objects.get(
        fecha=data['fecha'],
        producto__nombre=data['producto']
    )
    
    cargue.adicional = data['adicional']
    cargue.usuario_modificacion = data.get('usuario', 'Sistema')
    cargue.save()
    
    return Response({'success': True})

@api_view(['POST'])
def actualizar_dctos(request):
    """Actualiza campo DCTOS"""
    data = request.data
    
    modelo = obtener_modelo_cargue(data['id_vendedor'])
    
    cargue = modelo.objects.get(
        fecha=data['fecha'],
        producto__nombre=data['producto']
    )
    
    cargue.dctos = data['dctos']
    cargue.usuario_modificacion = data.get('usuario', 'Sistema')
    cargue.save()
    
    return Response({'success': True})

# ==========================================
# ENDPOINTS PARA VENTAS APP
# ==========================================

@api_view(['POST'])
def registrar_venta_ruta(request):
    """Registra venta desde app móvil"""
    data = request.data
    
    venta = VentaRuta.objects.create(
        vendedor_id=data['vendedor_id'],
        fecha=data['fecha'],
        producto_id=data['producto_id'],
        cantidad=data['cantidad'],
        valor_unitario=data['valor_unitario'],
        total=data['total'],
        metodo_pago=data['metodo_pago'],
        latitud=data.get('latitud'),
        longitud=data.get('longitud'),
        nombre_cliente=data.get('nombre_cliente', 'Cliente')
    )
    
    return Response({
        'success': True,
        'venta_id': venta.id,
        'mensaje': '✅ Venta registrada correctamente'
    })

@api_view(['GET'])
def obtener_ventas_ruta(request, vendedor_id, fecha):
    """Obtiene ventas de un vendedor en una fecha"""
    ventas = VentaRuta.objects.filter(
        vendedor_id=vendedor_id,
        fecha=fecha
    ).values(
        'producto__nombre',
        'cantidad',
        'total',
        'metodo_pago',
        'hora'
    )
    
    # Resumen
    resumen = VentaRuta.objects.filter(
        vendedor_id=vendedor_id,
        fecha=fecha
    ).aggregate(
        total_cantidad=Sum('cantidad'),
        total_dinero=Sum('total'),
        total_ventas=Count('id')
    )
    
    # Por método de pago
    por_metodo = VentaRuta.objects.filter(
        vendedor_id=vendedor_id,
        fecha=fecha
    ).values('metodo_pago').annotate(
        total=Sum('total')
    )
    
    return Response({
        'ventas': list(ventas),
        'resumen': resumen,
        'por_metodo_pago': list(por_metodo)
    })

@api_view(['GET'])
def calcular_devoluciones(request, vendedor_id, fecha):
    """Calcula devoluciones automáticamente"""
    modelo = obtener_modelo_cargue(vendedor_id)
    cargues = modelo.objects.filter(fecha=fecha)
    
    resultado = []
    
    for cargue in cargues:
        # Cantidad con la que salió
        cantidad_inicial = cargue.cantidad - cargue.dctos + cargue.adicional
        
        # Ventas desde app
        ventas_app = VentaRuta.objects.filter(
            vendedor_id=vendedor_id,
            fecha=fecha,
            producto=cargue.producto
        ).aggregate(Sum('cantidad'))['cantidad__sum'] or 0
        
        # Vencidas
        vencidas = cargue.vencidas or 0
        
        # Devoluciones calculadas
        devoluciones = max(0, cantidad_inicial - ventas_app - vencidas)
        
        resultado.append({
            'producto': cargue.producto.nombre,
            'cantidad_inicial': cantidad_inicial,
            'ventas_app': ventas_app,
            'vencidas': vencidas,
            'devoluciones': devoluciones
        })
    
    return Response(resultado)

# ==========================================
# FUNCIÓN AUXILIAR
# ==========================================

def obtener_modelo_cargue(id_vendedor):
    """Retorna el modelo correcto según el ID"""
    from api.models import CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6
    
    modelos = {
        'ID1': CargueID1,
        'ID2': CargueID2,
        'ID3': CargueID3,
        'ID4': CargueID4,
        'ID5': CargueID5,
        'ID6': CargueID6,
    }
    
    return modelos.get(id_vendedor)
```

### PASO 1.4: Agregar rutas

**Archivo:** `api/urls.py`

```python
urlpatterns = [
    # ... rutas existentes ...
    
    # Rutas de Cargue
    path('cargue/check-despachador/', actualizar_check_despachador, name='check-despachador'),
    path('cargue/check-vendedor/', actualizar_check_vendedor, name='check-vendedor'),
    path('cargue/actualizar-adicional/', actualizar_adicional, name='actualizar-adicional'),
    path('cargue/actualizar-dctos/', actualizar_dctos, name='actualizar-dctos'),
    path('cargue/calcular-devoluciones/<str:vendedor_id>/<str:fecha>/', calcular_devoluciones, name='calcular-devoluciones'),
    
    # Rutas de Ventas Ruta
    path('ventas-ruta/registrar/', registrar_venta_ruta, name='registrar-venta-ruta'),
    path('ventas-ruta/<str:vendedor_id>/<str:fecha>/', obtener_ventas_ruta, name='obtener-ventas-ruta'),
]
```

---

## 🖥️ FASE 2: FRONTEND WEB (2 días)

### PASO 2.1: Renombrar archivo

```bash
cd frontend/src/components/Cargue
mv BotonLimpiar.jsx BotonCargue.jsx
```

Actualizar imports en todos los archivos que lo usen.

### PASO 2.2: Modificar BotonCargue.jsx

**Cambio 1: Transición automática**

```javascript
// Agregar useEffect que monitorea checkboxes
useEffect(() => {
  const verificarTransicion = async () => {
    if (estado === 'ALISTAMIENTO_ACTIVO') {
      // Verificar si todos los productos tienen V y D
      const todosConChecks = productosConCantidad.every(p => 
        p.check_vendedor && p.check_despachador
      );
      
      if (todosConChecks && productosConCantidad.length > 0) {
        console.log('✅ Transición automática: ALISTAMIENTO_ACTIVO → DESPACHO');
        
        setEstado('DESPACHO');
        localStorage.setItem(
          `estado_boton_${dia}_${idSheet}_${fechaFormateadaLS}`,
          'DESPACHO'
        );
        
        // Guardar en BD
        await guardarEstadoEnBD('DESPACHO');
      }
    }
  };
  
  verificarTransicion();
}, [productosConCantidad, estado]);
```

**Cambio 2: Modificar botones**

```javascript
const obtenerConfigBoton = () => {
  switch (estado) {
    case 'ALISTAMIENTO':
      return {
        texto: '📦 SUGERIDO',
        variant: 'outline-secondary',
        disabled: loading,
        onClick: async () => {
          congelarProduccion('ALISTAMIENTO ACTIVADO');
          await congelarPedidosEnPlaneacion();
          await guardarSolicitadasEnPlaneacion();
          await guardarSnapshotPlaneacion();
          
          setEstado('ALISTAMIENTO_ACTIVO');
          await guardarEstadoEnBD('ALISTAMIENTO_ACTIVO');
        }
      };
      
    case 'ALISTAMIENTO_ACTIVO':
      return {
        texto: '📦 ALISTAMIENTO ACTIVO',
        variant: 'dark',
        disabled: true,  // Se activa automáticamente
        onClick: null
      };
      
    case 'DESPACHO':
      return {
        texto: '✅ COMPLETAR',
        variant: 'success',
        disabled: loading,
        onClick: manejarCompletar
      };
      
    case 'COMPLETADO':
      return {
        texto: '🎉 COMPLETADO',
        variant: 'success',
        disabled: true,
        onClick: null
      };
  }
};
```

**Cambio 3: Función manejarCompletar**

```javascript
const manejarCompletar = async () => {
  setLoading(true);
  
  try {
    // 1. Validar
    const errores = await validarAntesDeCompletar();
    if (errores.length > 0) {
      alert('❌ Errores:\n' + errores.join('\n'));
      setLoading(false);
      return;
    }
    
    // 2. Confirmar
    const confirmar = window.confirm(
      '¿Completar jornada?\n\n' +
      'Se afectará el inventario y no se podrá editar.'
    );
    
    if (!confirmar) {
      setLoading(false);
      return;
    }
    
    // 3. Obtener ventas desde app
    const ventasResponse = await fetch(
      `http://localhost:8000/api/ventas-ruta/${idSheet}/${fechaSeleccionada}/`
    );
    const ventasData = await ventasResponse.json();
    
    // 4. Calcular devoluciones
    const devolucionesResponse = await fetch(
      `http://localhost:8000/api/cargue/calcular-devoluciones/${idSheet}/${fechaSeleccionada}/`
    );
    const devolucionesData = await devolucionesResponse.json();
    
    // 5. AFECTAR INVENTARIO
    for (const item of devolucionesData) {
      const producto = products.find(p => p.name === item.producto);
      
      if (!producto) continue;
      
      // Descontar ventas
      if (item.ventas_app > 0) {
        await actualizarInventario(producto.id, item.ventas_app, 'RESTAR');
        console.log(`⬇️ DESCONTADO: ${item.producto} -${item.ventas_app} (ventas)`);
      }
      
      // Descontar vencidas
      if (item.vencidas > 0) {
        await actualizarInventario(producto.id, item.vencidas, 'RESTAR');
        console.log(`⬇️ DESCONTADO: ${item.producto} -${item.vencidas} (vencidas)`);
      }
      
      // Sumar devoluciones
      if (item.devoluciones > 0) {
        await actualizarInventario(producto.id, item.devoluciones, 'SUMAR');
        console.log(`⬆️ SUMADO: ${item.producto} +${item.devoluciones} (devoluciones)`);
      }
    }
    
    // 6. Descontar pedidos
    await descontarPedidos(fechaSeleccionada);
    
    // 7. Guardar en BD
    await guardarDatosCompletos(fechaSeleccionada, [idSheet]);
    
    // 8. Cambiar estado
    setEstado('COMPLETADO');
    await guardarEstadoEnBD('COMPLETADO');
    
    // 9. Limpiar localStorage
    limpiarLocalStorage(fechaSeleccionada, [idSheet]);
    
    alert('✅ Jornada completada exitosamente');
    
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error: ' + error.message);
  }
  
  setLoading(false);
};
```

### PASO 2.3: Agregar display de ventas en tiempo real

```javascript
const VentasEnTiempoReal = ({ idVendedor, fecha }) => {
  const [ventas, setVentas] = useState(null);
  
  useEffect(() => {
    const cargarVentas = async () => {
      const response = await fetch(
        `http://localhost:8000/api/ventas-ruta/${idVendedor}/${fecha}/`
      );
      const data = await response.json();
      setVentas(data);
    };
    
    // Cargar cada 30 segundos
    cargarVentas();
    const interval = setInterval(cargarVentas, 30000);
    
    return () => clearInterval(interval);
  }, [idVendedor, fecha]);
  
  if (!ventas) return <div>Cargando ventas...</div>;
  
  return (
    <Card className="mt-3">
      <Card.Header className="bg-info text-white">
        📊 Ventas en Tiempo Real
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={4}>
            <strong>Total Vendido:</strong>
            <h4>{ventas.resumen.total_cantidad} und</h4>
          </Col>
          <Col md={4}>
            <strong>Total Dinero:</strong>
            <h4>${ventas.resumen.total_dinero?.toLocaleString()}</h4>
          </Col>
          <Col md={4}>
            <strong>Ventas:</strong>
            <h4>{ventas.resumen.total_ventas}</h4>
          </Col>
        </Row>
        
        <hr />
        
        <h6>Por método de pago:</h6>
        {ventas.por_metodo_pago.map(metodo => (
          <div key={metodo.metodo_pago}>
            <strong>{metodo.metodo_pago}:</strong> ${metodo.total.toLocaleString()}
          </div>
        ))}
      </Card.Body>
    </Card>
  );
};

// Agregar en el componente principal
{estado === 'DESPACHO' && (
  <VentasEnTiempoReal 
    idVendedor={idSheet} 
    fecha={fechaSeleccionada} 
  />
)}
```

---

## 📱 FASE 3: APP MÓVIL (2 días)

### PASO 3.1: Modificar Checkbox V

**Archivo:** `AP GUERRERO/components/Cargue.js`

```javascript
const marcarCheckVendedor = async (producto) => {
  try {
    const response = await fetch('http://192.168.1.100:8000/api/cargue/check-vendedor/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_vendedor: idVendedor,  // ID1, ID2, etc.
        fecha: fechaSeleccionada,
        producto: producto.nombre,
        checked: true
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      Alert.alert('✅ Verificado', 'Producto marcado como recibido');
      
      // Si cambió a DESPACHO automáticamente
      if (data.estado === 'DESPACHO') {
        Alert.alert(
          '🚚 Estado Actualizado',
          'Todos los productos verificados. Estado cambió a DESPACHO.'
        );
      }
      
      // Actualizar UI
      cargarCargue();
    }
  } catch (error) {
    Alert.alert('Error', 'No se pudo marcar el producto');
  }
};

// En el render
<TouchableOpacity
  onPress={() => marcarCheckVendedor(producto)}
  disabled={producto.check_vendedor}
>
  <Text>
    {producto.check_vendedor ? '✅ V' : '⬜ V'}
  </Text>
</TouchableOpacity>
```

### PASO 3.2: Mejorar módulo de ventas

**Archivo:** `AP GUERRERO/screens/Ventas.js`

```javascript
const registrarVenta = async (venta) => {
  try {
    const response = await fetch('http://192.168.1.100:8000/api/ventas-ruta/registrar/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendedor_id: idVendedor,
        fecha: new Date().toISOString().split('T')[0],
        producto_id: venta.producto.id,
        cantidad: venta.cantidad,
        valor_unitario: venta.precio,
        total: venta.total,
        metodo_pago: venta.metodoPago,  // EFECTIVO, NEQUI, DAVIPLATA
        nombre_cliente: venta.nombreCliente
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      Alert.alert('✅ Venta Registrada', data.mensaje);
      
      // Limpiar formulario
      limpiarFormulario();
      
      // Actualizar lista de ventas
      cargarVentasDelDia();
    }
  } catch (error) {
    Alert.alert('Error', 'No se pudo registrar la venta');
  }
};
```

### PASO 3.3: Agregar indicador de estado

```javascript
const EstadoCargue = ({ idVendedor, fecha }) => {
  const [estado, setEstado] = useState('CARGANDO...');
  
  useEffect(() => {
    const cargarEstado = async () => {
      try {
        const response = await fetch(
          `http://192.168.1.100:8000/api/cargue/estado/${idVendedor}/${fecha}/`
        );
        const data = await response.json();
        setEstado(data.estado);
      } catch (error) {
        setEstado('ERROR');
      }
    };
    
    cargarEstado();
    const interval = setInterval(cargarEstado, 10000);
    
    return () => clearInterval(interval);
  }, [idVendedor, fecha]);
  
  const obtenerColor = () => {
    switch (estado) {
      case 'SUGERIDO': return '#6c757d';
      case 'ALISTAMIENTO_ACTIVO': return '#17a2b8';
      case 'DESPACHO': return '#28a745';
      case 'COMPLETADO': return '#007bff';
      default: return '#ffc107';
    }
  };
  
  return (
    <View style={{ 
      backgroundColor: obtenerColor(), 
      padding: 10, 
      borderRadius: 5 
    }}>
      <Text style={{ color: 'white', fontWeight: 'bold' }}>
        Estado: {estado}
      </Text>
    </View>
  );
};
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [ ] Migración de BD (agregar campos a CargueIDx)
- [ ] Crear modelo VentaRuta
- [ ] Crear endpoints de checkboxes
- [ ] Crear endpoints de ventas
- [ ] Crear endpoint de cálculo de devoluciones
- [ ] Probar endpoints con Postman

### Frontend Web
- [ ] Renombrar BotonLimpiar → BotonCargue
- [ ] Implementar transición automática
- [ ] Modificar función manejarCompletar
- [ ] Agregar componente VentasEnTiempoReal
- [ ] Actualizar guardado en BD
- [ ] Probar flujo completo

### App Móvil
- [ ] Modificar checkbox V
- [ ] Mejorar módulo de ventas
- [ ] Agregar indicador de estado
- [ ] Agregar registro de vencidas
- [ ] Probar sincronización

---

## 🎯 ORDEN DE IMPLEMENTACIÓN

1. **DÍA 1-2:** Backend completo
2. **DÍA 3-4:** Frontend web
3. **DÍA 5-6:** App móvil
4. **DÍA 7:** Testing y ajustes

---

**¿Empezamos con el PASO 1.1 (Modificar modelo CargueIDx)?** 🚀
