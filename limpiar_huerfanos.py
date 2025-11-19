#!/usr/bin/env python
"""Script para limpiar productos huérfanos de RegistroInventario"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Producto, RegistroInventario

# Identificar productos huérfanos
productos_validos = set(Producto.objects.values_list('nombre', flat=True))
registros_huerfanos = RegistroInventario.objects.exclude(producto_nombre__in=productos_validos)

print("🔍 PRODUCTOS HUÉRFANOS:")
huerfanos = set(registros_huerfanos.values_list('producto_nombre', flat=True))
for nombre in sorted(huerfanos):
    count = registros_huerfanos.filter(producto_nombre=nombre).count()
    print(f"  - {nombre}: {count} registros")

print(f"\n📊 Total registros huérfanos: {registros_huerfanos.count()}")
print(f"📊 Total productos válidos: {len(productos_validos)}")

# Eliminar huérfanos
if registros_huerfanos.count() > 0:
    registros_huerfanos.delete()
    print("\n✅ Productos huérfanos eliminados")
else:
    print("\n✅ No hay productos huérfanos")
