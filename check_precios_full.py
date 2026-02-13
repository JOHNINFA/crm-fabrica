from api.models import Cliente, PrecioProducto, Producto, ListaPrecio

cliente = Cliente.objects.filter(nombre_completo__icontains="SABROZON").first()
producto = Producto.objects.filter(nombre__icontains="OBLEA").first()

print(f"CLIENTE: {cliente}")
if cliente:
    print(f"LISTA ASIGNADA: {cliente.tipo_lista_precio}")
    if cliente.tipo_lista_precio:
        lista = ListaPrecio.objects.filter(nombre=cliente.tipo_lista_precio).first()
        if lista:
            pp = PrecioProducto.objects.filter(producto=producto, lista_precio=lista).first()
            if pp:
                print(f"PRECIO EN LISTA '{lista.nombre}': {pp.precio}")

# REVISAR TODAS LAS LISTAS QUE TENGAN PRECIO 1900
pps_1900 = PrecioProducto.objects.filter(producto=producto, precio=1900)
for p in pps_1900:
    print(f"LISTA CON PRECIO 1900: {p.lista_precio.nombre}")
    
# PRECIO CARGUE?
print(f"PRECIO CARGUE MODELO: {producto.precio_cargue}")
