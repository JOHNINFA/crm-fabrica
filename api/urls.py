# api/urls.py
from rest_framework.routers import DefaultRouter
from .views import (
    RegistroViewSet, ProductoViewSet, CategoriaViewSet,
    LoteViewSet, MovimientoInventarioViewSet, RegistroInventarioViewSet,
    VentaViewSet, DetalleVentaViewSet, ClienteViewSet, ListaPrecioViewSet, PrecioProductoViewSet,
    VendedorViewSet, CargueOperativoViewSet, DetalleCargueViewSet, ResumenPagosViewSet, ResumenTotalesViewSet, LoteVencidoViewSet, ControlCumplimientoViewSet
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
router.register(r'vendedores', VendedorViewSet, basename='vendedor')
router.register(r'cargues', CargueOperativoViewSet, basename='cargue')
router.register(r'detalle-cargues', DetalleCargueViewSet, basename='detalle-cargue')
router.register(r'lotes-vencidos', LoteVencidoViewSet, basename='lote-vencido')
router.register(r'resumen-pagos', ResumenPagosViewSet, basename='resumen-pagos')
router.register(r'resumen-totales', ResumenTotalesViewSet, basename='resumen-totales')
router.register(r'control-cumplimiento', ControlCumplimientoViewSet, basename='control-cumplimiento')

urlpatterns = router.urls
