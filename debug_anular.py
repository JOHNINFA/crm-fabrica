import traceback
import sys
from api.models import Pedido
from api.views import PedidoViewSet
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request
from rest_framework.parsers import JSONParser

try:
    p = Pedido.objects.filter(numero_pedido='PED-000047').first()
    if not p:
        print('Pedido PED-000047 no encontrado')
    else:
        print(f'Probando anulación para {p} (ID: {p.pk})')
        print('Estado actual:', p.estado)
        
        factory = APIRequestFactory()
        wsgi_request = factory.post('/anular/', {'motivo': 'Debug', 'usuario': 'DebugUser'}, format='json')
        drf_request = Request(wsgi_request, parsers=[JSONParser()])
        
        view = PedidoViewSet()
        view.action = 'anular'
        view.kwargs = {'pk': p.pk}
        view.request = drf_request
        view.format_kwarg = None
        
        print("Llamando a anular...")
        response = view.anular(drf_request, pk=p.pk)
        print('Estado de respuesta:', response.status_code)
        
except Exception:
    traceback.print_exc()
