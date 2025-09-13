from rest_framework import serializers
from .models import Registro, Producto, Categoria, Lote, MovimientoInventario, RegistroInventario, Venta, DetalleVenta, Cliente, ListaPrecio, PrecioProducto, Vendedor, CargueOperativo, DetalleCargue, ResumenPagos, ResumenTotales, LoteVencido, ControlCumplimiento

class CategoriaSerializer(serializers.ModelSerializer):
    """Serializer para categorías"""
    class Meta:
        model = Categoria
        fields = ['id', 'nombre']

class ProductoSerializer(serializers.ModelSerializer):
    """Serializer para productos"""
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
    """Serializer para lotes"""
    class Meta:
        model = Lote
        fields = [
            'id', 'lote', 'fecha_vencimiento', 
            'usuario', 'fecha_produccion', 'activo', 'fecha_creacion'
        ]
        read_only_fields = ('fecha_creacion',)

class MovimientoInventarioSerializer(serializers.ModelSerializer):
    """Serializer para movimientos de inventario"""
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
    """Serializer para registros del sistema existente"""
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
    """Serializer para registro de cantidades de inventario"""
    class Meta:
        model = RegistroInventario
        fields = [
            'id', 'producto_id', 'producto_nombre', 'cantidad',
            'entradas', 'salidas', 'saldo', 'tipo_movimiento',
            'fecha_produccion', 'usuario', 'activo', 'fecha_creacion'
        ]
        read_only_fields = ('fecha_creacion',)

class DetalleVentaSerializer(serializers.ModelSerializer):
    """Serializer para detalles de venta"""
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    
    class Meta:
        model = DetalleVenta
        fields = [
            'id', 'producto', 'producto_nombre', 'cantidad', 
            'precio_unitario', 'subtotal'
        ]
        read_only_fields = ('subtotal',)

class VentaSerializer(serializers.ModelSerializer):
    """Serializer para ventas"""
    detalles = DetalleVentaSerializer(many=True, read_only=True)
    
    class Meta:
        model = Venta
        fields = [
            'id', 'numero_factura', 'fecha', 'vendedor', 'cliente',
            'metodo_pago', 'subtotal', 'impuestos', 'descuentos', 'total',
            'dinero_entregado', 'devuelta', 'estado', 'nota', 'banco',
            'centro_costo', 'bodega', 'detalles'
        ]
        read_only_fields = ('numero_factura', 'fecha', 'id')

class ClienteSerializer(serializers.ModelSerializer):
    """Serializer para clientes"""
    
    class Meta:
        model = Cliente
        fields = [
            'id', 'regimen', 'tipo_persona', 'tipo_identificacion', 'identificacion',
            'nombre_completo', 'alias', 'primer_nombre', 'segundo_nombre', 
            'primer_apellido', 'segundo_apellido', 'telefono_1', 'movil', 'email_1',
            'contacto', 'telefono_contacto', 'pais', 'departamento', 'ciudad',
            'direccion', 'zona_barrio', 'tipo_contacto', 'sucursal', 'medio_pago_defecto',
            'nota', 'permite_venta_credito', 'cupo_endeudamiento', 'dias_vencimiento_cartera',
            'activo', 'fecha_registro', 'fecha_creacion'
        ]
        read_only_fields = ('fecha_creacion',)

class ListaPrecioSerializer(serializers.ModelSerializer):
    """Serializer para listas de precios"""
    
    class Meta:
        model = ListaPrecio
        fields = [
            'id', 'nombre', 'tipo', 'empleado', 'sucursal', 
            'activo', 'fecha_creacion'
        ]
        read_only_fields = ('fecha_creacion',)

class PrecioProductoSerializer(serializers.ModelSerializer):
    """Serializer para precios de productos"""
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    lista_nombre = serializers.ReadOnlyField(source='lista_precio.nombre')
    
    class Meta:
        model = PrecioProducto
        fields = [
            'id', 'producto', 'producto_nombre', 'lista_precio', 'lista_nombre',
            'precio', 'utilidad_porcentaje', 'activo', 'fecha_actualizacion'
        ]
        read_only_fields = ('fecha_actualizacion',)

class VendedorSerializer(serializers.ModelSerializer):
    """Serializer para vendedores"""
    
    class Meta:
        model = Vendedor
        fields = [
            'id', 'nombre', 'id_vendedor', 'ruta', 'activo', 'fecha_creacion'
        ]
        read_only_fields = ('fecha_creacion',)

class LoteVencidoSerializer(serializers.ModelSerializer):
    """Serializer para lotes vencidos"""
    
    class Meta:
        model = LoteVencido
        fields = [
            'id', 'detalle_cargue', 'lote', 'motivo', 
            'fecha_registro', 'usuario'
        ]
        read_only_fields = ('fecha_registro',)

class DetalleCargueSerializer(serializers.ModelSerializer):
    """Serializer para detalles de cargue"""
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    lotes_vencidos = LoteVencidoSerializer(many=True, read_only=True)
    
    class Meta:
        model = DetalleCargue
        fields = [
            'id', 'cargue', 'producto', 'producto_nombre', 'vendedor_check', 'despachador_check',
            'cantidad', 'dctos', 'adicional', 'devoluciones', 'vencidas',
            'total', 'valor', 'neto', 'lotes_vencidos'
        ]
        read_only_fields = ('total', 'neto')

class ResumenPagosSerializer(serializers.ModelSerializer):
    """Serializer para resumen de pagos"""
    
    class Meta:
        model = ResumenPagos
        fields = [
            'id', 'concepto', 'descuentos', 'nequi', 'daviplata'
        ]

class ResumenTotalesSerializer(serializers.ModelSerializer):
    """Serializer para resumen de totales"""
    
    class Meta:
        model = ResumenTotales
        fields = [
            'id', 'base_caja', 'total_despacho', 'total_pedidos', 
            'total_dctos', 'venta', 'total_efectivo'
        ]

class CargueOperativoSerializer(serializers.ModelSerializer):
    """Serializer para cargue operativo"""
    vendedor_nombre = serializers.ReadOnlyField(source='vendedor.nombre')
    vendedor_id = serializers.ReadOnlyField(source='vendedor.id_vendedor')
    detalles = DetalleCargueSerializer(many=True, read_only=True)
    pagos = ResumenPagosSerializer(many=True, read_only=True)
    resumen = ResumenTotalesSerializer(read_only=True)
    
    class Meta:
        model = CargueOperativo
        fields = [
            'id', 'dia', 'vendedor', 'vendedor_nombre', 'vendedor_id',
            'fecha', 'usuario', 'activo', 'fecha_creacion',
            'detalles', 'pagos', 'resumen'
        ]
        read_only_fields = ('fecha_creacion',)

class ControlCumplimientoSerializer(serializers.ModelSerializer):
    """Serializer para control de cumplimiento"""
    
    class Meta:
        model = ControlCumplimiento
        fields = [
            'id', 'dia', 'id_sheet', 'fecha', 'licencia_transporte', 'soat',
            'uniforme', 'no_locion', 'no_accesorios', 'capacitacion_carnet',
            'higiene', 'estibas', 'desinfeccion', 'usuario', 'fecha_creacion',
            'fecha_actualizacion'
        ]
        read_only_fields = ('fecha_creacion', 'fecha_actualizacion')