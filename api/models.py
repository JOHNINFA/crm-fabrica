from django.db import models
from django.utils import timezone

class Categoria(models.Model):
    """Modelo para categorías de productos"""
    nombre = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.nombre

class Producto(models.Model):
    """Modelo principal para productos"""
    UBICACION_INVENTARIO_CHOICES = [
        ('PRODUCCION', 'Producción'),
        ('MAQUILA', 'Maquila'),
    ]
    
    nombre = models.CharField(max_length=255, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    precio_cargue = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Precio Cargue/App")  # Precio independiente para Cargue y App móvil
    stock_total = models.IntegerField(default=0)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, related_name='productos')
    imagen = models.ImageField(upload_to='productos/', null=True, blank=True)
    codigo_barras = models.CharField(max_length=100, blank=True, null=True)
    marca = models.CharField(max_length=100, default="GENERICA")
    impuesto = models.CharField(max_length=20, default="IVA(0%)")
    orden = models.IntegerField(default=0, db_index=True)  # Campo para ordenamiento personalizado
    ubicacion_inventario = models.CharField(max_length=20, choices=UBICACION_INVENTARIO_CHOICES, default='PRODUCCION', db_index=True)  # Para filtrar en Inventario
    fecha_creacion = models.DateTimeField(default=timezone.now)
    
    # 🆕 DISPONIBILIDAD POR MÓDULO (CRM Web)
    disponible_pos = models.BooleanField(default=True, verbose_name="Disponible en POS")
    disponible_cargue = models.BooleanField(default=True, verbose_name="Disponible en Cargue (CRM)")
    disponible_pedidos = models.BooleanField(default=True, verbose_name="Disponible en Pedidos")
    disponible_inventario = models.BooleanField(default=True, verbose_name="Disponible en Inventario")
    
    # 🆕 DISPONIBILIDAD POR MÓDULO (App Móvil)
    disponible_app_cargue = models.BooleanField(default=True, verbose_name="App: Cargue")
    disponible_app_sugeridos = models.BooleanField(default=True, verbose_name="App: Sugeridos")
    disponible_app_rendimiento = models.BooleanField(default=True, verbose_name="App: Rendimiento")
    disponible_app_ventas = models.BooleanField(default=True, verbose_name="App: Ventas")
    
    activo = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['orden', 'id']  # Ordenar por orden personalizado, luego por ID

    def save(self, *args, **kwargs):
        """Eliminar imagen antigua al actualizar con una nueva y crear/actualizar Stock"""
        es_nuevo = self.pk is None
        skip_stock_sync = kwargs.pop('skip_stock_sync', False)  # Flag para evitar loops
        
        if self.pk:  # Solo si es actualización
            try:
                old_producto = Producto.objects.get(pk=self.pk)
                # Si hay imagen antigua y es diferente a la nueva
                if old_producto.imagen and old_producto.imagen != self.imagen:
                    self._delete_image_files(old_producto.imagen)
            except Producto.DoesNotExist:
                pass
            except Exception as e:
                print(f"⚠️ Error al eliminar imagen antigua: {e}")
        
        super().save(*args, **kwargs)
        
        # 🚀 AUTO-CREAR/ACTUALIZAR STOCK (solo si no viene del Stock mismo)
        if not skip_stock_sync:
            if es_nuevo:
                # Crear registro en Stock para producto nuevo
                from api.models import Stock
                Stock.objects.create(
                    producto=self,
                    cantidad_actual=self.stock_total or 0
                )
                print(f"✅ Stock creado automáticamente para: {self.nombre}")
            else:
                # Actualizar stock existente solo si cambió
                try:
                    from api.models import Stock
                    stock_obj = Stock.objects.get(producto=self)
                    if stock_obj.cantidad_actual != self.stock_total:
                        stock_obj.cantidad_actual = self.stock_total or 0
                        stock_obj.save()
                except Stock.DoesNotExist:
                    # Si no existe, crearlo
                    Stock.objects.create(
                        producto=self,
                        cantidad_actual=self.stock_total or 0
                    )
                    print(f"✅ Stock creado para producto existente: {self.nombre}")
    
    def delete(self, *args, **kwargs):
        """Eliminar imagen al borrar el producto"""
        if self.imagen:
            self._delete_image_files(self.imagen)
        super().delete(*args, **kwargs)
    
    def _delete_image_files(self, imagen):
        """Método auxiliar para eliminar archivos de imagen de ambas ubicaciones"""
        import os
        from django.conf import settings
        
        try:
            # Eliminar de media/productos/
            if os.path.isfile(imagen.path):
                os.remove(imagen.path)
                print(f"✅ Imagen eliminada de media: {imagen.path}")
            
            # Eliminar de frontend/public/images/productos/
            frontend_path = os.path.join(
                settings.BASE_DIR, 
                'frontend', 
                'public', 
                'images', 
                'productos',
                os.path.basename(imagen.name)
            )
            if os.path.isfile(frontend_path):
                os.remove(frontend_path)
                print(f"✅ Imagen eliminada de frontend: {frontend_path}")
        except Exception as e:
            print(f"⚠️ Error al eliminar archivos de imagen: {e}")

    @property
    def stock_actual(self):
        """Obtener stock actual desde tabla Stock"""
        try:
            return self.stock.cantidad_actual
        except:
            return self.stock_total or 0
    
    def __str__(self):
        return f"{self.nombre} - Stock: {self.stock_total}"

class Stock(models.Model):
    """Modelo para almacenar stock actual de productos"""
    producto = models.OneToOneField(
        Producto, 
        on_delete=models.CASCADE, 
        related_name='stock',
        primary_key=True
    )
    producto_nombre = models.CharField(max_length=255, blank=True)
    producto_descripcion = models.TextField(blank=True, null=True)
    cantidad_actual = models.IntegerField(default=0)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'api_stock'
        verbose_name = 'Stock'
        verbose_name_plural = 'Stocks'
    
    def save(self, *args, **kwargs):
        """Auto-llenar nombre y descripción del producto y sincronizar con Producto.stock_total"""
        if self.producto:
            self.producto_nombre = self.producto.nombre
            self.producto_descripcion = self.producto.descripcion
            
            # 🔄 SINCRONIZAR con Producto.stock_total
            # Solo sincronizar si la cantidad cambió (evitar loops infinitos)
            if self.pk:  # Si ya existe
                try:
                    old_stock = Stock.objects.get(pk=self.pk)
                    if old_stock.cantidad_actual != self.cantidad_actual:
                        # Actualizar stock_total del producto con flag para evitar loop
                        self.producto.stock_total = self.cantidad_actual
                        self.producto.save(skip_stock_sync=True)
                except Stock.DoesNotExist:
                    pass
            else:  # Si es nuevo
                self.producto.stock_total = self.cantidad_actual
                self.producto.save(skip_stock_sync=True)
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.producto.nombre}: {self.cantidad_actual}"

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
            
        # Guardar producto con flag para que sincronice con Stock
        self.producto.save()  # Esto dispara Producto.save() que actualiza Stock
        
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
    creado_por = models.CharField(max_length=100, default='Sistema')  # 🆕 Usuario que digitó la venta
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

