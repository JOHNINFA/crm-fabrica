#!/usr/bin/env python
"""Script para actualizar nombre y descripción en registros existentes de Stock"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Stock

print("🚀 ACTUALIZANDO NOMBRE Y DESCRIPCIÓN EN api_stock\n")

stocks = Stock.objects.all()
total = stocks.count()
actualizados = 0

for stock in stocks:
    # Actualizar nombre y descripción desde el producto
    stock.producto_nombre = stock.producto.nombre
    stock.producto_descripcion = stock.producto.descripcion
    stock.save()
    
    actualizados += 1
    print(f"✅ {stock.producto.nombre}")

print(f"\n📊 RESUMEN:")
print(f"   Total registros: {total}")
print(f"   Actualizados: {actualizados}")
print(f"\n✅ Actualización completada")
