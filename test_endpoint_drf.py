from rest_framework.test import APIRequestFactory
from api.views import obtener_cargue
import json

factory = APIRequestFactory()
usuario_id = "ID1" # Jhonathan Onofres
dia = "LUNES"
fecha = "2026-02-09" 

# Crear request
request = factory.get(f'/api/obtener-cargue/?vendedor_id={usuario_id}&dia={dia}&fecha={fecha}')

# Ejecutar vista directamente
response = obtener_cargue(request)

# DRF responses don't need render in most cases if dict is returned, but let's see.
if hasattr(response, 'rendered_content'):
     content = response.rendered_content
else:
     # For simple views or debugging, sometimes we check .data
     content = json.dumps(response.data)

print("=== RESPUESTA ===")
data = json.loads(content)

encontrado = False
for k, v in data.items():
    if "OBLEA" in k:
        encontrado = True
        print(f"PRODUCTO: {k}")
        print(f"PRECIOS ALTERNOS: {v.get('precios_alternos', 'NO ENVIADO')}")
        print(f"ESTADO: {v.get('estado', 'SIN ESTADO')}")

if not encontrado:
    print("Producto OBLEA no encontrado")
