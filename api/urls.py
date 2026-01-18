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
    PrediccionIAView, guardar_sugerido, obtener_cargue, obtener_rendimiento_cargue, actualizar_check_vendedor, verificar_estado_dia,
    calcular_devoluciones_automaticas, ventas_tiempo_real, cerrar_turno_vendedor,
    RutaViewSet, ClienteRutaViewSet, VentaRutaViewSet,
    RegistrosPlaneacionDiaViewSet,
    CarguePagosViewSet, RutaOrdenViewSet, ReportePlaneacionViewSet,
    obtener_estado_cargue, actualizar_estado_cargue,  # 🆕 Estado de cargue
    # 🆕 Endpoints de turno
    verificar_turno_activo, abrir_turno, cerrar_turno_estado,
    # 🆕 Configuración de producción
    obtener_configuracion_produccion, guardar_configuracion_produccion,
    # 🆕 Trazabilidad de lotes
    buscar_lote, lotes_por_fecha, lotes_por_mes,
    # 🤖 Endpoints de IA
    ai_chat, ai_analyze_data, ai_health, ai_agent_command,
    # 📊 Reportes Avanzados
    reportes_vendedores
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
router.register(r'precio-productos', PrecioProductoViewSet, basename='precio-productos')
router.register(r'cargue-id1', CargueID1ViewSet, basename='cargue-id1')
router.register(r'cargue-id2', CargueID2ViewSet, basename='cargue-id2')
router.register(r'cargue-id3', CargueID3ViewSet, basename='cargue-id3')
router.register(r'cargue-id4', CargueID4ViewSet, basename='cargue-id4')
router.register(r'cargue-id5', CargueID5ViewSet, basename='cargue-id5')
router.register(r'cargue-id6', CargueID6ViewSet, basename='cargue-id6')
router.register(r'cargue-pagos', CarguePagosViewSet, basename='cargue-pagos')  # 🆕 Pagos de cargue

# Domiciliarios
router.register(r'domiciliarios', DomiciliarioViewSet, basename='domiciliarios')

# Rutas y Ventas Ruta
router.register(r'rutas', RutaViewSet, basename='rutas')
router.register(r'clientes-ruta', ClienteRutaViewSet, basename='clientes-ruta')
router.register(r'ventas-ruta', VentaRutaViewSet, basename='ventas-ruta')

# Configuración
router.register(r'configuracion-impresion', ConfiguracionImpresionViewSet, basename='configuracion-impresion')

# Caja y POS
router.register(r'movimientos-caja', MovimientoCajaViewSet, basename='movimientos-caja')
router.register(r'arqueo-caja', ArqueoCajaViewSet, basename='arqueo-caja')
router.register(r'sucursales', SucursalViewSet, basename='sucursales')
router.register(r'cajeros', CajeroViewSet, basename='cajeros')
router.register(r'turnos', TurnoViewSet, basename='turnos')
router.register(r'ventas-cajero', VentaCajeroViewSet, basename='ventas-cajero')

# Snapshot Planeación
router.register(r'registros-planeacion-dia', RegistrosPlaneacionDiaViewSet, basename='registros-planeacion-dia')
router.register(r'ruta-orden', RutaOrdenViewSet, basename='ruta-orden')
router.register(r'reportes-planeacion', ReportePlaneacionViewSet, basename='reportes-planeacion')


urlpatterns = router.urls + [
    path('guardar-sugerido/', guardar_sugerido, name='guardar-sugerido'),
    path('obtener-cargue/', obtener_cargue, name='obtener-cargue'),
    path('rendimiento-cargue/', obtener_rendimiento_cargue, name='rendimiento-cargue'),
    path('actualizar-check-vendedor/', actualizar_check_vendedor, name='actualizar-check-vendedor'),
    path('verificar-estado-dia/', verificar_estado_dia, name='verificar-estado-dia'),
    
    # 🔗 Integración App ↔ Web
    path('cargue/devoluciones-automaticas/<str:id_vendedor>/<str:fecha>/', 
         calcular_devoluciones_automaticas, 
         name='devoluciones-automaticas'),
    path('cargue/ventas-tiempo-real/<str:id_vendedor>/<str:fecha>/', 
         ventas_tiempo_real, 
         name='ventas-tiempo-real'),
    path('cargue/cerrar-turno/', 
         cerrar_turno_vendedor, 
         name='cerrar-turno'),
    
    # 🆕 Gestión de turnos (App Móvil)
    path('turno/verificar/', verificar_turno_activo, name='verificar-turno'),
    path('turno/abrir/', abrir_turno, name='abrir-turno'),
    path('turno/cerrar/', cerrar_turno_estado, name='cerrar-turno-estado'),
    
    # 🆕 Estado del cargue
    path('estado-cargue/', obtener_estado_cargue, name='obtener-estado-cargue'),
    path('estado-cargue/actualizar/', actualizar_estado_cargue, name='actualizar-estado-cargue'),
    
    # 🆕 Configuración de producción
    path('configuracion-produccion/', obtener_configuracion_produccion, name='obtener-configuracion-produccion'),
    path('configuracion-produccion/guardar/', guardar_configuracion_produccion, name='guardar-configuracion-produccion'),
    
    # 🆕 Trazabilidad de lotes
    path('trazabilidad/buscar/', buscar_lote, name='buscar-lote'),
    path('trazabilidad/fecha/', lotes_por_fecha, name='lotes-por-fecha'),
    path('trazabilidad/mes/', lotes_por_mes, name='lotes-por-mes'),
    
    # 🤖 Endpoints de IA Local
    path('ai/chat/', ai_chat, name='ai-chat'),
    path('ai/analyze/', ai_analyze_data, name='ai-analyze'),
    path('ai/health/', ai_health, name='ai-health'),
    path('ai/agent/', ai_agent_command, name='ai-agent'),  # Agente con herramientas
    
    # 📊 Reportes Avanzados
    path('reportes/vendedores/', reportes_vendedores, name='reportes-vendedores'),
]