class TipoNegocio(models.Model):
    """Modelo para tipos de negocio personalizables"""
    nombre = models.CharField(max_length=100, unique=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['nombre']
        verbose_name = 'Tipo de Negocio'
        verbose_name_plural = 'Tipos de Negocio'
    
    def __str__(self):
        return self.nombre

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
    tipo_negocio = models.CharField(max_length=100, blank=True, null=True, help_text='Tipo de negocio: Tienda, Supermercado, Carnicería, etc.')
    
    # Nombres separados
    primer_nombre = models.CharField(max_length=100, blank=True, null=True)
    segundo_nombre = models.CharField(max_length=100, blank=True, null=True)
    primer_apellido = models.CharField(max_length=100, blank=True, null=True)
    segundo_apellido = models.CharField(max_length=100, blank=True, null=True)
    
    # Contacto
    telefono_1 = models.CharField(max_length=20, blank=True, null=True)
    movil = models.CharField(max_length=100, blank=True, null=True)
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
    tipo_lista_precio = models.CharField(max_length=100, blank=True, null=True)
    vendedor_asignado = models.CharField(max_length=100, blank=True, null=True)
    centro_costo = models.CharField(max_length=100, blank=True, null=True)
    dia_entrega = models.CharField(max_length=100, blank=True, null=True)
    notificar_cartera = models.BooleanField(default=False)
    notificar_rotacion = models.BooleanField(default=False)
    cliente_predeterminado = models.BooleanField(default=False)
    
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

class ProductosFrecuentes(models.Model):
    """Productos frecuentes de un cliente para un día específico"""
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='productos_frecuentes')
    dia = models.CharField(max_length=20)  # LUNES, MARTES, etc.
    productos = models.JSONField(default=list)  # [{producto_id, cantidad, nombre}, ...]
    nota = models.TextField(blank=True, null=True)  # 🆕 Nota persistente para este día
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Productos Frecuentes'
        verbose_name_plural = 'Productos Frecuentes'
        unique_together = ['cliente', 'dia']
    
    def __str__(self):
        return f"{self.cliente.nombre_completo} - {self.dia}"


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
    visible_pos = models.BooleanField(default=False)  # 🆕 Controlar visibilidad en POS globalmente
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
    
    def save(self, *args, **kwargs):
        """Si es lista CLIENTES, actualizar precio base del producto"""
        super().save(*args, **kwargs)
        
        # Si la lista es "CLIENTES", actualizar el precio base del producto
        if self.lista_precio.nombre == 'CLIENTES':
            self.producto.precio = self.precio
            self.producto.save(update_fields=['precio'])
            print(f"✅ Precio base actualizado: {self.producto.nombre} = ${self.precio}")
    
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
    vendidas = models.IntegerField(default=0)  # 🆕 Cantidades vendidas en el día
    vencidas = models.IntegerField(default=0)
    lotes_vencidos = models.TextField(blank=True)  # JSON string con lotes y motivos
    lotes_produccion = models.TextField(blank=True)  # JSON string con lotes del día
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
    ruta = models.CharField(max_length=100, default='', blank=True)  # Campo ruta para vendedor
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
    
    class Meta:
        # 🚀 Evitar duplicados: solo un registro por día+fecha+producto
        unique_together = ['dia', 'fecha', 'producto']
        verbose_name = 'Cargue ID1'
        verbose_name_plural = 'Cargues ID1'

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
    vendidas = models.IntegerField(default=0)  # 🆕 Cantidades vendidas en el día
    vencidas = models.IntegerField(default=0)
    lotes_vencidos = models.TextField(blank=True)  # JSON string con lotes y motivos
    lotes_produccion = models.TextField(blank=True)  # JSON string con lotes del día
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
    ruta = models.CharField(max_length=100, default='', blank=True)  # Campo ruta para vendedor
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
    
    class Meta:
        unique_together = ['dia', 'fecha', 'producto']
        verbose_name = 'Cargue ID2'
        verbose_name_plural = 'Cargues ID2'

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
    vendidas = models.IntegerField(default=0)  # 🆕 Cantidades vendidas en el día
    vencidas = models.IntegerField(default=0)
    lotes_vencidos = models.TextField(blank=True)  # JSON string con lotes y motivos
    lotes_produccion = models.TextField(blank=True)  # JSON string con lotes del día
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
    
    class Meta:
        unique_together = ['dia', 'fecha', 'producto']
        verbose_name = 'Cargue ID3'
        verbose_name_plural = 'Cargues ID3'

