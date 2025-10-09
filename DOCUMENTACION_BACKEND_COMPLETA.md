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
