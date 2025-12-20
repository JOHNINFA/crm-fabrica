# 📋 PLAN: INTEGRACIÓN CARGUE + APP + IA

**Fecha:** 2025-12-16  
**Estado:** PENDIENTE DE APROBACIÓN  
**Objetivo:** Sincronizar ventas de app móvil con cargue web y aplicar IA predictiva

---

## 🎯 OBJETIVO GENERAL

Crear un sistema integrado donde:
1. El vendedor vende desde la app móvil
2. Las ventas se reflejan automáticamente en la planilla web
3. El sistema valida que ventas = reportes
4. La IA aprende patrones de venta para optimizar
5. Los descuentos de inventario se hacen una sola vez al finalizar

---

## 📊 FLUJO ACTUAL vs NUEVO

### FLUJO ACTUAL (Problema):
```
Web                          App Móvil
┌─────────────┐             ┌─────────────┐
│ CARGUE      │             │ VENTAS      │
│ - Cantidad  │   ❌ NO    │ - Vendedor  │
│ - DCTOS     │  CONECTADO │   registra  │
│ - Devol.    │             │   manualmente│
└─────────────┘             └─────────────┘
      ↓                            ↓
  Inventario                  Registro
  descontado                  separado
  en DESPACHO                       ↓
                              ❌ NO se valida
                                 coincidencia
```

### FLUJO NUEVO (Solución):
```
Web                          App Móvil
┌─────────────┐             ┌─────────────┐
│ CARGUE      │   ✅ SYNC   │ VENTAS      │
│ - Cantidad  │ ◄─────────► │ - Venta en  │
│ - DCTOS     │             │   tiempo real│
│ - Devol.    │             │ - Nequi/Davi │
│ - Vencidas  │             │ - Vencidas   │
└─────────────┘             └─────────────┘
      ↓                            ↓
  INVENTARIO POR ID          VALIDACIÓN
  ID1: 200 inicial           Vendido = Reportado
  ID1: 150 vendido                ↓
  ID1: 50 devuelto           🧠 IA APRENDE
                             - Patrones venta
                             - Predicción demanda
```

---

## 🔄 NUEVO FLUJO DE ESTADOS

### 1️⃣ SUGERIDO (ALISTAMIENTO)
```
Usuario:
├─ Revisa sugeridos
├─ Revisa pedidos
└─ Click en botón SUGERIDO

Sistema:
├─ Congela producción
├─ Congela pedidos en Planeación
├─ Guarda solicitadas en Planeación
├─ Guarda snapshot de Planeación
└─ Cambia a: ALISTAMIENTO ACTIVO
```

### 2️⃣ ALISTAMIENTO ACTIVO
```
Editable:
├─ ✅ DCTOS (puede editar)
├─ ✅ ADICIONAL (puede editar)
└─ ✅ Checkboxes V y D

Cuando TODOS los productos con cantidad tienen V ✓ y D ✓:
└─ ✅ AUTOMÁTICAMENTE cambia a: DESPACHO
    (sin click de botón)
```

### 3️⃣ DESPACHO
```
Editable:
├─ ✅ DCTOS (sigue editable)
├─ ✅ ADICIONAL (sigue editable)
├─ ✅ DEVOLUCIONES (desde app móvil)
└─ ✅ VENCIDAS (desde app móvil)

Sistema:
├─ ❌ NO descuenta inventario
├─ ❌ NO guarda en BD final
├─ ✅ Muestra datos en tiempo real desde app
└─ ✅ Espera click en botón COMPLETAR

Botón:
└─ Click → pasa a COMPLETADO
```

### 4️⃣ COMPLETADO
```
Sistema:
├─ 📊 CALCULA INVENTARIO FINAL:
│   
│   Por cada producto:
│   ├─ Cantidad inicial = CARGUE (cantidad - dctos + adicional)
│   ├─ Venta real = Ventas desde app
│   ├─ Devoluciones = Cantidad inicial - Venta real - Vencidas
│   └─ Inventario a descontar = Venta real + Vencidas
│
├─ 💾 DESCUENTA INVENTARIO:
│   ├─ Productos vendidos (desde app)
│   ├─ Productos vencidos (desde app)
│   └─ Pedidos asignados
│
├─ 💾 GUARDA EN BD:
│   ├─ CargueIDx con datos finales
│   ├─ Ventas registradas
│   └─ Movimientos de inventario
│
├─ 🧹 LIMPIA localStorage
└─ 🔒 BLOQUEA EDICIÓN (solo lectura)
```

