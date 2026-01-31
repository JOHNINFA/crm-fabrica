
import json
import urllib.request
import urllib.error
import sys

BASE_URL = "http://localhost:8000/api"

def get_valid_product():
    try:
        url = f"{BASE_URL}/productos/"
        response = urllib.request.urlopen(url)
        data = json.loads(response.read().decode())
        if data and len(data) > 0:
            return data[0]['id']
    except Exception as e:
        print(f"Error obteniendo productos: {e}")
    return 1 # Fallback dummy

def run_test(name, payload):
    print(f"\n--- 🧪 PROBANDO: {name} ---")
    url = f"{BASE_URL}/ventas/"
    
    headers = {'Content-Type': 'application/json'}
    data = json.dumps(payload).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = response.read().decode()
            print(f"❌ FALLO DE SEGURIDAD: El servidor aceptó la venta (Status {status})")
            print(f"Respuesta: {body}")
            
    except urllib.error.HTTPError as e:
        print(f"✅ BLOQUEADO CORRECTAMENTE (Status {e.code})")
        print(f"Mensaje del servidor: {e.read().decode()}")
    except urllib.error.URLError as e:
        print(f"Error de conexión: {e.reason}")
    except Exception as e:
        print(f"Error inesperado: {e}")

def main():
    print("🛡️ INICIANDO SIMULACIÓN DE ATAQUE AL POS 🛡️")
    print(f"Objetivo: {BASE_URL}")
    
    prod_id = get_valid_product()
    print(f"Usando Producto ID: {prod_id} para las pruebas")

    # CASO 1: Venta con Precio Negativo (Robo de caja)
    payload_negativo = {
        "vendedor": "HACKER",
        "cliente": "TEST_SEGURIDAD",
        "metodo_pago": "EFECTIVO",
        "subtotal": -50000,
        "total": -50000,
        "detalles": [
            { "producto": prod_id, "cantidad": 1, "precio_unitario": -50000 }
        ]
    }
    run_test("PRECIO NEGATIVO", payload_negativo)

    # CASO 2: Venta con Cantidad Cero o Negativa
    payload_cero = {
        "vendedor": "HACKER",
        "cliente": "TEST_SEGURIDAD",
        "total": 0,
        "detalles": [
            { "producto": prod_id, "cantidad": 0, "precio_unitario": 5000 }
        ]
    }
    run_test("CANTIDAD CERO", payload_cero)

    # CASO 3: Inconsistencia Matemática (Compro mucho, pago poco)
    # 10 Unidades a 5000 = 50.000, pero digo que el total es 100 pesos
    payload_math = {
        "vendedor": "HACKER",
        "cliente": "TEST_SEGURIDAD",
        "subtotal": 100, # Trampa
        "total": 100,
        "detalles": [
            { "producto": prod_id, "cantidad": 10, "precio_unitario": 5000 }
        ]
    }
    run_test("INCONSISTENCIA MATEMÁTICA", payload_math)

if __name__ == "__main__":
    main()
