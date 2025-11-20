 .# 📋 Plan de Trabajo: Afectar Inventario en Pedidos Urgentes

## 🎯 Objetivo
Permitir que los pedidos urgentes afecten el inventario inmediatamente al crearlos, y asignarlos a vendedores (ID1-ID6) o domiciliarios para llevar un registro completo de ventas.

---

## 📊 Situación Actual

### Flujo Normal de Pedidos:
1. Se crea el pedido → NO afecta inventario
2. Se agrega a Planeación (campo "pedidos")
3. Se agrega a Cargue (campo "total_pedidos")
4. En Despacho → SÍ afecta inventario
5. Los pedidos se ven en el botón "Ver Pedidos Realizados" de cada vendedor (ID1-ID6)

### Problema:
- Cliente llama y necesita pedido urgente
- El cargue ya está en despacho (inventario ya afectado)
- No se puede crear pedido que descuente inventario inmediatamente
- No hay forma de asignar pedidos a domiciliarios

---

## 🎯 Solución Propuesta

### 1. Checkbox "Afectar Inventario Inmediatamente"
Al crear un pedido, agregar:
- ☑️ **"Afectar inventario inmediatamente"**
- Si está marcado: descuenta inventario al crear el pedido
- Si NO está marcado: descuenta inventario en despacho (comportamiento actual)

### 2. Dropdown "Asignar a Vendedor/Domiciliario"
Al crear un pedido, agregar:
- **Dropdown con opciones:**
  - ID1 (Vendedor 1)
  - ID2 (Vendedor 2)
  - ID3 (Vendedor 3)
  - ID4 (Vendedor 4)
  - ID5 (Vendedor 5)
  - ID6 (Vendedor 6)
  - DOMICILIARIO 1
  - DOMICILIARIO 2
  - DOMICILIARIO 3
  - (etc.)

### 3. Registro de Domiciliarios
Crear tabla/modelo para domiciliarios similar a vendedores:
- Nombre del domiciliario
- Identificación
- Teléfono
- Activo/Inactivo
- Fecha de creación

### 4. Integración con Cargue
Cuando se asigna a un vendedor (ID1-ID6):
- El dinero del pedido se suma a `total_pedidos` del vendedor
- El pedido aparece en "Ver Pedidos Realizados" del vendedor
- Si "Afectar inventario" está marcado, se marca como "Ya Despachado"

### 5. Integración con Domiciliarios
Cuando se asigna a un domiciliario:
- El pedido NO va a ningún cargue de vendedor
- Se registra en una tabla separada de "Pedidos Domiciliarios"
- Si "Afectar inventario" está marcado, descuenta inventario
- Se puede ver en un reporte de domiciliarios

---

## 🔧 Cambios Técnicos Necesarios

### Backend (Django)

#### 1. Actualizar Modelo `Pedido`
```python
class Pedido(models.Model):
    # ... campos existentes ...
    
    # NUEVOS CAMPOS
    afectar_inventario_inmediato = models.BooleanField(default=False)
    asignado_a_tipo = models.CharField(
        max_length=20, 
        choices=[
            ('VENDEDOR', 'Vendedor'),
            ('DOMICILIARIO', 'Domiciliario'),
            ('NINGUNO', 'Ninguno')
        ],
        default='NINGUNO'
    )
    asignado_a_id = models.CharField(max_length=50, blank=True, null=True)  # ID1, ID2, DOM1, etc.
    inventario_afectado = models.BooleanField(default=False)  # Para saber si ya se afectó
```

#### 2. Crear Modelo `Domiciliario`
```python
class Domiciliario(models.Model):
    codigo = models.CharField(max_length=20, unique=True)  # DOM1, DOM2, etc.
    nombre = models.CharField(max_length=100)
    identificacion = models.CharField(max_length=50)
    telefono = models.CharField(max_length=20)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
```

#### 3. Actualizar Serializer `PedidoSerializer`
```python
class PedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pedido
        fields = [
            # ... campos existentes ...
            'afectar_inventario_inmediato',
            'asignado_a_tipo',
            'asignado_a_id',
            'inventario_afectado'
        ]
```