---

## 🗄️ INVENTARIO POR ID

### Tabla Nueva: `InventarioID`

```python
class InventarioID(models.Model):
    """Inventario temporal por vendedor (ID1-ID6)"""
    
    id_vendedor = models.CharField(max_length=10)  # ID1, ID2, etc.
    fecha = models.DateField()
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    
    # Cargue inicial
    cantidad_inicial = models.IntegerField(default=0)
    dctos = models.IntegerField(default=0)
    adicional = models.IntegerField(default=0)
    cantidad_cargada = models.IntegerField(default=0)  # inicial - dctos + adicional
    
    # Ventas (desde app móvil)
    cantidad_vendida = models.IntegerField(default=0)  # Desde VentaRuta
    vencidas = models.IntegerField(default=0)  # Reportadas desde app
    
    # Cálculo automático
    devoluciones = models.IntegerField(default=0)  # inicial - vendida - vencidas
    inventario_actual = models.IntegerField(default=0)  # vendida + vencidas
    
    # Estado
    estado = models.CharField(max_length=20)  # ALISTAMIENTO, DESPACHO, COMPLETADO
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Calcular cantidad cargada
        self.cantidad_cargada = self.cantidad_inicial - self.dctos + self.adicional
        
        # Calcular devoluciones
        self.devoluciones = self.cantidad_cargada - self.cantidad_vendida - self.vencidas
        
        # Inventario a descontar
        self.inventario_actual = self.cantidad_vendida + self.vencidas
        
        super().save(*args, **kwargs)
```

### Ejemplo de Uso:

```python
# Al iniciar ALISTAMIENTO ACTIVO:
InventarioID.objects.create(
    id_vendedor='ID1',
    fecha='2025-12-17',
    producto=producto_oblea,
    cantidad_inicial=200,
    dctos=0,
    adicional=0,
    estado='ALISTAMIENTO'
)

# Durante el día (desde app móvil):
# ID1 vende 10 AREPAS TIPO OBLEA
inventario = InventarioID.objects.get(
    id_vendedor='ID1',
    fecha='2025-12-17',
    producto=producto_oblea
)
inventario.cantidad_vendida += 10
inventario.save()

# ID1 reporta 5 vencidas
inventario.vencidas += 5
inventario.save()

# Al COMPLETAR:
# cantidad_cargada = 200
# cantidad_vendida = 150 (desde app)
# vencidas = 5 (reportadas)
# devoluciones = 200 - 150 - 5 = 45 ✅
# inventario_actual = 150 + 5 = 155 (a descontar)
```

---

## 🔗 SINCRONIZACIÓN APP ↔ WEB

### Flujo de Datos:

```
APP MÓVIL                     BACKEND                    WEB
┌─────────────┐              ┌─────────────┐           ┌─────────────┐
│ Vendedor    │              │ API REST    │           │ Planilla    │
│ vende       │──POST──►    │ /api/ventas/ │──WS──►   │ actualiza   │
│ producto    │              │             │           │ en tiempo   │
└─────────────┘              └─────────────┘           │ real        │
                                    │                   └─────────────┘
                                    │
                                    ▼
                            ┌─────────────────┐
                            │ InventarioID    │
                            │ cantidad_vendida│
                            │ += 1            │
                            └─────────────────┘
```

### Endpoints Necesarios:

#### 1. Registrar Venta desde App
```python
@api_view(['POST'])
def registrar_venta_app(request):
    """Registra venta desde app móvil"""
    data = request.data
    
    # Crear registro de venta
    venta = VentaRuta.objects.create(
        vendedor_id=data['id_vendedor'],
        fecha=data['fecha'],
        producto_id=data['producto_id'],
        cantidad=data['cantidad'],
        metodo_pago=data['metodo_pago'],  # EFECTIVO, NEQUI, DAVIPLATA
        total=data['total']
    )
    
    # Actualizar InventarioID
    inventario = InventarioID.objects.get(
        id_vendedor=data['id_vendedor'],
        fecha=data['fecha'],
        producto_id=data['producto_id']
    )
    inventario.cantidad_vendida += data['cantidad']
    inventario.save()
    
    # Notificar a web por WebSocket
    enviar_actualizacion_websocket(data['id_vendedor'], inventario)
    
    return Response({'success': True})
```

