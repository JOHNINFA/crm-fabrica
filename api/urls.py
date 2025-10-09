# api/urls.py
from rest_framework.routers import DefaultRouter
from .views import (
    RegistroViewSet, ProductoViewSet, CategoriaViewSet,
    LoteViewSet, MovimientoInventarioViewSet, RegistroInventarioViewSet,
    VentaViewSet, DetalleVentaViewSet, ClienteViewSet, ListaPrecioViewSet, PrecioProductoViewSet,
    CargueID1ViewSet, CargueID2ViewSet, CargueID3ViewSet, CargueID4ViewSet, CargueID5ViewSet, CargueID6ViewSet, ProduccionViewSet,
    VendedorViewSet, ProduccionSolicitadaViewSet,
    SucursalViewSet, CajeroViewSet, TurnoViewSet, VentaCajeroViewSet, ArqueoCajaViewSet,
    RemisionViewSet, DetalleRemisionViewSet
)

router = DefaultRouter()

# ===== APIs EXISTENTES (SIN CAMBIOS) =====
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

# ===== NUEVAS APIs SIMPLIFICADAS =====
router.register(r'cargue-id1', CargueID1ViewSet, basename='cargue-id1')
router.register(r'cargue-id2', CargueID2ViewSet, basename='cargue-id2')
router.register(r'cargue-id3', CargueID3ViewSet, basename='cargue-id3')
router.register(r'cargue-id4', CargueID4ViewSet, basename='cargue-id4')
router.register(r'cargue-id5', CargueID5ViewSet, basename='cargue-id5')
router.register(r'cargue-id6', CargueID6ViewSet, basename='cargue-id6')
router.register(r'produccion', ProduccionViewSet, basename='produccion')

# ===== API PARA VENDEDORES/RESPONSABLES =====
router.register(r'vendedores', VendedorViewSet, basename='vendedor')

# ===== API PARA PRODUCCIÓN SOLICITADA =====
router.register(r'produccion-solicitadas', ProduccionSolicitadaViewSet, basename='produccion-solicitada')

# ===== NUEVAS APIs PARA SISTEMA POS - CAJEROS =====
router.register(r'sucursales', SucursalViewSet, basename='sucursal')
router.register(r'cajeros', CajeroViewSet, basename='cajero')
router.register(r'turnos', TurnoViewSet, basename='turno')
router.register(r'ventas-cajero', VentaCajeroViewSet, basename='venta-cajero')
router.register(r'arqueo-caja', ArqueoCajaViewSet, basename='arqueo-caja')

# ===== NUEVAS APIs PARA SISTEMA DE REMISIONES =====
router.register(r'remisiones', RemisionViewSet, basename='remision')
router.register(r'detalle-remisiones', DetalleRemisionViewSet, basename='detalle-remision')

urlpatterns = router.urls
