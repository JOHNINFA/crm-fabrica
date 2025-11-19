#!/usr/bin/env python
"""Script para verificar qué productos hay en api_stock"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Stock, Producto

print("🔍 VERIFICANDO api_stock\n")

stocks = Stock.objects.select_related('producto').all().order_by('producto__orden', 'producto__id')

print(f"📊 Total registros en api_stock: {stocks.count()}\n")
print("=" * 80)

for i, stock in enumerate(stocks, 1):
    ubicacion = stock.producto.ubicacion_inventario or 'SIN UBICACION'
    print(f"{i}. {stock.producto_nombre}")
    print(f"   ID: {stock.producto.id} | Ubicación: {ubicacion} | Stock: {stock.cantidad_actual}")
    print(f"   Activo: {stock.producto.activo}")
    print("-" * 80)

print("\n📋 RESUMEN POR UBICACIÓN:")
produccion = stocks.filter(producto__ubicacion_inventario='PRODUCCION').count()
maquila = stocks.filter(producto__ubicacion_inventario='MAQUILA').count()
sin_ubicacion = stocks.filter(producto__ubicacion_inventario__isnull=True).count()

print(f"   PRODUCCION: {produccion}")
print(f"   MAQUILA: {maquila}")
print(f"   SIN UBICACION: {sin_ubicacion}")
print(f"   TOTAL: {stocks.count()}")