#### 4. Modificar Método `create()` en `PedidoSerializer`
```python
def create(self, validated_data):
    with transaction.atomic():
        # Crear el pedido
        pedido = Pedido.objects.create(**validated_data)
        
        # Crear detalles
        for detalle_data in detalles_data:
            DetallePedido.objects.create(...)
        
        # SI "afectar_inventario_inmediato" está marcado
        if pedido.afectar_inventario_inmediato:
            # Descontar inventario AHORA
            for detalle in pedido.detalles.all():
                producto = detalle.producto
                producto.stock_total -= detalle.cantidad
                producto.save()
                
                # Crear movimiento de inventario
                MovimientoInventario.objects.create(
                    producto=producto,
                    tipo='SALIDA',
                    cantidad=detalle.cantidad,
                    usuario='Sistema',
                    nota=f'Pedido urgente #{pedido.numero_pedido}'
                )
            
            # Marcar como inventario afectado
            pedido.inventario_afectado = True
            pedido.save()
        
        # Actualizar Planeación (siempre)
        # ... código existente ...
        
        # Actualizar Cargue SI es vendedor
        if pedido.asignado_a_tipo == 'VENDEDOR' and pedido.asignado_a_id:
            # Buscar el modelo de cargue correspondiente
            cargue_models = {
                'ID1': CargueID1, 'ID2': CargueID2, 'ID3': CargueID3,
                'ID4': CargueID4, 'ID5': CargueID5, 'ID6': CargueID6
            }
            
            CargueModel = cargue_models.get(pedido.asignado_a_id)
            if CargueModel:
                # Actualizar total_pedidos del vendedor
                cargues = CargueModel.objects.filter(fecha=pedido.fecha_entrega)
                for cargue in cargues:
                    cargue.total_pedidos += float(pedido.total)
                    # Recalcular total_efectivo
                    if cargue.venta:
                        cargue.total_efectivo = float(cargue.venta) - float(cargue.total_pedidos)
                    cargue.save()
        
        return pedido
```

#### 5. Crear ViewSet para Domiciliarios
```python
class DomiciliarioViewSet(viewsets.ModelViewSet):
    queryset = Domiciliario.objects.all()
    serializer_class = DomiciliarioSerializer
    permission_classes = [permissions.AllowAny]
```

#### 6. Agregar Endpoint para Pedidos de Domiciliarios
```python
@action(detail=False, methods=['get'])
def pedidos_domiciliario(self, request):
    """Obtener pedidos asignados a un domiciliario"""
    domiciliario_id = request.query_params.get('domiciliario_id')
    fecha = request.query_params.get('fecha')
    
    pedidos = Pedido.objects.filter(
        asignado_a_tipo='DOMICILIARIO',
        asignado_a_id=domiciliario_id
    )
    
    if fecha:
        pedidos = pedidos.filter(fecha_entrega=fecha)
    
    serializer = self.get_serializer(pedidos, many=True)
    return Response(serializer.data)
```

---

### Frontend (React)

#### 1. Actualizar Formulario de Creación de Pedidos
**Archivo:** `frontend/src/components/Pedidos/ConsumerForm.jsx`

Agregar:
```jsx
// Estados
const [afectarInventario, setAfectarInventario] = useState(false);
const [asignadoATipo, setAsignadoATipo] = useState('NINGUNO');
const [asignadoAId, setAsignadoAId] = useState('');
const [vendedores, setVendedores] = useState([]);
const [domiciliarios, setDomiciliarios] = useState([]);

// Cargar vendedores y domiciliarios
useEffect(() => {
    cargarVendedores();
    cargarDomiciliarios();
}, []);

// Renderizar en el formulario
<div className="mb-3">
    <div className="form-check">
        <input
            type="checkbox"
            className="form-check-input"
            id="afectarInventario"
            checked={afectarInventario}
            onChange={(e) => setAfectarInventario(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="afectarInventario">
            ⚡ Afectar inventario inmediatamente (Pedido urgente)
        </label>
    </div>
</div>

<div className="mb-3">
    <label className="form-label">Asignar a:</label>
    <select
        className="form-select"
        value={asignadoATipo}
        onChange={(e) => {
            setAsignadoATipo(e.target.value);
            setAsignadoAId('');
        }}
    >
        <option value="NINGUNO">Ninguno</option>
        <option value="VENDEDOR">Vendedor</option>
        <option value="DOMICILIARIO">Domiciliario</option>
    </select>
</div>

{asignadoATipo === 'VENDEDOR' && (
    <div className="mb-3">
        <label className="form-label">Vendedor:</label>
        <select
            className="form-select"
            value={asignadoAId}
            onChange={(e) => setAsignadoAId(e.target.value)}
        >
            <option value="">Seleccione vendedor</option>
            <option value="ID1">ID1 - Vendedor 1</option>
            <option value="ID2">ID2 - Vendedor 2</option>
            <option value="ID3">ID3 - Vendedor 3</option>
            <option value="ID4">ID4 - Vendedor 4</option>
            <option value="ID5">ID5 - Vendedor 5</option>
            <option value="ID6">ID6 - Vendedor 6</option>
        </select>
    </div>
)}

{asignadoATipo === 'DOMICILIARIO' && (
    <div className="mb-3">
        <label className="form-label">Domiciliario:</label>
        <select
            className="form-select"
            value={asignadoAId}
            onChange={(e) => setAsignadoAId(e.target.value)}
        >
            <option value="">Seleccione domiciliario</option>
            {domiciliarios.map(dom => (
                <option key={dom.codigo} value={dom.codigo}>
                    {dom.codigo} - {dom.nombre}
                </option>
            ))}
        </select>
    </div>
)}
```

