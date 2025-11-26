# api/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    RegistroViewSet, ProductoViewSet, CategoriaViewSet, StockViewSet,
    LoteViewSet, MovimientoInventarioViewSet, RegistroInventarioViewSet,
    VentaViewSet, DetalleVentaViewSet, ClienteViewSet, ListaPrecioViewSet, PrecioProductoViewSet,
    CargueID1ViewSet, CargueID2ViewSet, CargueID3ViewSet, CargueID4ViewSet, CargueID5ViewSet, CargueID6ViewSet, ProduccionViewSet,
    VendedorViewSet, DomiciliarioViewSet, ProduccionSolicitadaViewSet, PlaneacionViewSet,
    SucursalViewSet, CajeroViewSet, TurnoViewSet, VentaCajeroViewSet, ArqueoCajaViewSet,
    PedidoViewSet, DetallePedidoViewSet, MovimientoCajaViewSet, ConfiguracionImpresionViewSet,
    PrediccionIAView, guardar_sugerido, obtener_cargue, actualizar_check_vendedor, verificar_estado_dia,
    RutaViewSet, ClienteRutaViewSet, VentaRutaViewSet
)

router = DefaultRouter()

# Registrar ViewSets
router.register(r'vendedores', VendedorViewSet, basename='vendedores')
router.register(r'productos', ProductoViewSet, basename='productos')
router.register(r'categorias', CategoriaViewSet, basename='categorias')
router.register(r'lotes', LoteViewSet, basename='lotes')
router.register(r'movimientos', MovimientoInventarioViewSet, basename='movimientos')
router.register(r'registro-inventario', RegistroInventarioViewSet, basename='registro-inventario')
router.register(r'stock', StockViewSet, basename='stock')
router.register(r'ventas', VentaViewSet, basename='ventas')
router.register(r'pedidos', PedidoViewSet, basename='pedidos')
router.register(r'clientes', ClienteViewSet, basename='clientes')
router.register(r'lista-precios', ListaPrecioViewSet, basename='lista-precios')
router.register(r'cargue-id1', CargueID1ViewSet, basename='cargue-id1')
router.register(r'cargue-id2', CargueID2ViewSet, basename='cargue-id2')
router.register(r'cargue-id3', CargueID3ViewSet, basename='cargue-id3')
router.register(r'cargue-id4', CargueID4ViewSet, basename='cargue-id4')
router.register(r'cargue-id5', CargueID5ViewSet, basename='cargue-id5')
router.register(r'cargue-id6', CargueID6ViewSet, basename='cargue-id6')

# Rutas y Ventas Ruta
router.register(r'rutas', RutaViewSet, basename='rutas')
router.register(r'clientes-ruta', ClienteRutaViewSet, basename='clientes-ruta')
router.register(r'ventas-ruta', VentaRutaViewSet, basename='ventas-ruta')


urlpatterns = router.urls + [
    path('guardar-sugerido/', guardar_sugerido, name='guardar-sugerido'),
    path('obtener-cargue/', obtener_cargue, name='obtener-cargue'),
    path('actualizar-check-vendedor/', actualizar_check_vendedor, name='actualizar-check-vendedor'),
    path('verificar-estado-dia/', verificar_estado_dia, name='verificar-estado-dia'),  # Nuevo endpoint
]

