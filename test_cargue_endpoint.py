#!/usr/bin/env python3
import requests
import json

def test_cargue_endpoint():
    print("🧪 PROBANDO ENDPOINT /api/cargues/...")
    
    # Datos de prueba
    datos_prueba = {
        "dia": "MARTES",
        "vendedor_id": "ID1",
        "fecha": "2025-09-23",
        "usuario": "SISTEMA_PRUEBA",
        "estado": "COMPLETADO",
        "activo": True,
        "productos": [
            {
                "producto_nombre": "AREPA TIPO OBLEA 500Gr",
                "cantidad": 5,
                "dctos": 0,
                "adicional": 0,
                "devoluciones": 0,
                "vencidas": 0,
                "valor": 1625,
                "vendedor_check": True,
                "despachador_check": True,
                "lotes_vencidos": []
            }
        ],
        "pagos": [],
        "resumen": {}
    }
    
    try:
        print("📤 Enviando datos de prueba...")
        print(f"📦 Payload: {json.dumps(datos_prueba, indent=2)}")
        
        response = requests.post(
            'http://localhost:8000/api/cargues/',
            json=datos_prueba,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"📡 Status Code: {response.status_code}")
        
        if response.status_code == 201:
            resultado = response.json()
            print("✅ ÉXITO - Cargue creado:")
            print(f"   - ID: {resultado.get('id')}")
            print(f"   - Día: {resultado.get('dia')}")
            print(f"   - Estado: {resultado.get('estado')}")
            print(f"   - Vendedor: {resultado.get('vendedor')}")
            return True
            
        elif response.status_code == 200:
            resultado = response.json()
            print("✅ ÉXITO - Cargue actualizado:")
            print(f"   - ID: {resultado.get('id')}")
            print(f"   - Día: {resultado.get('dia')}")
            print(f"   - Estado: {resultado.get('estado')}")
            return True
            
        else:
            print(f"❌ ERROR - Status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   - Error: {error_data}")
            except:
                print(f"   - Error text: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ ERROR - No se puede conectar al servidor Django")
        print("💡 Asegúrate de que el servidor esté corriendo: python3 manage.py runserver")
        return False
    except Exception as e:
        print(f"❌ ERROR - Excepción: {e}")
        return False

if __name__ == "__main__":
    success = test_cargue_endpoint()
    if success:
        print("\n🎉 PRUEBA EXITOSA - El endpoint funciona correctamente")
        print("💡 Ahora puedes probar el botón FINALIZAR en la aplicación")
    else:
        print("\n❌ PRUEBA FALLIDA - Revisa los errores arriba")