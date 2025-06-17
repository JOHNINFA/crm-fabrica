from django.db import models
from django.utils import timezone

# Modelo para Categorías
class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.nombre

# Modelo para el Inventario General
class Producto(models.Model):
    nombre = models.CharField(max_length=255, unique=True)  # Nombre del producto
    descripcion = models.TextField(blank=True, null=True)  # Descripción opcional
    precio = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Precio de venta
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Precio de compra
    stock_total = models.IntegerField(default=0)  # Cantidad total en inventario
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, related_name='productos')
    imagen = models.ImageField(upload_to='productos/', null=True, blank=True)  # Imagen del producto
    codigo_barras = models.CharField(max_length=100, blank=True, null=True)  # Código de barras opcional
    marca = models.CharField(max_length=100, default="GENERICA")  # Marca del producto
    impuesto = models.CharField(max_length=20, default="IVA(0%)")  # Tipo de impuesto
    fecha_creacion = models.DateTimeField(default=timezone.now)  # Fecha de creación
    activo = models.BooleanField(default=True)  # Estado del producto (activo/inactivo)

    def __str__(self):
        return f"{self.nombre} - Stock: {self.stock_total}"

# Modelo para Lotes de Productos
class Lote(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='lotes')
    codigo = models.CharField(max_length=100)  # Código del lote
    fecha_vencimiento = models.DateField(null=True, blank=True)  # Fecha de vencimiento
    cantidad = models.IntegerField(default=0)  # Cantidad en este lote
    fecha_creacion = models.DateTimeField(default=timezone.now)  # Fecha de creación del lote
    
    def __str__(self):
        return f"Lote {self.codigo} - {self.producto.nombre} - Cant: {self.cantidad}"

# Modelo para Movimientos de Inventario
class MovimientoInventario(models.Model):
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
    usuario = models.CharField(max_length=100)  # Usuario que realizó el movimiento
    nota = models.TextField(blank=True, null=True)  # Nota opcional
    
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

# Modelo para Registros (mantener compatibilidad con el sistema existente)
class Registro(models.Model):
    DIAS = [
        ('LUNES','LUNES'), ('MARTES','MARTES'),
        ('MIERCOLES','MIERCOLES'), ('JUEVES','JUEVES'),
        ('VIERNES','VIERNES'), ('SABADO','SABADO'),
    ]
    IDS = [(f'ID{i}',f'ID{i}') for i in range(1,7)]
    dia      = models.CharField(max_length=10, choices=DIAS, default='LUNES')
    id_sheet = models.CharField(max_length=4,  choices=IDS, default='ID1')
  
    id_usuario = models.IntegerField()
    v_vendedor = models.BooleanField(default=False)
    d_despachador = models.BooleanField(default=False)
    producto = models.ForeignKey('Producto', on_delete=models.CASCADE)
    cantidad   = models.IntegerField(default=0)
    descuentos = models.IntegerField(default=0)
    adicional  = models.IntegerField(default=0)
    devoluciones = models.IntegerField(default=0)
    vencidas   = models.IntegerField(default=0)
    valor      = models.IntegerField(default=0)
    total      = models.IntegerField(default=0)
    neto       = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        self.total = (
            self.cantidad
            - self.descuentos
            + self.adicional
            - self.devoluciones
            - self.vencidas
        )
        self.neto = self.total * self.valor
        # Actualiza stock si es nuevo
        if self.pk is None:
            self.producto.stock_total -= self.total
            self.producto.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.dia}/{self.id_sheet} – {self.producto.nombre} – Usuario {self.id_usuario}"