#### 2. Reportar Vencidas desde App
```python
@api_view(['POST'])
def reportar_vencidas_app(request):
    """Reporta productos vencidos desde app"""
    data = request.data
    
    inventario = InventarioID.objects.get(
        id_vendedor=data['id_vendedor'],
        fecha=data['fecha'],
        producto_id=data['producto_id']
    )
    inventario.vencidas += data['cantidad']
    inventario.lotes_vencidos = data['lotes']  # JSON con lotes
    inventario.save()
    
    # Notificar a web
    enviar_actualizacion_websocket(data['id_vendedor'], inventario)
    
    return Response({'success': True})
```

#### 3. Obtener Estado de Inventario
```python
@api_view(['GET'])
def obtener_inventario_id(request, id_vendedor, fecha):
    """Obtiene inventario actual de un ID"""
    inventarios = InventarioID.objects.filter(
        id_vendedor=id_vendedor,
        fecha=fecha
    )
    serializer = InventarioIDSerializer(inventarios, many=True)
    return Response(serializer.data)
```

---

## 🧠 IA PARA MÓDULO DE VENTAS

### Objetivo:
- Predecir cuánto venderá cada vendedor (ID) por producto
- Optimizar rutas de venta
- Detectar productos con baja rotación
- Sugerir acciones al vendedor en tiempo real

### Red Neuronal de Ventas:

```python
class IAVentasService:
    """Servicio de IA para predicción de ventas por vendedor"""
    
    def obtener_historial_ventas_app(self):
        """Obtiene historial de ventas desde app móvil"""
        ventas = VentaRuta.objects.filter(
            fecha__gte=hace_6_meses
        ).values(
            'vendedor_id',
            'producto__nombre',
            'fecha',
            'cantidad',
            'hora',
            'ubicacion',
            'metodo_pago'
        )
        
        df = pd.DataFrame(ventas)
        
        # Features adicionales
        df['dia_semana'] = df['fecha'].dt.dayofweek
        df['hora_del_dia'] = df['hora'].dt.hour
        df['es_quincena'] = df['fecha'].dt.day.isin([5, 15, 20, 30])
        
        return df
    
    def predecir_venta_vendedor(self, id_vendedor, producto, fecha, contexto):
        """
        Predice cuánto venderá un vendedor específico.
        
        Contexto puede incluir:
        - Ubicación actual
        - Hora del día
        - Productos en inventario
        - Historial de ventas del día
        """
        
        # Features para predicción
        features = [
            fecha.weekday(),
            fecha.day,
            fecha.month,
            contexto.get('hora', 10),
            contexto.get('inventario_actual', 0),
            contexto.get('ventas_acumuladas_hoy', 0),
            contexto.get('es_quincena', 0)
        ]
        
        modelo = self.cargar_modelo(id_vendedor, producto)
        prediccion = modelo.predict([features])[0]
        
        return int(prediccion)
    
    def sugerir_accion_vendedor(self, id_vendedor, fecha):
        """
        Sugiere acciones al vendedor basándose en IA.
        
        Ejemplos:
        - "Tienes 50 CANASTILLAS, pero solo venderás ~30. Reduce inventario."
        - "Hoy es quincena, aumenta AREPA TIPO OBLEA (+20%)."
        - "En esta zona vendes más por Nequi, sugiere ese método."
        """
        
        inventario = InventarioID.objects.filter(
            id_vendedor=id_vendedor,
            fecha=fecha
        )
        
        sugerencias = []
        
        for item in inventario:
            prediccion = self.predecir_venta_vendedor(
                id_vendedor,
                item.producto.nombre,
                fecha,
                {'inventario_actual': item.cantidad_cargada}
            )
            
            diferencia = item.cantidad_cargada - prediccion
            
            if diferencia > 10:
                sugerencias.append({
                    'tipo': 'SOBRECARGA',
                    'producto': item.producto.nombre,
                    'mensaje': f'Tienes {item.cantidad_cargada} pero venderás ~{prediccion}. Sobran {diferencia}.',
                    'accion': 'Devolver excedente o vender con descuento'
                })
            elif diferencia < -5:
                sugerencias.append({
                    'tipo': 'FALTANTE',
                    'producto': item.producto.nombre,
                    'mensaje': f'Tienes {item.cantidad_cargada} pero venderás ~{prediccion}. Faltan {abs(diferencia)}.',
                    'accion': 'Solicitar más inventario'
                })
        
        return sugerencias
```

### Endpoint de Sugerencias:

