#!/usr/bin/env python3
"""
Script de Migración de Datos: Tablas Antiguas → Tablas Normalizadas
Migra datos de api_cargueid1-6 a las nuevas tablas normalizadas

Autor: Sistema
Fecha: 2025-12-03
"""

import os
import django
import sys
from datetime import datetime

# Configurar Django
sys.path.append('/home/john/Escritorio/crm-fabrica')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import (
    CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6,
    CargueProductos, CargueResumen, CarguePagos, CargueCumplimiento
)
from django.db import transaction

# Mapeo de modelos antiguos
MODELOS_ANTIGUOS = {
    'ID1': CargueID1,
    'ID2': CargueID2,
    'ID3': CargueID3,
    'ID4': CargueID4,
    'ID5': CargueID5,
    'ID6': CargueID6,
}

def migrar_vendedor(vendedor_id, Modelo):
    """Migrar todos los datos de un vendedor específico"""
    print(f"\n{'='*80}")
    print(f"🔄 Migrando {vendedor_id}...")
    print(f"{'='*80}\n")
    
    # Obtener todos los registros
    registros = Modelo.objects.all().order_by('fecha', 'dia', 'producto')
    total_registros = registros.count()
    print(f"📊 Total de registros a migrar: {total_registros}")
    
    if total_registros == 0:
        print(f"⚠️ No hay datos para {vendedor_id}")
        return
    
    # Agrupar por (dia, fecha) para procesar día por día
    dias_unicos = {}
    for reg in registros:
        key = (reg.dia, reg.fecha)
        if key not in dias_unicos:
            dias_unicos[key] = []
        dias_unicos[key].append(reg)
    
    print(f"📅 Días únicos encontrados: {len(dias_unicos)}")
    
    stats = {
        'productos': 0,
        'resumenes': 0,
        'pagos': 0,
        'cumplimientos': 0,
        'errores': 0
    }
    
    for (dia, fecha), registros_dia in dias_unicos.items():
        print(f"\n🗓️ Procesando: {dia} {fecha} ({len(registros_dia)} productos)")
        
        with transaction.atomic():
            try:
                # 1. MIGRAR PRODUCTOS
                for reg in registros_dia:
                    producto, created = CargueProductos.objects.update_or_create(
                        vendedor_id=vendedor_id,
                        dia=dia,
                        fecha=fecha,
                        producto=reg.producto,
                        defaults={
                            'cantidad': reg.cantidad or 0,
                            'dctos': reg.dctos or 0,
                            'adicional': reg.adicional or 0,
                            'devoluciones': reg.devoluciones or 0,
                            'vencidas': reg.vencidas or 0,
                            'total': reg.total or 0,
                            'valor': reg.valor or 0,
                            'neto': reg.neto or 0,
                            'v': reg.v,
                            'd': reg.d,
                            'lotes_vencidos': reg.lotes_vencidos or '',
                            'lotes_produccion': reg.lotes_produccion or '',
                            'responsable': reg.responsable or 'Sistema',
                            'usuario': reg.usuario or 'Sistema',
                            'ruta': reg.ruta or '',
                            'activo': reg.activo,
                            'fecha_creacion': reg.fecha_creacion,
                            'fecha_actualizacion': reg.fecha_actualizacion,
                        }
                    )
                    stats['productos'] += 1
                
                # 2. MIGRAR RESUMEN (tomar del primer registro)
                primer_reg = registros_dia[0]
                resumen, created = CargueResumen.objects.update_or_create(
                    vendedor_id=vendedor_id,
                    dia=dia,
                    fecha=fecha,
                    defaults={
                        'base_caja': primer_reg.base_caja or 0,
                        'total_despacho': primer_reg.total_despacho or 0,
                        'total_pedidos': primer_reg.total_pedidos or 0,
                        'total_dctos': primer_reg.total_dctos or 0,
                        'venta': primer_reg.venta or 0,
                        'total_efectivo': primer_reg.total_efectivo or 0,
                        'usuario': primer_reg.usuario or 'Sistema',
                        'activo': primer_reg.activo,
                        'fecha_creacion': primer_reg.fecha_creacion,
                        'fecha_actualizacion': primer_reg.fecha_actualizacion,
                    }
                )
                stats['resumenes'] += 1
                
                # 3. MIGRAR PAGOS (si tiene concepto)
                if primer_reg.concepto or primer_reg.descuentos or primer_reg.nequi or primer_reg.daviplata:
                    pago, created = CarguePagos.objects.update_or_create(
                        vendedor_id=vendedor_id,
                        dia=dia,
                        fecha=fecha,
                        defaults={
                            'concepto': primer_reg.concepto or '',
                            'descuentos': primer_reg.descuentos or 0,
                            'nequi': primer_reg.nequi or 0,
                            'daviplata': primer_reg.daviplata or 0,
                            'usuario': primer_reg.usuario or 'Sistema',
                            'activo': primer_reg.activo,
                            'fecha_creacion': primer_reg.fecha_creacion,
                            'fecha_actualizacion': primer_reg.fecha_actualizacion,
                        }
                    )
                    stats['pagos'] += 1
                
                # 4. MIGRAR CUMPLIMIENTO (si tiene datos)
                tiene_cumplimiento = any([
                    primer_reg.licencia_transporte,
                    primer_reg.soat,
                    primer_reg.uniforme,
                    primer_reg.no_locion,
                    primer_reg.no_accesorios,
                    primer_reg.capacitacion_carnet,
                    primer_reg.higiene,
                    primer_reg.estibas,
                    primer_reg.desinfeccion,
                ])
                
                if tiene_cumplimiento:
                    cumplimiento, created = CargueCumplimiento.objects.update_or_create(
                        vendedor_id=vendedor_id,
                        dia=dia,
                        fecha=fecha,
                        defaults={
                            'licencia_transporte': primer_reg.licencia_transporte,
                            'soat': primer_reg.soat,
                            'uniforme': primer_reg.uniforme,
                            'no_locion': primer_reg.no_locion,
                            'no_accesorios': primer_reg.no_accesorios,
                            'capacitacion_carnet': primer_reg.capacitacion_carnet,
                            'higiene': primer_reg.higiene,
                            'estibas': primer_reg.estibas,
                            'desinfeccion': primer_reg.desinfeccion,
                            'usuario': primer_reg.usuario or 'Sistema',
                            'activo': primer_reg.activo,
                            'fecha_creacion': primer_reg.fecha_creacion,
                            'fecha_actualizacion': primer_reg.fecha_actualizacion,
                        }
                    )
                    stats['cumplimientos'] += 1
                
                print(f"  ✅ Migrado: {len(registros_dia)} productos + 1 resumen")
                
            except Exception as e:
                print(f"  ❌ ERROR en {dia} {fecha}: {e}")
                stats['errores'] += 1
                raise  # Forzar rollback
    
    print(f"\n{'='*80}")
    print(f"✅ Migración completada para {vendedor_id}")
    print(f"{'='*80}")
    print(f"📊 Estadísticas:")
    print(f"   - Productos migrados:    {stats['productos']}")
    print(f"   - Resúmenes creados:     {stats['resumenes']}")
    print(f"   - Pagos creados:         {stats['pagos']}")
    print(f"   - Cumplimientos creados: {stats['cumplimientos']}")
    print(f"   - Errores:               {stats['errores']}")
    print(f"{'='*80}\n")
    
    return stats


