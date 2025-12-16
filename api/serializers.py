from rest_framework import serializers
from .models import (
    Planeacion, Registro, Producto, Categoria, Stock, Lote, MovimientoInventario, 
    RegistroInventario, Venta, DetalleVenta, Cliente, ListaPrecio, PrecioProducto, 
    CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6,
    CargueProductos, CargueResumen, CarguePagos, CargueCumplimiento,  # Nuevos modelos normalizados
    Produccion, ProduccionSolicitada, Sucursal, Cajero, Turno, VentaCajero, 
    ArqueoCaja, MovimientoCaja, Pedido, DetallePedido, Vendedor, Domiciliario, 
    ConfiguracionImpresion, RegistrosPlaneacionDia
)


class CategoriaSerializer(serializers.ModelSerializer):
    """Serializer para categorías"""
    class Meta:
        model = Categoria
        fields = ['id', 'nombre']

class StockSerializer(serializers.ModelSerializer):
    """Serializer para stock de productos"""
    producto_id = serializers.IntegerField(source='producto.id', read_only=True)
    
    class Meta:
        model = Stock
        fields = ['producto', 'producto_id', 'producto_nombre', 'producto_descripcion', 'cantidad_actual', 'fecha_actualizacion']
        read_only_fields = ('fecha_actualizacion', 'producto_nombre', 'producto_descripcion')

class ProductoSerializer(serializers.ModelSerializer):
    """Serializer para productos"""
    categoria_nombre = serializers.ReadOnlyField(source='categoria.nombre')
    stock_actual = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion', 'precio', 'precio_compra', 'precio_cargue',
            'stock_total', 'stock_actual', 'categoria', 'categoria_nombre', 'imagen', 
            'codigo_barras', 'marca', 'impuesto', 'orden', 'ubicacion_inventario',
            'disponible_pos', 'disponible_cargue', 'disponible_pedidos', 'disponible_inventario',
            'disponible_app_cargue', 'disponible_app_sugeridos', 'disponible_app_rendimiento', 'disponible_app_ventas',
            'fecha_creacion', 'activo'
        ]
        read_only_fields = ('fecha_creacion', 'stock_actual')

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
            'nota', 'tipo_lista_precio', 'vendedor_asignado', 'centro_costo', 'dia_entrega',
            'notificar_cartera', 'notificar_rotacion', 'cliente_predeterminado',
            'permite_venta_credito', 'cupo_endeudamiento', 'dias_vencimiento_cartera',
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

# ========================================
# NUEVOS SERIALIZERS SIMPLIFICADOS
# ========================================

class CargueID1Serializer(serializers.ModelSerializer):
    """Serializer para CargueID1 - Tabla simplificada"""
    
    class Meta:
        model = CargueID1
        fields = [
            'id', 'dia', 'fecha', 'v', 'd', 'producto', 'cantidad', 'dctos', 
            'adicional', 'devoluciones', 'vencidas', 'lotes_vencidos', 'lotes_produccion', 'total', 
            'valor', 'neto', 'concepto', 'descuentos', 'nequi', 'daviplata',
            'base_caja', 'total_despacho', 'total_pedidos', 'total_dctos', 
            'venta', 'total_efectivo', 'licencia_transporte', 'soat', 'uniforme',
            'no_locion', 'no_accesorios', 'capacitacion_carnet', 'higiene', 
            'estibas', 'desinfeccion', 'usuario', 'responsable', 'ruta', 'activo', 'fecha_creacion', 
            'fecha_actualizacion'
        ]
        read_only_fields = ('total', 'neto', 'fecha_creacion', 'fecha_actualizacion')

    def validate_producto(self, value):
        """Normalizar nombre del producto: eliminar espacios dobles y espacios al inicio/final"""
        import re
        if value:
            return re.sub(r'\s+', ' ', value).strip()
        return value


