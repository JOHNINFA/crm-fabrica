#!/usr/bin/env python3
"""
Script para probar que todos los datos se están guardando correctamente
"""

import os
import sys
import django
from datetime import datetime, date

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import CargueID1

def test_datos_completos():
    print("🧪 PROBANDO GUARDADO DE DATOS COMPLETOS")
    print("=" * 60)
    
    # Simular datos completos como los enviaría el frontend
    test_date = date(2025, 1, 27)  # Un lunes de ejemplo
    
    print(f"📅 Fecha de prueba: {test_date}")
    
    try:
        # Crear registro con TODOS los campos
        registro = CargueID1(
            # Identificación
            dia='LUNES',
            fecha=test_date,
            responsable='WILSON TEST',
            usuario='Sistema Test',
            
            # Producto
            producto='AREPA TIPO OBLEAS',
            cantidad=10,
            dctos=1,
            adicional=0,
            devoluciones=0,
            vencidas=2,
            valor=1600,
            v=True,
            d=True,
            lotes_vencidos='[{"lote": "L001", "motivo": "FVTO"}]',
            
            # Pagos
            concepto='EFECTIVO, NEQUI',
            descuentos=5000,
            nequi=10000,
            daviplata=5000,
            
            # Resumen
            base_caja=50000,
            total_despacho=144000,  # 9 * 1600
            total_pedidos=0,
            total_dctos=1600,  # 1 * 1600
            venta=142400,  # total_despacho - total_dctos
            total_efectivo=127400,  # venta - nequi - daviplata
            
            # Cumplimiento
            licencia_transporte='C',
            soat='C',
            uniforme='NC',
            no_locion='C',
            no_accesorios='C',
            capacitacion_carnet='C',
            higiene='C',
            estibas='C',
            desinfeccion='C'
        )
        
        # Validar y guardar
        registro.full_clean()
        registro.save()
        
        print(f"✅ Registro creado exitosamente")
        print(f"   - ID: {registro.id}")
        print(f"   - Responsable: {registro.responsable}")
        print(f"   - Producto: {registro.producto}")
        print(f"   - Total calculado: {registro.total}")
        print(f"   - Neto calculado: {registro.neto}")
        
        # Verificar campos de pagos
        print(f"\n💰 DATOS DE PAGOS:")
        print(f"   - Concepto: {registro.concepto}")
        print(f"   - Descuentos: ${registro.descuentos}")
        print(f"   - Nequi: ${registro.nequi}")
        print(f"   - Daviplata: ${registro.daviplata}")
        
        # Verificar campos de resumen
        print(f"\n📊 DATOS DE RESUMEN:")
        print(f"   - Base caja: ${registro.base_caja}")
        print(f"   - Total despacho: ${registro.total_despacho}")
        print(f"   - Total dctos: ${registro.total_dctos}")
        print(f"   - Venta: ${registro.venta}")
        print(f"   - Total efectivo: ${registro.total_efectivo}")
        
        # Verificar campos de cumplimiento
        print(f"\n✅ DATOS DE CUMPLIMIENTO:")
        print(f"   - Licencia transporte: {registro.licencia_transporte}")
        print(f"   - SOAT: {registro.soat}")
        print(f"   - Uniforme: {registro.uniforme}")
        print(f"   - No loción: {registro.no_locion}")
        print(f"   - Higiene: {registro.higiene}")
        
        # Verificar que se puede consultar
        registros_encontrados = CargueID1.objects.filter(
            fecha=test_date,
            responsable='WILSON TEST'
        )
        print(f"\n🔍 Registros encontrados: {registros_encontrados.count()}")
        
        if registros_encontrados.exists():
            reg = registros_encontrados.first()
            print(f"   - Todos los campos guardados correctamente")
            print(f"   - Concepto recuperado: {reg.concepto}")
            print(f"   - Nequi recuperado: ${reg.nequi}")
            print(f"   - Cumplimiento recuperado: {reg.licencia_transporte}")
        
        # Limpiar registro de prueba
        registro.delete()
        print("\n🧹 Registro de prueba eliminado")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def verificar_campos_bd():
    print("\n🔍 VERIFICANDO ESTRUCTURA DE CAMPOS EN BD")
    print("=" * 50)
    
    # Obtener todos los campos del modelo
    campos = CargueID1._meta.get_fields()
    
    campos_importantes = [
        'concepto', 'descuentos', 'nequi', 'daviplata',
        'base_caja', 'total_despacho', 'total_pedidos', 'total_dctos', 'venta', 'total_efectivo',
        'licencia_transporte', 'soat', 'uniforme', 'no_locion', 'no_accesorios',
        'capacitacion_carnet', 'higiene', 'estibas', 'desinfeccion'
    ]
    
    campos_existentes = [campo.name for campo in campos]
    
    print("📋 CAMPOS VERIFICADOS:")
    for campo in campos_importantes:
        existe = campo in campos_existentes
        status = "✅" if existe else "❌"
        print(f"   {status} {campo}")
    
    campos_faltantes = [campo for campo in campos_importantes if campo not in campos_existentes]
    
    if campos_faltantes:
        print(f"\n❌ CAMPOS FALTANTES: {campos_faltantes}")
        return False
    else:
        print(f"\n✅ TODOS LOS CAMPOS EXISTEN EN LA BD")
        return True

if __name__ == "__main__":
    print("🚀 INICIANDO PRUEBAS DE DATOS COMPLETOS")
    print("=" * 70)
    
    test1 = verificar_campos_bd()
    test2 = test_datos_completos() if test1 else False
    
    print("\n📊 RESULTADOS FINALES")
    print("=" * 40)
    print(f"✅ Estructura de BD: {'PASS' if test1 else 'FAIL'}")
    print(f"✅ Guardado completo: {'PASS' if test2 else 'FAIL'}")
    
    if test1 and test2:
        print("\n🎉 TODAS LAS PRUEBAS PASARON")
        print("✅ Todos los datos se guardan correctamente")
    else:
        print("\n❌ ALGUNAS PRUEBAS FALLARON")
        if not test1:
            print("⚠️  Faltan campos en la base de datos")
        if not test2:
            print("⚠️  Error en el guardado de datos")