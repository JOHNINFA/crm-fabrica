from django.contrib import admin
from .models import Producto, Registro, Categoria, Lote, MovimientoInventario, RegistroInventario, CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6, Produccion

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