#### 2. Actualizar Componente Cart al Crear Pedido
**Archivo:** `frontend/src/components/Pedidos/Cart.jsx`

```jsx
const handleCreatePedido = async () => {
    // ... validaciones ...
    
    const pedidoData = {
        // ... datos existentes ...
        afectar_inventario_inmediato: afectarInventario,
        asignado_a_tipo: asignadoATipo,
        asignado_a_id: asignadoAId,
        detalles: cart.map(item => ({
            producto: item.id,
            cantidad: item.qty,
            precio_unitario: item.price
        }))
    };
    
    const result = await pedidoService.create(pedidoData);
    
    if (result.success) {
        alert('✅ Pedido creado exitosamente');
        if (afectarInventario) {
            alert('⚡ Inventario afectado inmediatamente');
        }
        clearCart();
    }
};
```

#### 3. Crear Pantalla de Gestión de Domiciliarios
**Archivo:** `frontend/src/pages/DomiciliariosScreen.jsx`

```jsx
export default function DomiciliariosScreen() {
    const [domiciliarios, setDomiciliarios] = useState([]);
    
    // CRUD de domiciliarios
    // - Listar
    // - Crear
    // - Editar
    // - Activar/Desactivar
    
    return (
        <div>
            <h2>Gestión de Domiciliarios</h2>
            {/* Tabla de domiciliarios */}
            {/* Botón agregar domiciliario */}
        </div>
    );
}
```

#### 4. Crear Pantalla de Pedidos por Domiciliario
**Archivo:** `frontend/src/pages/PedidosDomiciliarioScreen.jsx`

```jsx
export default function PedidosDomiciliarioScreen() {
    const [domiciliarios, setDomiciliarios] = useState([]);
    const [domiciliarioSeleccionado, setDomiciliarioSeleccionado] = useState(null);
    const [pedidos, setPedidos] = useState([]);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    
    const cargarPedidos = async () => {
        if (!domiciliarioSeleccionado) return;
        
        const response = await fetch(
            `/api/pedidos/pedidos_domiciliario/?domiciliario_id=${domiciliarioSeleccionado}&fecha=${fecha}`
        );
        const data = await response.json();
        setPedidos(data);
    };
    
    return (
        <div>
            <h2>Pedidos de Domiciliarios</h2>
            
            {/* Selector de domiciliario */}
            <select onChange={(e) => setDomiciliarioSeleccionado(e.target.value)}>
                {domiciliarios.map(dom => (
                    <option value={dom.codigo}>{dom.nombre}</option>
                ))}
            </select>
            
            {/* Selector de fecha */}
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            
            {/* Tabla de pedidos */}
            <table>
                <thead>
                    <tr>
                        <th>N° Pedido</th>
                        <th>Cliente</th>
                        <th>Dirección</th>
                        <th>Total</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {pedidos.map(pedido => (
                        <tr key={pedido.id}>
                            <td>{pedido.numero_pedido}</td>
                            <td>{pedido.destinatario}</td>
                            <td>{pedido.direccion_entrega}</td>
                            <td>${pedido.total}</td>
                            <td>{pedido.estado}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
```

#### 5. Actualizar "Ver Pedidos Realizados" de Vendedores
**Archivo:** Componente que muestra pedidos de vendedores

Agregar indicador visual para pedidos urgentes:
```jsx
{pedido.afectar_inventario_inmediato && (
    <span className="badge bg-warning">⚡ Urgente - Inventario Afectado</span>
)}
```

---

## 📊 Reporte Consolidado de Ventas

### Objetivo Final:
Recopilar todas las ventas de:
1. **Cargue** (ventas de vendedores ID1-ID6)
2. **Pedidos** (pedidos normales y urgentes)
3. **POS** (ventas en punto de venta)

