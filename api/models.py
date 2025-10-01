from django.db import models
from django.utils import timezone

class Categoria(models.Model):
    """Modelo para categorías de productos"""
    nombre = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.nombre

class Producto(models.Model):
    """Modelo principal para productos"""
    nombre = models.CharField(max_length=255, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock_total = models.IntegerField(default=0)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, related_name='productos')
    imagen = models.ImageField(upload_to='productos/', null=True, blank=True)
    codigo_barras = models.CharField(max_length=100, blank=True, null=True)
    marca = models.CharField(max_length=100, default="GENERICA")
    impuesto = models.CharField(max_length=20, default="IVA(0%)")
    fecha_creacion = models.DateTimeField(default=timezone.now)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nombre} - Stock: {self.stock_total}"

class Lote(models.Model):
    """Modelo para registro de lotes por fecha"""
    lote = models.CharField(max_length=100)
    fecha_vencimiento = models.DateField(null=True, blank=True)
    usuario = models.CharField(max_length=100, default='Sistema')
    fecha_produccion = models.DateField(default='2025-06-17')
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"Lote {self.lote} - {self.fecha_produccion} - {self.usuario}"

class RegistroInventario(models.Model):
    """Modelo para registrar cantidades de productos por fecha"""
    producto_id = models.IntegerField()
    producto_nombre = models.CharField(max_length=255)
    cantidad = models.IntegerField(default=0)
    entradas = models.IntegerField(default=0)
    salidas = models.IntegerField(default=0)
    saldo = models.IntegerField(default=0)
    tipo_movimiento = models.CharField(max_length=20, default='ENTRADA')
    fecha_produccion = models.DateField(default='2025-06-17')
    usuario = models.CharField(max_length=100, default='Sistema')
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.producto_nombre} - {self.cantidad} - {self.fecha_produccion} - {self.usuario}"

class MovimientoInventario(models.Model):
    """Modelo para movimientos de inventario"""
    TIPO_CHOICES = [
        ('ENTRADA', 'Entrada'),
        ('SALIDA', 'Salida'),
        ('AJUSTE', 'Ajuste'),
    ]
    
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='movimientos')
    lote = models.ForeignKey(Lote, on_delete=models.SET_NULL, null=True, blank=True, related_name='movimientos')
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    cantidad = models.IntegerField()
    fecha = models.DateTimeField(default=timezone.now)
    usuario = models.CharField(max_length=100)
    nota = models.TextField(blank=True, null=True)
    
    def save(self, *args, **kwargs):
        # Actualizar stock del producto
        if self.tipo == 'ENTRADA':
            self.producto.stock_total += self.cantidad
        elif self.tipo == 'SALIDA':
            self.producto.stock_total -= self.cantidad
        
        # Actualizar cantidad en el lote si existe
        if self.lote:
            if self.tipo == 'ENTRADA':
                self.lote.cantidad += self.cantidad
            elif self.tipo == 'SALIDA':
                self.lote.cantidad -= self.cantidad
            self.lote.save()
            
        self.producto.save()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.tipo} - {self.producto.nombre} - {self.cantidad} - {self.fecha.strftime('%Y-%m-%d %H:%M')}"

class Registro(models.Model):
    """Modelo para registros del sistema existente"""
    DIAS = [
        ('LUNES','LUNES'), ('MARTES','MARTES'),
        ('MIERCOLES','MIERCOLES'), ('JUEVES','JUEVES'),
        ('VIERNES','VIERNES'), ('SABADO','SABADO'),
    ]
    IDS = [(f'ID{i}',f'ID{i}') for i in range(1,7)]
    
    dia = models.CharField(max_length=10, choices=DIAS, default='LUNES')
    id_sheet = models.CharField(max_length=4, choices=IDS, default='ID1')
    id_usuario = models.IntegerField()
    v_vendedor = models.BooleanField(default=False)
    d_despachador = models.BooleanField(default=False)
    producto = models.ForeignKey('Producto', on_delete=models.CASCADE)
    cantidad = models.IntegerField(default=0)
    descuentos = models.IntegerField(default=0)
    adicional = models.IntegerField(default=0)
    devoluciones = models.IntegerField(default=0)
    vencidas = models.IntegerField(default=0)
    valor = models.IntegerField(default=0)
    total = models.IntegerField(default=0)
    neto = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        self.total = (
            self.cantidad
            - self.descuentos
            + self.adicional
            - self.devoluciones
            - self.vencidas
        )
        self.neto = self.total * self.valor
        
        # Actualizar stock si es nuevo
        if self.pk is None:
            self.producto.stock_total -= self.total
            self.producto.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.dia}/{self.id_sheet} – {self.producto.nombre} – Usuario {self.id_usuario}"

