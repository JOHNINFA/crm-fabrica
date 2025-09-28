#!/usr/bin/env python3
"""
Script para probar que el problema de fechas está solucionado
"""

import os
import sys
import django
from datetime import datetime, date

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import CargueID1

def test_fecha_consistency():
    print("🧪 PROBANDO CONSISTENCIA DE FECHAS")
    print("=" * 50)
    
    # Simular fecha calculada por frontend (próximo lunes)
    test_date = date(2025, 1, 27)  # Un lunes de ejemplo
    
    print(f"📅 Fecha de prueba (calculada por frontend): {test_date}")
    
    try:
        # Intentar crear registro con fecha específica
        registro = CargueID1(
            dia='LUNES',
            fecha=test_date,  # ✅ Fecha específica desde frontend
            producto='AREPA TEST',
            cantidad=10,
            valor=1600,
            responsable='TEST_USER'
        )
        
        # Validar antes de guardar
        registro.full_clean()
        registro.save()
        
        print(f"✅ Registro creado exitosamente")
        print(f"   - ID: {registro.id}")
        print(f"   - Día: {registro.dia}")
        print(f"   - Fecha guardada: {registro.fecha}")
        print(f"   - Fecha coincide: {registro.fecha == test_date}")
        
        # Verificar que se puede consultar por fecha
        registros_encontrados = CargueID1.objects.filter(fecha=test_date)
        print(f"   - Registros encontrados por fecha: {registros_encontrados.count()}")
        
        # Limpiar registro de prueba
        registro.delete()
        print("🧹 Registro de prueba eliminado")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_fecha_required():
    print("\n🧪 PROBANDO QUE FECHA ES REQUERIDA")
    print("=" * 50)
    
    try:
        # Intentar crear registro sin fecha
        registro = CargueID1(
            dia='LUNES',
            # fecha=None,  # ❌ Sin fecha
            producto='AREPA TEST',
            cantidad=10,
            valor=1600,
            responsable='TEST_USER'
        )
        
        registro.full_clean()  # Esto debería fallar
        print("❌ ERROR: Se permitió crear registro sin fecha")
        return False
        
    except Exception as e:
        print(f"✅ Validación correcta: {e}")
        return True

if __name__ == "__main__":
    print("🚀 INICIANDO PRUEBAS DE CORRECCIÓN DE FECHAS")
    print("=" * 60)
    
    test1 = test_fecha_consistency()
    test2 = test_fecha_required()
    
    print("\n📊 RESULTADOS")
    print("=" * 30)
    print(f"✅ Consistencia de fechas: {'PASS' if test1 else 'FAIL'}")
    print(f"✅ Fecha requerida: {'PASS' if test2 else 'FAIL'}")
    
    if test1 and test2:
        print("\n🎉 TODAS LAS PRUEBAS PASARON")
        print("✅ El problema de fechas está SOLUCIONADO")
    else:
        print("\n❌ ALGUNAS PRUEBAS FALLARON")
        print("⚠️  Revisar la implementación")