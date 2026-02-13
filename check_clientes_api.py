from rest_framework.test import APIRequestFactory
from api.views import ClienteViewSet
import json

factory = APIRequestFactory()
request = factory.get('/api/clientes/')
view = ClienteViewSet.as_view({'get': 'list'})
response = view(request)

if response.status_code == 200:
    # DRF response data might be list of dicts directly if not paginated specially
    # If using standard pagination, it's inside 'results'
    data = response.data
    if 'results' in data:
        data = data['results']
    
    found = False
    for c in data:
        if "SABROZON" in (c.get('nombre_completo') or "") or "SABROZON" in (c.get('nombre_negocio') or ""):
            print("=== CLIENTE ENCONTRADO EN /api/clientes/ ===")
            print(f"ID: {c.get('id')}")
            print(f"Nombre: {c.get('nombre_completo')}")
            print(f"Tipo Lista Precio: {c.get('tipo_lista_precio')}")
            found = True
            break
            
    if not found:
        print("Cliente SABROZON no encontrado en /api/clientes/")
else:
    print(f"Error {response.status_code}")
