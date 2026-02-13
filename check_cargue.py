from api.models import CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6, Vendedor
vendedor = Vendedor.objects.filter(nombre__icontains="JHONATHAN").first()
print(f"Vendedor: {vendedor}")
cargues = CargueID1.objects.filter(dia="LUNES", producto__icontains="OBLEA").last() # Asumo ID1 o pruebo varios
if cargues:
    print(f"CARGUE ID1 - Producto: {cargues.producto}")
    print(f"Valor en cargue: {cargues.valor}")
else:
    print("No encontrado en ID1")
