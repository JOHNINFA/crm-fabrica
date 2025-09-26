#!/usr/bin/env python3
# 🧪 EJECUTAR TEST COMPLETO - VERIFICAR TODOS LOS IDS Y PRODUCCIÓN

import os
import sys
import django
import requests
import json
from datetime import datetime

# Configurar Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

API_URL = 'http://localhost:8000/api'

class TestCompleto:
    
    def __init__(self):
        self.resultados = {
            'exitosos': [],
            'fallidos': [],
            'total': 0
        }
        
        # Datos de prueba para cada ID
        self.datos_prueba = {
            'ID1': {
                'endpoint': 'cargue-id1',
                'datos': {
                    'dia': 'LUNES',
                    'fecha': '2025-09-24',
                    'usuario': 'TEST_ID1',
                    'activo': True,
                    'producto': 'AREPA TIPO OBLEA 500Gr',
                    'cantidad': 10,
                    'dctos': 1,
                    'adicional': 0,
                    'devoluciones': 2,
                    'vencidas': 1,
                    'valor': 1625.00,
                    'v': True,
                    'd': True,
                    'lotes_vencidos': '[{"lote": "12345", "motivo": "HONGO"}]',
                    'concepto': 'Gasolina',
                    'descuentos': 5000.00,
                    'nequi': 15000.00,
                    'daviplata': 10000.00,
                    'base_caja': 50000.00,
                    'total_despacho': 162500.00,
                    'total_pedidos': 150000.00,
                    'total_dctos': 5000.00,
                    'venta': 145000.00,
                    'total_efectivo': 140000.00,
                    'licencia_transporte': 'C',
                    'soat': 'C',
                    'uniforme': 'NC'
                }
            },
            'ID2': {
                'endpoint': 'cargue-id2',
                'datos': {
                    'dia': 'MARTES',
                    'fecha': '2025-09-24',
                    'usuario': 'TEST_ID2',
                    'activo': True,
                    'producto': 'AREPA TIPO OBLEA 1000Gr',
                    'cantidad': 8,
                    'dctos': 0,
                    'adicional': 1,
                    'devoluciones': 1,
                    'vencidas': 0,
                    'valor': 3200.00,
                    'v': True,
                    'd': False,
                    'lotes_vencidos': '[]',
                    'concepto': 'Combustible',
                    'descuentos': 3000.00,
                    'nequi': 20000.00,
                    'daviplata': 5000.00,
                    'base_caja': 30000.00,
                    'total_despacho': 256000.00,
                    'total_pedidos': 250000.00,
                    'total_dctos': 3000.00,
                    'venta': 247000.00,
                    'total_efectivo': 244000.00,
                    'licencia_transporte': 'C',
                    'soat': 'NC',
                    'uniforme': 'C'
                }
            },
            'ID3': {
                'endpoint': 'cargue-id3',
                'datos': {
                    'dia': 'MIERCOLES',
                    'fecha': '2025-09-24',
                    'usuario': 'TEST_ID3',
                    'activo': True,
                    'producto': 'ALMOJABANA 500Gr',
                    'cantidad': 15,
                    'dctos': 2,
                    'adicional': 0,
                    'devoluciones': 0,
                    'vencidas': 1,
                    'valor': 2800.00,
                    'v': False,
                    'd': True,
                    'lotes_vencidos': '[{"lote": "67890", "motivo": "FVTO"}]',
                    'concepto': '',
                    'descuentos': 0.00,
                    'nequi': 0.00,
                    'daviplata': 0.00,
                    'base_caja': 25000.00,
                    'total_despacho': 336000.00,
                    'total_pedidos': 320000.00,
                    'total_dctos': 0.00,
                    'venta': 320000.00,
                    'total_efectivo': 295000.00,
                    'licencia_transporte': 'NC',
                    'soat': 'C',
                    'uniforme': 'C'
                }
            },
            'ID4': {
                'endpoint': 'cargue-id4',
                'datos': {
                    'dia': 'JUEVES',
                    'fecha': '2025-09-24',
                    'usuario': 'TEST_ID4',
                    'activo': True,
                    'producto': 'BUÑUELO 500Gr',
                    'cantidad': 12,
                    'dctos': 1,
                    'adicional': 2,
                    'devoluciones': 1,
                    'vencidas': 0,
                    'valor': 2500.00,
                    'v': True,
                    'd': True,
                    'lotes_vencidos': '[]',
                    'concepto': 'Mantenimiento',
                    'descuentos': 8000.00,
                    'nequi': 12000.00,
                    'daviplata': 18000.00,
                    'base_caja': 40000.00,
                    'total_despacho': 300000.00,
                    'total_pedidos': 280000.00,
                    'total_dctos': 8000.00,
                    'venta': 272000.00,
                    'total_efectivo': 232000.00,
                    'licencia_transporte': 'C',
                    'soat': 'C',
                    'uniforme': 'NC'
                }
            },
            'ID5': {
                'endpoint': 'cargue-id5',
                'datos': {
                    'dia': 'VIERNES',
                    'fecha': '2025-09-24',
                    'usuario': 'TEST_ID5',
                    'activo': True,
                    'producto': 'PANDEBONO 500Gr',
                    'cantidad': 20,
                    'dctos': 0,
                    'adicional': 0,
                    'devoluciones': 3,
                    'vencidas': 2,
                    'valor': 3500.00,
                    'v': True,
                    'd': False,
                    'lotes_vencidos': '[{"lote": "11111", "motivo": "HONGO"}, {"lote": "22222", "motivo": "SELLADO"}]',
                    'concepto': 'Varios',
                    'descuentos': 2000.00,
                    'nequi': 25000.00,
                    'daviplata': 15000.00,
                    'base_caja': 60000.00,
                    'total_despacho': 525000.00,
                    'total_pedidos': 500000.00,
                    'total_dctos': 2000.00,
                    'venta': 498000.00,
                    'total_efectivo': 438000.00,
                    'licencia_transporte': 'C',
                    'soat': 'NC',
                    'uniforme': 'C'
                }
            },
            'ID6': {
                'endpoint': 'cargue-id6',
                'datos': {
                    'dia': 'SABADO',
                    'fecha': '2025-09-24',
                    'usuario': 'TEST_ID6',
                    'activo': True,
                    'producto': 'ROSCON 500Gr',
                    'cantidad': 6,
                    'dctos': 1,
                    'adicional': 1,
                    'devoluciones': 0,
                    'vencidas': 1,
                    'valor': 4000.00,
                    'v': False,
                    'd': False,
                    'lotes_vencidos': '[{"lote": "33333", "motivo": "FVTO"}]',
                    'concepto': '',
                    'descuentos': 0.00,
                    'nequi': 0.00,
                    'daviplata': 0.00,
                    'base_caja': 20000.00,
                    'total_despacho': 200000.00,
                    'total_pedidos': 180000.00,
                    'total_dctos': 0.00,
                    'venta': 180000.00,
                    'total_efectivo': 160000.00,
                    'licencia_transporte': 'NC',
                    'soat': 'C',
                    'uniforme': 'NC'
                }
            }
        }
        
        # Datos de prueba para producción
        self.datos_produccion = [
            {
                'fecha': '2025-09-24',
                'producto': 'AREPA TIPO OBLEA 500Gr',
                'cantidad': 100,
                'lote': 'PROD001',
                'congelado': False,
                'usuario': 'TEST_PRODUCCION'
            },
            {
                'fecha': '2025-09-24',
                'producto': 'ALMOJABANA 500Gr',
                'cantidad': 80,
                'lote': 'PROD002',
                'congelado': False,
                'usuario': 'TEST_PRODUCCION'
            },
            {
                'fecha': '2025-09-24',
                'producto': 'BUÑUELO 500Gr',
                'cantidad': 60,
                'lote': 'PROD003',
                'congelado': False,
                'usuario': 'TEST_PRODUCCION'
            }
        ]

    def test_conectividad(self):
        """Test de conectividad con todos los endpoints"""
        print("🔌 ===== TEST DE CONECTIVIDAD =====")
        
        endpoints = [
            'cargue-id1', 'cargue-id2', 'cargue-id3', 
            'cargue-id4', 'cargue-id5', 'cargue-id6', 
            'produccion'
        ]
        
        conectados = 0
        
        for endpoint in endpoints:
            try:
                response = requests.get(f"{API_URL}/{endpoint}/", timeout=5)
                if response.status_code == 200:
                    print(f"✅ {endpoint}: Conectado")
                    conectados += 1
                else:
                    print(f"❌ {endpoint}: Error {response.status_code}")
            except Exception as e:
                print(f"❌ {endpoint}: Sin conexión - {str(e)}")
        
        porcentaje = round((conectados / len(endpoints)) * 100)
        print(f"📊 Conectividad: {conectados}/{len(endpoints)} endpoints ({porcentaje}%)")
        
        return conectados == len(endpoints)

    def test_id(self, id_vendedor):
        """Test individual para un ID específico"""
        print(f"\n🧪 ===== TESTEANDO {id_vendedor} =====")
        
        try:
            config = self.datos_prueba[id_vendedor]
            endpoint = config['endpoint']
            datos = config['datos']
            
            print(f"📤 Enviando datos para {id_vendedor} a /{endpoint}/")
            
            # Limpiar datos de prueba anteriores
            try:
                cleanup_response = requests.delete(f"{API_URL}/{endpoint}/?usuario=TEST_{id_vendedor[-1]}")
            except:
                pass  # Ignorar errores de limpieza
            
            # Enviar datos
            response = requests.post(
                f"{API_URL}/{endpoint}/",
                json=datos,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                resultado = response.json()
                print(f"✅ {id_vendedor}: Guardado exitosamente (ID: {resultado.get('id', 'N/A')})")
                
                # Verificar campos calculados
                if 'total' in resultado:
                    total_esperado = datos['cantidad'] - datos['dctos'] + datos['adicional'] - datos['devoluciones'] - datos['vencidas']
                    if resultado['total'] == total_esperado:
                        print(f"✅ {id_vendedor}: Total calculado correctamente ({resultado['total']})")
                    else:
                        print(f"⚠️ {id_vendedor}: Total incorrecto. Esperado: {total_esperado}, Obtenido: {resultado['total']}")
                
                if 'neto' in resultado:
                    neto_esperado = resultado['total'] * datos['valor']
                    if abs(float(resultado['neto']) - neto_esperado) < 0.01:  # Tolerancia para decimales
                        print(f"✅ {id_vendedor}: Neto calculado correctamente ({resultado['neto']})")
                    else:
                        print(f"⚠️ {id_vendedor}: Neto incorrecto. Esperado: {neto_esperado}, Obtenido: {resultado['neto']}")
                
                # Verificar que se guardó consultando la API
                self.verificar_guardado(id_vendedor, endpoint, datos)
                
                return True
                
            else:
                print(f"❌ {id_vendedor}: Error {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Detalle: {error_detail}")
                except:
                    print(f"   Detalle: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ {id_vendedor}: Excepción - {str(e)}")
            return False

    def verificar_guardado(self, id_vendedor, endpoint, datos_originales):
        """Verificar que los datos se guardaron correctamente"""
        try:
            response = requests.get(
                f"{API_URL}/{endpoint}/",
                params={
                    'dia': datos_originales['dia'],
                    'fecha': datos_originales['fecha'],
                    'usuario': datos_originales['usuario']
                },
                timeout=5
            )
            
            if response.status_code == 200:
                datos = response.json()
                if len(datos) > 0:
                    print(f"✅ {id_vendedor}: Verificación exitosa - {len(datos)} registros encontrados")
                    return True
                else:
                    print(f"⚠️ {id_vendedor}: No se encontraron registros en la verificación")
                    return False
            else:
                print(f"⚠️ {id_vendedor}: Error en verificación - {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ {id_vendedor}: Error verificando - {str(e)}")
            return False

    def test_produccion(self):
        """Test del módulo de producción"""
        print(f"\n🏭 ===== TESTEANDO PRODUCCIÓN =====")
        
        try:
            exitosos = 0
            ids_creados = []
            
            # Limpiar datos de prueba anteriores
            try:
                cleanup_response = requests.delete(f"{API_URL}/produccion/?usuario=TEST_PRODUCCION")
            except:
                pass
            
            for i, item in enumerate(self.datos_produccion):
                print(f"📤 Enviando item {i+1}: {item['producto']}")
                
                response = requests.post(
                    f"{API_URL}/produccion/",
                    json=item,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code in [200, 201]:
                    resultado = response.json()
                    ids_creados.append(resultado.get('id'))
                    print(f"✅ {item['producto']}: Guardado (ID: {resultado.get('id', 'N/A')})")
                    exitosos += 1
                else:
                    print(f"❌ {item['producto']}: Error {response.status_code}")
                    try:
                        error_detail = response.json()
                        print(f"   Detalle: {error_detail}")
                    except:
                        print(f"   Detalle: {response.text}")
            
            # Test de función congelar si se crearon items
            if ids_creados and ids_creados[0]:
                print(f"\n🧊 Testeando función congelar con ID: {ids_creados[0]}")
                
                congelar_response = requests.post(
                    f"{API_URL}/produccion/{ids_creados[0]}/congelar/",
                    json={'usuario': 'TEST_CONGELADO'},
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if congelar_response.status_code == 200:
                    congelar_resultado = congelar_response.json()
                    print(f"✅ Función congelar exitosa")
                    print(f"   Congelado: {congelar_resultado.get('congelado', 'N/A')}")
                    print(f"   Fecha congelado: {congelar_resultado.get('fecha_congelado', 'N/A')}")
                else:
                    print(f"⚠️ Error en función congelar: {congelar_response.status_code}")
            
            print(f"📊 Producción: {exitosos}/{len(self.datos_produccion)} items guardados")
            return exitosos == len(self.datos_produccion)
            
        except Exception as e:
            print(f"❌ Error en test de producción: {str(e)}")
            return False

    def ejecutar_test_completo(self):
        """Ejecutar test completo de todos los componentes"""
        print("🚀 ===== INICIANDO TEST COMPLETO DEL FRONTEND =====")
        print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        # 1. Test de conectividad
        conectividad_ok = self.test_conectividad()
        
        if not conectividad_ok:
            print("\n❌ ABORTANDO: Problemas de conectividad detectados")
            return False
        
        # 2. Test de todos los IDs
        for id_vendedor in ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6']:
            exito = self.test_id(id_vendedor)
            if exito:
                self.resultados['exitosos'].append(id_vendedor)
            else:
                self.resultados['fallidos'].append(id_vendedor)
            self.resultados['total'] += 1
        
        # 3. Test de producción
        exito_produccion = self.test_produccion()
        if exito_produccion:
            self.resultados['exitosos'].append('PRODUCCION')
        else:
            self.resultados['fallidos'].append('PRODUCCION')
        self.resultados['total'] += 1
        
        # 4. Mostrar resumen final
        self.mostrar_resumen_final()
        
        return len(self.resultados['fallidos']) == 0

    def mostrar_resumen_final(self):
        """Mostrar resumen final de todos los tests"""
        print(f"\n🎯 ===== RESUMEN FINAL =====")
        print(f"✅ Exitosos: {len(self.resultados['exitosos'])}/{self.resultados['total']}")
        print(f"❌ Fallidos: {len(self.resultados['fallidos'])}/{self.resultados['total']}")
        
        if self.resultados['exitosos']:
            print(f"🎉 Tests exitosos: {', '.join(self.resultados['exitosos'])}")
        
        if self.resultados['fallidos']:
            print(f"💥 Tests fallidos: {', '.join(self.resultados['fallidos'])}")
        
        porcentaje_exito = round((len(self.resultados['exitosos']) / self.resultados['total']) * 100)
        print(f"📊 Porcentaje de éxito: {porcentaje_exito}%")
        
        if porcentaje_exito == 100:
            print("🏆 ¡PERFECTO! Todos los tests pasaron. El frontend está funcionando correctamente.")
        elif porcentaje_exito >= 80:
            print("⚠️ La mayoría de tests pasaron, pero hay algunos problemas que revisar.")
        else:
            print("❌ Hay problemas significativos que necesitan atención inmediata.")
        
        print("=" * 60)

if __name__ == '__main__':
    test = TestCompleto()
    exito_total = test.ejecutar_test_completo()
    
    # Código de salida para scripts
    sys.exit(0 if exito_total else 1)