from rest_framework import serializers
from django.db import models
from .models import (
    Planeacion, Registro, Producto, Categoria, Stock, Lote, MovimientoInventario, 
    RegistroInventario, Venta, DetalleVenta, Cliente, ProductosFrecuentes, ListaPrecio, PrecioProducto, 
    CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6,
    CargueProductos, CargueResumen, CarguePagos, CargueCumplimiento,  # Nuevos modelos normalizados
    Produccion, ProduccionSolicitada, Sucursal, Cajero, Turno, VentaCajero, 
    ArqueoCaja, MovimientoCaja, Pedido, DetallePedido, Vendedor, Domiciliario, 
    ConfiguracionImpresion, RegistrosPlaneacionDia, RutaOrden, ReportePlaneacion, TipoNegocio
)


class CategoriaSerializer(serializers.ModelSerializer):
    """Serializer para categorías"""
    class Meta:
        model = Categoria
        fields = ['id', 'nombre']

class StockSerializer(serializers.ModelSerializer):
    """Serializer para stock de productos"""
    producto_id = serializers.IntegerField(source='producto.id', read_only=True)
    # 🆕 Agregar disponible_inventario para filtrar en Planeación
    disponible_inventario = serializers.BooleanField(source='producto.disponible_inventario', read_only=True)
    # 🆕 Agregar orden para ordenamiento consistente
    orden = serializers.IntegerField(source='producto.orden', read_only=True)
    
    class Meta:
        model = Stock
        fields = ['producto', 'producto_id', 'producto_nombre', 'producto_descripcion', 'cantidad_actual', 'fecha_actualizacion', 'disponible_inventario', 'orden']
        read_only_fields = ('fecha_actualizacion', 'producto_nombre', 'producto_descripcion', 'disponible_inventario', 'orden')

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
            'id', 'numero_factura', 'fecha', 'vendedor', 'creado_por', 'cliente',
            'metodo_pago', 'subtotal', 'impuestos', 'descuentos', 'total',
            'dinero_entregado', 'devuelta', 'estado', 'nota', 'banco',
            'centro_costo', 'bodega', 'detalles'
        ]
        read_only_fields = ('numero_factura', 'fecha', 'id')

class TipoNegocioSerializer(serializers.ModelSerializer):
    """Serializer para tipos de negocio"""
    class Meta:
        model = TipoNegocio
        fields = ['id', 'nombre', 'activo']

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