class ConfiguracionImpresion(models.Model):
    """Modelo para configuración de impresión de tickets"""
    
    ANCHO_PAPEL_CHOICES = [
        ('58mm', '58mm'),
        ('80mm', '80mm'),
    ]
    
    FUENTE_TICKET_CHOICES = [
        ('Courier New', 'Courier New (Clásico)'),
        ('Consolas', 'Consolas (Moderno)'),
        ('Monaco', 'Monaco'),
        ('Lucida Console', 'Lucida Console'),
        ('Arial', 'Arial'),
        ('Verdana', 'Verdana'),
        ('Tahoma', 'Tahoma'),
    ]

    
    # Información del negocio
    nombre_negocio = models.CharField(max_length=255, default='MI NEGOCIO')
    nit_negocio = models.CharField(max_length=50, blank=True, null=True)
    direccion_negocio = models.TextField(blank=True, null=True)
    ciudad_negocio = models.CharField(max_length=100, blank=True, null=True, help_text='Ciudad del negocio (ej: BOGOTA)')
    pais_negocio = models.CharField(max_length=100, blank=True, null=True, default='Colombia', help_text='País del negocio')
    telefono_negocio = models.CharField(max_length=100, blank=True, null=True)
    email_negocio = models.EmailField(blank=True, null=True)
    
    # Textos personalizables
    encabezado_ticket = models.TextField(blank=True, null=True, help_text='Texto que aparece al inicio del ticket')
    pie_pagina_ticket = models.TextField(blank=True, null=True, help_text='Texto que aparece al final del ticket')
    mensaje_agradecimiento = models.CharField(max_length=255, default='¡Gracias por su compra!')
    
    # Configuración de impresión
    logo = models.ImageField(upload_to='configuracion/', null=True, blank=True)
    ancho_papel = models.CharField(max_length=10, choices=ANCHO_PAPEL_CHOICES, default='80mm')
    fuente_ticket = models.CharField(max_length=50, choices=FUENTE_TICKET_CHOICES, default='Courier New', verbose_name='Fuente del Ticket')
    
    # 🆕 Configuración de estilos visuales (tamaños, espaciados, etc.)
    tamanio_fuente_general = models.IntegerField(default=14, help_text='Tamaño de fuente general del ticket (px)')
    tamanio_fuente_nombre_negocio = models.IntegerField(default=16, help_text='Tamaño del nombre del negocio (px)')
    tamanio_fuente_info = models.IntegerField(default=13, help_text='Tamaño de la información de venta (px)')
    tamanio_fuente_tabla = models.IntegerField(default=13, help_text='Tamaño de la tabla de productos (px)')
    tamanio_fuente_totales = models.IntegerField(default=13, help_text='Tamaño de los totales (px)')
    letter_spacing = models.DecimalField(max_digits=3, decimal_places=1, default=-0.2, help_text='Espaciado entre letras (px, negativo para compactar)')
    letter_spacing_divider = models.DecimalField(max_digits=3, decimal_places=1, default=-0.8, help_text='Espaciado de divisores (px)')
    font_weight_tabla = models.CharField(max_length=10, default='normal', choices=[('normal', 'Normal'), ('bold', 'Negrita')], help_text='Peso de fuente de la tabla de productos')
    
    mostrar_logo = models.BooleanField(default=True)
    mostrar_codigo_barras = models.BooleanField(default=False)
    impresora_predeterminada = models.CharField(max_length=255, blank=True, null=True)
    
    # Información adicional
    resolucion_facturacion = models.CharField(max_length=255, blank=True, null=True)
    regimen_tributario = models.CharField(max_length=255, blank=True, null=True)
    
    # Control
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Configuración de Impresión'
        verbose_name_plural = 'Configuraciones de Impresión'
    
    def __str__(self):
        return f"Configuración de Impresión - {self.nombre_negocio}"

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
    vendidas = models.IntegerField(default=0)  # 🆕 Cantidades vendidas en el día
    vencidas = models.IntegerField(default=0)
    lotes_vencidos = models.TextField(blank=True)  # JSON string con lotes y motivos
    lotes_produccion = models.TextField(blank=True)  # JSON string con lotes del día
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
    
    class Meta:
        unique_together = ['dia', 'fecha', 'producto']
        verbose_name = 'Cargue ID4'
        verbose_name_plural = 'Cargues ID4'

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
    vendidas = models.IntegerField(default=0)  # 🆕 Cantidades vendidas en el día
    vencidas = models.IntegerField(default=0)
    lotes_vencidos = models.TextField(blank=True)  # JSON string con lotes y motivos
    lotes_produccion = models.TextField(blank=True)  # JSON string con lotes del día
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
    
    class Meta:
        unique_together = ['dia', 'fecha', 'producto']
        verbose_name = 'Cargue ID5'
        verbose_name_plural = 'Cargues ID5'

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
    vendidas = models.IntegerField(default=0)  # 🆕 Cantidades vendidas en el día
    vencidas = models.IntegerField(default=0)
    lotes_vencidos = models.TextField(blank=True)  # JSON string con lotes y motivos
    lotes_produccion = models.TextField(blank=True)  # JSON string con lotes del día
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
    
    class Meta:
        unique_together = ['dia', 'fecha', 'producto']
        verbose_name = 'Cargue ID6'
        verbose_name_plural = 'Cargues ID6'

# ========================================
# TABLAS NORMALIZADAS DE CARGUE (Nuevas)
# ========================================

class CargueProductos(models.Model):
    """
    Modelo normalizado para productos de cargue
    Reemplaza la parte de productos de CargueID1-6
    """
    DIAS_CHOICES = [
        ('LUNES', 'Lunes'), ('MARTES', 'Martes'), ('MIERCOLES', 'Miércoles'),
        ('JUEVES', 'Jueves'), ('VIERNES', 'Viernes'), ('SABADO', 'Sábado'), ('DOMINGO', 'Domingo'),
    ]
    
    # Identificación (PK compuesta lógica)
    vendedor_id = models.CharField(max_length=3)  # ID1, ID2, ID3, ID4, ID5, ID6
    dia = models.CharField(max_length=10, choices=DIAS_CHOICES)
    fecha = models.DateField()
    producto = models.CharField(max_length=255)
    
    # Datos del producto
    cantidad = models.IntegerField(default=0)
    dctos = models.IntegerField(default=0)
    adicional = models.IntegerField(default=0)
    devoluciones = models.IntegerField(default=0)
    vencidas = models.IntegerField(default=0)
    total = models.IntegerField(default=0)
    
    # Precio y valor
    valor = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    neto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Checks
    v = models.BooleanField(default=False)  # Vendedor
    d = models.BooleanField(default=False)  # Despachador
    
    # Lotes (JSON)
    lotes_vencidos = models.TextField(blank=True)
    lotes_produccion = models.TextField(blank=True)
    
    # Metadatos
    responsable = models.CharField(max_length=100, default='Sistema')
    usuario = models.CharField(max_length=100, default='Sistema')
    ruta = models.CharField(max_length=100, blank=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'api_cargue_productos'
        unique_together = ['vendedor_id', 'dia', 'fecha', 'producto']
        indexes = [
            models.Index(fields=['vendedor_id', 'fecha', 'dia']),
            models.Index(fields=['fecha']),
        ]
        verbose_name = 'Producto de Cargue'
        verbose_name_plural = 'Productos de Cargue'
    
    def save(self, *args, **kwargs):
        # Calcular total y neto automáticamente
        self.total = self.cantidad - self.dctos + self.adicional - self.vencidas
        self.neto = self.total * self.valor
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.vendedor_id} - {self.dia} - {self.fecha} - {self.producto}"


class CargueResumen(models.Model):
    """
    Modelo normalizado para resúmenes de cargue
    Guarda base_caja, totales, ventas (UNA FILA POR DÍA/VENDEDOR)
    """
    DIAS_CHOICES = [
        ('LUNES', 'Lunes'), ('MARTES', 'Martes'), ('MIERCOLES', 'Miércoles'),
        ('JUEVES', 'Jueves'), ('VIERNES', 'Viernes'), ('SABADO', 'Sábado'), ('DOMINGO', 'Domingo'),
    ]
    
    # Identificación (PK compuesta lógica)
    vendedor_id = models.CharField(max_length=3)
    dia = models.CharField(max_length=10, choices=DIAS_CHOICES)
    fecha = models.DateField()
    
    # Resumen financiero
    base_caja = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_despacho = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_pedidos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_dctos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    venta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_efectivo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # 🆕 Notas del cargue
    nota = models.TextField(blank=True, default='')
    
    # 🆕 Estado del proceso de cargue
    ESTADO_CARGUE_CHOICES = [
        ('ALISTAMIENTO', 'Alistamiento'),
        ('SUGERIDO', 'Sugerido'),
        ('DESPACHO', 'Despacho'),
        ('COMPLETADO', 'Completado'),
    ]
    estado_cargue = models.CharField(max_length=20, choices=ESTADO_CARGUE_CHOICES, default='ALISTAMIENTO')
    
    # Metadatos
    usuario = models.CharField(max_length=100, default='Sistema')
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'api_cargue_resumen'
        unique_together = ['vendedor_id', 'dia', 'fecha']
        indexes = [
            models.Index(fields=['vendedor_id', 'fecha']),
            models.Index(fields=['fecha']),
        ]
        verbose_name = 'Resumen de Cargue'
        verbose_name_plural = 'Resúmenes de Cargue'
    
    def __str__(self):
        return f"{self.vendedor_id} - {self.dia} - {self.fecha} - Venta: ${self.venta}"


