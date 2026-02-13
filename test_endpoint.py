from django.test import RequestFactory
from api.views import obtener_cargue
import json
import datetime

# Crear request simulado para obtener cargue del día
factory = RequestFactory()
usuario_id = "ID1" # Jhonathan Onofres
dia = "LUNES"
fecha = "2026-02-09" 

request = factory.get(f'/api/obtener-cargue/?vendedor_id={usuario_id}&dia={dia}&fecha={fecha}')
response = obtener_cargue(request)

if response.status_code == 200:
    data = json.loads(response.content)
    # Buscar OBLEA
    encontrado = False
    for k, v in data.items():
        if "OBLEA" in k:
            encontrado = True
            print(f"PRODUCTO: {k}")
            print(f"PRECIOS ALTERNOS: {v.get('precios_alternos', 'NO ENVIADO')}")
            print(f"ESTADO: {v.get('estado', 'SIN ESTADO')}")
    
    if not encontrado:
        print("Producto OBLEA no encontrado en la respuesta")
else:
    print(f"Error {response.status_code}: {response.content}")
