from api.models import ClienteRuta
from api.serializers import ClienteRutaSerializer
import json

cliente_ruta = ClienteRuta.objects.filter(nombre_negocio__icontains="SABROZON").first()
if cliente_ruta:
    serializer = ClienteRutaSerializer(cliente_ruta)
    print(json.dumps(serializer.data, indent=2))
else:
    print("Cliente Ruta no encontrado")
