from django.contrib import admin
from .models import Producto, Registro

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'stock_total')
    search_fields = ('nombre',)

@admin.register(Registro)
class RegistroAdmin(admin.ModelAdmin):
    list_display = ('dia', 'id_sheet', 'producto', 'cantidad', 'total', 'neto')
    list_filter = ('dia', 'id_sheet')
    search_fields = ('producto__nombre',)
