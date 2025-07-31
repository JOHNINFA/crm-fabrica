# api/urls.py
from rest_framework.routers import DefaultRouter
from .views import (
    RegistroViewSet, ProductoViewSet, CategoriaViewSet,
    LoteViewSet, MovimientoInventarioViewSet, RegistroInventarioViewSet,
    VentaViewSet, DetalleVentaViewSet, ClienteViewSet, ListaPrecioViewSet, PrecioProductoViewSet
)

router = DefaultRouter()
router.register(r'registros', RegistroViewSet, basename='registro')
router.register(r'productos', ProductoViewSet, basename='producto')
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'lotes', LoteViewSet, basename='lote')
router.register(r'movimientos', MovimientoInventarioViewSet, basename='movimiento')
router.register(r'registro-inventario', RegistroInventarioViewSet, basename='registro-inventario')
router.register(r'ventas', VentaViewSet, basename='venta')
router.register(r'detalle-ventas', DetalleVentaViewSet, basename='detalle-venta')
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'lista-precios', ListaPrecioViewSet, basename='lista-precio')
router.register(r'precio-productos', PrecioProductoViewSet, basename='precio-producto')

urlpatterns = router.urls
