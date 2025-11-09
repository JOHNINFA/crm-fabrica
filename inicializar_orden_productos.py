#!/usr/bin/env python3
"""
Script para inicializar el orden de los productos existentes
"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Producto

def inicializar_orden():
    """Asigna un orden inicial a todos los productos basado en su ID"""
    productos = Producto.objects.all().order_by('id')
    
    print(f"📦 Encontrados {productos.count()} productos")
    print("🔄 Asignando orden...")
    
    for index, producto in enumerate(productos):
        producto.orden = index
        producto.save(update_fields=['orden'])
        print(f"  ✓ {index + 1}. {producto.nombre} - orden: {index}")
    
    print(f"\n✅ {productos.count()} productos ordenados correctamente")

if __name__ == '__main__':
    inicializar_orden()
