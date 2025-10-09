from rest_framework import serializers
from .models import Registro, Producto, Categoria, Lote, MovimientoInventario, RegistroInventario, Venta, DetalleVenta, Cliente, ListaPrecio, PrecioProducto, CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6, Produccion, ProduccionSolicitada, Sucursal, Cajero, Turno, VentaCajero, ArqueoCaja, Remision, DetalleRemision

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
            'adicional', 'devoluciones', 'vencidas', 'lotes_vencidos', 'total', 
            'valor', 'neto', 'concepto', 'descuentos', 'nequi', 'daviplata',
            'base_caja', 'total_despacho', 'total_pedidos', 'total_dctos', 
            'venta', 'total_efectivo', 'licencia_transporte', 'soat', 'uniforme',
            'no_locion', 'no_accesorios', 'capacitacion_carnet', 'higiene', 
            'estibas', 'desinfeccion', 'usuario', 'responsable', 'activo', 'fecha_creacion', 
            'fecha_actualizacion'
        ]
        read_only_fields = ('total', 'neto', 'fecha_creacion', 'fecha_actualizacion')

class CargueID2Serializer(serializers.ModelSerializer):
    """Serializer para CargueID2 - Tabla simplificada"""
    
    class Meta:
        model = CargueID2
        fields = [
            'id', 'dia', 'fecha', 'v', 'd', 'producto', 'cantidad', 'dctos', 
            'adicional', 'devoluciones', 'vencidas', 'lotes_vencidos', 'total', 
            'valor', 'neto', 'concepto', 'descuentos', 'nequi', 'daviplata',
            'base_caja', 'total_despacho', 'total_pedidos', 'total_dctos', 
            'venta', 'total_efectivo', 'licencia_transporte', 'soat', 'uniforme',
            'no_locion', 'no_accesorios', 'capacitacion_carnet', 'higiene', 
            'estibas', 'desinfeccion', 'usuario', 'responsable', 'activo', 'fecha_creacion', 
            'fecha_actualizacion'
        ]
        read_only_fields = ('total', 'neto', 'fecha_creacion', 'fecha_actualizacion')

class CargueID3Serializer(serializers.ModelSerializer):
    """Serializer para CargueID3 - Tabla simplificada"""
    
    class Meta:
        model = CargueID3
        fields = [
            'id', 'dia', 'fecha', 'v', 'd', 'producto', 'cantidad', 'dctos', 
            'adicional', 'devoluciones', 'vencidas', 'lotes_vencidos', 'total', 
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
            'adicional', 'devoluciones', 'vencidas', 'lotes_vencidos', 'total', 
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
            'adicional', 'devoluciones', 'vencidas', 'lotes_vencidos', 'total', 
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
            'adicional', 'devoluciones', 'vencidas', 'lotes_vencidos', 'total', 
            'valor', 'neto', 'concepto', 'descuentos', 'nequi', 'daviplata',
            'base_caja', 'total_despacho', 'total_pedidos', 'total_dctos', 
            'venta', 'total_efectivo', 'licencia_transporte', 'soat', 'uniforme',
            'no_locion', 'no_accesorios', 'capacitacion_carnet', 'higiene', 
            'estibas', 'desinfeccion', 'usuario', 'responsable', 'activo', 'fecha_creacion', 
            'fecha_actualizacion'
        ]
        read_only_fields = ('total', 'neto', 'fecha_creacion', 'fecha_actualizacion')

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

class DetalleRemisionSerializer(serializers.ModelSerializer):
    """Serializer para detalles de remisión"""
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    
    class Meta:
        model = DetalleRemision
        fields = [
            'id', 'producto', 'producto_nombre', 'cantidad', 
            'precio_unitario', 'subtotal'
        ]
        read_only_fields = ('subtotal',)

class RemisionSerializer(serializers.ModelSerializer):
    """Serializer para remisiones"""
    detalles = DetalleRemisionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Remision
        fields = [
            'id', 'numero_remision', 'fecha', 'vendedor', 'destinatario',
            'direccion_entrega', 'telefono_contacto', 'fecha_entrega',
            'tipo_remision', 'transportadora', 'subtotal', 'impuestos',
            'descuentos', 'total', 'estado', 'nota', 'fecha_creacion',
            'fecha_actualizacion', 'detalles'
        ]
        read_only_fields = ('numero_remision', 'fecha_creacion', 'fecha_actualizacion')
    
    def create(self, validated_data):
        # Extraer detalles si vienen en los datos
        detalles_data = self.context['request'].data.get('detalles', [])
        
        # Crear la remisión
        remision = Remision.objects.create(**validated_data)
        
        # Crear los detalles
        for detalle_data in detalles_data:
            DetalleRemision.objects.create(
                remision=remision,
                producto_id=detalle_data['producto'],
                cantidad=detalle_data['cantidad'],
                precio_unitario=detalle_data['precio_unitario']
            )
        
        return remision