class CarguePagos(models.Model):
    """
    Modelo normalizado para conceptos de pago
    Puede haber MÚLTIPLES conceptos por día/vendedor
    """
    DIAS_CHOICES = [
        ('LUNES', 'Lunes'), ('MARTES', 'Martes'), ('MIERCOLES', 'Miércoles'),
        ('JUEVES', 'Jueves'), ('VIERNES', 'Viernes'), ('SABADO', 'Sábado'), ('DOMINGO', 'Domingo'),
    ]
    
    # Identificación
    vendedor_id = models.CharField(max_length=3)
    dia = models.CharField(max_length=10, choices=DIAS_CHOICES)
    fecha = models.DateField()
    
    # Datos de pago
    concepto = models.CharField(max_length=255, blank=True)
    descuentos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    nequi = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    daviplata = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Metadatos
    usuario = models.CharField(max_length=100, default='Sistema')
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'api_cargue_pagos'
        indexes = [
            models.Index(fields=['vendedor_id', 'fecha', 'dia']),
            models.Index(fields=['fecha']),
        ]
        verbose_name = 'Pago de Cargue'
        verbose_name_plural = 'Pagos de Cargue'
    
    def __str__(self):
        return f"{self.vendedor_id} - {self.dia} - {self.fecha} - {self.concepto}"


class CargueCumplimiento(models.Model):
    """
    Modelo normalizado para checklist de cumplimiento
    UNA FILA POR DÍA/VENDEDOR
    """
    DIAS_CHOICES = [
        ('LUNES', 'Lunes'), ('MARTES', 'Martes'), ('MIERCOLES', 'Miércoles'),
        ('JUEVES', 'Jueves'), ('VIERNES', 'Viernes'), ('SABADO', 'Sábado'), ('DOMINGO', 'Domingo'),
    ]
    
    CUMPLIMIENTO_CHOICES = [('C', 'Cumple'), ('NC', 'No Cumple')]
    
    # Identificación (PK compuesta lógica)
    vendedor_id = models.CharField(max_length=3)
    dia = models.CharField(max_length=10, choices=DIAS_CHOICES)
    fecha = models.DateField()
    
    # Checklist de cumplimiento
    licencia_transporte = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    soat = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    uniforme = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    no_locion = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    no_accesorios = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    capacitacion_carnet = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    higiene = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    estibas = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    desinfeccion = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True, null=True)
    
    # Metadatos
    usuario = models.CharField(max_length=100, default='Sistema')
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'api_cargue_cumplimiento'
        unique_together = ['vendedor_id', 'dia', 'fecha']
        indexes = [
            models.Index(fields=['vendedor_id', 'fecha']),
            models.Index(fields=['fecha']),
        ]
        verbose_name = 'Cumplimiento de Cargue'
        verbose_name_plural = 'Cumplimientos de Cargue'
    
    def __str__(self):
        return f"{self.vendedor_id} - {self.dia} - {self.fecha}"


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

# ========================================
# MODELOS PARA SISTEMA POS - CAJEROS
# ========================================

class Sucursal(models.Model):
    """Modelo para sucursales/puntos de venta"""
    nombre = models.CharField(max_length=100, unique=True)
    direccion = models.TextField(blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    ciudad = models.CharField(max_length=100, blank=True, null=True)
    departamento = models.CharField(max_length=100, blank=True, null=True)
    codigo_postal = models.CharField(max_length=10, blank=True, null=True)
    
    # Configuración
    activo = models.BooleanField(default=True)
    es_principal = models.BooleanField(default=False)
    
    # Metadatos
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Sucursal'
        verbose_name_plural = 'Sucursales'
        ordering = ['nombre']
    
    def save(self, *args, **kwargs):
        # Solo una sucursal puede ser principal
        if self.es_principal:
            Sucursal.objects.filter(es_principal=True).update(es_principal=False)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.nombre} {'(Principal)' if self.es_principal else ''}"

class Cajero(models.Model):
    """Modelo unificado para usuarios del sistema (Cajeros, Vendedores, Remisiones, Admin)"""
    ROLES_CHOICES = [
        ('CAJERO', 'Cajero POS'),
        ('VENDEDOR', 'Vendedor App Móvil'),
        ('REMISIONES', 'Remisiones/Pedidos'),
        ('SUPERVISOR', 'Supervisor'),
        ('ADMINISTRADOR', 'Administrador'),
    ]
    
    # 🆕 Código interno único (ID1, ID101, ID102, etc.)
    codigo = models.CharField(max_length=20, unique=True, blank=True, null=True, help_text="Código interno: ID1, ID101, etc.")
    
    nombre = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    password = models.CharField(max_length=255)  # Hash de la contraseña
    password_plano = models.CharField(max_length=255, blank=True, null=True)  # 🆕 Contraseña visible (texto plano)
    
    # Relaciones (opcional para vendedores)
    sucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE, related_name='cajeros', null=True, blank=True)
    
    # Configuración
    rol = models.CharField(max_length=20, choices=ROLES_CHOICES, default='CAJERO')
    activo = models.BooleanField(default=True)
    puede_hacer_descuentos = models.BooleanField(default=False)
    limite_descuento = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    puede_anular_ventas = models.BooleanField(default=False)
    
    # 🆕 PERMISOS POR MÓDULO
    acceso_app_movil = models.BooleanField(default=False, verbose_name="App Móvil (Ventas Ruta)")
    acceso_pos = models.BooleanField(default=False, verbose_name="POS (Punto de Venta)")
    acceso_pedidos = models.BooleanField(default=False, verbose_name="Pedidos/Remisiones")
    acceso_cargue = models.BooleanField(default=False, verbose_name="Cargue Vendedores")
    acceso_produccion = models.BooleanField(default=False, verbose_name="Producción/Planeación")
    acceso_inventario = models.BooleanField(default=False, verbose_name="Inventario")
    acceso_reportes = models.BooleanField(default=False, verbose_name="Reportes")
    acceso_configuracion = models.BooleanField(default=False, verbose_name="Configuración/Admin")
    
    # Metadatos
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    ultimo_login = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['rol', 'nombre']
    
    def save(self, *args, **kwargs):
        # Auto-generar código si no existe
        if not self.codigo:
            # Generar código según el rol
            prefijo = {
                'VENDEDOR': 'ID',
                'CAJERO': 'POS',
                'REMISIONES': 'REM',
                'SUPERVISOR': 'SUP',
                'ADMINISTRADOR': 'ADM'
            }.get(self.rol, 'USR')
            
            ultimo = Cajero.objects.filter(codigo__startswith=prefijo).order_by('-id').first()
            if ultimo and ultimo.codigo:
                try:
                    num = int(ultimo.codigo.replace(prefijo, '')) + 1
                except:
                    num = 1
            else:
                num = 1
            self.codigo = f"{prefijo}{num}"
        
        # Auto-asignar permisos según rol
        if self.pk is None:  # Solo en creación
            if self.rol == 'VENDEDOR':
                self.acceso_app_movil = True
            elif self.rol == 'CAJERO':
                self.acceso_pos = True
            elif self.rol == 'REMISIONES':
                self.acceso_pedidos = True
                self.acceso_cargue = True
            elif self.rol == 'ADMINISTRADOR':
                self.acceso_app_movil = True
                self.acceso_pos = True
                self.acceso_pedidos = True
                self.acceso_cargue = True
                self.acceso_produccion = True
                self.acceso_inventario = True
                self.acceso_reportes = True
                self.acceso_configuracion = True
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"[{self.codigo}] {self.nombre} ({self.rol})"