```python
@api_view(['GET'])
def obtener_sugerencias_ia(request, id_vendedor):
    """Obtiene sugerencias de IA para el vendedor"""
    fecha = request.GET.get('fecha', date.today())
    
    ia = IAVentasService()
    sugerencias = ia.sugerir_accion_vendedor(id_vendedor, fecha)
    
    return Response({
        'sugerencias': sugerencias,
        'fecha': fecha
    })
```

### En la App Móvil:

```jsx
// Pantalla de ventas del vendedor
const SugerenciasIA = () => {
  const [sugerencias, setSugerencias] = useState([]);
  
  useEffect(() => {
    cargarSugerencias();
  }, []);
  
  const cargarSugerencias = async () => {
    const response = await fetch(
      `http://localhost:8000/api/ia/sugerencias/${idVendedor}/`
    );
    const data = await response.json();
    setSugerencias(data.sugerencias);
  };
  
  return (
    <View>
      <Text>💡 Sugerencias de IA:</Text>
      {sugerencias.map(sug => (
        <View key={sug.producto}>
          <Text>{sug.tipo === 'SOBRECARGA' ? '⚠️' : '📈'}</Text>
          <Text>{sug.mensaje}</Text>
          <Text>Acción: {sug.accion}</Text>
        </View>
      ))}
    </View>
  );
};
```

---

## ✅ VALIDACIÓN: VENTAS = REPORTES

### Al COMPLETAR, validar:

```python
def validar_coincidencia_ventas(id_vendedor, fecha):
    """
    Valida que las ventas registradas en app coincidan
    con lo reportado en la planilla.
    """
    
    # Obtener inventario
    inventarios = InventarioID.objects.filter(
        id_vendedor=id_vendedor,
        fecha=fecha
    )
    
    discrepancias = []
    
    for inv in inventarios:
        # Ventas desde app
        ventas_app = VentaRuta.objects.filter(
            vendedor_id=id_vendedor,
            fecha=fecha,
            producto=inv.producto
        ).aggregate(total=Sum('cantidad'))['total'] or 0
        
        # Ventas reportadas (calculadas)
        ventas_reportadas = inv.cantidad_vendida
        
        if ventas_app != ventas_reportadas:
            discrepancias.append({
                'producto': inv.producto.nombre,
                'ventas_app': ventas_app,
                'ventas_reportadas': ventas_reportadas,
                'diferencia': ventas_app - ventas_reportadas
            })
    
    if discrepancias:
        return {
            'valido': False,
            'discrepancias': discrepancias
        }
    
    return {'valido': True}
```

---

## 🔄 GUARDAR EN BD (CRUD EN CADA ESTADO)

### Estado del Botón → Tabla en BD

```python
class EstadoCargue(models.Model):
    """CRUD para guardar estado del cargue en cada fase"""
    
    id_vendedor = models.CharField(max_length=10)
    fecha = models.DateField()
    dia = models.CharField(max_length=20)
    
    # Estados
    estado_actual = models.CharField(max_length=30)
    # SUGERIDO, ALISTAMIENTO_ACTIVO, DESPACHO, COMPLETADO
    
    # Datos guardados en cada estado
    datos_json = models.JSONField(default=dict)
    # {
    #   'productos': [...],
    #   'timestamp': '...',
    #   'usuario': '...'
    # }
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['id_vendedor', 'fecha', 'dia']
```

### Endpoints CRUD:

```python
# CREATE/UPDATE - Guardar estado
@api_view(['POST'])
def guardar_estado_cargue(request):
    estado, created = EstadoCargue.objects.update_or_create(
        id_vendedor=request.data['id_vendedor'],
        fecha=request.data['fecha'],
        dia=request.data['dia'],
        defaults={
            'estado_actual': request.data['estado'],
            'datos_json': request.data['datos']
        }
    )
    return Response({'success': True})

# READ - Obtener estado
@api_view(['GET'])
def obtener_estado_cargue(request, id_vendedor, fecha, dia):
    try:
        estado = EstadoCargue.objects.get(
            id_vendedor=id_vendedor,
            fecha=fecha,
            dia=dia
        )
        return Response(EstadoCargueSerializer(estado).data)
    except:
        return Response({'estado_actual': 'SUGERIDO', 'datos_json': {}})
