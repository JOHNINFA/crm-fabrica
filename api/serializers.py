# api/serializers.py
from rest_framework import serializers
from .models import Registro, Producto, Categoria, Lote, MovimientoInventario, RegistroInventario

class CategoriaSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Categoria.
    
    CAMPOS:
    - id: ID único de la categoría
    - nombre: Nombre de la categoría
    
    FLUJO DE COMUNICACIÓN:
    1. Frontend envía {nombre: "Nombre de categoría"}
    2. Backend valida y crea/actualiza el registro
    3. Backend devuelve {id: 1, nombre: "Nombre de categoría"}
    
    NOTAS:
    - El frontend maneja las categorías como strings (nombres)
    - El backend espera IDs numéricos para las categorías en las relaciones
    """
    class Meta:
        model = Categoria
        fields = ['id', 'nombre']

class ProductoSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Producto.
    
    CAMPOS:
    - id: ID único del producto
    - nombre: Nombre del producto
    - descripcion: Descripción opcional
    - precio: Precio de venta
    - precio_compra: Precio de compra
    - stock_total: Cantidad en inventario
    - categoria: ID de la categoría (ForeignKey)
    - categoria_nombre: Nombre de la categoría (campo calculado, solo lectura)
    - imagen: Ruta a la imagen del producto
    - codigo_barras: Código de barras opcional
    - marca: Marca del producto
    - impuesto: Tipo de impuesto
    - fecha_creacion: Fecha de creación (solo lectura)
    - activo: Estado del producto
    
    FLUJO DE COMUNICACIÓN:
    1. Frontend envía datos del producto con 'categoria' como ID numérico
    2. Backend valida y crea/actualiza el registro
    3. Backend devuelve el producto con todos sus campos, incluyendo 'categoria_nombre'
    
    NOTAS:
    - El campo 'categoria' espera un ID numérico, no un nombre de categoría
    - El campo 'categoria_nombre' es de solo lectura y se calcula automáticamente
    - El frontend debe mapear entre nombres de categoría e IDs
    """
    # Campo calculado que obtiene el nombre de la categoría a partir de la relación
    categoria_nombre = serializers.ReadOnlyField(source='categoria.nombre')
    
    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion', 'precio', 'precio_compra', 
            'stock_total', 'categoria', 'categoria_nombre', 'imagen', 
            'codigo_barras', 'marca', 'impuesto', 'fecha_creacion', 'activo'
        ]
        read_only_fields = ('fecha_creacion',)

class LoteSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para registro de lotes.
    
    CAMPOS:
    - id: ID único del lote
    - lote: Número del lote
    - fecha_vencimiento: Fecha de vencimiento (opcional)
    - usuario: Usuario que creó el lote
    - fecha_produccion: Fecha de producción
    - activo: Estado del lote
    - fecha_creacion: Fecha de creación (solo lectura)
    """
    
    class Meta:
        model = Lote
        fields = [
            'id', 'lote', 'fecha_vencimiento', 
            'usuario', 'fecha_produccion', 'activo', 'fecha_creacion'
        ]
        read_only_fields = ('fecha_creacion',)

class MovimientoInventarioSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    lote_codigo = serializers.ReadOnlyField(source='lote.lote', allow_null=True)
    
    class Meta:
        model = MovimientoInventario
        fields = [
            'id', 'producto', 'producto_nombre', 'lote', 'lote_codigo',
            'tipo', 'cantidad', 'fecha', 'usuario', 'nota'
        ]
        read_only_fields = ('fecha',)



class RegistroSerializer(serializers.ModelSerializer):
    producto = serializers.SlugRelatedField(
        slug_field='nombre',
        queryset=Producto.objects.all()
    )

    class Meta:
        model = Registro
        fields = [
            'id', 'dia', 'id_sheet', 'id_usuario',
            'v_vendedor','d_despachador',
            'producto','cantidad','descuentos','adicional',
            'devoluciones','vencidas','valor',
            'total','neto',
        ]
        read_only_fields = ('total','neto')

class RegistroInventarioSerializer(serializers.ModelSerializer):
    """
    Serializer para registro de cantidades de inventario.
    """
    
    class Meta:
        model = RegistroInventario
        fields = [
            'id', 'producto_id', 'producto_nombre', 'cantidad',
            'entradas', 'salidas', 'saldo', 'tipo_movimiento',
            'fecha_produccion', 'usuario', 'activo', 'fecha_creacion'
        ]
        read_only_fields = ('fecha_creacion',)
