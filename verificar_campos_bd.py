#!/usr/bin/env python3
# 🧪 VERIFICADOR DE CAMPOS EN BASE DE DATOS
# Verifica que todos los campos se estén guardando correctamente en las nuevas tablas

import os
import sys
import django
from datetime import datetime

# Configurar Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6, Produccion

class VerificadorCamposBD:
    
    def __init__(self):
        self.modelos = {
            'ID1': CargueID1,
            'ID2': CargueID2, 
            'ID3': CargueID3,
            'ID4': CargueID4,
            'ID5': CargueID5,
            'ID6': CargueID6
        }
        
        self.campos_esperados = [
            # Identificación
            'dia', 'fecha',
            # Checkboxes
            'v', 'd',
            # Productos
            'producto', 'cantidad', 'dctos', 'adicional', 'devoluciones', 
            'vencidas', 'lotes_vencidos', 'total', 'valor', 'neto',
            # Pagos
            'concepto', 'descuentos', 'nequi', 'daviplata',
            # Resumen
            'base_caja', 'total_despacho', 'total_pedidos', 'total_dctos', 
            'venta', 'total_efectivo',
            # Control de cumplimiento
            'licencia_transporte', 'soat', 'uniforme', 'no_locion', 
            'no_accesorios', 'capacitacion_carnet', 'higiene', 'estibas', 'desinfeccion',
            # Metadatos
            'usuario', 'activo', 'fecha_creacion', 'fecha_actualizacion'
        ]
        
        self.campos_produccion = [
            'fecha', 'producto', 'cantidad', 'lote', 'congelado', 
            'fecha_congelado', 'usuario_congelado', 'usuario', 'activo', 
            'fecha_creacion', 'fecha_actualizacion'
        ]

    def verificar_estructura_tablas(self):
        """Verificar que todas las tablas tengan la estructura correcta"""
        print("🔍 ===== VERIFICANDO ESTRUCTURA DE TABLAS =====\n")
        
        resultados = {}
        
        # Verificar tablas de cargue
        for id_vendedor, modelo in self.modelos.items():
            print(f"📋 Verificando tabla para {id_vendedor}...")
            
            # Obtener campos del modelo
            campos_modelo = [field.name for field in modelo._meta.fields]
            
            # Verificar campos esperados
            campos_faltantes = []
            campos_extra = []
            
            for campo in self.campos_esperados:
                if campo not in campos_modelo:
                    campos_faltantes.append(campo)
            
            for campo in campos_modelo:
                if campo not in self.campos_esperados and campo != 'id':
                    campos_extra.append(campo)
            
            resultados[id_vendedor] = {
                'total_campos': len(campos_modelo),
                'campos_faltantes': campos_faltantes,
                'campos_extra': campos_extra,
                'estructura_ok': len(campos_faltantes) == 0
            }
            
            if resultados[id_vendedor]['estructura_ok']:
                print(f"✅ {id_vendedor}: Estructura correcta ({len(campos_modelo)} campos)")
            else:
                print(f"❌ {id_vendedor}: Estructura incorrecta")
                if campos_faltantes:
                    print(f"   Campos faltantes: {', '.join(campos_faltantes)}")
                if campos_extra:
                    print(f"   Campos extra: {', '.join(campos_extra)}")
            
            print()
        
        # Verificar tabla de producción
        print("🏭 Verificando tabla de Producción...")
        campos_produccion_modelo = [field.name for field in Produccion._meta.fields]
        
        campos_faltantes_prod = []
        campos_extra_prod = []
        
        for campo in self.campos_produccion:
            if campo not in campos_produccion_modelo:
                campos_faltantes_prod.append(campo)
        
        for campo in campos_produccion_modelo:
            if campo not in self.campos_produccion and campo != 'id':
                campos_extra_prod.append(campo)
        
        resultados['PRODUCCION'] = {
            'total_campos': len(campos_produccion_modelo),
            'campos_faltantes': campos_faltantes_prod,
            'campos_extra': campos_extra_prod,
            'estructura_ok': len(campos_faltantes_prod) == 0
        }
        
        if resultados['PRODUCCION']['estructura_ok']:
            print(f"✅ PRODUCCION: Estructura correcta ({len(campos_produccion_modelo)} campos)")
        else:
            print(f"❌ PRODUCCION: Estructura incorrecta")
            if campos_faltantes_prod:
                print(f"   Campos faltantes: {', '.join(campos_faltantes_prod)}")
            if campos_extra_prod:
                print(f"   Campos extra: {', '.join(campos_extra_prod)}")
        
        return resultados

    def crear_datos_prueba(self):
        """Crear datos de prueba en todas las tablas"""
        print("\n🧪 ===== CREANDO DATOS DE PRUEBA =====\n")
        
        resultados = {}
        fecha_hoy = datetime.now().date()
        
        # Crear datos para cada ID
        for id_vendedor, modelo in self.modelos.items():
            print(f"📝 Creando datos de prueba para {id_vendedor}...")
            
            try:
                # Eliminar datos de prueba anteriores
                modelo.objects.filter(usuario='TEST_VERIFICACION').delete()
                
                # Crear nuevo registro de prueba
                registro = modelo.objects.create(
                    # Identificación
                    dia='LUNES',
                    fecha=fecha_hoy,
                    
                    # Checkboxes
                    v=True,
                    d=False,
                    
                    # Productos
                    producto=f'PRODUCTO_TEST_{id_vendedor}',
                    cantidad=10,
                    dctos=1,
                    adicional=0,
                    devoluciones=2,
                    vencidas=1,
                    lotes_vencidos='[{"lote": "TEST123", "motivo": "HONGO"}]',
                    valor=1500.00,
                    
                    # Pagos
                    concepto='TEST_CONCEPTO',
                    descuentos=5000.00,
                    nequi=15000.00,
                    daviplata=10000.00,
                    
                    # Resumen
                    base_caja=50000.00,
                    total_despacho=150000.00,
                    total_pedidos=140000.00,
                    total_dctos=5000.00,
                    venta=135000.00,
                    total_efectivo=130000.00,
                    
                    # Control de cumplimiento
                    licencia_transporte='C',
                    soat='C',
                    uniforme='NC',
                    no_locion='C',
                    no_accesorios='C',
                    capacitacion_carnet='NC',
                    higiene='C',
                    estibas='C',
                    desinfeccion='C',
                    
                    # Metadatos
                    usuario='TEST_VERIFICACION',
                    activo=True
                )
                
                resultados[id_vendedor] = {
                    'creado': True,
                    'id': registro.id,
                    'total_calculado': registro.total,
                    'neto_calculado': registro.neto
                }
                
                print(f"✅ {id_vendedor}: Registro creado (ID: {registro.id})")
                print(f"   Total calculado: {registro.total}")
                print(f"   Neto calculado: {registro.neto}")
                
            except Exception as e:
                resultados[id_vendedor] = {
                    'creado': False,
                    'error': str(e)
                }
                print(f"❌ {id_vendedor}: Error creando registro - {str(e)}")
            
            print()
        
        # Crear datos de prueba para producción
        print("🏭 Creando datos de prueba para Producción...")
        
        try:
            # Eliminar datos de prueba anteriores
            Produccion.objects.filter(usuario='TEST_VERIFICACION').delete()
            
            # Crear registros de prueba
            registros_produccion = []
            
            for i in range(3):
                registro = Produccion.objects.create(
                    fecha=fecha_hoy,
                    producto=f'PRODUCTO_PRODUCCION_{i+1}',
                    cantidad=50 + (i * 10),
                    lote=f'LOTE_TEST_{i+1}',
                    congelado=i == 1,  # Solo el segundo está congelado
                    usuario='TEST_VERIFICACION',
                    activo=True
                )
                registros_produccion.append(registro)
                
                # Si está marcado como congelado, congelarlo
                if i == 1:
                    registro.congelar('TEST_CONGELADO')
            
            resultados['PRODUCCION'] = {
                'creado': True,
                'registros': len(registros_produccion),
                'ids': [r.id for r in registros_produccion]
            }
            
            print(f"✅ PRODUCCION: {len(registros_produccion)} registros creados")
            print(f"   IDs: {[r.id for r in registros_produccion]}")
            
        except Exception as e:
            resultados['PRODUCCION'] = {
                'creado': False,
                'error': str(e)
            }
            print(f"❌ PRODUCCION: Error creando registros - {str(e)}")
        
        return resultados

    def verificar_datos_guardados(self):
        """Verificar que los datos se guardaron correctamente"""
        print("\n🔍 ===== VERIFICANDO DATOS GUARDADOS =====\n")
        
        resultados = {}
        
        # Verificar datos de cargue
        for id_vendedor, modelo in self.modelos.items():
            print(f"🔎 Verificando datos guardados para {id_vendedor}...")
            
            try:
                registros = modelo.objects.filter(usuario='TEST_VERIFICACION')
                
                if registros.exists():
                    registro = registros.first()
                    
                    # Verificar campos críticos
                    verificaciones = {
                        'dia_correcto': registro.dia == 'LUNES',
                        'producto_correcto': registro.producto == f'PRODUCTO_TEST_{id_vendedor}',
                        'cantidad_correcta': registro.cantidad == 10,
                        'total_calculado': registro.total == 6,  # 10 - 1 + 0 - 2 - 1
                        'neto_calculado': registro.neto == 9000.00,  # 6 * 1500
                        'checkboxes_correctos': registro.v == True and registro.d == False,
                        'pagos_correctos': registro.nequi == 15000.00,
                        'resumen_correcto': registro.base_caja == 50000.00,
                        'cumplimiento_correcto': registro.licencia_transporte == 'C'
                    }
                    
                    campos_correctos = sum(verificaciones.values())
                    total_verificaciones = len(verificaciones)
                    
                    resultados[id_vendedor] = {
                        'encontrado': True,
                        'verificaciones': verificaciones,
                        'campos_correctos': campos_correctos,
                        'total_verificaciones': total_verificaciones,
                        'porcentaje_correcto': (campos_correctos / total_verificaciones) * 100
                    }
                    
                    print(f"✅ {id_vendedor}: Registro encontrado")
                    print(f"   Campos correctos: {campos_correctos}/{total_verificaciones} ({resultados[id_vendedor]['porcentaje_correcto']:.1f}%)")
                    
                    # Mostrar campos incorrectos
                    incorrectos = [k for k, v in verificaciones.items() if not v]
                    if incorrectos:
                        print(f"   ⚠️ Campos incorrectos: {', '.join(incorrectos)}")
                    
                else:
                    resultados[id_vendedor] = {
                        'encontrado': False,
                        'error': 'No se encontraron registros'
                    }
                    print(f"❌ {id_vendedor}: No se encontraron registros")
                
            except Exception as e:
                resultados[id_vendedor] = {
                    'encontrado': False,
                    'error': str(e)
                }
                print(f"❌ {id_vendedor}: Error verificando - {str(e)}")
            
            print()
        
        # Verificar datos de producción
        print("🏭 Verificando datos de producción...")
        
        try:
            registros = Produccion.objects.filter(usuario='TEST_VERIFICACION')
            
            if registros.exists():
                verificaciones_prod = {
                    'cantidad_correcta': registros.count() == 3,
                    'productos_correctos': all(r.producto.startswith('PRODUCTO_PRODUCCION_') for r in registros),
                    'congelado_correcto': registros.filter(congelado=True).count() == 1,
                    'lotes_correctos': all(r.lote.startswith('LOTE_TEST_') for r in registros)
                }
                
                campos_correctos_prod = sum(verificaciones_prod.values())
                total_verificaciones_prod = len(verificaciones_prod)
                
                resultados['PRODUCCION'] = {
                    'encontrado': True,
                    'registros_encontrados': registros.count(),
                    'verificaciones': verificaciones_prod,
                    'campos_correctos': campos_correctos_prod,
                    'total_verificaciones': total_verificaciones_prod,
                    'porcentaje_correcto': (campos_correctos_prod / total_verificaciones_prod) * 100
                }
                
                print(f"✅ PRODUCCION: {registros.count()} registros encontrados")
                print(f"   Campos correctos: {campos_correctos_prod}/{total_verificaciones_prod} ({resultados['PRODUCCION']['porcentaje_correcto']:.1f}%)")
                
                # Mostrar campos incorrectos
                incorrectos_prod = [k for k, v in verificaciones_prod.items() if not v]
                if incorrectos_prod:
                    print(f"   ⚠️ Campos incorrectos: {', '.join(incorrectos_prod)}")
                
            else:
                resultados['PRODUCCION'] = {
                    'encontrado': False,
                    'error': 'No se encontraron registros de producción'
                }
                print(f"❌ PRODUCCION: No se encontraron registros")
                
        except Exception as e:
            resultados['PRODUCCION'] = {
                'encontrado': False,
                'error': str(e)
            }
            print(f"❌ PRODUCCION: Error verificando - {str(e)}")
        
        return resultados

    def limpiar_datos_prueba(self):
        """Limpiar datos de prueba"""
        print("\n🧹 ===== LIMPIANDO DATOS DE PRUEBA =====\n")
        
        # Limpiar datos de cargue
        for id_vendedor, modelo in self.modelos.items():
            try:
                eliminados = modelo.objects.filter(usuario='TEST_VERIFICACION').delete()
                print(f"🗑️ {id_vendedor}: {eliminados[0]} registros eliminados")
            except Exception as e:
                print(f"❌ {id_vendedor}: Error limpiando - {str(e)}")
        
        # Limpiar datos de producción
        try:
            eliminados = Produccion.objects.filter(usuario='TEST_VERIFICACION').delete()
            print(f"🗑️ PRODUCCION: {eliminados[0]} registros eliminados")
        except Exception as e:
            print(f"❌ PRODUCCION: Error limpiando - {str(e)}")

    def ejecutar_verificacion_completa(self):
        """Ejecutar verificación completa"""
        print("🧪 ===== VERIFICACIÓN COMPLETA DE CAMPOS EN BD =====")
        print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        # 1. Verificar estructura
        estructura = self.verificar_estructura_tablas()
        
        # 2. Crear datos de prueba
        creacion = self.crear_datos_prueba()
        
        # 3. Verificar datos guardados
        verificacion = self.verificar_datos_guardados()
        
        # 4. Mostrar resumen final
        print("\n🎯 ===== RESUMEN FINAL =====")
        
        tablas_ok = 0
        total_tablas = len(self.modelos) + 1  # +1 para producción
        
        for tabla in list(self.modelos.keys()) + ['PRODUCCION']:
            estructura_ok = estructura.get(tabla, {}).get('estructura_ok', False)
            datos_ok = verificacion.get(tabla, {}).get('encontrado', False)
            
            if estructura_ok and datos_ok:
                tablas_ok += 1
                print(f"✅ {tabla}: Estructura y datos correctos")
            else:
                print(f"❌ {tabla}: Problemas detectados")
                if not estructura_ok:
                    print(f"   - Estructura incorrecta")
                if not datos_ok:
                    print(f"   - Datos no guardados correctamente")
        
        porcentaje_exito = (tablas_ok / total_tablas) * 100
        print(f"\n📊 Resultado: {tablas_ok}/{total_tablas} tablas correctas ({porcentaje_exito:.1f}%)")
        
        if porcentaje_exito == 100:
            print("🏆 ¡PERFECTO! Todas las tablas funcionan correctamente.")
        elif porcentaje_exito >= 80:
            print("⚠️ La mayoría de tablas funcionan, pero hay algunos problemas.")
        else:
            print("❌ Hay problemas significativos que necesitan atención.")
        
        # 5. Limpiar datos de prueba
        self.limpiar_datos_prueba()
        
        return {
            'estructura': estructura,
            'creacion': creacion,
            'verificacion': verificacion,
            'porcentaje_exito': porcentaje_exito
        }

if __name__ == '__main__':
    verificador = VerificadorCamposBD()
    resultado = verificador.ejecutar_verificacion_completa()