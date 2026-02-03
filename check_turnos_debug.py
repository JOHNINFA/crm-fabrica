import requests
import json
import os

# Configuración básica
API_URL = 'http://localhost:8000/api'

def check_turnos():
    print(f"🔍 Conectando a {API_URL}...")
    
    estados = ['ACTIVO', 'ABIERTO']
    encontrados = 0
    
    for estado in estados:
        try:
            url = f"{API_URL}/turnos/?estado={estado}"
            print(f"\n📡 Consultando estado: {estado}")
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Respuesta exitosa ({len(data)} registros)")
                if len(data) > 0:
                    encontrados += len(data)
                    for t in data:
                        print(f"   - ID: {t.get('id')} | Cajero: {t.get('cajero_nombre')} | Inicio: {t.get('fecha_inicio')}")
            else:
                print(f"⚠️ Error {response.status_code}: {response.text}")
                
        except Exception as e:
            print(f"❌ Error conectando: {e}")

    print(f"\n📊 Total turnos encontrados en DB: {encontrados}")

if __name__ == '__main__':
    check_turnos()
