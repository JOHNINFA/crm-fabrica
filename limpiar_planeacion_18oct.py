#!/usr/bin/env python
"""
Script para limpiar la columna pedidos en Planeación del 18 de octubre de 2025
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Planeacion
from datetime import date
from django.db import transaction

def limpiar_planeacion():
    """Poner en 0 la columna pedidos para el 18 de octubre"""
    
    fecha = date(2025, 10, 18)
    
    print(f"\n{'='*60}")
    print(f"📊 REVISANDO PLANEACIÓN - {fecha}")
    print(f"{'='*60}\n")
    
    # Buscar registros
    planeaciones = Planeacion.objects.filter(fecha=fecha)
    
    if not planeaciones.exists():
        print("⚠️ No hay registros en Planeación para esta fecha\n")
        return
    
    print(f"Total registros encontrados: {planeaciones.count()}\n")
    
    print("ANTES DE LIMPIAR:")
    print("-" * 60)
    for p in planeaciones:
        print(f"{p.producto_nombre}:")
        print(f"  Existencias: {p.existencias}")
        print(f"  Solicitadas: {p.solicitadas}")
        print(f"  Pedidos: {p.pedidos} ← SERÁ PUESTO EN 0")
        print(f"  Total: {p.total}")
        print()
    
    # Confirmar
    respuesta = input("¿Confirmas que quieres poner en 0 la columna pedidos? (si/no): ")
    
    if respuesta.lower() != 'si':
        print("\n❌ Operación cancelada\n")
        return
    
    print(f"\n{'='*60}")
    print(f"🔄 LIMPIANDO COLUMNA PEDIDOS")
    print(f"{'='*60}\n")
    
    with transaction.atomic():
        for p in planeaciones:
            pedidos_antes = p.pedidos
            total_antes = p.total
            
            p.pedidos = 0
            p.save()  # El total se recalcula automáticamente
            
            print(f"✅ {p.producto_nombre}:")
            print(f"   Pedidos: {pedidos_antes} → {p.pedidos}")
            print(f"   Total: {total_antes} → {p.total}")
            print()
    
    print(f"{'='*60}")
    print(f"✅ LIMPIEZA COMPLETADA")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    limpiar_planeacion()