class Venta(models.Model):
    """Modelo para registrar ventas del POS"""
    ESTADO_CHOICES = [
        ('PAGADO', 'Pagado'),
        ('PENDIENTE', 'Pendiente'),
        ('CANCELADO', 'Cancelado'),
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
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES, default='EFECTIVO')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    impuestos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    descuentos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    dinero_entregado = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    devuelta = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PAGADO')
    nota = models.TextField(blank=True, null=True)
    banco = models.CharField(max_length=100, default='Caja General')
    centro_costo = models.CharField(max_length=100, blank=True, null=True)
    bodega = models.CharField(max_length=100, default='Principal')
    
    def __str__(self):
        return f"Venta #{self.numero_factura} - {self.cliente} - ${self.total}"
    
    def save(self, *args, **kwargs):
        # Generar número de factura si no existe
        if not self.numero_factura:
            import uuid
            self.numero_factura = f"F{str(uuid.uuid4().int)[:8]}"
        super().save(*args, **kwargs)

class DetalleVenta(models.Model):
    """Modelo para los items de cada venta"""
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.IntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    
    def save(self, *args, **kwargs):
        # Calcular subtotal
        self.subtotal = self.cantidad * self.precio_unitario
        
        # Solo crear movimiento de inventario (que se encarga del stock)
        if self.pk is None:  # Solo al crear
            MovimientoInventario.objects.create(
                producto=self.producto,
                tipo='SALIDA',
                cantidad=self.cantidad,
                usuario=self.venta.vendedor,
                nota=f'Venta #{self.venta.numero_factura}'
            )
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.producto.nombre} x{self.cantidad} - ${self.subtotal}"

class Cliente(models.Model):
    """Modelo para gestionar clientes"""
    REGIMEN_CHOICES = [
        ('SIMPLIFICADO', 'Régimen Simplificado'),
        ('COMUN', 'Régimen Común'),
    ]
    
    TIPO_PERSONA_CHOICES = [
        ('NATURAL', 'Natural'),
        ('JURIDICA', 'Jurídica'),
    ]
    
    TIPO_IDENTIFICACION_CHOICES = [
        ('CC', 'Cédula de ciudadanía'),
        ('NIT', 'NIT'),
        ('CE', 'Cédula de extranjería'),
        ('PASAPORTE', 'Pasaporte'),
    ]
    
    # Información básica
    regimen = models.CharField(max_length=20, choices=REGIMEN_CHOICES, default='SIMPLIFICADO')
    tipo_persona = models.CharField(max_length=20, choices=TIPO_PERSONA_CHOICES, default='NATURAL')
    tipo_identificacion = models.CharField(max_length=20, choices=TIPO_IDENTIFICACION_CHOICES, default='CC')
    identificacion = models.CharField(max_length=50, unique=True)
    nombre_completo = models.CharField(max_length=255)
    alias = models.CharField(max_length=100, blank=True, null=True)
    
    # Nombres separados
    primer_nombre = models.CharField(max_length=100, blank=True, null=True)
    segundo_nombre = models.CharField(max_length=100, blank=True, null=True)
    primer_apellido = models.CharField(max_length=100, blank=True, null=True)
    segundo_apellido = models.CharField(max_length=100, blank=True, null=True)
    
    # Contacto
    telefono_1 = models.CharField(max_length=20, blank=True, null=True)
    movil = models.CharField(max_length=20, blank=True, null=True)
    email_1 = models.EmailField(blank=True, null=True)
    contacto = models.CharField(max_length=255, blank=True, null=True)
    telefono_contacto = models.CharField(max_length=20, blank=True, null=True)
    
    # Datos geográficos
    pais = models.CharField(max_length=100, default='Colombia')
    departamento = models.CharField(max_length=100, blank=True, null=True)
    ciudad = models.CharField(max_length=100, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    zona_barrio = models.CharField(max_length=255, blank=True, null=True)
    
    # Configuración
    tipo_contacto = models.CharField(max_length=50, default='CLIENTE')
    sucursal = models.CharField(max_length=100, default='Todas')
    medio_pago_defecto = models.CharField(max_length=50, blank=True, null=True)
    nota = models.TextField(blank=True, null=True)
    
    # Saldos y crédito
    permite_venta_credito = models.BooleanField(default=False)
    cupo_endeudamiento = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    dias_vencimiento_cartera = models.IntegerField(default=30)
    
    # Control
    activo = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(default=timezone.now)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.identificacion} - {self.nombre_completo}"

