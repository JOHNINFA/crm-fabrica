#!/usr/bin/env python3
"""
Script para debuggear completamente el problema de ID4
"""

import os
import sys
import django

# Configurar Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import CargueID4

def debug_id4_completo():
    """Debug completo de ID4"""
    
    fecha = "2025-09-27"
    dia = "SABADO"
    
    print(f"🔍 DEBUG COMPLETO ID4")
    print(f"Fecha: {fecha}")
    print(f"Día: {dia}")
    print("=" * 60)
    
    # 1. Todos los registros para esa fecha
    registros_fecha = CargueID4.objects.filter(fecha=fecha)
    print(f"📅 Registros con fecha {fecha}: {registros_fecha.count()}")
    
    for i, registro in enumerate(registros_fecha):
        print(f"\n--- Registro {i+1} ---")
        print(f"ID: {registro.id}")
        print(f"Día: {registro.dia}")
        print(f"Responsable: {registro.responsable}")
        print(f"Producto: {registro.producto}")
        print(f"Concepto: '{registro.concepto}'")
        print(f"Descuentos: {registro.descuentos}")
        print(f"Nequi: {registro.nequi}")
        print(f"Daviplata: {registro.daviplata}")
        print(f"Base Caja: {registro.base_caja}")
        print(f"Activo: {registro.activo}")
        print(f"Fecha creación: {registro.fecha_creacion}")
        print(f"Fecha actualización: {registro.fecha_actualizacion}")
    
    # 2. Filtro exacto como en el endpoint
    registros_exactos = CargueID4.objects.filter(dia=dia.upper(), fecha=fecha).order_by('-fecha', '-fecha_actualizacion')
    print(f"\n🎯 Registros con filtro exacto (día={dia}, fecha={fecha}): {registros_exactos.count()}")
    
    for i, registro in enumerate(registros_exactos):
        print(f"\n--- Registro exacto {i+1} ---")
        print(f"ID: {registro.id}")
        print(f"Concepto: '{registro.concepto}'")
        print(f"Descuentos: {registro.descuentos}")
        print(f"Nequi: {registro.nequi}")
        print(f"Daviplata: {registro.daviplata}")
    
    # 3. Buscar el registro específico con concepto "GASTO"
    registro_gasto = CargueID4.objects.filter(fecha=fecha, concepto="GASTO").first()
    if registro_gasto:
        print(f"\n💰 REGISTRO CON CONCEPTO 'GASTO' ENCONTRADO:")
        print(f"ID: {registro_gasto.id}")
        print(f"Día: {registro_gasto.dia}")
        print(f"Descuentos: {registro_gasto.descuentos}")
        print(f"Nequi: {registro_gasto.nequi}")
        print(f"Daviplata: {registro_gasto.daviplata}")
    else:
        print(f"\n❌ NO se encontró registro con concepto 'GASTO' para fecha {fecha}")
    
    # 4. Verificar si hay registros duplicados o con diferentes responsables
    responsables = CargueID4.objects.filter(fecha=fecha).values_list('responsable', flat=True).distinct()
    print(f"\n👤 Responsables únicos para fecha {fecha}: {list(responsables)}")
    
    productos = CargueID4.objects.filter(fecha=fecha).values_list('producto', flat=True).distinct()
    print(f"📦 Productos únicos para fecha {fecha}: {list(productos)}")

if __name__ == "__main__":
    debug_id4_completo()