from rest_framework.test import APIRequestFactory
from api.views import ClienteRutaViewSet
import json

factory = APIRequestFactory()
# Buscar ruta 1 (donde está Pollos Sabrozon) y dia LUNES
request = factory.get('/api/clientes-ruta/?ruta=1&dia=LUNES')

view = ClienteRutaViewSet.as_view({'get': 'list'})
response = view(request)
content = json.dumps(response.data)
data = json.loads(content)

found = False
for cliente in data:
    if "SABROZON" in cliente['nombre_negocio']:
        print("=== CLIENTE ENCONTRADO ===")
        print(f"Nombre: {cliente['nombre_negocio']}")
        print(f"Lista Precio: {cliente.get('lista_precio_nombre', 'NO VIENE')}")
        found = True

if not found:
    print("No encontré a Pollos Sabrozon en la respuesta")
