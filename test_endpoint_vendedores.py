#!/usr/bin/env python3
"""
Script para probar el endpoint de vendedores/responsables
"""

import requests
import json

API_URL = 'http://localhost:8000/api'

def probar_actualizar_responsable():
    """Probar actualización de responsable"""
    print("🧪 PROBANDO ACTUALIZACIÓN DE RESPONSABLE")
    print("=" * 50)
    
    url = f"{API_URL}/vendedores/actualizar_responsable/"
    datos = {
        'id_vendedor': 'ID1',
        'responsable': 'MARIA GONZALEZ - PRUEBA'
    }
    
    try:
        response = requests.post(url, json=datos)
        print(f"📤 URL: {url}")
        print(f"📦 Datos enviados: {datos}")
        print(f"📥 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            resultado = response.json()
            print("✅ Respuesta exitosa:")
            print(json.dumps(resultado, indent=2, ensure_ascii=False))
            return True
        else:
            print("❌ Error en respuesta:")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def probar_obtener_responsable():
    """Probar obtención de responsable"""
    print("\n🔍 PROBANDO OBTENCIÓN DE RESPONSABLE")
    print("=" * 50)
    
    url = f"{API_URL}/vendedores/obtener_responsable/"
    params = {'id_vendedor': 'ID1'}
    
    try:
        response = requests.get(url, params=params)
        print(f"📤 URL: {url}")
        print(f"📦 Parámetros: {params}")
        print(f"📥 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            resultado = response.json()
            print("✅ Respuesta exitosa:")
            print(json.dumps(resultado, indent=2, ensure_ascii=False))
            return True
        else:
            print("❌ Error en respuesta:")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def probar_endpoint_completo():
    """Ejecutar todas las pruebas"""
    print("🚀 INICIANDO PRUEBAS DEL ENDPOINT DE VENDEDORES")
    print("=" * 60)
    
    resultados = {
        'actualizar': False,
        'obtener': False
    }
    
    # 1. Probar actualización
    resultados['actualizar'] = probar_actualizar_responsable()
    
    # 2. Probar obtención
    resultados['obtener'] = probar_obtener_responsable()
    
    # Resumen
    print("\n📊 RESUMEN DE RESULTADOS")
    print("=" * 50)
    print(f"📤 Actualizar responsable: {'✅ PASS' if resultados['actualizar'] else '❌ FAIL'}")
    print(f"🔍 Obtener responsable: {'✅ PASS' if resultados['obtener'] else '❌ FAIL'}")
    
    if all(resultados.values()):
        print("\n🎉 ¡TODAS LAS PRUEBAS PASARON!")
        print("✅ El endpoint de vendedores funciona correctamente")
    else:
        print("\n⚠️ ALGUNAS PRUEBAS FALLARON")
        print("❌ Revisar la configuración del servidor")
    
    return resultados

if __name__ == '__main__':
    probar_endpoint_completo()