#!/usr/bin/env python3
"""
Script para debuggear la carga de datos COMPLETADOS
"""

import os
import sys
import django
from datetime import datetime, date

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import CargueID1

def debug_datos_completados():
    print("🔍 DEBUG: DATOS COMPLETADOS EN BD")
    print("=" * 50)
    
    # Buscar registros recientes
    registros = CargueID1.objects.filter(activo=True).order_by('-fecha_creacion')[:10]
    
    print(f"📊 Total registros encontrados: {registros.count()}")
    
    for registro in registros:
        print(f"\n📦 REGISTRO ID: {registro.id}")
        print(f"   - Día: {registro.dia}")
        print(f"   - Fecha: {registro.fecha}")
        print(f"   - Responsable: {registro.responsable}")
        print(f"   - Producto: {registro.producto}")
        print(f"   - Cantidad: {registro.cantidad}")
        print(f"   - Total: {registro.total}")
        print(f"   - Valor: {registro.valor}")
        print(f"   - Neto: {registro.neto}")
        print(f"   - V: {registro.v}")
        print(f"   - D: {registro.d}")
        
        # Datos de pagos
        if registro.concepto or registro.nequi or registro.daviplata:
            print(f"   💰 PAGOS:")
            print(f"      - Concepto: {registro.concepto}")
            print(f"      - Descuentos: ${registro.descuentos}")
            print(f"      - Nequi: ${registro.nequi}")
            print(f"      - Daviplata: ${registro.daviplata}")
        
        # Datos de resumen
        if registro.base_caja or registro.total_despacho:
            print(f"   📊 RESUMEN:")
            print(f"      - Base caja: ${registro.base_caja}")
            print(f"      - Total despacho: ${registro.total_despacho}")
            print(f"      - Venta: ${registro.venta}")
        
        # Datos de cumplimiento
        cumplimiento = []
        if registro.licencia_transporte: cumplimiento.append(f"Licencia: {registro.licencia_transporte}")
        if registro.soat: cumplimiento.append(f"SOAT: {registro.soat}")
        if registro.uniforme: cumplimiento.append(f"Uniforme: {registro.uniforme}")
        
        if cumplimiento:
            print(f"   ✅ CUMPLIMIENTO: {', '.join(cumplimiento)}")

def simular_consulta_api():
    print("\n🌐 SIMULANDO CONSULTA API")
    print("=" * 30)
    
    # Simular la consulta que hace el frontend
    dia = "LUNES"
    fecha = "2025-09-22"  # ✅ Usar la fecha que realmente está en BD
    
    print(f"📅 Consultando: {dia} - {fecha}")
    
    registros = CargueID1.objects.filter(
        dia=dia.upper(),
        fecha=fecha,
        activo=True
    )
    
    print(f"📊 Registros encontrados: {registros.count()}")
    
    if registros.exists():
        print("\n📦 DATOS QUE RECIBIRÍA EL FRONTEND:")
        for registro in registros:
            print(f"   - {registro.producto}: {registro.cantidad} und")
            print(f"     Total: {registro.total}, Valor: ${registro.valor}, Neto: ${registro.neto}")
            print(f"     V: {registro.v}, D: {registro.d}")
    else:
        print("❌ No se encontraron registros para esa fecha/día")
        
        # Mostrar fechas disponibles
        fechas_disponibles = CargueID1.objects.filter(activo=True).values_list('dia', 'fecha').distinct()
        print("\n📅 Fechas disponibles en BD:")
        for dia_bd, fecha_bd in fechas_disponibles:
            print(f"   - {dia_bd}: {fecha_bd}")

if __name__ == "__main__":
    debug_datos_completados()
    simular_consulta_api()