class CargueID2Serializer(serializers.ModelSerializer):
    """Serializer para CargueID2 - Tabla simplificada"""
    
    class Meta:
        model = CargueID2
        fields = [
            'id', 'dia', 'fecha', 'v', 'd', 'producto', 'cantidad', 'dctos', 
            'adicional', 'devoluciones', 'vencidas', 'lotes_vencidos', 'lotes_produccion', 'total', 
            'valor', 'neto', 'concepto', 'descuentos', 'nequi', 'daviplata',
            'base_caja', 'total_despacho', 'total_pedidos', 'total_dctos', 
            'venta', 'total_efectivo', 'licencia_transporte', 'soat', 'uniforme',
            'no_locion', 'no_accesorios', 'capacitacion_carnet', 'higiene', 
            'estibas', 'desinfeccion', 'usuario', 'responsable', 'ruta', 'activo', 'fecha_creacion', 
            'fecha_actualizacion'
        ]
        read_only_fields = ('total', 'neto', 'fecha_creacion', 'fecha_actualizacion')

class CargueID3Serializer(serializers.ModelSerializer):
    """Serializer para CargueID3 - Tabla simplificada"""
    
    class Meta:
        model = CargueID3
        fields = [
            'id', 'dia', 'fecha', 'v', 'd', 'producto', 'cantidad', 'dctos', 
            'adicional', 'devoluciones', 'vencidas', 'lotes_vencidos', 'lotes_produccion', 'total', 
            'valor', 'neto', 'concepto', 'descuentos', 'nequi', 'daviplata',
            'base_caja', 'total_despacho', 'total_pedidos', 'total_dctos', 
            'venta', 'total_efectivo', 'licencia_transporte', 'soat', 'uniforme',
            'no_locion', 'no_accesorios', 'capacitacion_carnet', 'higiene', 
            'estibas', 'desinfeccion', 'usuario', 'responsable', 'ruta', 'activo', 'fecha_creacion', 
            'fecha_actualizacion'
        ]
        read_only_fields = ('total', 'neto', 'fecha_creacion', 'fecha_actualizacion')

class CargueID4Serializer(serializers.ModelSerializer):
    """Serializer para CargueID4 - Tabla simplificada"""
    
    class Meta:
        model = CargueID4
        fields = [
            'id', 'dia', 'fecha', 'v', 'd', 'producto', 'cantidad', 'dctos', 
            'adicional', 'devoluciones', 'vencidas', 'lotes_vencidos', 'lotes_produccion', 'total', 
            'valor', 'neto', 'concepto', 'descuentos', 'nequi', 'daviplata',
            'base_caja', 'total_despacho', 'total_pedidos', 'total_dctos', 
            'venta', 'total_efectivo', 'licencia_transporte', 'soat', 'uniforme',
            'no_locion', 'no_accesorios', 'capacitacion_carnet', 'higiene', 
            'estibas', 'desinfeccion', 'usuario', 'responsable', 'ruta', 'activo', 'fecha_creacion', 
            'fecha_actualizacion'
        ]
        read_only_fields = ('total', 'neto', 'fecha_creacion', 'fecha_actualizacion')

class CargueID5Serializer(serializers.ModelSerializer):
    """Serializer para CargueID5 - Tabla simplificada"""
    
    class Meta:
        model = CargueID5
        fields = [
            'id', 'dia', 'fecha', 'v', 'd', 'producto', 'cantidad', 'dctos', 
            'adicional', 'devoluciones', 'vencidas', 'lotes_vencidos', 'lotes_produccion', 'total', 
            'valor', 'neto', 'concepto', 'descuentos', 'nequi', 'daviplata',
            'base_caja', 'total_despacho', 'total_pedidos', 'total_dctos', 
            'venta', 'total_efectivo', 'licencia_transporte', 'soat', 'uniforme',
            'no_locion', 'no_accesorios', 'capacitacion_carnet', 'higiene', 
            'estibas', 'desinfeccion', 'usuario', 'responsable', 'ruta', 'activo', 'fecha_creacion', 
            'fecha_actualizacion'
        ]
        read_only_fields = ('total', 'neto', 'fecha_creacion', 'fecha_actualizacion')