```

---

## 📱 CAMBIOS EN FRONTEND

### Archivo: `BotonCargue.jsx` (renombrado de BotonLimpiar.jsx)

#### Cambio 1: Transición automática a DESPACHO

```jsx
// Monitorear checkboxes
useEffect(() => {
  if (estado === 'ALISTAMIENTO_ACTIVO') {
    const todosValidados = productosPendientes.length === 0 
                         && productosValidados.length > 0;
    
    if (todosValidados) {
      console.log('✅ Todos los checkboxes marcados → AUTOMÁTICAMENTE a DESPACHO');
      setEstado('DESPACHO');
      localStorage.setItem(`estado_boton_${dia}_${fechaFormateadaLS}`, 'DESPACHO');
      guardarEstadoEnBD('DESPACHO');
    }
  }
}, [productosPendientes, productosValidados, estado]);
```

#### Cambio 2: DESPACHO sin descontar inventario

```jsx
case 'DESPACHO':
  return {
    texto: '✅ COMPLETAR',
    variant: 'success',
    disabled: loading,
    onClick: async () => {
      // ❌ NO descontar inventario aquí
      // ❌ NO guardar en CargueIDx aquí
      
      // ✅ Solo validación
      const confirmar = window.confirm(
        '¿Confirmar completar jornada?\\n\\n' +
        'Se guardarán los datos finales y se afectará el inventario.'
      );
      
      if (confirmar) {
        await manejarCompletar();
      }
    }
  };
```

#### Cambio 3: COMPLETADO descuenta inventario

```jsx
const manejarCompletar = async () => {
  setLoading(true);
  
  try {
    // 1. Obtener datos de InventarioID
    const inventarios = await fetch(
      `http://localhost:8000/api/inventario-id/${idSheet}/${fechaSeleccionada}/`
    ).then(r => r.json());
    
    // 2. Validar ventas = reportes
    const validacion = await fetch(
      `http://localhost:8000/api/validar-ventas/${idSheet}/${fechaSeleccionada}/`
    ).then(r => r.json());
    
    if (!validacion.valido) {
      alert('⚠️ Discrepancias encontradas:\\n' + 
            JSON.stringify(validacion.discrepancias, null, 2));
      // Permitir continuar pero advertir
    }
    
    // 3. DESCONTAR INVENTARIO FINAL
    for (const inv of inventarios) {
      // Descontar: vendido + vencidas
      await actualizarInventario(
        inv.producto_id,
        inv.inventario_actual,  // vendido + vencidas
        'RESTAR'
      );
      
      // Sumar devoluciones
      if (inv.devoluciones > 0) {
        await actualizarInventario(
          inv.producto_id,
          inv.devoluciones,
          'SUMAR'
        );
      }
    }
    
    // 4. Descontar pedidos
    await descontarPedidos(fechaSeleccionada);
    
    // 5. Guardar en CargueIDx
    await guardarDatosCompletos(fechaSeleccionada, idSheet);
    
    // 6. Cambiar a COMPLETADO
    setEstado('COMPLETADO');
    localStorage.setItem(`estado_boton_${dia}_${fechaFormateadaLS}`, 'COMPLETADO');
    
    // 7. Limpiar localStorage
    limpiarLocalStorage(fechaSeleccionada, [idSheet]);
    
    alert('✅ Jornada completada exitosamente');
    
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error: ' + error.message);
  }
  
  setLoading(false);
};
```

---

## 📊 RESUMEN DE CAMBIOS

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `BotonLimpiar.jsx` | Renombrar | → `BotonCargue.jsx` |
| `models.py` | Agregar | Modelo `InventarioID` |
| `models.py` | Agregar | Modelo `EstadoCargue` |
| `ia_service.py` | Crear | `IAVentasService` |
| `views.py` | Agregar | Endpoints de inventario y ventas |
| Frontend | Modificar | Transición automática a DESPACHO |
| Frontend | Modificar | COMPLETADO descuenta inventario |
| App Móvil | Integrar | Registro de ventas → InventarioID |

---

## 🎯 BENEFICIOS

1. ✅ **Sincronización real** entre app y web
2. ✅ **Validación automática** de ventas
3. ✅ **IA predictiva** para cada vendedor
4. ✅ **Inventario preciso** (solo un descuento al final)
5. ✅ **Sugerencias en tiempo real** al vendedor
6. ✅ **CRUD completo** de estados guardados en BD
7. ✅ **No depende del vendedor** (IA aprende)

---

**¿Entendí correctamente? ¿Empezamos con la implementación?** 🚀
