from django.contrib import admin
from .models import Producto, Registro, Categoria, Lote, MovimientoInventario, RegistroInventario, Vendedor, CargueOperativo, DetalleCargue, ResumenPagos, ResumenTotales

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre')
    search_fields = ('nombre',)

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'categoria', 'precio', 'stock_total', 'activo')
    list_filter = ('categoria', 'activo')
    search_fields = ('nombre', 'descripcion')

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

@admin.register(Vendedor)
class VendedorAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'id_vendedor', 'ruta', 'activo', 'fecha_creacion')
    list_filter = ('id_vendedor', 'activo')
    search_fields = ('nombre', 'ruta')
    ordering = ('id_vendedor',)

@admin.register(CargueOperativo)
class CargueOperativoAdmin(admin.ModelAdmin):
    list_display = ('id', 'dia', 'vendedor', 'fecha', 'usuario', 'activo')
    list_filter = ('dia', 'vendedor', 'activo')
    search_fields = ('vendedor__nombre', 'usuario')
    date_hierarchy = 'fecha'

@admin.register(DetalleCargue)
class DetalleCargueAdmin(admin.ModelAdmin):
    list_display = ('id', 'cargue', 'producto', 'cantidad', 'total', 'neto')
    list_filter = ('cargue__dia', 'cargue__vendedor')
    search_fields = ('producto__nombre',)

@admin.register(ResumenPagos)
class ResumenPagosAdmin(admin.ModelAdmin):
    list_display = ('id', 'cargue', 'concepto', 'descuentos', 'nequi', 'daviplata')
    list_filter = ('cargue__dia', 'cargue__vendedor')
    search_fields = ('concepto',)

@admin.register(ResumenTotales)
class ResumenTotalesAdmin(admin.ModelAdmin):
    list_display = ('id', 'cargue', 'total_despacho', 'base_caja', 'total_efectivo')
    list_filter = ('cargue__dia', 'cargue__vendedor')
    search_fields = ('cargue__vendedor__nombre',)