class Turno(models.Model):
    """Modelo para turnos de cajeros"""
    ESTADOS_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('CERRADO', 'Cerrado'),
        ('SUSPENDIDO', 'Suspendido'),
    ]
    
    # Relaciones
    cajero = models.ForeignKey(Cajero, on_delete=models.CASCADE, related_name='turnos')
    sucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE, related_name='turnos')
    
    # Información del turno
    fecha_inicio = models.DateTimeField(default=timezone.now)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS_CHOICES, default='ACTIVO')
    
    # Arqueo de caja
    base_inicial = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    arqueo_final = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    diferencia = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Totales calculados
    total_ventas = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_efectivo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_tarjeta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_otros = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    numero_transacciones = models.IntegerField(default=0)
    
    # Notas
    notas_apertura = models.TextField(blank=True, null=True)
    notas_cierre = models.TextField(blank=True, null=True)
    
    # Metadatos
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Turno'
        verbose_name_plural = 'Turnos'
        ordering = ['-fecha_inicio']
    
    def save(self, *args, **kwargs):
        # Calcular diferencia en arqueo
        if self.arqueo_final and self.base_inicial:
            esperado = self.base_inicial + self.total_efectivo
            self.diferencia = self.arqueo_final - esperado
        super().save(*args, **kwargs)
    
    def cerrar_turno(self, arqueo_final, notas_cierre=None):
        """Método para cerrar el turno"""
        self.fecha_fin = timezone.now()
        self.estado = 'CERRADO'
        self.arqueo_final = arqueo_final
        self.notas_cierre = notas_cierre
        
        # Calcular totales desde las ventas
        ventas_turno = Venta.objects.filter(
            fecha__gte=self.fecha_inicio,
            fecha__lte=self.fecha_fin
        )
        
        self.total_ventas = sum(v.total for v in ventas_turno)
        self.total_efectivo = sum(v.total for v in ventas_turno if v.metodo_pago == 'EFECTIVO')
        self.total_tarjeta = sum(v.total for v in ventas_turno if v.metodo_pago == 'TARJETA')
        self.total_otros = sum(v.total for v in ventas_turno if v.metodo_pago not in ['EFECTIVO', 'TARJETA'])
        self.numero_transacciones = ventas_turno.count()
        
        self.save()
    
    def duracion(self):
        """Calcular duración del turno"""
        if self.fecha_fin:
            return self.fecha_fin - self.fecha_inicio
        return timezone.now() - self.fecha_inicio
    
    def __str__(self):
        estado_emoji = {'ACTIVO': '🟢', 'CERRADO': '🔴', 'SUSPENDIDO': '🟡'}
        return f"{estado_emoji.get(self.estado, '')} {self.cajero.nombre} - {self.fecha_inicio.strftime('%Y-%m-%d %H:%M')}"

class VentaCajero(models.Model):
    """Extensión del modelo Venta para incluir información del cajero"""
    venta = models.OneToOneField(Venta, on_delete=models.CASCADE, related_name='info_cajero')
    cajero = models.ForeignKey(Cajero, on_delete=models.CASCADE, related_name='ventas_realizadas')
    turno = models.ForeignKey(Turno, on_delete=models.CASCADE, related_name='ventas', null=True, blank=True)
    sucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE, related_name='ventas_sucursal')
    
    # Información adicional
    terminal = models.CharField(max_length=50, default='POS-001')
    numero_transaccion = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        verbose_name = 'Venta Cajero'
        verbose_name_plural = 'Ventas Cajero'
    
    def __str__(self):
        return f"Venta #{self.venta.numero_factura} - {self.cajero.nombre}"

class ArqueoCaja(models.Model):
    """Modelo para arqueos de caja"""
    ESTADOS_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('COMPLETADO', 'Completado'),
        ('REVISADO', 'Revisado'),
    ]
    
    # Información básica
    fecha = models.DateField()
    cajero = models.CharField(max_length=100)
    banco = models.CharField(max_length=100, default='Caja General')
    
    # Valores del sistema (calculados)
    valores_sistema = models.JSONField(default=dict)
    total_sistema = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Valores físicos de caja (ingresados por cajero)
    valores_caja = models.JSONField(default=dict)
    total_caja = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Diferencias calculadas
    diferencias = models.JSONField(default=dict)
    total_diferencia = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Información adicional
    observaciones = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADOS_CHOICES, default='COMPLETADO')
    
    # Relaciones opcionales con cajero logueado
    cajero_logueado = models.ForeignKey(Cajero, on_delete=models.SET_NULL, null=True, blank=True, related_name='arqueos')
    sucursal = models.ForeignKey(Sucursal, on_delete=models.SET_NULL, null=True, blank=True, related_name='arqueos')
    turno = models.ForeignKey(Turno, on_delete=models.SET_NULL, null=True, blank=True, related_name='arqueos')
    
    # Metadatos
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Arqueo de Caja'
        verbose_name_plural = 'Arqueos de Caja'
        ordering = ['-fecha', '-fecha_creacion']
        # NOTA: Removido unique_together para permitir múltiples arqueos por día (uno por turno)
    
    def save(self, *args, **kwargs):
        # Calcular totales automáticamente
        if isinstance(self.valores_sistema, dict):
            self.total_sistema = sum(float(v) for v in self.valores_sistema.values())
        if isinstance(self.valores_caja, dict):
            self.total_caja = sum(float(v) for v in self.valores_caja.values())
        
        self.total_diferencia = self.total_caja - self.total_sistema
        
        # Calcular diferencias por método
        if isinstance(self.valores_sistema, dict) and isinstance(self.valores_caja, dict):
            diferencias = {}
            for metodo in self.valores_sistema.keys():
                sistema = float(self.valores_sistema.get(metodo, 0))
                caja = float(self.valores_caja.get(metodo, 0))
                diferencias[metodo] = caja - sistema
            self.diferencias = diferencias
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        estado_emoji = {'PENDIENTE': '⏳', 'COMPLETADO': '✅', 'REVISADO': '🔍'}
        return f"{estado_emoji.get(self.estado, '')} {self.fecha} - {self.cajero} - {self.banco}"

