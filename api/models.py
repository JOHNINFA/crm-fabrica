from django.db import models
from django.utils import timezone

# Modelo para Categorías
class Categoria(models.Model):
    """
    Modelo para almacenar categorías de productos.
    
    ESTRUCTURA EN BASE DE DATOS (tabla api_categoria):
    - id: Integer (clave primaria, autogenerada)
    - nombre: Varchar(100) (único)
    
    RELACIONES:
    - Una categoría puede tener muchos productos (relación uno a muchos)
    
    NOTAS:
    - El frontend maneja las categorías como strings (nombres)
    - El backend espera IDs numéricos para las categorías en las solicitudes
    - Al crear un producto, se debe proporcionar el ID de la categoría, no el nombre
    """
    nombre = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.nombre

# Modelo para el Inventario General
class Producto(models.Model):
    """
    Modelo principal para productos en el sistema.
    
    ESTRUCTURA EN BASE DE DATOS (tabla api_producto):
    - id: Integer (clave primaria, autogenerada)
    - nombre: Varchar(255) (único)
    - descripcion: Text (opcional)
    - precio: Decimal(10,2)
    - precio_compra: Decimal(10,2)
    - stock_total: Integer
    - categoria_id: Integer (clave foránea a api_categoria)
    - imagen: Varchar (ruta al archivo)
    - codigo_barras: Varchar(100) (opcional)
    - marca: Varchar(100)
    - impuesto: Varchar(20)
    - fecha_creacion: DateTime
    - activo: Boolean
    
    RELACIONES:
    - Cada producto pertenece a una categoría (ForeignKey)
    - Un producto puede tener muchos lotes (relación uno a muchos)
    - Un producto puede tener muchos movimientos (relación uno a muchos)
    
    MAPEO CON FRONTEND:
    Backend (Django)    | Frontend (React)
    -------------------|------------------
    id                 | id
    nombre             | name
    precio             | price
    precio_compra      | purchasePrice
    stock_total        | stock
    categoria_id       | (no mapeado directamente)
    categoria.nombre   | category
    imagen             | image
    marca              | brand
    impuesto           | tax
    activo             | (no mapeado directamente)
    
    NOTAS:
    - El campo 'categoria' es una relación ForeignKey que espera un ID numérico
    - El frontend envía el nombre de la categoría, pero el backend necesita el ID
    - La sincronización entre POS e Inventario se hace a través de localStorage
    """
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

# Modelo para Registro de Lotes (Simplificado)
class Lote(models.Model):
    """
    Modelo simplificado para registro de lotes por fecha.
    
    ESTRUCTURA EN BASE DE DATOS (tabla api_lote):
    - id: Integer (clave primaria, autogenerada)
    - lote: Varchar(100) (número del lote)
    - fecha_vencimiento: Date (fecha de vencimiento, opcional)
    - usuario: Varchar(100) (usuario que creó el lote)
    - fecha_produccion: Date (fecha cuando se creó el lote)
    - fecha_creacion: DateTime (fecha de creación del registro)
    - activo: Boolean (estado del lote)
    
    PROPÓSITO:
    - Registrar solo los lotes creados por día
    - Sin vincular a productos específicos
    - Solo información de trazabilidad
    """
    lote = models.CharField(max_length=100)  # Número del lote
    fecha_vencimiento = models.DateField(null=True, blank=True)  # Fecha de vencimiento
    usuario = models.CharField(max_length=100, default='Sistema')  # Usuario que creó el lote
    fecha_produccion = models.DateField(default='2025-06-17')  # Fecha de producción
    activo = models.BooleanField(default=True)  # Estado del lote
    fecha_creacion = models.DateTimeField(default=timezone.now)  # Fecha de creación
    
    def __str__(self):
        return f"Lote {self.lote} - {self.fecha_produccion} - {self.usuario}"

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