class ListaPrecio(models.Model):
    """Modelo para listas de precios"""
    TIPO_CHOICES = [
        ('CLIENTE', 'Cliente'),
        ('PROVEEDOR', 'Proveedor'),
        ('EMPLEADO', 'Empleado'),
    ]
    
    nombre = models.CharField(max_length=100, unique=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='CLIENTE')
    empleado = models.CharField(max_length=100, blank=True, null=True)
    sucursal = models.CharField(max_length=100, default='Principal')
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.nombre} - {self.tipo}"

class PrecioProducto(models.Model):
    """Modelo para precios específicos por producto y lista"""
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='precios')
    lista_precio = models.ForeignKey(ListaPrecio, on_delete=models.CASCADE, related_name='precios')
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    utilidad_porcentaje = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    activo = models.BooleanField(default=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('producto', 'lista_precio')
    
    def __str__(self):
        return f"{self.producto.nombre} - {self.lista_precio.nombre} - ${self.precio}"

# ========================================
# NUEVOS MODELOS SIMPLIFICADOS DE CARGUE
# ========================================

class CargueID1(models.Model):
    """Modelo simplificado para cargue ID1 - Toda la información en una tabla"""
    
    # Choices reutilizables
    DIAS_CHOICES = [
        ('LUNES', 'Lunes'), ('MARTES', 'Martes'), ('MIERCOLES', 'Miércoles'),
        ('JUEVES', 'Jueves'), ('VIERNES', 'Viernes'), ('SABADO', 'Sábado'), ('DOMINGO', 'Domingo'),
    ]
    
    CUMPLIMIENTO_CHOICES = [('C', 'Cumple'), ('NC', 'No Cumple')]
    MOTIVO_CHOICES = [('HONGO', 'Hongo'), ('FVTO', 'FVTO'), ('SELLADO', 'Sellado')]
    
    # ===== IDENTIFICACIÓN =====
    dia = models.CharField(max_length=10, choices=DIAS_CHOICES)
    fecha = models.DateField()  # ✅ Sin default automático - se pasa desde frontend
    
    # ===== CHECKBOXES =====
    v = models.BooleanField(default=False)  # vendedor
    d = models.BooleanField(default=False)  # despachador
    
    # ===== PRODUCTOS =====
    producto = models.CharField(max_length=255, blank=True)
    cantidad = models.IntegerField(default=0)
    dctos = models.IntegerField(default=0)
    adicional = models.IntegerField(default=0)
    devoluciones = models.IntegerField(default=0)
    vencidas = models.IntegerField(default=0)
    lotes_vencidos = models.TextField(blank=True)  # JSON string con lotes y motivos
    total = models.IntegerField(default=0)
    valor = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    neto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # ===== PAGOS =====
    concepto = models.CharField(max_length=255, blank=True)
    descuentos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    nequi = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    daviplata = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # ===== RESUMEN =====
    base_caja = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_despacho = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_pedidos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_dctos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    venta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_efectivo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # ===== CONTROL DE CUMPLIMIENTO =====
    licencia_transporte = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    soat = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    uniforme = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    no_locion = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    no_accesorios = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    capacitacion_carnet = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    higiene = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    estibas = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    desinfeccion = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    
    # ===== METADATOS =====
    usuario = models.CharField(max_length=100, default='Sistema')
    responsable = models.CharField(max_length=100, default='RESPONSABLE', blank=True)  # ✅ Campo responsable agregado
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Calcular total automáticamente
        self.total = self.cantidad - self.dctos + self.adicional - self.devoluciones - self.vencidas
        # Calcular neto
        self.neto = self.total * self.valor
        super().save(*args, **kwargs)
    
    def clean(self):
        # ✅ Validar que fecha sea requerida
        if not self.fecha:
            from django.core.exceptions import ValidationError
            raise ValidationError("La fecha es requerida y debe ser proporcionada desde el frontend")
    
    def __str__(self):
        return f"ID1 - {self.dia} - {self.fecha} - {self.producto} - {self.responsable}"

class CargueID2(models.Model):
    """Modelo simplificado para cargue ID2 - Toda la información en una tabla"""
    
    # Choices reutilizables
    DIAS_CHOICES = [
        ('LUNES', 'Lunes'), ('MARTES', 'Martes'), ('MIERCOLES', 'Miércoles'),
        ('JUEVES', 'Jueves'), ('VIERNES', 'Viernes'), ('SABADO', 'Sábado'), ('DOMINGO', 'Domingo'),
    ]
    
    CUMPLIMIENTO_CHOICES = [('C', 'Cumple'), ('NC', 'No Cumple')]
    MOTIVO_CHOICES = [('HONGO', 'Hongo'), ('FVTO', 'FVTO'), ('SELLADO', 'Sellado')]
    
    # ===== IDENTIFICACIÓN =====
    dia = models.CharField(max_length=10, choices=DIAS_CHOICES)
    fecha = models.DateField()  # ✅ Sin default automático - se pasa desde frontend
    
    # ===== CHECKBOXES =====
    v = models.BooleanField(default=False)  # vendedor
    d = models.BooleanField(default=False)  # despachador
    
    # ===== PRODUCTOS =====
    producto = models.CharField(max_length=255, blank=True)
    cantidad = models.IntegerField(default=0)
    dctos = models.IntegerField(default=0)
    adicional = models.IntegerField(default=0)
    devoluciones = models.IntegerField(default=0)
    vencidas = models.IntegerField(default=0)
    lotes_vencidos = models.TextField(blank=True)  # JSON string con lotes y motivos
    total = models.IntegerField(default=0)
    valor = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    neto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # ===== PAGOS =====
    concepto = models.CharField(max_length=255, blank=True)
    descuentos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    nequi = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    daviplata = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # ===== RESUMEN =====
    base_caja = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_despacho = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_pedidos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_dctos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    venta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_efectivo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # ===== CONTROL DE CUMPLIMIENTO =====
    licencia_transporte = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    soat = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    uniforme = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    no_locion = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    no_accesorios = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    capacitacion_carnet = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    higiene = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    estibas = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    desinfeccion = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    
    # ===== METADATOS =====
    usuario = models.CharField(max_length=100, default='Sistema')
    responsable = models.CharField(max_length=100, default='RESPONSABLE', blank=True)  # ✅ Campo responsable agregado
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Calcular total automáticamente
        self.total = self.cantidad - self.dctos + self.adicional - self.devoluciones - self.vencidas
        # Calcular neto
        self.neto = self.total * self.valor
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"ID2 - {self.dia} - {self.fecha} - {self.producto} - {self.responsable}"

class CargueID3(models.Model):
    """Modelo simplificado para cargue ID3 - Toda la información en una tabla"""
    
    # Choices reutilizables
    DIAS_CHOICES = [
        ('LUNES', 'Lunes'), ('MARTES', 'Martes'), ('MIERCOLES', 'Miércoles'),
        ('JUEVES', 'Jueves'), ('VIERNES', 'Viernes'), ('SABADO', 'Sábado'), ('DOMINGO', 'Domingo'),
    ]
    
    CUMPLIMIENTO_CHOICES = [('C', 'Cumple'), ('NC', 'No Cumple')]
    MOTIVO_CHOICES = [('HONGO', 'Hongo'), ('FVTO', 'FVTO'), ('SELLADO', 'Sellado')]
    
    # ===== IDENTIFICACIÓN =====
    dia = models.CharField(max_length=10, choices=DIAS_CHOICES)
    fecha = models.DateField()  # ✅ Sin default automático - se pasa desde frontend
    
    # ===== CHECKBOXES =====
    v = models.BooleanField(default=False)  # vendedor
    d = models.BooleanField(default=False)  # despachador
    
    # ===== PRODUCTOS =====
    producto = models.CharField(max_length=255, blank=True)
    cantidad = models.IntegerField(default=0)
    dctos = models.IntegerField(default=0)
    adicional = models.IntegerField(default=0)
    devoluciones = models.IntegerField(default=0)
    vencidas = models.IntegerField(default=0)
    lotes_vencidos = models.TextField(blank=True)  # JSON string con lotes y motivos
    total = models.IntegerField(default=0)
    valor = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    neto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # ===== PAGOS =====
    concepto = models.CharField(max_length=255, blank=True)
    descuentos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    nequi = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    daviplata = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # ===== RESUMEN =====
    base_caja = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_despacho = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_pedidos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_dctos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    venta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_efectivo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # ===== CONTROL DE CUMPLIMIENTO =====
    licencia_transporte = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    soat = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    uniforme = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    no_locion = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    no_accesorios = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    capacitacion_carnet = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    higiene = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    estibas = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    desinfeccion = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    
    # ===== METADATOS =====
    usuario = models.CharField(max_length=100, default='Sistema')
    responsable = models.CharField(max_length=100, default='RESPONSABLE', blank=True)  # ✅ Campo responsable agregado
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Calcular total automáticamente
        self.total = self.cantidad - self.dctos + self.adicional - self.devoluciones - self.vencidas
        # Calcular neto
        self.neto = self.total * self.valor
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"ID3 - {self.dia} - {self.fecha} - {self.producto} - {self.responsable}"

class CargueID4(models.Model):
    """Modelo simplificado para cargue ID4 - Toda la información en una tabla"""
    
    # Choices reutilizables
    DIAS_CHOICES = [
        ('LUNES', 'Lunes'), ('MARTES', 'Martes'), ('MIERCOLES', 'Miércoles'),
        ('JUEVES', 'Jueves'), ('VIERNES', 'Viernes'), ('SABADO', 'Sábado'), ('DOMINGO', 'Domingo'),
    ]
    
    CUMPLIMIENTO_CHOICES = [('C', 'Cumple'), ('NC', 'No Cumple')]
    MOTIVO_CHOICES = [('HONGO', 'Hongo'), ('FVTO', 'FVTO'), ('SELLADO', 'Sellado')]
    
    # ===== IDENTIFICACIÓN =====
    dia = models.CharField(max_length=10, choices=DIAS_CHOICES)
    fecha = models.DateField()  # ✅ Sin default automático - se pasa desde frontend
    
    # ===== CHECKBOXES =====
    v = models.BooleanField(default=False)  # vendedor
    d = models.BooleanField(default=False)  # despachador
    
    # ===== PRODUCTOS =====
    producto = models.CharField(max_length=255, blank=True)
    cantidad = models.IntegerField(default=0)
    dctos = models.IntegerField(default=0)
    adicional = models.IntegerField(default=0)
    devoluciones = models.IntegerField(default=0)
    vencidas = models.IntegerField(default=0)
    lotes_vencidos = models.TextField(blank=True)  # JSON string con lotes y motivos
    total = models.IntegerField(default=0)
    valor = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    neto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # ===== PAGOS =====
    concepto = models.CharField(max_length=255, blank=True)
    descuentos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    nequi = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    daviplata = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # ===== RESUMEN =====
    base_caja = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_despacho = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_pedidos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_dctos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    venta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_efectivo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # ===== CONTROL DE CUMPLIMIENTO =====
    licencia_transporte = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    soat = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    uniforme = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    no_locion = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    no_accesorios = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    capacitacion_carnet = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    higiene = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    estibas = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    desinfeccion = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    
    # ===== METADATOS =====
    usuario = models.CharField(max_length=100, default='Sistema')
    responsable = models.CharField(max_length=100, default='RESPONSABLE', blank=True)  # ✅ Campo responsable agregado
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Calcular total automáticamente
        self.total = self.cantidad - self.dctos + self.adicional - self.devoluciones - self.vencidas
        # Calcular neto
        self.neto = self.total * self.valor
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"ID4 - {self.dia} - {self.fecha} - {self.producto} - {self.responsable}"

class CargueID5(models.Model):
    """Modelo simplificado para cargue ID5 - Toda la información en una tabla"""
    
    # Choices reutilizables
    DIAS_CHOICES = [
        ('LUNES', 'Lunes'), ('MARTES', 'Martes'), ('MIERCOLES', 'Miércoles'),
        ('JUEVES', 'Jueves'), ('VIERNES', 'Viernes'), ('SABADO', 'Sábado'), ('DOMINGO', 'Domingo'),
    ]
    
    CUMPLIMIENTO_CHOICES = [('C', 'Cumple'), ('NC', 'No Cumple')]
    MOTIVO_CHOICES = [('HONGO', 'Hongo'), ('FVTO', 'FVTO'), ('SELLADO', 'Sellado')]
    
    # ===== IDENTIFICACIÓN =====
    dia = models.CharField(max_length=10, choices=DIAS_CHOICES)
    fecha = models.DateField()  # ✅ Sin default automático - se pasa desde frontend
    
    # ===== CHECKBOXES =====
    v = models.BooleanField(default=False)  # vendedor
    d = models.BooleanField(default=False)  # despachador
    
    # ===== PRODUCTOS =====
    producto = models.CharField(max_length=255, blank=True)
    cantidad = models.IntegerField(default=0)
    dctos = models.IntegerField(default=0)
    adicional = models.IntegerField(default=0)
    devoluciones = models.IntegerField(default=0)
    vencidas = models.IntegerField(default=0)
    lotes_vencidos = models.TextField(blank=True)  # JSON string con lotes y motivos
    total = models.IntegerField(default=0)
    valor = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    neto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # ===== PAGOS =====
    concepto = models.CharField(max_length=255, blank=True)
    descuentos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    nequi = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    daviplata = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # ===== RESUMEN =====
    base_caja = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_despacho = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_pedidos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_dctos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    venta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_efectivo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # ===== CONTROL DE CUMPLIMIENTO =====
    licencia_transporte = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    soat = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    uniforme = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    no_locion = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    no_accesorios = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    capacitacion_carnet = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    higiene = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    estibas = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    desinfeccion = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    
    # ===== METADATOS =====
    usuario = models.CharField(max_length=100, default='Sistema')
    responsable = models.CharField(max_length=100, default='RESPONSABLE', blank=True)  # ✅ Campo responsable agregado
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Calcular total automáticamente
        self.total = self.cantidad - self.dctos + self.adicional - self.devoluciones - self.vencidas
        # Calcular neto
        self.neto = self.total * self.valor
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"ID5 - {self.dia} - {self.fecha} - {self.producto} - {self.responsable}"

class CargueID6(models.Model):
    """Modelo simplificado para cargue ID6 - Toda la información en una tabla"""
    
    # Choices reutilizables
    DIAS_CHOICES = [
        ('LUNES', 'Lunes'), ('MARTES', 'Martes'), ('MIERCOLES', 'Miércoles'),
        ('JUEVES', 'Jueves'), ('VIERNES', 'Viernes'), ('SABADO', 'Sábado'), ('DOMINGO', 'Domingo'),
    ]
    
    CUMPLIMIENTO_CHOICES = [('C', 'Cumple'), ('NC', 'No Cumple')]
    MOTIVO_CHOICES = [('HONGO', 'Hongo'), ('FVTO', 'FVTO'), ('SELLADO', 'Sellado')]
    
    # ===== IDENTIFICACIÓN =====
    dia = models.CharField(max_length=10, choices=DIAS_CHOICES)
    fecha = models.DateField()  # ✅ Sin default automático - se pasa desde frontend
    
    # ===== CHECKBOXES =====
    v = models.BooleanField(default=False)  # vendedor
    d = models.BooleanField(default=False)  # despachador
    
    # ===== PRODUCTOS =====
    producto = models.CharField(max_length=255, blank=True)
    cantidad = models.IntegerField(default=0)
    dctos = models.IntegerField(default=0)
    adicional = models.IntegerField(default=0)
    devoluciones = models.IntegerField(default=0)
    vencidas = models.IntegerField(default=0)
    lotes_vencidos = models.TextField(blank=True)  # JSON string con lotes y motivos
    total = models.IntegerField(default=0)
    valor = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    neto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # ===== PAGOS =====
    concepto = models.CharField(max_length=255, blank=True)
    descuentos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    nequi = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    daviplata = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # ===== RESUMEN =====
    base_caja = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_despacho = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_pedidos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_dctos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    venta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_efectivo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # ===== CONTROL DE CUMPLIMIENTO =====
    licencia_transporte = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    soat = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    uniforme = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    no_locion = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    no_accesorios = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    capacitacion_carnet = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    higiene = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    estibas = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    desinfeccion = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    
    # ===== METADATOS =====
    usuario = models.CharField(max_length=100, default='Sistema')
    responsable = models.CharField(max_length=100, default='RESPONSABLE', blank=True)  # ✅ Campo responsable agregado
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Calcular total automáticamente
        self.total = self.cantidad - self.dctos + self.adicional - self.devoluciones - self.vencidas
        # Calcular neto
        self.neto = self.total * self.valor
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"ID6 - {self.dia} - {self.fecha} - {self.producto} - {self.responsable}"

# ========================================
# TABLA DE PRODUCCIÓN SEPARADA
# ========================================

class Produccion(models.Model):
    """Modelo para producción con función de congelado"""
    
    # Identificación
    fecha = models.DateField(default=timezone.now)
    producto = models.CharField(max_length=255)
    cantidad = models.IntegerField(default=0)
    lote = models.CharField(max_length=100, blank=True)
    
    # Función especial de congelado
    congelado = models.BooleanField(default=False)
    fecha_congelado = models.DateTimeField(blank=True, null=True)
    usuario_congelado = models.CharField(max_length=100, blank=True)
    
    # Metadatos
    usuario = models.CharField(max_length=100, default='Sistema')
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    def congelar(self, usuario):
        """Función para congelar la producción"""
        self.congelado = True
        self.fecha_congelado = timezone.now()
        self.usuario_congelado = usuario
        self.save()
    
    def descongelar(self, usuario):
        """Función para descongelar la producción"""
        self.congelado = False
        self.fecha_congelado = None
        self.usuario_congelado = usuario
        self.save()
    
    def __str__(self):
        estado = "🧊 CONGELADO" if self.congelado else "🔥 ACTIVO"
        return f"{estado} - {self.fecha} - {self.producto} - {self.cantidad}"

class ProduccionSolicitada(models.Model):
    """Modelo para guardar las cantidades solicitadas de producción"""
    
    DIAS_CHOICES = [
        ('LUNES', 'Lunes'), ('MARTES', 'Martes'), ('MIERCOLES', 'Miércoles'),
        ('JUEVES', 'Jueves'), ('VIERNES', 'Viernes'), ('SABADO', 'Sábado'), ('DOMINGO', 'Domingo'),
    ]
    
    dia = models.CharField(max_length=10, choices=DIAS_CHOICES)
    fecha = models.DateField()
    producto_nombre = models.CharField(max_length=255)
    cantidad_solicitada = models.IntegerField(default=0)
    
    # Metadatos
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('dia', 'fecha', 'producto_nombre')
    
    def __str__(self):
        return f"{self.dia} - {self.fecha} - {self.producto_nombre}: {self.cantidad_solicitada}"