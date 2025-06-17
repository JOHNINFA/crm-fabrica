#!/usr/bin/env python3
"""
Script para eliminar todos los movimientos de inventario de la base de datos.
"""

import os
import django

# Configurar entorno Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import MovimientoInventario

def clear_movements():
    """Elimina todos los movimientos de inventario."""
    try:
        # Contar movimientos antes de eliminar
        count_before = MovimientoInventario.objects.count()
        print(f"Movimientos antes de limpiar: {count_before}")
        
        # Eliminar todos los movimientos
        MovimientoInventario.objects.all().delete()
        
        # Verificar que se eliminaron
        count_after = MovimientoInventario.objects.count()
        print(f"Movimientos después de limpiar: {count_after}")
        print(f"Se eliminaron {count_before - count_after} movimientos.")
        
    except Exception as e:
        print(f"Error al eliminar movimientos: {e}")

if __name__ == "__main__":
    clear_movements()