def main():
    """Función principal de migración"""
    print("\n" + "="*80)
    print("🚀 MIGRACIÓN DE DATOS: Tablas Antiguas → Tablas Normalizadas")
    print("="*80 + "\n")
    
    inicio = datetime.now()
    
    stats_totales = {
        'productos': 0,
        'resumenes': 0,
        'pagos': 0,
        'cumplimientos': 0,
        'errores': 0
    }
    
    # Migrar cada vendedor
    for vendedor_id, Modelo in MODELOS_ANTIGUOS.items():
        stats = migrar_vendedor(vendedor_id, Modelo)
        if stats:
            for key in stats_totales:
                stats_totales[key] += stats[key]
    
    fin = datetime.now()
    duracion = (fin - inicio).total_seconds()
    
    print("\n" + "="*80)
    print("🎉 MIGRACIÓN COMPLETADA")
    print("="*80)
    print(f"⏱️ Tiempo total: {duracion:.2f} segundos")
    print(f"\n📊 TOTALES GENERALES:")
    print(f"   - Productos migrados:    {stats_totales['productos']}")
    print(f"   - Resúmenes creados:     {stats_totales['resumenes']}")
    print(f"   - Pagos creados:         {stats_totales['pagos']}")
    print(f"   - Cumplimientos creados: {stats_totales['cumplimientos']}")
    print(f"   - Errores:               {stats_totales['errores']}")
    print("="*80 + "\n")
    
    if stats_totales['errores'] > 0:
        print("⚠️  ATENCIÓN: Hubo errores durante la migración.")
        print("   Revisa los logs anteriores para más detalles.")
        return 1
    else:
        print("✅ Migración exitosa sin errores")
        return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️ Migración cancelada por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ ERROR FATAL: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
