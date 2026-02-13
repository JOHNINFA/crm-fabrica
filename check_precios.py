from api.models import Producto, ListaPrecio, PrecioProducto
print("=== CONSULTA DE PRECIOS ===")
try:
    p = Producto.objects.filter(nombre__icontains="OBLEA").first()
    if p:
        print(f"PRODUCTO: {p.nombre}")
        print(f"PRECIO BASE: {p.precio}")
    else:
        print("Producto OBLEA no encontrado")

    lista = ListaPrecio.objects.filter(nombre__icontains="DOMICILIOS").first()
    if lista:
        print(f"LISTA PRECIO: {lista.nombre}")
        pp = PrecioProducto.objects.filter(producto=p, lista_precio=lista).first()
        if pp:
            print(f"PRECIO EN LISTA: {pp.precio}")
        else:
            print("No hay precio especial en esta lista")
    else:
        print("Lista DOMICILIOS no encontrada")
except Exception as e:
    print(f"Error: {e}")
