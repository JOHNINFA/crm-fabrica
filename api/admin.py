from django.contrib import admin
from .models import Producto, Registro, Categoria, Lote, MovimientoInventario

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
    list_display = ('id', 'producto', 'codigo', 'cantidad', 'fecha_vencimiento')
    list_filter = ('producto__categoria',)
    search_fields = ('codigo', 'producto__nombre')
    date_hierarchy = 'fecha_creacion'

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