class MovimientoCaja(models.Model):
    """Modelo para movimientos de caja (ingresos y egresos)"""
    TIPO_CHOICES = [
        ('INGRESO', 'Ingreso'),
        ('EGRESO', 'Egreso'),
    ]
    
    # Información básica
    fecha = models.DateField()
    hora = models.CharField(max_length=10)
    cajero = models.CharField(max_length=100)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    concepto = models.CharField(max_length=255)
    
    # 🆕 Relación con el turno
    # 🆕 Relación con el turno
    turno = models.ForeignKey('Turno', on_delete=models.SET_NULL, null=True, blank=True, related_name='movimientos_caja')
    
    
    # Metadatos
    fecha_creacion = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = 'Movimiento de Caja'
        verbose_name_plural = 'Movimientos de Caja'
        ordering = ['-fecha', '-hora']
    
    def __str__(self):
        tipo_emoji = {'INGRESO': '💰', 'EGRESO': '💸'}
        return f"{tipo_emoji.get(self.tipo, '')} {self.fecha} - {self.cajero} - ${self.monto}"

class Pedido(models.Model):
    """Modelo para pedidos de productos"""
    
    class Meta:
        db_table = 'api_pedido'
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'
    
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('EN_TRANSITO', 'En Tránsito'),
        ('ENTREGADA', 'Entregada'),
        ('ANULADA', 'Anulada'),
    ]
    
    TIPO_PEDIDO_CHOICES = [
        ('ENTREGA', 'Entrega'),
        ('TRASLADO', 'Traslado'),
        ('DEVOLUCION', 'Devolución'),
        ('MUESTRA', 'Muestra'),
    ]
    
    ASIGNADO_A_TIPO_CHOICES = [
        ('VENDEDOR', 'Vendedor'),
        ('DOMICILIARIO', 'Domiciliario'),
        ('NINGUNO', 'Ninguno'),
    ]
    
    # Información básica
    numero_pedido = models.CharField(max_length=50, unique=True, verbose_name='Número de Pedido', db_column='numero_remision')
    fecha = models.DateTimeField(default=timezone.now)
    vendedor = models.CharField(max_length=100)
    destinatario = models.CharField(max_length=255)
    
    # Información de entrega
    direccion_entrega = models.TextField()
    telefono_contacto = models.CharField(max_length=20, blank=True, null=True)
    zona_barrio = models.CharField(max_length=255, blank=True, null=True, verbose_name='Zona/Barrio')  # 🆕
    fecha_entrega = models.DateField(null=True, blank=True)
    
    # Clasificación
    tipo_pedido = models.CharField(max_length=20, choices=TIPO_PEDIDO_CHOICES, default='ENTREGA', verbose_name='Tipo de Pedido', db_column='tipo_remision')
    transportadora = models.CharField(max_length=100, default='Propia')
    
    # Totales
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    impuestos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    descuentos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # ===== NUEVOS CAMPOS PARA AFECTAR INVENTARIO =====
    afectar_inventario_inmediato = models.BooleanField(default=False, verbose_name='Afectar inventario inmediatamente')
    asignado_a_tipo = models.CharField(
        max_length=20, 
        choices=ASIGNADO_A_TIPO_CHOICES, 
        default='NINGUNO',
        verbose_name='Tipo de asignación'
    )
    asignado_a_id = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        verbose_name='ID del vendedor o domiciliario'
    )  # Ej: 'ID1', 'ID2', 'DOM1', 'DOM2', etc.
    inventario_afectado = models.BooleanField(default=False, verbose_name='Inventario ya afectado')
    
    # 🆕 Método de pago
    METODO_PAGO_CHOICES = [
        ('EFECTIVO', 'Efectivo'),
        ('NEQUI', 'Nequi'),
        ('DAVIPLATA', 'Daviplata'),
    ]
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES, default='EFECTIVO')
    
    # Estado y control
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    nota = models.TextField(blank=True, null=True)
    novedades = models.JSONField(default=list, blank=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Generar número de pedido automáticamente si no existe
        if not self.numero_pedido:
            # Obtener el último número
            ultimo_pedido = Pedido.objects.filter(
                numero_pedido__startswith='PED-'
            ).order_by('-id').first()
            
            if ultimo_pedido:
                try:
                    ultimo_numero = int(ultimo_pedido.numero_pedido.split('-')[1])
                    nuevo_numero = ultimo_numero + 1
                except (ValueError, IndexError):
                    nuevo_numero = 1
            else:
                nuevo_numero = 1
            
            self.numero_pedido = f'PED-{nuevo_numero:06d}'
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.numero_pedido} - {self.destinatario} - ${self.total}"

class DetallePedido(models.Model):
    """Modelo para detalles de productos en pedidos"""
    
    class Meta:
        db_table = 'api_detallepedido'
        verbose_name = 'Detalle de Pedido'
        verbose_name_plural = 'Detalles de Pedidos'
    
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='detalles', verbose_name='Pedido')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    
    def save(self, *args, **kwargs):
        # Calcular subtotal automáticamente
        self.subtotal = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.producto.nombre} x{self.cantidad} - ${self.subtotal}"


class Planeacion(models.Model):
    """Modelo para planeación de producción por fecha"""
    
    # Identificación
    fecha = models.DateField()
    producto_nombre = models.CharField(max_length=255)
    
    # Datos de planeación
    existencias = models.IntegerField(default=0)
    solicitadas = models.IntegerField(default=0)
    pedidos = models.IntegerField(default=0)
    total = models.IntegerField(default=0)
    orden = models.IntegerField(default=0)
    ia = models.IntegerField(default=0)
    
    # Metadatos
    usuario = models.CharField(max_length=100, default='Sistema')
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('fecha', 'producto_nombre')
        ordering = ['fecha', 'producto_nombre']
    
    def save(self, *args, **kwargs):
        # Calcular total automáticamente
        self.total = self.solicitadas + self.pedidos
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.fecha} - {self.producto_nombre} - Total: {self.total}"


class Vendedor(models.Model):
    """Modelo para gestionar vendedores y sus nombres"""
    id_vendedor = models.CharField(max_length=10, unique=True, primary_key=True)  # ID1, ID2, etc.
    nombre = models.CharField(max_length=100)
    password = models.CharField(max_length=50, default='1234')  # Contraseña para la App
    ruta = models.CharField(max_length=100, blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.id_vendedor} - {self.nombre}"
    
    class Meta:
        verbose_name = "Vendedor"
        verbose_name_plural = "Vendedores"
        ordering = ['id_vendedor']

    def save(self, *args, **kwargs):
        # Verificar si es una actualización y el nombre cambió
        if self.pk:
            try:
                old_instance = Vendedor.objects.get(pk=self.pk)
                if old_instance.nombre != self.nombre:
                    # Actualizar el nombre en todos los pedidos asociados
                    # Nota: Pedido está definido arriba en este mismo archivo
                    Pedido.objects.filter(
                        asignado_a_tipo='VENDEDOR',
                        asignado_a_id=self.id_vendedor
                    ).update(vendedor=self.nombre)
                    print(f"✅ Nombre de vendedor actualizado en pedidos: {old_instance.nombre} -> {self.nombre}")

                    # Actualizar el nombre en todos los CLIENTES asociados
                    # Nota: Cliente está definido arriba en este mismo archivo
                    Cliente.objects.filter(
                        vendedor_asignado=old_instance.nombre
                    ).update(vendedor_asignado=self.nombre)
                    print(f"✅ Nombre de vendedor actualizado en clientes: {old_instance.nombre} -> {self.nombre}")
            except Exception as e:
                print(f"⚠️ Error actualizando nombre en pedidos/clientes: {e}")
        
        super().save(*args, **kwargs)


