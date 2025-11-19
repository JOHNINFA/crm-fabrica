#!/usr/bin/env python
"""Script para actualizar ubicacion_inventario de productos sin ubicación"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Producto

print("🔧 ACTUALIZANDO UBICACIÓN DE PRODUCTOS\n")

# Productos sin ubicación o con ubicación vacía
productos_sin_ubicacion = Producto.objects.filter(
    ubicacion_inventario__isnull=True
) | Producto.objects.filter(ubicacion_inventario='')

print(f"📊 Productos sin ubicación: {productos_sin_ubicacion.count()}\n")

for producto in productos_sin_ubicacion:
    print(f"📝 {producto.nombre}")
    print(f"   Ubicación actual: {producto.ubicacion_inventario or 'NULL'}")
    producto.ubicacion_inventario = 'PRODUCCION'
    producto.save()
    print(f"   ✅ Actualizado a: PRODUCCION\n")

print(f"\n✅ {productos_sin_ubicacion.count()} productos actualizados")