### Crear Endpoint de Reporte Consolidado
```python
@action(detail=False, methods=['get'])
def reporte_consolidado(self, request):
    """Reporte consolidado de todas las ventas"""
    fecha_inicio = request.query_params.get('fecha_inicio')
    fecha_fin = request.query_params.get('fecha_fin')
    
    # 1. Ventas de Cargue
    ventas_cargue = []
    for CargueModel in [CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6]:
        cargues = CargueModel.objects.filter(
            fecha__gte=fecha_inicio,
            fecha__lte=fecha_fin
        )
        for cargue in cargues:
            ventas_cargue.append({
                'tipo': 'CARGUE',
                'vendedor': cargue.responsable,
                'fecha': cargue.fecha,
                'total': cargue.venta
            })
    
    # 2. Pedidos
    pedidos = Pedido.objects.filter(
        fecha_entrega__gte=fecha_inicio,
        fecha_entrega__lte=fecha_fin,
        estado='ENTREGADA'
    )
    ventas_pedidos = [{
        'tipo': 'PEDIDO',
        'vendedor': p.asignado_a_id or 'Sin asignar',
        'fecha': p.fecha_entrega,
        'total': p.total
    } for p in pedidos]
    
    # 3. Ventas POS
    ventas_pos = Venta.objects.filter(
        fecha__gte=fecha_inicio,
        fecha__lte=fecha_fin,
        estado='PAGADO'
    )
    ventas_pos_data = [{
        'tipo': 'POS',
        'vendedor': v.vendedor,
        'fecha': v.fecha,
        'total': v.total
    } for v in ventas_pos]
    
    # Consolidar
    todas_ventas = ventas_cargue + ventas_pedidos + ventas_pos_data
    total_general = sum(v['total'] for v in todas_ventas)
    
    return Response({
        'ventas': todas_ventas,
        'total_general': total_general,
        'resumen': {
            'cargue': sum(v['total'] for v in ventas_cargue),
            'pedidos': sum(v['total'] for v in ventas_pedidos),
            'pos': sum(v['total'] for v in ventas_pos_data)
        }
    })
```

---

## ✅ Checklist de Implementación

### Backend
- [ ] Actualizar modelo `Pedido` con nuevos campos
- [ ] Crear modelo `Domiciliario`
- [ ] Crear migraciones
- [ ] Actualizar `PedidoSerializer`
- [ ] Modificar método `create()` para afectar inventario
- [ ] Crear `DomiciliarioViewSet`
- [ ] Crear endpoint `pedidos_domiciliario`
- [ ] Crear endpoint `reporte_consolidado`
- [ ] Registrar rutas en `urls.py`

### Frontend
- [ ] Actualizar `ConsumerForm.jsx` con checkbox y dropdowns
- [ ] Actualizar `Cart.jsx` para enviar nuevos campos
- [ ] Crear `DomiciliariosScreen.jsx`
- [ ] Crear `PedidosDomiciliarioScreen.jsx`
- [ ] Actualizar componente de "Ver Pedidos Realizados"
- [ ] Crear pantalla de reporte consolidado
- [ ] Agregar rutas en `App.js`

### Testing
- [ ] Probar creación de pedido normal (sin afectar inventario)
- [ ] Probar creación de pedido urgente (afecta inventario)
- [ ] Probar asignación a vendedor
- [ ] Probar asignación a domiciliario
- [ ] Verificar que el dinero se suma correctamente en cargue
- [ ] Verificar reporte consolidado

---

## 📅 Estimación de Tiempo

- **Backend**: 4-6 horas
- **Frontend**: 6-8 horas
- **Testing**: 2-3 horas
- **Total**: 12-17 horas

---

## 🚀 Orden de Implementación Sugerido

1. **Fase 1: Backend Base** (2 horas)
   - Crear modelo Domiciliario
   - Actualizar modelo Pedido
   - Crear migraciones

2. **Fase 2: Lógica de Negocio** (3 horas)
   - Modificar create() para afectar inventario
   - Integración con Cargue
   - Endpoints de domiciliarios

3. **Fase 3: Frontend Formulario** (3 horas)
   - Checkbox afectar inventario
   - Dropdowns de asignación
   - Integración con API

4. **Fase 4: Pantallas de Gestión** (4 horas)
   - Pantalla de domiciliarios
   - Pantalla de pedidos por domiciliario
   - Actualizar vista de pedidos de vendedores

5. **Fase 5: Reporte Consolidado** (3 horas)
   - Endpoint backend
   - Pantalla frontend
   - Gráficos y estadísticas

6. **Fase 6: Testing y Ajustes** (2 horas)
   - Pruebas completas
   - Corrección de bugs
   - Documentación

---

**Fecha de creación**: 20 de Noviembre de 2025
**Estado**: Planificación
