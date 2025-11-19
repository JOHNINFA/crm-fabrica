#!/usr/bin/env python
"""Script para reactivar un producto específico"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Producto

# Nombre del producto a reactivar
nombre_producto = "AREPA DE CHOCLO CON QUESO PEQUEÑA 700 Gr"

try:
    producto = Producto.objects.get(nombre=nombre_producto)
    print(f"📝 Producto encontrado: {producto.nombre}")
    print(f"   Estado actual: {'Activo' if producto.activo else 'Inactivo'}")
    
    if not producto.activo:
        producto.activo = True
        producto.save()
        print(f"   ✅ Producto REACTIVADO")
    else:
        print(f"   ℹ️ El producto ya estaba activo")
        
except Producto.DoesNotExist:
    print(f"❌ Producto '{nombre_producto}' no encontrado")