class ProductosFrecuentesSerializer(serializers.ModelSerializer):
    """Serializer para productos frecuentes de un cliente"""
    cliente_nombre = serializers.ReadOnlyField(source='cliente.nombre_completo')
    
    class Meta:
        model = ProductosFrecuentes
        fields = [
            'id', 'cliente', 'cliente_nombre', 'dia', 'productos', 'nota',
            'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ('fecha_creacion', 'fecha_actualizacion')


class ListaPrecioSerializer(serializers.ModelSerializer):
    """Serializer para listas de precios"""
    
    class Meta:
        model = ListaPrecio
        fields = [
            'id', 'nombre', 'tipo', 'empleado', 'sucursal', 
            'visible_pos', 'activo', 'fecha_creacion'
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
            'adicional', 'devoluciones', 'vendidas', 'vencidas', 'lotes_vencidos', 'lotes_produccion', 'total', 
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
            'adicional', 'devoluciones', 'vendidas', 'vencidas', 'lotes_vencidos', 'lotes_produccion', 'total', 
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
            'adicional', 'devoluciones', 'vendidas', 'vencidas', 'lotes_vencidos', 'lotes_produccion', 'total', 
            'valor', 'neto', 'concepto', 'descuentos', 'nequi', 'daviplata',
            'base_caja', 'total_despacho', 'total_pedidos', 'total_dctos', 
            'venta', 'total_efectivo', 'licencia_transporte', 'soat', 'uniforme',
            'no_locion', 'no_accesorios', 'capacitacion_carnet', 'higiene', 
            'estibas', 'desinfeccion', 'usuario', 'responsable', 'activo', 'fecha_creacion', 
            'fecha_actualizacion'
        ]
        read_only_fields = ('total', 'neto', 'fecha_creacion', 'fecha_actualizacion')

class CargueID4Serializer(serializers.ModelSerializer):
    """Serializer para CargueID4 - Tabla simplificada"""
    
    class Meta:
        model = CargueID4
        fields = [
            'id', 'dia', 'fecha', 'v', 'd', 'producto', 'cantidad', 'dctos', 
            'adicional', 'devoluciones', 'vendidas', 'vencidas', 'lotes_vencidos', 'lotes_produccion', 'total', 
            'valor', 'neto', 'concepto', 'descuentos', 'nequi', 'daviplata',
            'base_caja', 'total_despacho', 'total_pedidos', 'total_dctos', 
            'venta', 'total_efectivo', 'licencia_transporte', 'soat', 'uniforme',
            'no_locion', 'no_accesorios', 'capacitacion_carnet', 'higiene', 
            'estibas', 'desinfeccion', 'usuario', 'responsable', 'activo', 'fecha_creacion', 
            'fecha_actualizacion'
        ]
        read_only_fields = ('total', 'neto', 'fecha_creacion', 'fecha_actualizacion')

class CargueID5Serializer(serializers.ModelSerializer):
    """Serializer para CargueID5 - Tabla simplificada"""
    
    class Meta:
        model = CargueID5
        fields = [
            'id', 'dia', 'fecha', 'v', 'd', 'producto', 'cantidad', 'dctos', 
            'adicional', 'devoluciones', 'vendidas', 'vencidas', 'lotes_vencidos', 'lotes_produccion', 'total', 
            'valor', 'neto', 'concepto', 'descuentos', 'nequi', 'daviplata',
            'base_caja', 'total_despacho', 'total_pedidos', 'total_dctos', 
            'venta', 'total_efectivo', 'licencia_transporte', 'soat', 'uniforme',
            'no_locion', 'no_accesorios', 'capacitacion_carnet', 'higiene', 
            'estibas', 'desinfeccion', 'usuario', 'responsable', 'activo', 'fecha_creacion', 
            'fecha_actualizacion'
        ]
        read_only_fields = ('total', 'neto', 'fecha_creacion', 'fecha_actualizacion')

class CargueID6Serializer(serializers.ModelSerializer):
    """Serializer para CargueID6 - Tabla simplificada"""
    
    class Meta:
        model = CargueID6
        fields = [
            'id', 'dia', 'fecha', 'v', 'd', 'producto', 'cantidad', 'dctos', 
            'adicional', 'devoluciones', 'vendidas', 'vencidas', 'lotes_vencidos', 'lotes_produccion', 'total', 
            'valor', 'neto', 'concepto', 'descuentos', 'nequi', 'daviplata',
            'base_caja', 'total_despacho', 'total_pedidos', 'total_dctos', 
            'venta', 'total_efectivo', 'licencia_transporte', 'soat', 'uniforme',
            'no_locion', 'no_accesorios', 'capacitacion_carnet', 'higiene', 
            'estibas', 'desinfeccion', 'usuario', 'responsable', 'activo', 'fecha_creacion', 
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
            'cantidad', 'dctos', 'adicional', 'devoluciones', 'vendidas', 'vencidas',
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
            'venta', 'total_efectivo', 'nota',
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
    """Serializer para usuarios del sistema (unificado)"""
    sucursal_nombre = serializers.ReadOnlyField(source='sucursal.nombre', allow_null=True)
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Cajero
        fields = [
            'id', 'codigo', 'nombre', 'email', 'telefono', 'password', 'password_plano', 'sucursal', 
            'sucursal_nombre', 'rol', 'activo', 'puede_hacer_descuentos',
            'limite_descuento', 'puede_anular_ventas', 
            # 🆕 Permisos por módulo
            'acceso_app_movil', 'acceso_pos', 'acceso_pedidos', 'acceso_cargue',
            'acceso_produccion', 'acceso_inventario', 'acceso_reportes', 'acceso_configuracion',
            'fecha_creacion', 'fecha_actualizacion', 'ultimo_login'
        ]
        read_only_fields = ('password_plano', 'fecha_creacion', 'fecha_actualizacion', 'ultimo_login')
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'sucursal': {'required': False, 'allow_null': True},
            'codigo': {'required': False, 'allow_blank': True, 'allow_null': True}
        }
    
    def create(self, validated_data):
        """Crear usuario con contraseña hasheada y plana"""
        import hashlib
        password = validated_data.pop('password', '1234')  # Default password
        
        # 🔧 Si el código viene vacío, dejarlo como None para que el modelo lo genere
        if 'codigo' in validated_data and (not validated_data['codigo'] or validated_data['codigo'].strip() == ''):
            validated_data.pop('codigo')
        
        # 🆕 Guardar copia visible
        validated_data['password_plano'] = password
        
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        validated_data['password'] = hashed_password
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Actualizar usuario, hashear contraseña si se proporciona"""
        if 'password' in validated_data and validated_data['password']:
            import hashlib
            password = validated_data.pop('password')
            
            # 🆕 Actualizar copia visible
            validated_data['password_plano'] = password
            
            hashed_password = hashlib.sha256(password.encode()).hexdigest()
            validated_data['password'] = hashed_password
        elif 'password' in validated_data:
            validated_data.pop('password')  # Quitar si viene vacío
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


class EvidenciaPedidoSerializer(serializers.ModelSerializer):
    """Serializer para fotos de evidencia de pedidos"""
    from .models import EvidenciaPedido
    
    class Meta:
        from .models import EvidenciaPedido
        model = EvidenciaPedido
        fields = ['id', 'producto_nombre', 'imagen', 'motivo', 'fecha_creacion']
        read_only_fields = ('fecha_creacion',)


class PedidoSerializer(serializers.ModelSerializer):
    """Serializer para pedidos"""
    detalles = DetallePedidoSerializer(many=True, read_only=True)
    detalles_info = DetallePedidoSerializer(source='detalles', many=True, read_only=True)  # Alias para frontend
    evidencias = EvidenciaPedidoSerializer(many=True, read_only=True)  # 🆕 Fotos de evidencia
    
    class Meta:
        model = Pedido
        fields = [
            'id', 'numero_pedido', 'fecha', 'vendedor', 'destinatario',
            'direccion_entrega', 'telefono_contacto', 'fecha_entrega',
            'tipo_pedido', 'transportadora', 'subtotal', 'impuestos',
            'descuentos', 'total', 'estado', 'nota', 'metodo_pago', 'productos_vencidos', 'novedades', 'editada',
            'fecha_creacion', 'fecha_actualizacion', 'detalles', 'detalles_info',
            'evidencias',  # 🆕 Fotos de evidencia
            # Nuevos campos
            'afectar_inventario_inmediato', 'asignado_a_tipo', 
            'asignado_a_id', 'inventario_afectado'
        ]
        read_only_fields = ('numero_pedido', 'fecha_creacion', 'fecha_actualizacion', 'inventario_afectado')
    

    
    def create(self, validated_data):
        from django.db import transaction
        from django.db import models
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
            
            # ===== 5. CREAR CLIENTE EN RUTA SI ESTÁ ASIGNADO A VENDEDOR =====
            if pedido.asignado_a_tipo == 'VENDEDOR' and pedido.asignado_a_id and pedido.fecha_entrega:
                print(f"\n👥 CREANDO/ACTUALIZANDO CLIENTE EN RUTA")
                print(f"{'='*60}")
                
                try:
                    from .models import Ruta, ClienteRuta, Vendedor
                    import datetime
                    
                    # Buscar el vendedor
                    vendedor = Vendedor.objects.filter(id_vendedor=pedido.asignado_a_id).first()
                    
                    if vendedor:
                        # Buscar la ruta del vendedor
                        ruta = Ruta.objects.filter(vendedor=vendedor, activo=True).first()
                        
                        if ruta:
                            # Obtener el día de la semana de la fecha de entrega
                            dias_map = {
                                0: 'LUNES',
                                1: 'MARTES',
                                2: 'MIERCOLES',
                                3: 'JUEVES',
                                4: 'VIERNES',
                                5: 'SABADO',
                                6: 'DOMINGO'
                            }
                            dia_semana = dias_map[pedido.fecha_entrega.weekday()]
                            
                            # Buscar si ya existe el cliente en la ruta
                            cliente_ruta = ClienteRuta.objects.filter(
                                ruta=ruta,
                                nombre_negocio=pedido.destinatario
                            ).first()
                            
                            if cliente_ruta:
                                # Actualizar días de visita si no incluye el día actual
                                dias_actuales = [d.strip() for d in cliente_ruta.dia_visita.split(',')]
                                if dia_semana not in dias_actuales:
                                    dias_actuales.append(dia_semana)
                                    # Ordenar días
                                    orden_dias = {'LUNES': 1, 'MARTES': 2, 'MIERCOLES': 3, 'JUEVES': 4, 'VIERNES': 5, 'SABADO': 6, 'DOMINGO': 7}
                                    dias_actuales.sort(key=lambda d: orden_dias.get(d, 99))
                                    cliente_ruta.dia_visita = ','.join(dias_actuales)
                                    cliente_ruta.save()
                                    print(f"✅ Cliente actualizado: {pedido.destinatario} - Días: {cliente_ruta.dia_visita}")
                                else:
                                    print(f"ℹ️ Cliente ya existe: {pedido.destinatario}")
                            else:
                                # Crear nuevo cliente en ruta
                                ultimo_orden = ClienteRuta.objects.filter(ruta=ruta).aggregate(
                                    models.Max('orden')
                                )['orden__max'] or 0
                                
                                ClienteRuta.objects.create(
                                    ruta=ruta,
                                    nombre_negocio=pedido.destinatario,
                                    nombre_contacto=pedido.destinatario,
                                    direccion=pedido.direccion_entrega or '',
                                    telefono=pedido.telefono_contacto or '',
                                    tipo_negocio=f"Cliente | PEDIDOS",  # 🔥 MARCAR ORIGEN COMO PEDIDOS
                                    dia_visita=dia_semana,
                                    orden=ultimo_orden + 1,
                                    activo=True,
                                    nota=f"Pedido #{pedido.numero_pedido}"
                                )
                                print(f"✅ Cliente creado en ruta: {pedido.destinatario} - Día: {dia_semana} - ORIGEN: PEDIDOS")
                        else:
                            print(f"⚠️ No se encontró ruta activa para el vendedor {pedido.asignado_a_id}")
                    else:
                        print(f"⚠️ No se encontró vendedor con ID {pedido.asignado_a_id}")
                        
                except Exception as e:
                    print(f"❌ Error creando cliente en ruta: {str(e)}")
                    import traceback
                    traceback.print_exc()
            
            # ===== 6. ACTUALIZAR CARGUE SI ESTÁ ASIGNADO A VENDEDOR =====
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

    def update(self, instance, validated_data):
        from django.db import transaction
        from .models import DetallePedido, EvidenciaPedido, CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6
        import base64
        import uuid
        from django.core.files.base import ContentFile
        
        # Extraer datos adicionales del request
        detalles_data = self.context['request'].data.get('detalles')
        productos_vencidos_data = self.context['request'].data.get('productos_vencidos')
        foto_vencidos_base64 = self.context['request'].data.get('foto_vencidos')
        
        with transaction.atomic():
            # Actualizar campos del pedido
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            
            # Guardar productos_vencidos si vienen en el request (no están en validated_data si no son del modelo)
            # Pero ahora YA están en el modelo.
            if productos_vencidos_data is not None:
                instance.productos_vencidos = productos_vencidos_data
                
            instance.save()
            
            # 1. Si vienen detalles, reemplazar todos
            if detalles_data is not None:
                instance.detalles.all().delete()
                for detalle_data in detalles_data:
                    DetallePedido.objects.create(
                        pedido=instance, 
                        producto_id=detalle_data['producto'],
                        cantidad=detalle_data['cantidad'],
                        precio_unitario=detalle_data['precio_unitario']
                    )
            
            # 2. 🆕 MANEJO DE VENCIDAS Y STOCK (CargueIDx)
            if productos_vencidos_data and len(productos_vencidos_data) > 0:
                print(f"🔄 Procesando {len(productos_vencidos_data)} vencidas para Pedido #{instance.numero_pedido}")
                
                id_vendedor = instance.vendedor # Suele ser 'ID1', 'ID2', etc.
                if not id_vendedor.startswith('ID'):
                    # Intentar buscar el ID en el perfil si vendedor es nombre
                    from .models import Vendedor
                    v_obj = Vendedor.objects.filter(nombre__icontains=id_vendedor).first()
                    if v_obj:
                        id_vendedor = v_obj.id_vendedor

                fecha_ref = instance.fecha_entrega or instance.fecha.date()
                
                modelo_map = {
                    'ID1': CargueID1, 'ID2': CargueID2, 'ID3': CargueID3,
                    'ID4': CargueID4, 'ID5': CargueID5, 'ID6': CargueID6,
                }
                ModeloCargue = modelo_map.get(id_vendedor)
                
                if ModeloCargue:
                    from django.db.models import F
                    for item in productos_vencidos_data:
                        nombre_prod = item.get('producto') or item.get('nombre', '')
                        cantidad = int(item.get('cantidad', 0))
                        
                        if nombre_prod and cantidad > 0:
                            updated = ModeloCargue.objects.filter(
                                fecha=fecha_ref,
                                producto__iexact=nombre_prod,
                                activo=True
                            ).update(vencidas=F('vencidas') + cantidad)
                            print(f"   ✅ {nombre_prod}: vencidas += {cantidad} (registros: {updated})")

            # 3. 🆕 MANEJO DE FOTOS (EvidenciaPedido)
            if foto_vencidos_base64 and isinstance(foto_vencidos_base64, dict):
                print(f"📸 Procesando fotos de evidencia para Pedido #{instance.numero_pedido}")
                for prod_id_key, pics in foto_vencidos_base64.items():
                    if not pics or not isinstance(pics, list): continue
                    
                    for pic_base64 in pics:
                        if ',' in pic_base64:
                            try:
                                format, imgstr = pic_base64.split(';base64,')
                                ext = format.split('/')[-1]
                                data = ContentFile(base64.b64decode(imgstr), name=f"pedido_{instance.id}_{uuid.uuid4().hex[:6]}.{ext}")
                                
                                # Buscar nombre del producto si el ID es numérico
                                prod_nombre = ""
                                try:
                                    if str(prod_id_key).isdigit():
                                        from .models import Producto
                                        p_obj = Producto.objects.filter(id=int(prod_id_key)).first()
                                        if p_obj: prod_nombre = p_obj.nombre
                                    else:
                                        prod_nombre = str(prod_id_key) # Tal vez es 'general'
                                except:
                                    pass

                                EvidenciaPedido.objects.create(
                                    pedido=instance,
                                    producto_nombre=prod_nombre,
                                    imagen=data,
                                    motivo='Vencida reportada en entrega'
                                )
                                print(f"   ✅ Evidencia guardada para: {prod_nombre}")
                            except Exception as e:
                                print(f"   ❌ Error guardando foto: {e}")

        return instance
class PlaneacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Planeacion
        fields = '__all__'

class ReportePlaneacionSerializer(serializers.ModelSerializer):
    """Serializer para snapshots de reportes de planeación"""
    class Meta:
        model = ReportePlaneacion
        fields = '__all__'

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
    logo_base64 = serializers.SerializerMethodField()
    
    class Meta:
        model = ConfiguracionImpresion
        fields = [
            'id', 'nombre_negocio', 'nit_negocio', 'direccion_negocio',
            'ciudad_negocio', 'pais_negocio',
            'telefono_negocio', 'email_negocio', 'encabezado_ticket',
            'pie_pagina_ticket', 'mensaje_agradecimiento', 'logo', 'logo_base64',
            'ancho_papel', 'fuente_ticket', 
            'tamanio_fuente_general', 'tamanio_fuente_nombre_negocio', 
            'tamanio_fuente_info', 'tamanio_fuente_tabla', 'tamanio_fuente_totales',
            'letter_spacing', 'letter_spacing_divider', 'font_weight_tabla',
            'mostrar_logo', 'mostrar_codigo_barras',
            'impresora_predeterminada', 'resolucion_facturacion',
            'regimen_tributario', 'activo', 'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ('fecha_creacion', 'fecha_actualizacion', 'logo_base64')
    
    def get_logo_base64(self, obj):
        """Convierte el logo a Base64 para evitar problemas de CORS"""
        import base64
        import os
        
        if obj.logo and obj.mostrar_logo:
            try:
                # Obtener la ruta del archivo
                logo_path = obj.logo.path
                if os.path.exists(logo_path):
                    with open(logo_path, 'rb') as f:
                        logo_data = f.read()
                    # Detectar tipo de imagen
                    if logo_path.lower().endswith('.png'):
                        mime_type = 'image/png'
                    elif logo_path.lower().endswith('.jpg') or logo_path.lower().endswith('.jpeg'):
                        mime_type = 'image/jpeg'
                    elif logo_path.lower().endswith('.gif'):
                        mime_type = 'image/gif'
                    else:
                        mime_type = 'image/png'  # Default
                    
                    # Codificar a Base64
                    encoded = base64.b64encode(logo_data).decode('utf-8')
                    return f"data:{mime_type};base64,{encoded}"
            except Exception as e:
                print(f"Error convirtiendo logo a Base64: {e}")
                return None
        return None


# ===== SERIALIZERS RUTAS Y VENTAS RUTA =====
from .models import Ruta, ClienteRuta, VentaRuta, EvidenciaVenta, ClienteOcasional

class RutaSerializer(serializers.ModelSerializer):
    vendedor_nombre = serializers.CharField(source='vendedor.nombre', read_only=True)
    
    class Meta:
        model = Ruta
        fields = '__all__'

class ClienteRutaSerializer(serializers.ModelSerializer):
    lista_precio_nombre = serializers.SerializerMethodField()

    class Meta:
        model = ClienteRuta
        fields = '__all__'

    def create(self, validated_data):
        # ⚡ Calcular orden automáticamente si no se proporciona
        if 'orden' not in validated_data or validated_data.get('orden') is None:
            ruta = validated_data.get('ruta')
            if ruta:
                # Obtener el máximo orden actual de la ruta
                max_orden = ClienteRuta.objects.filter(ruta=ruta).aggregate(
                    models.Max('orden')
                )['orden__max']
                validated_data['orden'] = (max_orden or 0) + 1
            else:
                validated_data['orden'] = 999
        
        return super().create(validated_data)

    def get_lista_precio_nombre(self, obj):
        """Optimizado para evitar consultas N+1 durante la serialización en masa."""
        # ⚡ Si ya fue inyectado por el ViewSet, usarlo (MÁXIMO RENDIMIENTO)
        if hasattr(obj, 'precomputed_lista_precio'):
            return obj.precomputed_lista_precio
            
        # Fallback para consultas individuales
        try:
            from .models import Cliente
            return Cliente.objects.filter(nombre_completo__iexact=obj.nombre_negocio.strip()).values_list('tipo_lista_precio', flat=True).first()
        except Exception:
            pass
        return None

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
        fields = '__all__'  # Incluye automáticamente dispositivo_id e ip_origen
        # read_only_fields = ('fecha',)  # FECHA debe ser editable para permitir simular días anteriores

class ClienteOcasionalSerializer(serializers.ModelSerializer):
    """Serializer para clientes ocasionales (ventas en calle)"""
    vendedor_nombre = serializers.CharField(source='vendedor.nombre', read_only=True)
    total_ventas = serializers.SerializerMethodField()
    cantidad_ventas = serializers.SerializerMethodField()
    
    class Meta:
        model = ClienteOcasional
        fields = '__all__'
    
    def get_total_ventas(self, obj):
        """Sumar total de ventas asociadas a este cliente ocasional"""
        from django.db.models import Sum
        return float(obj.ventas.filter(estado='ACTIVA').aggregate(
            total=Sum('total')
        )['total'] or 0)
    
    def get_cantidad_ventas(self, obj):
        """Cantidad de ventas realizadas a este cliente"""
        return obj.ventas.filter(estado='ACTIVA').count()


# ===== SERIALIZER PARA LOGS DE SINCRONIZACIÓN =====

class SyncLogSerializer(serializers.ModelSerializer):
    """Serializer para logs de sincronización multi-dispositivo"""
    
    class Meta:
        from .models import SyncLog
        model = SyncLog
        fields = '__all__'
        read_only_fields = ('timestamp',)


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


class ConfiguracionProduccionSerializer(serializers.ModelSerializer):
    """Serializer para configuración de producción"""
    
    class Meta:
        from .models import ConfiguracionProduccion
        model = ConfiguracionProduccion
        fields = ['clave', 'valor', 'descripcion', 'fecha_actualizacion']
        read_only_fields = ('fecha_actualizacion',)


class RutaOrdenSerializer(serializers.ModelSerializer):
    """Serializer para el orden de rutas"""
    class Meta:
        model = RutaOrden
        fields = '__all__'
