from django.contrib import admin
from .models import Producto, Registro, Categoria, Stock, Lote, MovimientoInventario, RegistroInventario, CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6, Produccion

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre')
    search_fields = ('nombre',)

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'categoria', 'precio', 'stock_total', 'disponible_pos', 'disponible_cargue', 'disponible_pedidos', 'disponible_inventario', 'activo')
    list_filter = ('categoria', 'activo', 'disponible_pos', 'disponible_cargue', 'disponible_pedidos', 'disponible_inventario')
    search_fields = ('nombre', 'descripcion')
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'descripcion', 'categoria', 'codigo_barras', 'marca', 'impuesto', 'orden')
        }),
        ('Precios y Stock', {
            'fields': ('precio', 'precio_compra', 'stock_total')
        }),
        ('Disponibilidad por Módulo', {
            'fields': ('disponible_pos', 'disponible_cargue', 'disponible_pedidos', 'disponible_inventario'),
            'description': 'Selecciona en qué módulos estará disponible este producto'
        }),
        ('Configuración', {
            'fields': ('ubicacion_inventario', 'imagen', 'activo')
        }),
    )

@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('get_producto_nombre', 'get_descripcion_corta', 'cantidad_actual', 'fecha_actualizacion')
    search_fields = ('producto__nombre', 'producto_nombre', 'producto_descripcion')
    readonly_fields = ('fecha_actualizacion', 'producto_nombre', 'producto_descripcion')
    ordering = ('producto__orden', 'producto__id')
    
    def get_producto_nombre(self, obj):
        """Mostrar nombre del producto"""
        return obj.producto_nombre or obj.producto.nombre
    get_producto_nombre.short_description = 'Producto'
    get_producto_nombre.admin_order_field = 'producto__nombre'
    
    def get_descripcion_corta(self, obj):
        """Mostrar descripción corta (primeros 50 caracteres)"""
        desc = obj.producto_descripcion or obj.producto.descripcion or ''
        return desc[:50] + '...' if len(desc) > 50 else desc
    get_descripcion_corta.short_description = 'Descripción'

@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
    list_display = ('id', 'lote', 'fecha_produccion', 'fecha_vencimiento', 'usuario', 'activo')
    list_filter = ('fecha_produccion', 'usuario', 'activo')
    search_fields = ('lote', 'usuario')
    date_hierarchy = 'fecha_produccion'

@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = ('id', 'producto', 'tipo', 'cantidad', 'fecha', 'usuario')
    list_filter = ('tipo', 'producto__categoria')
    search_fields = ('producto__nombre', 'usuario', 'nota')
    date_hierarchy = 'fecha'

@admin.register(Registro)
class RegistroAdmin(admin.ModelAdmin):
    list_display = ('dia', 'id_sheet', 'producto', 'cantidad', 'total', 'neto')
    list_filter = ('dia', 'id_sheet')
    search_fields = ('producto__nombre',)

@admin.register(RegistroInventario)
class RegistroInventarioAdmin(admin.ModelAdmin):
    list_display = ('id', 'producto_nombre', 'tipo_movimiento', 'entradas', 'salidas', 'saldo', 'fecha_produccion', 'usuario', 'activo')
    list_filter = ('fecha_produccion', 'usuario', 'activo')
    search_fields = ('producto_nombre', 'usuario')
    date_hierarchy = 'fecha_produccion'

# ========================================
# NUEVOS ADMINS SIMPLIFICADOS
# ========================================

@admin.register(CargueID1)
class CargueID1Admin(admin.ModelAdmin):
    list_display = ('id', 'dia', 'fecha', 'producto', 'cantidad', 'total', 'neto', 'usuario', 'activo')
    list_filter = ('dia', 'fecha', 'activo', 'v', 'd')
    search_fields = ('producto', 'usuario')
    date_hierarchy = 'fecha'
    ordering = ('-fecha', '-fecha_actualizacion')

@admin.register(CargueID2)
class CargueID2Admin(admin.ModelAdmin):
    list_display = ('id', 'dia', 'fecha', 'producto', 'cantidad', 'total', 'neto', 'usuario', 'activo')
    list_filter = ('dia', 'fecha', 'activo', 'v', 'd')
    search_fields = ('producto', 'usuario')
    date_hierarchy = 'fecha'
    ordering = ('-fecha', '-fecha_actualizacion')

@admin.register(CargueID3)
class CargueID3Admin(admin.ModelAdmin):
    list_display = ('id', 'dia', 'fecha', 'producto', 'cantidad', 'total', 'neto', 'usuario', 'activo')
    list_filter = ('dia', 'fecha', 'activo', 'v', 'd')
    search_fields = ('producto', 'usuario')
    date_hierarchy = 'fecha'
    ordering = ('-fecha', '-fecha_actualizacion')

@admin.register(CargueID4)
class CargueID4Admin(admin.ModelAdmin):
    list_display = ('id', 'dia', 'fecha', 'producto', 'cantidad', 'total', 'neto', 'usuario', 'activo')
    list_filter = ('dia', 'fecha', 'activo', 'v', 'd')
    search_fields = ('producto', 'usuario')
    date_hierarchy = 'fecha'
    ordering = ('-fecha', '-fecha_actualizacion')

@admin.register(CargueID5)
class CargueID5Admin(admin.ModelAdmin):
    list_display = ('id', 'dia', 'fecha', 'producto', 'cantidad', 'total', 'neto', 'usuario', 'activo')
    list_filter = ('dia', 'fecha', 'activo', 'v', 'd')
    search_fields = ('producto', 'usuario')
    date_hierarchy = 'fecha'
    ordering = ('-fecha', '-fecha_actualizacion')

@admin.register(CargueID6)
class CargueID6Admin(admin.ModelAdmin):
    list_display = ('id', 'dia', 'fecha', 'producto', 'cantidad', 'total', 'neto', 'usuario', 'activo')
    list_filter = ('dia', 'fecha', 'activo', 'v', 'd')
    search_fields = ('producto', 'usuario')
    date_hierarchy = 'fecha'
    ordering = ('-fecha', '-fecha_actualizacion')

@admin.register(Produccion)
class ProduccionAdmin(admin.ModelAdmin):
    list_display = ('id', 'fecha', 'producto', 'cantidad', 'lote', 'congelado', 'usuario', 'activo')
    list_filter = ('fecha', 'congelado', 'activo')
    search_fields = ('producto', 'lote', 'usuario')
    date_hierarchy = 'fecha'
    ordering = ('-fecha', '-fecha_actualizacion')
    
    def get_readonly_fields(self, request, obj=None):
        # Si está congelado, hacer campos de solo lectura
        if obj and obj.congelado:
            return ('fecha', 'producto', 'cantidad', 'lote', 'fecha_congelado', 'usuario_congelado')
        return ('fecha_congelado', 'usuario_congelado')
