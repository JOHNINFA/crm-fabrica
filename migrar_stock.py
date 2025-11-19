#!/usr/bin/env python
"""Script para migrar datos de stock_total a tabla api_stock"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Producto, Stock

print("🚀 MIGRANDO STOCK A TABLA api_stock\n")

productos = Producto.objects.all()
total = productos.count()
migrados = 0
actualizados = 0

for producto in productos:
    stock_actual = producto.stock_total or 0
    
    # Crear o actualizar registro en Stock
    stock_obj, created = Stock.objects.update_or_create(
        producto=producto,
        defaults={'cantidad_actual': stock_actual}
    )
    
    if created:
        migrados += 1
        print(f"✅ Creado: {producto.nombre}: {stock_actual}")
    else:
        actualizados += 1
        print(f"🔄 Actualizado: {producto.nombre}: {stock_actual}")

print(f"\n📊 RESUMEN:")
print(f"   Total productos: {total}")
print(f"   Nuevos registros: {migrados}")
print(f"   Actualizados: {actualizados}")
print(f"\n✅ Migración completada")