class CargueID6Serializer(serializers.ModelSerializer):
    """Serializer para CargueID6 - Tabla simplificada"""
    
    class Meta:
        model = CargueID6
        fields = [
            'id', 'dia', 'fecha', 'v', 'd', 'producto', 'cantidad', 'dctos', 
            'adicional', 'devoluciones', 'vencidas', 'lotes_vencidos', 'lotes_produccion', 'total', 
            'valor', 'neto', 'concepto', 'descuentos', 'nequi', 'daviplata',
            'base_caja', 'total_despacho', 'total_pedidos', 'total_dctos', 
            'venta', 'total_efectivo', 'licencia_transporte', 'soat', 'uniforme',
            'no_locion', 'no_accesorios', 'capacitacion_carnet', 'higiene', 
            'estibas', 'desinfeccion', 'usuario', 'responsable', 'ruta', 'activo', 'fecha_creacion', 
            'fecha_actualizacion'
        ]
        read_only_fields = ('total', 'neto', 'fecha_creacion', 'fecha_actualizacion')

# ========================================
# SERIALIZERS PARA MODELOS NORMALIZADOS (Nuevos)
# ========================================

class CargueProductosSerializer(serializers.ModelSerializer):
    """Serializer para CargueProductos - Tabla normalizada de productos"""
    
    class Meta:
        model = CargueProductos
        fields = [
            'id', 'vendedor_id', 'dia', 'fecha', 'producto',
            'cantidad', 'dctos', 'adicional', 'devoluciones', 'vencidas',
            'total', 'valor', 'neto', 'v', 'd',
            'lotes_vencidos', 'lotes_produccion',
            'responsable', 'usuario', 'ruta', 'activo',
            'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ('total', 'neto', 'fecha_creacion', 'fecha_actualizacion')
    
    def validate_producto(self, value):
        """Normalizar nombre del producto"""
        import re
        if value:
            return re.sub(r'\s+', ' ', value).strip()
        return value


class CargueResumenSerializer(serializers.ModelSerializer):
    """Serializer para CargueResumen - Tabla normalizada de resúmenes"""
    
    class Meta:
        model = CargueResumen
        fields = [
            'id', 'vendedor_id', 'dia', 'fecha',
            'base_caja', 'total_despacho', 'total_pedidos', 'total_dctos',
            'venta', 'total_efectivo',
            'usuario', 'activo', 'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ('fecha_creacion', 'fecha_actualizacion')


class CarguePagosSerializer(serializers.ModelSerializer):
    """Serializer para CarguePagos - Tabla normalizada de pagos"""
    
    class Meta:
        model = CarguePagos
        fields = [
            'id', 'vendedor_id', 'dia', 'fecha',
            'concepto', 'descuentos', 'nequi', 'daviplata',
            'usuario', 'activo', 'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ('fecha_creacion', 'fecha_actualizacion')


class CargueCumplimientoSerializer(serializers.ModelSerializer):
    """Serializer para CargueCumplimiento - Tabla normalizada de cumplimiento"""
    
    class Meta:
        model = CargueCumplimiento
        fields = [
            'id', 'vendedor_id', 'dia', 'fecha',
            'licencia_transporte', 'soat', 'uniforme',
            'no_locion', 'no_accesorios', 'capacitacion_carnet',
            'higiene', 'estibas', 'desinfeccion',
            'usuario', 'activo', 'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ('fecha_creacion', 'fecha_actualizacion')

# ========================================
# FIN SERIALIZERS NORMALIZADOS
# ========================================


class ProduccionSerializer(serializers.ModelSerializer):
    """Serializer para Producción con función de congelado"""
    
    class Meta:
        model = Produccion
        fields = [
            'id', 'fecha', 'producto', 'cantidad', 'lote', 'congelado', 
            'fecha_congelado', 'usuario_congelado', 'usuario', 'activo', 
            'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ('fecha_congelado', 'fecha_creacion', 'fecha_actualizacion')

class ProduccionSolicitadaSerializer(serializers.ModelSerializer):
    """Serializer para ProduccionSolicitada"""
    
    class Meta:
        model = ProduccionSolicitada
        fields = [
            'id', 'dia', 'fecha', 'producto_nombre', 'cantidad_solicitada',
            'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ('fecha_creacion', 'fecha_actualizacion')

# ========================================
# SERIALIZERS PARA SISTEMA POS - CAJEROS
# ========================================

class SucursalSerializer(serializers.ModelSerializer):
    """Serializer para sucursales"""
    
    class Meta:
        model = Sucursal
        fields = [
            'id', 'nombre', 'direccion', 'telefono', 'email', 'ciudad', 
            'departamento', 'codigo_postal', 'activo', 'es_principal',
            'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ('fecha_creacion', 'fecha_actualizacion')

class CajeroSerializer(serializers.ModelSerializer):
    """Serializer para cajeros"""
    sucursal_nombre = serializers.ReadOnlyField(source='sucursal.nombre')
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Cajero
        fields = [
            'id', 'nombre', 'email', 'telefono', 'password', 'sucursal', 
            'sucursal_nombre', 'rol', 'activo', 'puede_hacer_descuentos',
            'limite_descuento', 'puede_anular_ventas', 'fecha_creacion',
            'fecha_actualizacion', 'ultimo_login'
        ]
        read_only_fields = ('fecha_creacion', 'fecha_actualizacion', 'ultimo_login')
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def create(self, validated_data):
        """Crear cajero con contraseña hasheada"""
        import hashlib
        password = validated_data.pop('password')
        # Hash simple para desarrollo (en producción usar bcrypt)
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        validated_data['password'] = hashed_password
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Actualizar cajero, hashear contraseña si se proporciona"""
        if 'password' in validated_data:
            import hashlib
            password = validated_data.pop('password')
            hashed_password = hashlib.sha256(password.encode()).hexdigest()
            validated_data['password'] = hashed_password
        return super().update(instance, validated_data)

class TurnoSerializer(serializers.ModelSerializer):
    """Serializer para turnos"""
    cajero_nombre = serializers.ReadOnlyField(source='cajero.nombre')
    sucursal_nombre = serializers.ReadOnlyField(source='sucursal.nombre')
    duracion_horas = serializers.SerializerMethodField()
    
    class Meta:
        model = Turno
        fields = [
            'id', 'cajero', 'cajero_nombre', 'sucursal', 'sucursal_nombre',
            'fecha_inicio', 'fecha_fin', 'estado', 'base_inicial', 'arqueo_final',
            'diferencia', 'total_ventas', 'total_efectivo', 'total_tarjeta',
            'total_otros', 'numero_transacciones', 'notas_apertura', 'notas_cierre',
            'duracion_horas', 'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ('diferencia', 'total_ventas', 'total_efectivo', 
                          'total_tarjeta', 'total_otros', 'numero_transacciones',
                          'fecha_creacion', 'fecha_actualizacion')
    
    def get_duracion_horas(self, obj):
        """Calcular duración en horas"""
        duracion = obj.duracion()
        return round(duracion.total_seconds() / 3600, 2)

class VentaCajeroSerializer(serializers.ModelSerializer):
    """Serializer para ventas con información de cajero"""
    cajero_nombre = serializers.ReadOnlyField(source='cajero.nombre')
    sucursal_nombre = serializers.ReadOnlyField(source='sucursal.nombre')
    turno_id = serializers.ReadOnlyField(source='turno.id')
    venta_info = VentaSerializer(source='venta', read_only=True)
    
    class Meta:
        model = VentaCajero
        fields = [
            'id', 'venta', 'venta_info', 'cajero', 'cajero_nombre', 
            'turno', 'turno_id', 'sucursal', 'sucursal_nombre',
            'terminal', 'numero_transaccion'
        ]

# Serializer simplificado para autenticación
class CajeroLoginSerializer(serializers.Serializer):
    """Serializer para login de cajeros"""
    nombre = serializers.CharField(max_length=100)
    password = serializers.CharField(max_length=255)
    sucursal_id = serializers.IntegerField(required=False)
    
    def validate(self, data):
        """Validar credenciales de cajero"""
        import hashlib
        from django.utils import timezone
        
        nombre = data.get('nombre')
        password = data.get('password')
        sucursal_id = data.get('sucursal_id')
        
        # Hash de la contraseña
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        # Buscar cajero
        try:
            cajero_query = Cajero.objects.filter(
                nombre__iexact=nombre,
                password=hashed_password,
                activo=True
            )
            
            if sucursal_id:
                cajero_query = cajero_query.filter(sucursal_id=sucursal_id)
            
            cajero = cajero_query.first()
            
            if not cajero:
                raise serializers.ValidationError("Credenciales inválidas")
            
            # Actualizar último login
            cajero.ultimo_login = timezone.now()
            cajero.save()
            
            data['cajero'] = cajero
            return data
            
        except Exception as e:
            raise serializers.ValidationError("Error en la autenticación")

class TurnoResumenSerializer(serializers.ModelSerializer):
    """Serializer resumido para turnos (para listados)"""
    cajero_nombre = serializers.ReadOnlyField(source='cajero.nombre')
    sucursal_nombre = serializers.ReadOnlyField(source='sucursal.nombre')
    duracion_horas = serializers.SerializerMethodField()
    estado_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Turno
        fields = [
            'id', 'cajero_nombre', 'sucursal_nombre', 'fecha_inicio', 
            'fecha_fin', 'estado', 'estado_display', 'total_ventas', 
            'numero_transacciones', 'duracion_horas'
        ]
    
    def get_duracion_horas(self, obj):
        duracion = obj.duracion()
        return round(duracion.total_seconds() / 3600, 2)
    
    def get_estado_display(self, obj):
        estado_map = {
            'ACTIVO': '🟢 Activo',
            'CERRADO': '🔴 Cerrado', 
            'SUSPENDIDO': '🟡 Suspendido'
        }
        return estado_map.get(obj.estado, obj.estado)

class ArqueoCajaSerializer(serializers.ModelSerializer):
    """Serializer para arqueos de caja"""
    cajero_logueado_nombre = serializers.ReadOnlyField(source='cajero_logueado.nombre')
    sucursal_nombre = serializers.ReadOnlyField(source='sucursal.nombre')
    turno_id = serializers.ReadOnlyField(source='turno.id')
    
    class Meta:
        model = ArqueoCaja
        fields = [
            'id', 'fecha', 'cajero', 'banco', 'valores_sistema', 'total_sistema',
            'valores_caja', 'total_caja', 'diferencias', 'total_diferencia',
            'observaciones', 'estado', 'cajero_logueado', 'cajero_logueado_nombre',
            'sucursal', 'sucursal_nombre', 'turno', 'turno_id',
            'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ('total_sistema', 'total_caja', 'diferencias', 
                          'total_diferencia', 'fecha_creacion', 'fecha_actualizacion')
    
    def create(self, validated_data):
        """Crear arqueo con relaciones automáticas si hay cajero logueado"""
        # Aquí podrías agregar lógica para vincular automáticamente
        # el cajero logueado, sucursal y turno activo
        return super().create(validated_data)

class MovimientoCajaSerializer(serializers.ModelSerializer):
    """Serializer para movimientos de caja"""
    
    class Meta:
        model = MovimientoCaja
        fields = ['id', 'fecha', 'hora', 'cajero', 'tipo', 'monto', 'concepto', 'fecha_creacion']
        read_only_fields = ('fecha_creacion',)

class ArqueoCajaSerializer(serializers.ModelSerializer):
    """Serializer para arqueos de caja"""
    cajero_nombre = serializers.ReadOnlyField(source='cajero_logueado.nombre', allow_null=True)
    sucursal_nombre = serializers.ReadOnlyField(source='sucursal.nombre', allow_null=True)
    turno_id = serializers.ReadOnlyField(source='turno.id', allow_null=True)
    
    class Meta:
        model = ArqueoCaja
        fields = [
            'id', 'fecha', 'cajero', 'banco', 
            'valores_sistema', 'total_sistema',
            'valores_caja', 'total_caja',
            'diferencias', 'total_diferencia',
            'observaciones', 'estado',
            'cajero_logueado', 'cajero_nombre',
            'sucursal', 'sucursal_nombre',
            'turno', 'turno_id',
            'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ('total_sistema', 'total_caja', 'total_diferencia', 'diferencias', 'fecha_creacion', 'fecha_actualizacion')

class DetallePedidoSerializer(serializers.ModelSerializer):
    """Serializer para detalles de pedido"""
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    
    class Meta:
        model = DetallePedido
        fields = [
            'id', 'producto', 'producto_nombre', 'cantidad', 
            'precio_unitario', 'subtotal'
        ]
        read_only_fields = ('subtotal',)

class PedidoSerializer(serializers.ModelSerializer):
    """Serializer para pedidos"""
    detalles = DetallePedidoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Pedido
        fields = [
            'id', 'numero_pedido', 'fecha', 'vendedor', 'destinatario',
            'direccion_entrega', 'telefono_contacto', 'fecha_entrega',
            'tipo_pedido', 'transportadora', 'subtotal', 'impuestos',
            'descuentos', 'total', 'estado', 'nota', 'fecha_creacion',
            'fecha_actualizacion', 'detalles',
            # Nuevos campos
            'afectar_inventario_inmediato', 'asignado_a_tipo', 
            'asignado_a_id', 'inventario_afectado'
        ]
        read_only_fields = ('numero_pedido', 'fecha_creacion', 'fecha_actualizacion', 'inventario_afectado')
    
    def create(self, validated_data):
        from django.db import transaction
        from .models import Planeacion, Producto, MovimientoInventario, CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6
        
        # Extraer detalles si vienen en los datos
        detalles_data = self.context['request'].data.get('detalles', [])
        
        with transaction.atomic():
            # ===== 1. CREAR EL PEDIDO =====
            pedido = Pedido.objects.create(**validated_data)
            print(f"\n{'='*60}")
            print(f"📦 CREANDO PEDIDO #{pedido.numero_pedido}")
            print(f"{'='*60}")
            print(f"💰 Total: ${pedido.total}")
            print(f"📅 Fecha entrega: {pedido.fecha_entrega}")
            print(f"🎯 Asignado a: {pedido.asignado_a_tipo} - {pedido.asignado_a_id or 'Ninguno'}")
            print(f"⚡ Afectar inventario inmediato: {'SÍ' if pedido.afectar_inventario_inmediato else 'NO'}")
            
            # ===== 2. CREAR LOS DETALLES =====
            for detalle_data in detalles_data:
                DetallePedido.objects.create(
                    pedido=pedido,
                    producto_id=detalle_data['producto'],
                    cantidad=detalle_data['cantidad'],
                    precio_unitario=detalle_data['precio_unitario']
                )
            
            # ===== 3. AFECTAR INVENTARIO SI CHECKBOX ESTÁ MARCADO =====
            if pedido.afectar_inventario_inmediato and not pedido.inventario_afectado:
                print(f"\n⚡ AFECTANDO INVENTARIO INMEDIATAMENTE")
                print(f"{'='*60}")
                
                for detalle in pedido.detalles.all():
                    try:
                        producto = detalle.producto
                        cantidad_a_descontar = detalle.cantidad
                        
                        # Verificar stock disponible
                        if producto.stock_total < cantidad_a_descontar:
                            print(f"⚠️ ADVERTENCIA: {producto.nombre} - Stock insuficiente ({producto.stock_total} < {cantidad_a_descontar})")
                        
                        # Descontar del stock
                        # Crear movimiento de inventario (esto actualiza el stock automáticamente)
                        MovimientoInventario.objects.create(
                            producto=producto,
                            tipo='SALIDA',
                            cantidad=cantidad_a_descontar,
                            usuario='Sistema',
                            nota=f'Pedido urgente #{pedido.numero_pedido} - {pedido.destinatario}'
                        )
                        print(f"✅ Movimiento de salida creado para {producto.nombre} (-{cantidad_a_descontar})")
                        
                    except Exception as e:
                        print(f"❌ Error afectando inventario para {detalle.producto.nombre}: {str(e)}")
                        continue
                
                # Marcar como inventario afectado
                pedido.inventario_afectado = True
                pedido.save()
                print(f"✅ Inventario marcado como afectado")
            
            # ===== 4. ACTUALIZAR PLANEACIÓN (siempre se hace) =====
            if pedido.fecha_entrega:
                print(f"\n📊 ACTUALIZANDO PLANEACIÓN")
                print(f"{'='*60}")
                
                for detalle_data in detalles_data:
                    try:
                        producto = Producto.objects.get(id=detalle_data['producto'])
                        
                        # Buscar o crear registro en Planeación
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
                        
                        # Sumar la cantidad del pedido
                        planeacion.pedidos += detalle_data['cantidad']
                        planeacion.save()  # El total se calcula automáticamente
                        
                        print(f"✅ {producto.nombre}: +{detalle_data['cantidad']} = {planeacion.pedidos}")
                        
                    except Producto.DoesNotExist:
                        print(f"⚠️ Producto {detalle_data['producto']} no encontrado")
                        continue
                    except Exception as e:
                        print(f"⚠️ Error actualizando Planeación: {str(e)}")
                        continue
            
            # ===== 5. ACTUALIZAR CARGUE SI ESTÁ ASIGNADO A VENDEDOR =====
            if pedido.asignado_a_tipo == 'VENDEDOR' and pedido.asignado_a_id and pedido.fecha_entrega:
                print(f"\n💼 ACTUALIZANDO CARGUE DEL VENDEDOR")
                print(f"{'='*60}")
                
                # Mapear ID del vendedor al modelo de cargue
                cargue_models_map = {
                    'ID1': CargueID1,
                    'ID2': CargueID2,
                    'ID3': CargueID3,
                    'ID4': CargueID4,
                    'ID5': CargueID5,
                    'ID6': CargueID6
                }
                
                CargueModel = cargue_models_map.get(pedido.asignado_a_id)
                
                if CargueModel:
                    try:
                        # Buscar registros de cargue por fecha
                        cargues = CargueModel.objects.filter(fecha=pedido.fecha_entrega)
                        
                        if cargues.exists():
                            for cargue in cargues:
                                # Sumar al total_pedidos
                                total_anterior = float(cargue.total_pedidos or 0)
                                cargue.total_pedidos = total_anterior + float(pedido.total)
                                
                                # Recalcular total_efectivo
                                if cargue.venta:
                                    cargue.total_efectivo = float(cargue.venta) - float(cargue.total_pedidos)
                                
                                cargue.save()
                                print(f"✅ {pedido.asignado_a_id}: Total pedidos ${total_anterior} → ${cargue.total_pedidos}")
                        else:
                            print(f"⚠️ No se encontró cargue para {pedido.asignado_a_id} en fecha {pedido.fecha_entrega}")
                    
                    except Exception as e:
                        print(f"❌ Error actualizando Cargue {pedido.asignado_a_id}: {str(e)}")
                else:
                    print(f"⚠️ Modelo de cargue no encontrado para {pedido.asignado_a_id}")
            
            # ===== 6. REGISTRO PARA DOMICILIARIO =====
            if pedido.asignado_a_tipo == 'DOMICILIARIO' and pedido.asignado_a_id:
                print(f"\n🛵 PEDIDO ASIGNADO A DOMICILIARIO: {pedido.asignado_a_id}")
                # El domiciliario solo necesita el registro, no afecta cargue
            
            print(f"\n{'='*60}")
            print(f"✅ PEDIDO CREADO EXITOSAMENTE")
            print(f"{'='*60}\n")
        
        return pedido
class PlaneacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Planeacion
        fields = '__all__'


class VendedorSerializer(serializers.ModelSerializer):
    """Serializer para vendedores"""
    class Meta:
        model = Vendedor
        fields = ['id_vendedor', 'nombre', 'password', 'ruta', 'activo', 'fecha_creacion', 'fecha_actualizacion']
        read_only_fields = ('fecha_creacion', 'fecha_actualizacion')


class DomiciliarioSerializer(serializers.ModelSerializer):
    """Serializer para domiciliarios"""
    class Meta:
        model = Domiciliario
        fields = [
            'codigo', 'nombre', 'identificacion', 'telefono', 'email',
            'direccion', 'vehiculo', 'placa', 'activo',
            'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ('fecha_creacion', 'fecha_actualizacion')



class ConfiguracionImpresionSerializer(serializers.ModelSerializer):
    """Serializer para configuración de impresión de tickets"""
    
    class Meta:
        model = ConfiguracionImpresion
        fields = [
            'id', 'nombre_negocio', 'nit_negocio', 'direccion_negocio',
            'telefono_negocio', 'email_negocio', 'encabezado_ticket',
            'pie_pagina_ticket', 'mensaje_agradecimiento', 'logo',
            'ancho_papel', 'mostrar_logo', 'mostrar_codigo_barras',
            'impresora_predeterminada', 'resolucion_facturacion',
            'regimen_tributario', 'activo', 'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ('fecha_creacion', 'fecha_actualizacion')

# ===== SERIALIZERS RUTAS Y VENTAS RUTA =====
from .models import Ruta, ClienteRuta, VentaRuta, EvidenciaVenta

class RutaSerializer(serializers.ModelSerializer):
    vendedor_nombre = serializers.CharField(source='vendedor.nombre', read_only=True)
    
    class Meta:
        model = Ruta
        fields = '__all__'

class ClienteRutaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClienteRuta
        fields = '__all__'

class EvidenciaVentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvidenciaVenta
        fields = ['id', 'producto_id', 'imagen', 'fecha_creacion']

class VentaRutaSerializer(serializers.ModelSerializer):
    vendedor_nombre = serializers.CharField(source='vendedor.nombre', read_only=True)
    ruta_nombre = serializers.CharField(source='ruta.nombre', read_only=True)
    evidencias = EvidenciaVentaSerializer(many=True, read_only=True)
    
    class Meta:
        model = VentaRuta
        fields = '__all__'


# ===== SERIALIZER PARA SNAPSHOT PLANEACIÓN =====

class RegistrosPlaneacionDiaSerializer(serializers.ModelSerializer):
    """Serializer para snapshot de Planeación al congelar"""
    
    class Meta:
        model = RegistrosPlaneacionDia
        fields = [
            'id', 'fecha', 'producto_nombre', 'existencias', 'solicitadas',
            'pedidos', 'total', 'orden', 'ia', 'fecha_congelado', 'usuario'
        ]
        read_only_fields = ('fecha_congelado',)
