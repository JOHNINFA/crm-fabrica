#!/usr/bin/env python3
# 🧪 TEST - Verificar endpoints específicos de ResumenVentas

import requests
import json
from datetime import datetime

def test_endpoints_resumen():
    """Probar endpoints específicos para cada ID"""
    
    base_url = "http://localhost:8000/api"
    dia = "MARTES"
    fecha = "2025-09-23"
    
    endpoints = [
        ("ID1", "cargue-id1"),
        ("ID2", "cargue-id2"),
        ("ID3", "cargue-id3"),
        ("ID4", "cargue-id4"),
        ("ID5", "cargue-id5"),
        ("ID6", "cargue-id6")
    ]
    
    print("🧪 PROBANDO endpoints específicos de ResumenVentas...")
    print(f"📅 Día: {dia}, Fecha: {fecha}\n")
    
    resultados = {}
    
    for id_vendedor, endpoint in endpoints:
        print(f"🔍 Probando {id_vendedor} ({endpoint})...")
        
        url = f"{base_url}/{endpoint}/?dia={dia}&fecha={fecha}"
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    print(f"   ✅ Respuesta: {len(data)} registros")
                    
                    # Analizar datos de conceptos y base_caja
                    conceptos_encontrados = []
                    base_caja_encontrada = None
                    
                    for item in data:
                        if item.get('concepto') and item['concepto'].strip():
                            conceptos_encontrados.append({
                                'concepto': item['concepto'],
                                'descuentos': item.get('descuentos', 0),
                                'nequi': item.get('nequi', 0),
                                'daviplata': item.get('daviplata', 0)
                            })
                        
                        if item.get('base_caja') and float(item['base_caja']) > 0:
                            base_caja_encontrada = item['base_caja']
                    
                    print(f"   📋 Conceptos encontrados: {len(conceptos_encontrados)}")
                    for concepto in conceptos_encontrados[:3]:  # Mostrar solo los primeros 3
                        print(f"      - {concepto['concepto']}: D={concepto['descuentos']}, N={concepto['nequi']}, Dv={concepto['daviplata']}")
                    
                    if base_caja_encontrada:
                        print(f"   💰 Base caja: {base_caja_encontrada}")
                    else:
                        print(f"   💰 Base caja: No encontrada")
                    
                    resultados[id_vendedor] = {
                        'status': 'success',
                        'registros': len(data),
                        'conceptos': conceptos_encontrados,
                        'base_caja': base_caja_encontrada
                    }
                    
                else:
                    print(f"   ⚠️ Formato inesperado: {type(data)}")
                    resultados[id_vendedor] = {
                        'status': 'unexpected_format',
                        'data': str(data)[:100]
                    }
            else:
                print(f"   ❌ Error HTTP: {response.status_code}")
                resultados[id_vendedor] = {
                    'status': 'http_error',
                    'code': response.status_code
                }
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Error de conexión: {e}")
            resultados[id_vendedor] = {
                'status': 'connection_error',
                'error': str(e)
            }
        
        print()
    
    # Resumen final
    print("📊 RESUMEN DE RESULTADOS:")
    print("=" * 50)
    
    for id_vendedor, resultado in resultados.items():
        status = resultado['status']
        
        if status == 'success':
            registros = resultado['registros']
            conceptos = len(resultado['conceptos'])
            base_caja = resultado['base_caja'] or 'No'
            
            print(f"{id_vendedor}: ✅ {registros} registros, {conceptos} conceptos, Base caja: {base_caja}")
        else:
            print(f"{id_vendedor}: ❌ {status}")
    
    print("\n🎯 CONCLUSIONES:")
    
    # Verificar si hay datos específicos por ID
    ids_con_datos = [id_v for id_v, res in resultados.items() if res['status'] == 'success' and res['registros'] > 0]
    ids_con_conceptos = [id_v for id_v, res in resultados.items() if res['status'] == 'success' and len(res['conceptos']) > 0]
    
    if len(ids_con_datos) > 0:
        print(f"✅ {len(ids_con_datos)} IDs tienen datos: {', '.join(ids_con_datos)}")
    else:
        print("❌ Ningún ID tiene datos")
    
    if len(ids_con_conceptos) > 0:
        print(f"✅ {len(ids_con_conceptos)} IDs tienen conceptos: {', '.join(ids_con_conceptos)}")
    else:
        print("❌ Ningún ID tiene conceptos")
    
    # Verificar independencia de datos
    conceptos_por_id = {}
    for id_vendedor, resultado in resultados.items():
        if resultado['status'] == 'success':
            conceptos_por_id[id_vendedor] = [c['concepto'] for c in resultado['conceptos']]
    
    if len(conceptos_por_id) > 1:
        conceptos_unicos = set()
        for conceptos in conceptos_por_id.values():
            conceptos_unicos.update(conceptos)
        
        total_conceptos = sum(len(conceptos) for conceptos in conceptos_por_id.values())
        
        if len(conceptos_unicos) == total_conceptos:
            print("✅ Los conceptos son únicos por ID (datos independientes)")
        else:
            print("⚠️ Hay conceptos repetidos entre IDs")
            
            # Mostrar detalles
            for id_vendedor, conceptos in conceptos_por_id.items():
                if conceptos:
                    print(f"   {id_vendedor}: {conceptos}")
    
    return resultados

if __name__ == "__main__":
    try:
        resultados = test_endpoints_resumen()
        print(f"\n🎉 Test completado a las {datetime.now().strftime('%H:%M:%S')}")
    except Exception as e:
        print(f"❌ Error ejecutando test: {e}")