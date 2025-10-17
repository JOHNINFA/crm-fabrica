# 🔧 BACKEND DJANGO - DOCUMENTACIÓN COMPLETA

## ÍNDICE
1. [URLs y Rutas API](#urls-y-rutas-api)
2. [Modelos Completos](#modelos-completos)
3. [Serializers](#serializers)
4. [ViewSets y APIs](#viewsets-y-apis)
5. [Lógica de Negocio](#lógica-de-negocio)

---

## URLs Y RUTAS API

### api/urls.py - Configuración de Rutas
```python
from rest_framework.routers import DefaultRouter
from .views import (
    RegistroViewSet, ProductoViewSet, CategoriaViewSet,
    LoteViewSet, MovimientoInventarioViewSet, RegistroInventarioViewSet,
    VentaViewSet, DetalleVentaViewSet, ClienteViewSet, ListaPrecioViewSet, 
    PrecioProductoViewSet, CargueID1ViewSet, CargueID2ViewSet, CargueID3ViewSet, 
    CargueID4ViewSet, CargueID5ViewSet, CargueID6ViewSet, ProduccionViewSet,
    VendedorViewSet, ProduccionSolicitadaViewSet,
    SucursalViewSet, CajeroViewSet, TurnoViewSet, VentaCajeroViewSet, 
    ArqueoCajaViewSet, RemisionViewSet, DetalleRemisionViewSet
)

router = DefaultRouter()

# APIs de Productos e Inventario
router.register(r'productos', ProductoViewSet, basename='producto')
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'lotes', LoteViewSet, basename='lote')
router.register(r'movimientos', MovimientoInventarioViewSet, basename='movimiento')
router.register(r'registro-inventario', RegistroInventarioViewSet, basename='registro-inventario')

# APIs de Ventas
router.register(r'ventas', VentaViewSet, basename='venta')
router.register(r'detalle-ventas', DetalleVentaViewSet, basename='detalle-venta')

# APIs de Clientes y Precios
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'lista-precios', ListaPrecioViewSet, basename='lista-precio')
router.register(r'precio-productos', PrecioProductoViewSet, basename='precio-producto')

# APIs de Cargue (6 vendedores)
router.register(r'cargue-id1', CargueID1ViewSet, basename='cargue-id1')
router.register(r'cargue-id2', CargueID2ViewSet, basename='cargue-id2')
router.register(r'cargue-id3', CargueID3ViewSet, basename='cargue-id3')
router.register(r'cargue-id4', CargueID4ViewSet, basename='cargue-id4')
router.register(r'cargue-id5', CargueID5ViewSet, basename='cargue-id5')
router.register(r'cargue-id6', CargueID6ViewSet, basename='cargue-id6')

# APIs de Producción
router.register(r'produccion', ProduccionViewSet, basename='produccion')
router.register(r'produccion-solicitadas', ProduccionSolicitadaViewSet, basename='produccion-solicitada')

# APIs de Vendedores
router.register(r'vendedores', VendedorViewSet, basename='vendedor')

# APIs de Sistema POS - Cajeros
router.register(r'sucursales', SucursalViewSet, basename='sucursal')
router.register(r'cajeros', CajeroViewSet, basename='cajero')
router.register(r'turnos', TurnoViewSet, basename='turno')
router.register(r'ventas-cajero', VentaCajeroViewSet, basename='venta-cajero')
router.register(r'arqueo-caja', ArqueoCajaViewSet, basename='arqueo-caja')

# APIs de Remisiones
router.register(r'remisiones', RemisionViewSet, basename='remision')
router.register(r'detalle-remisiones', DetalleRemisionViewSet, basename='detalle-remision')

urlpatterns = router.urls
```

### Endpoints Disponibles

#### Productos
```
GET    /api/productos/                    # Listar todos
POST   /api/productos/                    # Crear nuevo
GET    /api/productos/{id}/               # Obtener uno
PUT    /api/productos/{id}/               # Actualizar
DELETE /api/productos/{id}/               # Eliminar
POST   /api/productos/save_image/         # Guardar imagen
POST   /api/productos/{id}/actualizar_stock/  # Actualizar stock
```

#### Ventas
```
GET    /api/ventas/                       # Listar todas
POST   /api/ventas/                       # Crear venta
GET    /api/ventas/{id}/                  # Obtener una
GET    /api/ventas/?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD  # Filtrar
```

#### Clientes
```
GET    /api/clientes/                     # Listar todos
POST   /api/clientes/                     # Crear cliente
GET    /api/clientes/{id}/                # Obtener uno
PUT    /api/clientes/{id}/                # Actualizar
GET    /api/clientes/?activo=true         # Filtrar activos
```

#### Cargue (ID1-ID6)
```
GET    /api/cargue-id1/                   # Listar registros ID1
POST   /api/cargue-id1/                   # Crear registro ID1
GET    /api/cargue-id1/?dia=LUNES&fecha=2025-01-09  # Filtrar
```

#### Vendedores
```
POST   /api/vendedores/actualizar_responsable/  # Actualizar responsable
GET    /api/vendedores/obtener_responsable/     # Obtener responsable
GET    /api/vendedores/obtener_responsable/?id_vendedor=ID1  # Por vendedor
```

#### Cajeros y Turnos
```
POST   /api/cajeros/authenticate/         # Login cajero
GET    /api/turnos/turno_activo/?cajero_id=1  # Turno activo
POST   /api/turnos/iniciar_turno/         # Iniciar turno
POST   /api/turnos/{id}/cerrar_turno/     # Cerrar turno
```

#### Remisiones
```
GET    /api/remisiones/                   # Listar todas
POST   /api/remisiones/                   # Crear remisión
GET    /api/remisiones/?fecha_desde=2025-01-01  # Filtrar
PATCH  /api/remisiones/{id}/cambiar_estado/  # Cambiar estado
POST   /api/remisiones/{id}/anular/       # Anular remisión
```

---

## MODELOS COMPLETOS

### Modelo: Producto
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

### Modelo: Venta
```python
class Venta(models.Model):
    ESTADO_CHOICES = [
        ('PAGADO', 'Pagado'),
        ('PENDIENTE', 'Pendiente'),
        ('CANCELADO', 'Cancelado'),
        ('ANULADA', 'Anulada'),
    ]
    
    METODO_PAGO_CHOICES = [
        ('EFECTIVO', 'Efectivo'),
        ('TARJETA', 'Tarjeta'),
        ('T_CREDITO', 'T. Crédito'),
        ('QR', 'Qr'),
        ('TRANSF', 'Transf'),
        ('RAPPIPAY', 'RAPPIPAY'),
        ('BONOS', 'Bonos'),
        ('OTROS', 'Otros'),
    ]
    
    numero_factura = models.CharField(max_length=50, unique=True, blank=True)
    fecha = models.DateTimeField(default=timezone.now)
    vendedor = models.CharField(max_length=100, default='Sistema')
    cliente = models.CharField(max_length=255, default='CONSUMIDOR FINAL')
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    impuestos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    descuentos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    dinero_entregado = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    devuelta = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PAGADO')
    nota = models.TextField(blank=True, null=True)
    banco = models.CharField(max_length=100, default='Caja General')
    
    def save(self, *args, **kwargs):
        if not self.numero_factura:
            import uuid
            self.numero_factura = f"F{str(uuid.uuid4().int)[:8]}"
        super().save(*args, **kwargs)
```

### Modelo: Cliente
```python
class Cliente(models.Model):
    REGIMEN_CHOICES = [
        ('SIMPLIFICADO', 'Régimen Simplificado'),
        ('COMUN', 'Régimen Común'),
    ]
    
    # Información básica
    regimen = models.CharField(max_length=20, choices=REGIMEN_CHOICES)
    tipo_persona = models.CharField(max_length=20)
    tipo_identificacion = models.CharField(max_length=20)
    identificacion = models.CharField(max_length=50, unique=True)
    nombre_completo = models.CharField(max_length=255)
    
    # Contacto
    telefono_1 = models.CharField(max_length=20, blank=True, null=True)
    movil = models.CharField(max_length=20, blank=True, null=True)
    email_1 = models.EmailField(blank=True, null=True)
    
    # Ubicación
    pais = models.CharField(max_length=100, default='Colombia')
    departamento = models.CharField(max_length=100, blank=True, null=True)
    ciudad = models.CharField(max_length=100, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    
    # Configuración comercial
    tipo_lista_precio = models.CharField(max_length=100, blank=True, null=True)
    vendedor_asignado = models.CharField(max_length=100, blank=True, null=True)
    dia_entrega = models.CharField(max_length=20, blank=True, null=True)
    
    # Control
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
```

### Modelo: CargueID1 (y ID2-ID6 similar)
```python
class CargueID1(models.Model):
    DIAS_CHOICES = [
        ('LUNES', 'Lunes'), ('MARTES', 'Martes'), ('MIERCOLES', 'Miércoles'),
        ('JUEVES', 'Jueves'), ('VIERNES', 'Viernes'), ('SABADO', 'Sábado'),
    ]
    
    # Identificación
    dia = models.CharField(max_length=10, choices=DIAS_CHOICES)
    fecha = models.DateField()
    
    # Checkboxes
    v = models.BooleanField(default=False)  # vendedor
    d = models.BooleanField(default=False)  # despachador
    
    # Productos
    producto = models.CharField(max_length=255, blank=True)
    cantidad = models.IntegerField(default=0)
    dctos = models.IntegerField(default=0)
    adicional = models.IntegerField(default=0)
    devoluciones = models.IntegerField(default=0)
    vencidas = models.IntegerField(default=0)
    total = models.IntegerField(default=0)
    valor = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    neto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Pagos
    concepto = models.CharField(max_length=255, blank=True)
    descuentos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    nequi = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    daviplata = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Resumen
    base_caja = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_despacho = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    venta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_efectivo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Metadatos
    usuario = models.CharField(max_length=100, default='Sistema')
    responsable = models.CharField(max_length=100, default='RESPONSABLE')
    ruta = models.CharField(max_length=100, default='', blank=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    
    def save(self, *args, **kwargs):
        self.total = self.cantidad - self.dctos + self.adicional - self.devoluciones - self.vencidas
        self.neto = self.total * self.valor
        super().save(*args, **kwargs)
```

### Modelo: Cajero
```python
class Cajero(models.Model):
    ROLES_CHOICES = [
        ('CAJERO', 'Cajero'),
        ('SUPERVISOR', 'Supervisor'),
        ('ADMINISTRADOR', 'Administrador'),
    ]
    
    nombre = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    password = models.CharField(max_length=255)
    sucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE)
    rol = models.CharField(max_length=20, choices=ROLES_CHOICES, default='CAJERO')
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    ultimo_login = models.DateTimeField(null=True, blank=True)
```

### Modelo: Turno
```python
class Turno(models.Model):
    ESTADOS_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('CERRADO', 'Cerrado'),
        ('SUSPENDIDO', 'Suspendido'),
    ]
    
    cajero = models.ForeignKey(Cajero, on_delete=models.CASCADE)
    sucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE)
    fecha_inicio = models.DateTimeField(default=timezone.now)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS_CHOICES, default='ACTIVO')
    base_inicial = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    arqueo_final = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    diferencia = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_ventas = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    numero_transacciones = models.IntegerField(default=0)
    
    def cerrar_turno(self, arqueo_final, notas_cierre=None):
        self.fecha_fin = timezone.now()
        self.estado = 'CERRADO'
        self.arqueo_final = arqueo_final
        self.notas_cierre = notas_cierre
        
        # Calcular totales desde ventas
        ventas_turno = Venta.objects.filter(
            fecha__gte=self.fecha_inicio,
            fecha__lte=self.fecha_fin
        )
        self.total_ventas = sum(v.total for v in ventas_turno)
        self.numero_transacciones = ventas_turno.count()
        self.save()
```

### Modelo: Remision
```python
class Remision(models.Model):
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('EN_TRANSITO', 'En Tránsito'),
        ('ENTREGADA', 'Entregada'),
        ('ANULADA', 'Anulada'),
    ]
    
    TIPO_REMISION_CHOICES = [
        ('ENTREGA', 'Entrega'),
        ('TRASLADO', 'Traslado'),
        ('DEVOLUCION', 'Devolución'),
        ('MUESTRA', 'Muestra'),
    ]
    
    numero_remision = models.CharField(max_length=50, unique=True)
    fecha = models.DateTimeField(default=timezone.now)
    vendedor = models.CharField(max_length=100)
    destinatario = models.CharField(max_length=255)
    direccion_entrega = models.TextField()
    telefono_contacto = models.CharField(max_length=20, blank=True, null=True)
    fecha_entrega = models.DateField(null=True, blank=True)
    tipo_remision = models.CharField(max_length=20, choices=TIPO_REMISION_CHOICES)
    transportadora = models.CharField(max_length=100, default='Propia')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    
    def save(self, *args, **kwargs):
        if not self.numero_remision:
            ultima = Remision.objects.filter(
                numero_remision__startswith='REM-'
            ).order_by('-id').first()
            
            if ultima:
                ultimo_numero = int(ultima.numero_remision.split('-')[1])
                nuevo_numero = ultimo_numero + 1
            else:
                nuevo_numero = 1
            
            self.numero_remision = f'REM-{nuevo_numero:06d}'
        
        super().save(*args, **kwargs)
```

---

*Continúa en DOCUMENTACION_FRONTEND_COMPLETA.md*


---

## SISTEMA DE GESTIÓN DE PEDIDOS

### Descripción General
Sistema completo para gestionar pedidos de clientes con integración automática a Planeación de Inventario y Cargue de Vendedores.

### Modelos

#### Pedido
```python
class Pedido(models.Model):
    """Modelo para gestionar pedidos de clientes"""
    
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('PAGADO', 'Pagado'),
        ('CANCELADO', 'Cancelado'),
        ('ANULADA', 'Anulada'),
    ]
    
    TIPO_PEDIDO_CHOICES = [
        ('ENTREGA', 'Entrega'),
        ('TRASLADO', 'Traslado'),
        ('DEVOLUCION', 'Devolución'),
        ('MUESTRA', 'Muestra'),
    ]
    
    # Información básica
    numero_pedido = models.CharField(max_length=50, unique=True)  # PED-000001
    fecha = models.DateTimeField(default=timezone.now)
    vendedor = models.CharField(max_length=100)
    destinatario = models.CharField(max_length=255)
    
    # Información de entrega
    direccion_entrega = models.TextField()
    telefono_contacto = models.CharField(max_length=20, blank=True, null=True)
    fecha_entrega = models.DateField(null=True, blank=True)  # ← CLAVE para Planeación
    
    # Clasificación
    tipo_pedido = models.CharField(max_length=20, choices=TIPO_PEDIDO_CHOICES, default='ENTREGA')
    transportadora = models.CharField(max_length=100, default='Propia')
    
    # Totales
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    impuestos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    descuentos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Estado y control
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    nota = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
```

#### DetallePedido
```python
class DetallePedido(models.Model):
    """Modelo para detalles de productos en pedidos"""
    
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    
    def save(self, *args, **kwargs):
        # Calcular subtotal automáticamente
        self.subtotal = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs)
```

---

### Serializers

#### PedidoSerializer
**Ubicación:** `api/serializers.py`

**Función:** Serializa pedidos y maneja la lógica de creación con integración a Planeación y Cargue

```python
class PedidoSerializer(serializers.ModelSerializer):
    """Serializer para pedidos con integración automática"""
    detalles = DetallePedidoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Pedido
        fields = [
            'id', 'numero_pedido', 'fecha', 'vendedor', 'destinatario',
            'direccion_entrega', 'telefono_contacto', 'fecha_entrega',
            'tipo_pedido', 'transportadora', 'subtotal', 'impuestos',
            'descuentos', 'total', 'estado', 'nota', 'fecha_creacion',
            'fecha_actualizacion', 'detalles'
        ]
        read_only_fields = ('numero_pedido', 'fecha_creacion', 'fecha_actualizacion')
    
    def create(self, validated_data):
        """
        Crea un pedido y actualiza automáticamente:
        1. Planeación: Suma cantidades en columna 'pedidos'
        2. Cargue: Suma dinero en 'total_pedidos'
        """
        from django.db import transaction
        
        detalles_data = self.context['request'].data.get('detalles', [])
        
        with transaction.atomic():
            # 1. Crear el pedido
            pedido = Pedido.objects.create(**validated_data)
            
            # 2. Crear los detalles
            for detalle_data in detalles_data:
                DetallePedido.objects.create(
                    pedido=pedido,
                    producto_id=detalle_data['producto'],
                    cantidad=detalle_data['cantidad'],
                    precio_unitario=detalle_data['precio_unitario']
                )
            
            # 3. Actualizar Planeación
            if pedido.fecha_entrega:
                from .models import Planeacion, Producto
                
                for detalle_data in detalles_data:
                    producto = Producto.objects.get(id=detalle_data['producto'])
                    
                    planeacion, created = Planeacion.objects.get_or_create(
                        fecha=pedido.fecha_entrega,
                        producto_nombre=producto.nombre,
                        defaults={
                            'existencias': 0,
                            'solicitadas': 0,
                            'pedidos': 0,
                            'orden': 0,
                            'ia': 0,
                            'usuario': 'Sistema'
                        }
                    )
                    
                    # ✅ SUMAR cantidad
                    planeacion.pedidos += detalle_data['cantidad']
                    planeacion.save()
            
            # 4. Actualizar Cargue
            if pedido.fecha_entrega and pedido.vendedor:
                from .models import CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6
                
                cargue_models = [CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6]
                
                for CargueModel in cargue_models:
                    cargues = CargueModel.objects.filter(fecha=pedido.fecha_entrega)
                    
                    for cargue in cargues:
                        if hasattr(cargue, 'responsable') and cargue.responsable:
                            if pedido.vendedor.lower() in cargue.responsable.lower():
                                # ✅ SUMAR dinero
                                cargue.total_pedidos = float(cargue.total_pedidos or 0) + float(pedido.total)
                                
                                # Recalcular total_efectivo
                                if hasattr(cargue, 'venta') and cargue.venta:
                                    cargue.total_efectivo = float(cargue.venta) - float(cargue.total_pedidos)
                                
                                cargue.save()
                                break
        
        return pedido
```

---

### ViewSets

#### PedidoViewSet
**Ubicación:** `api/views.py`

**Endpoints:**
- `GET /api/pedidos/` - Listar todos los pedidos
- `POST /api/pedidos/` - Crear nuevo pedido
- `GET /api/pedidos/{id}/` - Obtener pedido específico
- `PATCH /api/pedidos/{id}/` - Actualizar pedido
- `DELETE /api/pedidos/{id}/` - Eliminar pedido
- `POST /api/pedidos/{id}/anular/` - Anular pedido (custom action)

```python
class PedidoViewSet(viewsets.ModelViewSet):
    """API para gestionar pedidos"""
    queryset = Pedido.objects.all().order_by('-fecha_creacion')
    serializer_class = PedidoSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """Filtrar pedidos por parámetros"""
        queryset = Pedido.objects.all().order_by('-fecha_creacion')
        
        # Filtros opcionales
        destinatario = self.request.query_params.get('destinatario')
        estado = self.request.query_params.get('estado')
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        transportadora = self.request.query_params.get('transportadora')
        
        if destinatario:
            queryset = queryset.filter(destinatario__icontains=destinatario)
        if estado:
            queryset = queryset.filter(estado=estado.upper())
        if fecha_desde:
            queryset = queryset.filter(fecha__date__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha__date__lte=fecha_hasta)
        if transportadora:
            queryset = queryset.filter(transportadora__icontains=transportadora)
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def anular(self, request, pk=None):
        """
        Anular pedido y revertir cambios en Planeación y Cargue
        
        Proceso:
        1. Cambiar estado a ANULADA
        2. Restar cantidades en Planeación
        3. Restar dinero en Cargue
        4. Agregar nota con motivo y fecha
        """
        pedido = self.get_object()
        
        if pedido.estado == 'ANULADA':
            return Response(
                {'detail': 'El pedido ya está anulado'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # 1. Cambiar estado
                estado_anterior = pedido.estado
                pedido.estado = 'ANULADA'
                motivo = request.data.get('motivo', 'Anulado desde gestión de pedidos')
                pedido.nota = f"{pedido.nota or ''}\n[ANULADO] Estado anterior: {estado_anterior} - {motivo} - {timezone.now().strftime('%Y-%m-%d %H:%M')}"
                pedido.save()
                
                # 2. Revertir en Planeación
                if pedido.fecha_entrega:
                    for detalle in pedido.detalles.all():
                        planeacion = Planeacion.objects.filter(
                            fecha=pedido.fecha_entrega,
                            producto_nombre=detalle.producto.nombre
                        ).first()
                        
                        if planeacion:
                            # ✅ RESTAR cantidad
                            planeacion.pedidos = max(0, planeacion.pedidos - detalle.cantidad)
                            planeacion.save()
                
                # 3. Revertir en Cargue
                if pedido.fecha_entrega and pedido.vendedor:
                    cargue_models = [
                        ('ID1', CargueID1), ('ID2', CargueID2), ('ID3', CargueID3),
                        ('ID4', CargueID4), ('ID5', CargueID5), ('ID6', CargueID6)
                    ]
                    
                    for id_cargue, CargueModel in cargue_models:
                        cargues = CargueModel.objects.filter(fecha=pedido.fecha_entrega)
                        
                        for cargue in cargues:
                            if hasattr(cargue, 'responsable') and cargue.responsable:
                                if pedido.vendedor.lower() in cargue.responsable.lower():
                                    # ✅ RESTAR dinero
                                    cargue.total_pedidos = max(0, float(cargue.total_pedidos or 0) - float(pedido.total))
                                    
                                    # Recalcular total_efectivo
                                    if hasattr(cargue, 'venta') and cargue.venta:
                                        cargue.total_efectivo = float(cargue.venta) - float(cargue.total_pedidos)
                                    
                                    cargue.save()
                                    break
                
                serializer = self.get_serializer(pedido)
                return Response({
                    'success': True,
                    'message': 'Pedido anulado exitosamente',
                    'pedido': serializer.data
                })
                
        except Exception as e:
            return Response(
                {'detail': f'Error al anular pedido: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

---

### Integración con Planeación

#### Modelo Planeacion
```python
class Planeacion(models.Model):
    """Modelo para planeación de producción por fecha"""
    
    fecha = models.DateField()
    producto_nombre = models.CharField(max_length=255)
    
    # Datos de planeación
    existencias = models.IntegerField(default=0)
    solicitadas = models.IntegerField(default=0)
    pedidos = models.IntegerField(default=0)  # ← Se actualiza con pedidos
    total = models.IntegerField(default=0)
    orden = models.IntegerField(default=0)
    ia = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ('fecha', 'producto_nombre')
    
    def save(self, *args, **kwargs):
        # ✅ Calcular total automáticamente
        self.total = self.solicitadas + self.pedidos
        super().save(*args, **kwargs)
```

**Flujo:**
1. Pedido se crea con `fecha_entrega = 2025-10-18`
2. Serializer busca/crea registro en Planeacion para esa fecha y producto
3. Suma cantidad en `planeacion.pedidos`
4. Al guardar, `planeacion.total` se recalcula automáticamente

---

### Integración con Cargue

#### Modelos CargueID1-ID6
```python
class CargueID1(models.Model):
    """Modelo para cargue de vendedor ID1"""
    
    dia = models.CharField(max_length=10, choices=DIAS_CHOICES)
    fecha = models.DateField()
    responsable = models.CharField(max_length=100, default='RESPONSABLE')
    
    # Resumen financiero
    base_caja = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_despacho = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_pedidos = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # ← Se actualiza
    total_dctos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    venta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_efectivo = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # ← Se recalcula
```

**Flujo:**
1. Pedido se crea con `vendedor = "Carlos"` y `fecha_entrega = 2025-10-18`
2. Serializer busca registros de Cargue para esa fecha
3. Compara `pedido.vendedor` con `cargue.responsable`
4. Si coincide, suma `pedido.total` a `cargue.total_pedidos`
5. Recalcula `cargue.total_efectivo = venta - total_pedidos`

---

### Casos de Uso

#### Crear Pedido
```bash
POST /api/pedidos/
Content-Type: application/json

{
  "fecha": "2025-10-17T14:30:00",
  "vendedor": "Carlos",
  "destinatario": "PRUEBA3",
  "direccion_entrega": "Cll 134 no18-20",
  "telefono_contacto": "3001234567",
  "fecha_entrega": "2025-10-18",
  "tipo_pedido": "ENTREGA",
  "transportadora": "Propia",
  "subtotal": 4500.00,
  "impuestos": 0.00,
  "descuentos": 0.00,
  "total": 4500.00,
  "estado": "PENDIENTE",
  "nota": "",
  "detalles": [
    {
      "producto": 1,
      "cantidad": 1,
      "precio_unitario": 2500.00
    },
    {
      "producto": 2,
      "cantidad": 1,
      "precio_unitario": 2000.00
    }
  ]
}
```

**Resultado:**
- ✅ Crea PED-000011
- ✅ Planeación 2025-10-18: AREPA TIPO OBLEA +1, AREPA MEDIANA +1
- ✅ Cargue ID1 (Carlos) 2025-10-18: total_pedidos +$4,500

#### Anular Pedido
```bash
POST /api/pedidos/11/anular/
Content-Type: application/json

{
  "motivo": "Cliente canceló el pedido"
}
```

**Resultado:**
- ✅ PED-000011.estado = 'ANULADA'
- ✅ Planeación 2025-10-18: AREPA TIPO OBLEA -1, AREPA MEDIANA -1
- ✅ Cargue ID1 (Carlos) 2025-10-18: total_pedidos -$4,500

---

### Consideraciones Importantes

#### 1. Transacciones Atómicas
Todas las operaciones usan `transaction.atomic()` para garantizar consistencia:
- Si falla la actualización de Planeación, se revierte todo
- Si falla la actualización de Cargue, se revierte todo

#### 2. Filtrado de Pedidos Anulados
El frontend DEBE filtrar pedidos anulados al calcular totales:
```python
pedidos_activos = pedidos.filter(estado__ne='ANULADA')
```

#### 3. Coincidencia de Vendedores
La lógica busca coincidencia parcial (case-insensitive):
```python
if pedido.vendedor.lower() in cargue.responsable.lower():
```

#### 4. Cálculo Automático de Totales
- `Planeacion.total` se calcula automáticamente en `save()`
- `Cargue.total_efectivo` se calcula manualmente después de actualizar `total_pedidos`

---

### Troubleshooting

#### Problema: Pedidos anulados se siguen sumando
**Solución:** Verificar que el frontend filtre por `estado !== 'ANULADA'`

#### Problema: Total duplicado en Cargue
**Solución:** Verificar que solo haya un registro de Cargue por fecha y vendedor

#### Problema: Pedido no aparece en Planeación
**Solución:** Verificar que `fecha_entrega` coincida con la fecha seleccionada

#### Problema: Pedido no suma en Cargue
**Solución:** Verificar que `vendedor` coincida con `responsable` en Cargue