class Domiciliario(models.Model):
    """Modelo para gestionar domiciliarios"""
    codigo = models.CharField(max_length=20, unique=True, primary_key=True)  # DOM1, DOM2, etc.
    nombre = models.CharField(max_length=100)
    identificacion = models.CharField(max_length=50, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    vehiculo = models.CharField(max_length=100, blank=True, null=True)  # Tipo de vehículo
    placa = models.CharField(max_length=20, blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"
    
    class Meta:
        verbose_name = "Domiciliario"
        verbose_name_plural = "Domiciliarios"
        ordering = ['codigo']






# ===== MÓDULO RUTAS Y VENTAS RUTA =====

class Ruta(models.Model):
    """Modelo para definir rutas de venta"""
    nombre = models.CharField(max_length=100)
    vendedor = models.ForeignKey(Vendedor, on_delete=models.SET_NULL, null=True, blank=True, related_name='rutas_asignadas')
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return self.nombre

class ClienteRuta(models.Model):
    """Modelo para clientes asignados a una ruta"""
    ruta = models.ForeignKey(Ruta, related_name='clientes', on_delete=models.CASCADE)
    nombre_negocio = models.CharField(max_length=200)
    nombre_contacto = models.CharField(max_length=200, blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    telefono = models.CharField(max_length=50, blank=True, null=True)
    tipo_negocio = models.CharField(max_length=100, blank=True, null=True) # Supermercado, Carniceria, etc.
    dia_visita = models.CharField(max_length=100) # LUNES,MARTES,MIERCOLES,etc. (múltiples días)
    orden = models.IntegerField(default=0)
    latitud = models.FloatField(null=True, blank=True)
    longitud = models.FloatField(null=True, blank=True)
    activo = models.BooleanField(default=True)
    nota = models.TextField(blank=True, null=True) # 🆕 Campo para nota/preferencias del cliente
    
    def __str__(self):
        return f"{self.nombre_negocio} ({self.dia_visita})"

class VentaRuta(models.Model):
    """Modelo para registrar ventas realizadas en ruta (App Móvil)"""
    # 🆕 ID único aumentado para formato largo (vendedor-dispositivo-timestamp-random)
    id_local = models.CharField(
        max_length=150,  # Aumentado de 50 a 150 para IDs largos
        unique=True, 
        null=True, 
        blank=True, 
        help_text="ID único: vendedor-dispositivo-timestamp-random"
    )
    
    # 🆕 Tracking multi-dispositivo
    dispositivo_id = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text="Identificador del dispositivo (ej: ANDROID-SAMSUNG-K3J9X2)"
    )
    
    ip_origen = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP desde donde se registró la venta"
    )
    
    # Campos existentes
    vendedor = models.ForeignKey(Vendedor, on_delete=models.CASCADE, related_name='ventas_ruta')
    ruta = models.ForeignKey(Ruta, on_delete=models.SET_NULL, null=True, blank=True)
    cliente_nombre = models.CharField(max_length=200) # Guardamos nombre por si borran el cliente
    nombre_negocio = models.CharField(max_length=255, blank=True, default='') # Nombre del negocio
    cliente = models.ForeignKey(ClienteRuta, on_delete=models.SET_NULL, null=True, blank=True)
    fecha = models.DateTimeField(default=timezone.now)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    metodo_pago = models.CharField(max_length=50, default='EFECTIVO')
    detalles = models.JSONField(default=list) # [{producto: "Arepa", cantidad: 10, precio: 2000, subtotal: 20000}, ...]
    productos_vencidos = models.JSONField(default=list, blank=True) # [{producto: "Arepa", cantidad: 5, motivo: "Hongo"}, ...]
    foto_vencidos = models.ImageField(upload_to='vencidos/%Y/%m/%d/', null=True, blank=True)
    sincronizado = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Venta {self.vendedor} - {self.cliente_nombre} - {self.fecha.strftime('%Y-%m-%d')}"

class EvidenciaVenta(models.Model):
    """Modelo para guardar fotos de evidencia (vencidos) asociadas a una venta"""
    venta = models.ForeignKey(VentaRuta, on_delete=models.CASCADE, related_name='evidencias')
    producto_id = models.IntegerField(help_text="ID del producto al que corresponde la foto", null=True, blank=True)
    imagen = models.ImageField(upload_to='vencidos/%Y/%m/%d/')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Evidencia Venta {self.venta.id} - Prod {self.producto_id}"


class EvidenciaPedido(models.Model):
    """Modelo para guardar fotos de evidencia (vencidos/novedades) asociadas a un pedido"""
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='evidencias')
    producto_nombre = models.CharField(max_length=200, blank=True, help_text="Nombre del producto")
    imagen = models.ImageField(upload_to='evidencias_pedidos/%Y/%m/%d/')
    motivo = models.CharField(max_length=255, blank=True, default='Devolución en entrega')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Evidencia de Pedido'
        verbose_name_plural = 'Evidencias de Pedidos'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"Evidencia Pedido {self.pedido.numero_pedido} - {self.producto_nombre}"


# ========================================
# MODELO PARA SNAPSHOT DE PLANEACIÓN
# ========================================

class RegistrosPlaneacionDia(models.Model):
    """
    Modelo para guardar snapshot de Planeación al momento de congelar.
    Se crea cuando el botón cambia de SUGERIDO → ALISTAMIENTO_ACTIVO.
    Los datos son inmutables - solo se crean, no se actualizan.
    """
    fecha = models.DateField(db_index=True)  # Fecha del día de planeación
    producto_nombre = models.CharField(max_length=200)
    existencias = models.IntegerField(default=0)
    solicitadas = models.IntegerField(default=0)
    pedidos = models.IntegerField(default=0)
    total = models.IntegerField(default=0)
    orden = models.IntegerField(default=0)
    ia = models.IntegerField(default=0)
    fecha_congelado = models.DateTimeField(auto_now_add=True)  # Timestamp de cuándo se congeló
    usuario = models.CharField(max_length=100, default='Sistema')
    
    class Meta:
        db_table = 'api_registros_planeacion_dia'
        unique_together = ['fecha', 'producto_nombre']  # Un registro por producto por día
        verbose_name = 'Registro Planeación Día'
        verbose_name_plural = 'Registros Planeación Día'
        ordering = ['fecha', 'orden']
    
    def __str__(self):
        return f"{self.fecha} - {self.producto_nombre} - Sol:{self.solicitadas}"


