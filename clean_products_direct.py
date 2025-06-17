#!/usr/bin/env python3
"""
Script para marcar como inactivos los productos sin imagen.
"""

import os
import django
import json

# Configurar entorno Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Producto

def clean_products():
    """Marca como inactivos los productos sin imagen."""
    print("Marcando como inactivos los productos sin imagen...")
    
    # Obtener todos los productos activos
    productos = Producto.objects.filter(activo=True)
    print(f"Total de productos activos en la base de datos: {productos.count()}")
    
    # Filtrar productos sin imagen
    productos_sin_imagen = productos.filter(imagen__isnull=True) | productos.filter(imagen='')
    count_sin_imagen = productos_sin_imagen.count()
    print(f"Productos activos sin imagen: {count_sin_imagen}")
    
    if count_sin_imagen > 0:
        # Marcar como inactivos los productos sin imagen
        productos_sin_imagen.update(activo=False)
        print(f"Se marcaron como inactivos {count_sin_imagen} productos sin imagen.")
    else:
        print("No hay productos sin imagen para marcar como inactivos.")
    
    print("\nProceso completado.")

if __name__ == "__main__":
    clean_products()