# ========================================
# MODELO PARA GESTIÓN DE TURNOS
# ========================================

class TurnoVendedor(models.Model):
    """
    Modelo para gestionar el estado de turnos de vendedores.
    Permite sincronización entre dispositivos - si el turno está abierto
    en un dispositivo, se refleja en todos.
    """
    ESTADO_CHOICES = [
        ('ABIERTO', 'Abierto'),
        ('CERRADO', 'Cerrado'),
    ]
    
    vendedor_id = models.IntegerField(db_index=True)  # ID del vendedor (userId)
    vendedor_nombre = models.CharField(max_length=100, blank=True)
    dia = models.CharField(max_length=10)  # LUNES, MARTES, etc.
    fecha = models.DateField()  # Fecha del turno
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='ABIERTO')
    hora_apertura = models.DateTimeField(default=timezone.now)  # Hora de apertura
    hora_cierre = models.DateTimeField(null=True, blank=True)  # Hora de cierre
    cerrado_manual = models.BooleanField(default=False)  # 🆕 True si fue cerrado con botón
    
    # Estadísticas del turno
    total_ventas = models.IntegerField(default=0)
    total_dinero = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Metadatos
    dispositivo = models.CharField(max_length=100, blank=True)  # Info del dispositivo
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'api_turno_vendedor'
        # Un vendedor solo puede tener un turno por día
        unique_together = ['vendedor_id', 'fecha']
        verbose_name = 'Turno Vendedor'
        verbose_name_plural = 'Turnos Vendedores'
        ordering = ['-fecha', 'vendedor_id']
    
    def __str__(self):
        return f"Turno {self.vendedor_nombre} - {self.dia} {self.fecha} - {self.estado}"


# ========================================
# CONFIGURACIÓN DE PRODUCCIÓN
# ========================================

class ConfiguracionProduccion(models.Model):
    """Modelo para guardar configuración de producción como usuario actual"""
    
    # Clave única para identificar la configuración
    clave = models.CharField(max_length=50, unique=True, primary_key=True)
    
    # Valor de la configuración
    valor = models.CharField(max_length=255)
    
    # Descripción opcional
    descripcion = models.TextField(blank=True)
    
    # Metadatos
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'api_configuracion_produccion'
        verbose_name = 'Configuración de Producción'
        verbose_name_plural = 'Configuraciones de Producción'
    
    def __str__(self):
        return f"{self.clave}: {self.valor}"


class RutaOrden(models.Model):
    """Modelo para guardar el orden personalizado de clientes por ruta y día"""
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='ordenes_dia', null=True, blank=True)
    dia = models.CharField(max_length=20)  # LUNES, MARTES, etc.
    clientes_ids = models.JSONField(default=list)  # Lista de IDs de clientes en orden [1, 5, 12, ...]
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        ruta_nombre = self.ruta.nombre if self.ruta else "Global"
        return f"{ruta_nombre} - {self.dia} - {len(self.clientes_ids)} clientes"

    class Meta:
        verbose_name = "Orden de Ruta"
        verbose_name_plural = "Ordenes de Rutas"
        unique_together = ['ruta', 'dia']  # Un orden por ruta + día


class AgentSession(models.Model):
    """
    Modelo para guardar sesiones conversacionales del agente IA.
    Permite flujos multi-turno donde el agente pregunta y recuerda respuestas.
    """
    import uuid as uuid_module
    
    session_id = models.UUIDField(primary_key=True, default=uuid_module.uuid4, editable=False)
    tool_name = models.CharField(max_length=100, null=True, blank=True)
    collected_params = models.JSONField(default=dict)
    required_params = models.JSONField(default=list)
    current_param_index = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['created_at']),
        ]
    
    def get_next_param(self):
        """Retorna el próximo parámetro a pedir"""
        if self.current_param_index < len(self.required_params):
            return self.required_params[self.current_param_index]
        return None
    
    def is_complete(self):
        """Verifica si tiene todos los parámetros requeridos"""
        return self.current_param_index >= len(self.required_params)
    
    def reset(self):
        """Reinicia la sesión"""
        self.tool_name = None
        self.collected_params = {}
        self.required_params = []
        self.current_param_index = 0
        self.save()
    
    def __str__(self):
        return f"Session {self.session_id} - {self.tool_name or 'idle'}"

class ReportePlaneacion(models.Model):
    """Modelo para guardar snapshots históricos de planeación"""
    fecha_reporte = models.DateField()      # Fecha de la planeación
    fecha_creacion = models.DateTimeField(auto_now_add=True) # Cuándo se creó
    usuario = models.CharField(max_length=100, blank=True, null=True, default='Sistema')
    
    # Guardamos el JSON completo de la tabla
    datos_json = models.JSONField() 
    
    def __str__(self):
        return f"Reporte {self.fecha_reporte} - {self.fecha_creacion.strftime('%Y-%m-%d %H:%M')}"
    
    class Meta:
        ordering = ['-fecha_creacion']


# ========================================
# MODELO PARA LOGS DE SINCRONIZACIÓN MULTI-DISPOSITIVO
# ========================================

class SyncLog(models.Model):
    """Modelo para trackear sincronización multi-dispositivo"""
    
    ACCION_CHOICES = [
        ('CREATE_VENTA', 'Crear Venta'),
        ('CREATE_DUPLICADO', 'Intento Duplicado'),
        ('UPDATE_CARGUE', 'Actualizar Cargue'),
        ('CLOSE_TURNO', 'Cerrar Turno'),
        ('CONFLICT', 'Conflicto Detectado'),
    ]
    
    # Qué se hizo
    accion = models.CharField(max_length=50, choices=ACCION_CHOICES)
    modelo = models.CharField(max_length=50)  # VentaRuta, CargueID1, etc.
    registro_id = models.IntegerField(default=0)
    id_local = models.CharField(max_length=150, blank=True, default='')  # Para duplicados
    
    # Quién lo hizo
    vendedor_id = models.CharField(max_length=10, blank=True, default='')
    dispositivo_id = models.CharField(max_length=100, blank=True, default='')
    ip_origen = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')
    
    # Resultado
    exito = models.BooleanField(default=True)
    error_mensaje = models.TextField(blank=True, default='')
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'api_sync_log'
        verbose_name = 'Log de Sincronización'
        verbose_name_plural = 'Logs de Sincronización'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['accion', 'timestamp']),
            models.Index(fields=['dispositivo_id', 'timestamp']),
            models.Index(fields=['id_local']),
        ]
    
    def __str__(self):
        status_emoji = '✅' if self.exito else '❌'
        return f"{status_emoji} {self.accion} - {self.dispositivo_id} - {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"
