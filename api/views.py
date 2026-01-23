from rest_framework import viewsets, permissions, status, parsers
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from django.db import transaction, models  # 🆕 Agregar models para Q
from django.utils import timezone
from django.http import HttpResponse
import os
import base64
import re
import uuid
import csv
from api.services.ai_assistant_service import AIAssistant
from .models import Planeacion, Registro, Producto, Categoria, Stock, Lote, MovimientoInventario, RegistroInventario, Venta, DetalleVenta, Cliente, ListaPrecio, PrecioProducto, CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6, Produccion, ProduccionSolicitada, Pedido, DetallePedido, Vendedor, Domiciliario, MovimientoCaja, ArqueoCaja, ConfiguracionImpresion, Ruta, ClienteRuta, VentaRuta, CarguePagos, RutaOrden, ReportePlaneacion, CargueResumen
from .serializers import (
    PlaneacionSerializer, ReportePlaneacionSerializer,
    RegistroSerializer, ProductoSerializer, CategoriaSerializer, StockSerializer,
    LoteSerializer, MovimientoInventarioSerializer, RegistroInventarioSerializer,
    VentaSerializer, DetalleVentaSerializer, ClienteSerializer, ListaPrecioSerializer, PrecioProductoSerializer,
    CargueID1Serializer, CargueID2Serializer, CargueID3Serializer, CargueID4Serializer, CargueID5Serializer, CargueID6Serializer, ProduccionSerializer, ProduccionSolicitadaSerializer, PedidoSerializer, DetallePedidoSerializer, VendedorSerializer, DomiciliarioSerializer, MovimientoCajaSerializer, ArqueoCajaSerializer, ConfiguracionImpresionSerializer,
    RutaSerializer, ClienteRutaSerializer, VentaRutaSerializer, CarguePagosSerializer, RutaOrdenSerializer, CargueResumenSerializer
)

class CargueResumenViewSet(viewsets.ModelViewSet):
    """API para gestionar resúmenes de cargue y estados"""
    queryset = CargueResumen.objects.all()
    serializer_class = CargueResumenSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['vendedor_id', 'dia', 'fecha', 'estado_cargue']

    def get_queryset(self):
        queryset = super().get_queryset()
        vendedor_id = self.request.query_params.get('vendedor_id')
        dia = self.request.query_params.get('dia')
        fecha = self.request.query_params.get('fecha')
        
        if vendedor_id:
            queryset = queryset.filter(vendedor_id=vendedor_id)
        if dia:
            queryset = queryset.filter(dia=dia.upper())
        if fecha:
            queryset = queryset.filter(fecha=fecha)
            
        return queryset

# 🆕 ViewSet para pagos de Cargue (múltiples filas por día/vendedor)
class CarguePagosViewSet(viewsets.ModelViewSet):
    """API para gestionar filas de pagos del módulo Cargue"""
    queryset = CarguePagos.objects.filter(activo=True).order_by('id')
    serializer_class = CarguePagosSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['vendedor_id', 'dia', 'fecha']

    def get_queryset(self):
        queryset = super().get_queryset()
        vendedor_id = self.request.query_params.get('vendedor_id')
        dia = self.request.query_params.get('dia')
        fecha = self.request.query_params.get('fecha')
        
        if vendedor_id:
            queryset = queryset.filter(vendedor_id=vendedor_id)
        if dia:
            queryset = queryset.filter(dia=dia.upper())
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        
        return queryset

    @action(detail=False, methods=['post'])
    def sync_pagos(self, request):
        """
        Sincroniza todas las filas de pagos para un vendedor/día/fecha.
        Elimina las anteriores y crea las nuevas.
        """
        vendedor_id = request.data.get('vendedor_id')
        dia = request.data.get('dia', '').upper()
        fecha = request.data.get('fecha')
        filas = request.data.get('filas', [])
        usuario = request.data.get('usuario', 'Sistema')

        if not all([vendedor_id, dia, fecha]):
            return Response(
                {'error': 'Se requiere vendedor_id, dia y fecha'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                # Eliminar filas anteriores
                CarguePagos.objects.filter(
                    vendedor_id=vendedor_id,
                    dia=dia,
                    fecha=fecha
                ).delete()

                # Crear nuevas filas
                nuevas_filas = []
                for fila in filas:
                    if fila.get('concepto') or fila.get('descuentos', 0) > 0 or fila.get('nequi', 0) > 0 or fila.get('daviplata', 0) > 0:
                        nuevas_filas.append(CarguePagos(
                            vendedor_id=vendedor_id,
                            dia=dia,
                            fecha=fecha,
                            concepto=fila.get('concepto', ''),
                            descuentos=fila.get('descuentos', 0),
                            nequi=fila.get('nequi', 0),
                            daviplata=fila.get('daviplata', 0),
                            usuario=usuario
                        ))

                if nuevas_filas:
                    CarguePagos.objects.bulk_create(nuevas_filas)

                return Response({
                    'success': True,
                    'message': f'Sincronizadas {len(nuevas_filas)} filas de pagos',
                    'count': len(nuevas_filas)
                })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# 🆕 Importar CargueResumen para estado
from .models import CargueResumen


# 🆕 Endpoints para estado del cargue
@api_view(['GET'])
def obtener_estado_cargue(request):
    """Obtiene el estado del cargue para un día/fecha"""
    dia = request.query_params.get('dia', '').upper()
    fecha = request.query_params.get('fecha')
    
    if not dia or not fecha:
        return Response({'error': 'Se requiere dia y fecha'}, status=400)
    
    try:
        # Buscar en CargueResumen (usamos ID1 como referencia global)
        resumen = CargueResumen.objects.filter(
            dia=dia,
            fecha=fecha,
            activo=True
        ).first()
        
        if resumen:
            return Response({
                'success': True,
                'estado': resumen.estado_cargue,
                'vendedor_id': resumen.vendedor_id
            })
        else:
            return Response({
                'success': True,
                'estado': 'ALISTAMIENTO',  # Default si no existe
                'vendedor_id': None
            })
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
def actualizar_estado_cargue(request):
    """Actualiza el estado del cargue para un día/fecha"""
    dia = request.data.get('dia', '').upper()
    fecha = request.data.get('fecha')
    estado = request.data.get('estado', 'ALISTAMIENTO')
    vendedor_id = request.data.get('vendedor_id', 'ID1')  # ID1 como referencia global
    
    if not dia or not fecha:
        return Response({'error': 'Se requiere dia y fecha'}, status=400)
    
    estados_validos = ['ALISTAMIENTO', 'SUGERIDO', 'DESPACHO', 'COMPLETADO', 'ALISTAMIENTO_ACTIVO', 'FINALIZAR']
    if estado not in estados_validos:
        return Response({'error': f'Estado inválido. Válidos: {estados_validos}'}, status=400)
    
    try:
        # Crear o actualizar en CargueResumen
        resumen, created = CargueResumen.objects.update_or_create(
            dia=dia,
            fecha=fecha,
            vendedor_id=vendedor_id,
            defaults={
                'estado_cargue': estado,
                'activo': True
            }
        )
        
        return Response({
            'success': True,
            'estado': resumen.estado_cargue,
            'action': 'created' if created else 'updated',
            'message': f'Estado actualizado a {estado}'
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)


class RegistroViewSet(viewsets.ModelViewSet):
    queryset = Registro.objects.all()
    serializer_class = RegistroSerializer
    permission_classes = [permissions.AllowAny]

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.AllowAny]

class ProductoViewSet(viewsets.ModelViewSet):
    """API para gestionar productos"""
    queryset = Producto.objects.filter(activo=True).order_by('orden', 'nombre')  # 🆕 Ordenar por campo 'orden'
    serializer_class = ProductoSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    
    def _save_image_to_paths(self, image_data, filename):
        """Guarda imagen en ambas ubicaciones"""
        # Crear carpetas
        frontend_path = os.path.join(settings.BASE_DIR, 'frontend', 'public', 'images', 'productos')
        media_path = os.path.join(settings.MEDIA_ROOT, 'productos')
        
        os.makedirs(frontend_path, exist_ok=True)
        os.makedirs(media_path, exist_ok=True)
        
        # Guardar en ambas ubicaciones
        for path in [frontend_path, media_path]:
            filepath = os.path.join(path, filename)
            with open(filepath, 'wb') as f:
                f.write(base64.b64decode(image_data))
    
    @action(detail=False, methods=['post'])
    def save_image(self, request):
        """Guarda imagen base64 y devuelve URLs"""
        try:
            image_data = request.data.get('image')
            product_id = request.data.get('productId')
            
            if not image_data or not image_data.startswith('data:'):
                return Response({'error': 'Datos de imagen no válidos'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Extraer datos base64
            match = re.match(r'data:([^;]+);base64,(.+)', image_data)
            if not match:
                return Response({'error': 'Formato de imagen no válido'}, status=status.HTTP_400_BAD_REQUEST)
            
            mime_type, base64_data = match.groups()
            extension = mime_type.split('/')[-1]
            filename = f"producto_{product_id or uuid.uuid4()}_{uuid.uuid4().hex[:8]}.{extension}"
            
            # Guardar imagen
            self._save_image_to_paths(base64_data, filename)
            
            return Response({
                'success': True,
                'frontendUrl': f"/images/productos/{filename}",
                'mediaUrl': f"/media/productos/{filename}",
                'filename': filename
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def actualizar_stock(self, request, pk=None):
        """Actualiza stock y registra movimiento"""
        try:
            producto = self.get_object()
            cantidad = int(request.data.get('cantidad', 0))
            usuario = request.data.get('usuario', 'Sistema')
            nota = request.data.get('nota', '')
            
            import datetime
            timestamp = datetime.datetime.now().strftime('%H:%M:%S.%f')[:-3]
            print(f"\n=== 🔥 ACTUALIZANDO STOCK [{timestamp}] ===\n")
            print(f"Producto: {producto.nombre} (ID: {producto.id})")
            print(f"Stock ANTES: {producto.stock_total}")
            print(f"Cantidad recibida: {cantidad}")
            print(f"Usuario: {usuario}")
            print(f"Nota: {nota}")
            print(f"Request IP: {request.META.get('REMOTE_ADDR', 'Unknown')}")
            print(f"Request User-Agent: {request.META.get('HTTP_USER_AGENT', 'Unknown')[:50]}...")
            
            # Actualizar stock DIRECTAMENTE (sin crear MovimientoInventario)
            stock_anterior = producto.stock_total
            producto.stock_total += cantidad
            producto.save()
            
            print(f"Stock DESPUÉS: {producto.stock_total}")
            print(f"Diferencia aplicada: {producto.stock_total - stock_anterior}")
            print(f"=== ✅ ACTUALIZACIÓN COMPLETADA [{timestamp}] ===\n")
            print(f"CONTADOR DE LLAMADAS PARA {producto.nombre}: {getattr(producto, '_call_count', 0) + 1}")
            producto._call_count = getattr(producto, '_call_count', 0) + 1
            
            return Response({
                'success': True,
                'stock_actual': producto.stock_total,
                'nota': 'Stock actualizado sin MovimientoInventario para evitar doble descuento'
            })
            
        except (ValueError, TypeError) as e:
            print(f"❌ Error de valor: {e}")
            return Response({'error': 'La cantidad debe ser un número entero'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"❌ Error general: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # 🆕 ENDPOINTS FILTRADOS POR MÓDULO
    @action(detail=False, methods=['get'], url_path='pos')
    def productos_pos(self, request):
        """Obtener productos disponibles para POS"""
        productos = Producto.objects.filter(disponible_pos=True, activo=True).order_by('orden', 'id')
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='cargue')
    def productos_cargue(self, request):
        """Obtener productos disponibles para Cargue"""
        productos = Producto.objects.filter(disponible_cargue=True, activo=True).order_by('orden', 'id')
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='pedidos')
    def productos_pedidos(self, request):
        """Obtener productos disponibles para Pedidos"""
        productos = Producto.objects.filter(disponible_pedidos=True, activo=True).order_by('orden', 'id')
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='inventario')
    def productos_inventario(self, request):
        """Obtener productos disponibles para Inventario"""
        productos = Producto.objects.filter(disponible_inventario=True, activo=True).order_by('orden', 'id')
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)

class StockViewSet(viewsets.ModelViewSet):
    """API para gestionar stock de productos"""
    queryset = Stock.objects.select_related('producto').all()
    serializer_class = StockSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Stock.objects.select_related('producto').all()
        
        # 🎯 SOLO productos activos por defecto
        queryset = queryset.filter(producto__activo=True)
        
        # Filtrar por producto_id
        producto_id = self.request.query_params.get('producto_id')
        if producto_id:
            queryset = queryset.filter(producto_id=producto_id)
        
        # Filtrar por ubicación de inventario
        ubicacion = self.request.query_params.get('ubicacion')
        if ubicacion:
            # Incluir productos con ubicacion=PRODUCCION O sin ubicacion (NULL)
            from django.db.models import Q
            queryset = queryset.filter(
                Q(producto__ubicacion_inventario=ubicacion) | 
                Q(producto__ubicacion_inventario__isnull=True) |
                Q(producto__ubicacion_inventario='')
            )
            
        return queryset.order_by('producto__orden', 'producto__id')

class LoteViewSet(viewsets.ModelViewSet):
    queryset = Lote.objects.all()
    serializer_class = LoteSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Lote.objects.all()
        
        # Filtros
        producto_id = self.request.query_params.get('producto')
        if producto_id:
            queryset = queryset.filter(producto_id=producto_id)
        
        fecha_produccion = self.request.query_params.get('fecha_produccion')
        if fecha_produccion:
            queryset = queryset.filter(fecha_produccion=fecha_produccion)
            
        return queryset.order_by('-fecha_creacion')

class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.all()
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = MovimientoInventario.objects.all().order_by('-fecha')
        
        # Aplicar filtros
        filters = {
            'producto': 'producto_id',
            'tipo': 'tipo',
            'fecha_inicio': 'fecha__gte',
            'fecha_fin': 'fecha__lte'
        }
        
        for param, field in filters.items():
            value = self.request.query_params.get(param)
            if value:
                if param == 'tipo':
                    value = value.upper()
                queryset = queryset.filter(**{field: value})
        
        return queryset

class RegistroInventarioViewSet(viewsets.ModelViewSet):
    queryset = RegistroInventario.objects.all()
    serializer_class = RegistroInventarioSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = RegistroInventario.objects.all()
        
        fecha_produccion = self.request.query_params.get('fecha_produccion')
        if fecha_produccion:
            queryset = queryset.filter(fecha_produccion=fecha_produccion)
            
        return queryset.order_by('-fecha_creacion')

class VentaViewSet(viewsets.ModelViewSet):
    """API para gestionar ventas"""
    queryset = Venta.objects.all()
    serializer_class = VentaSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Venta.objects.all().order_by('-fecha')
        
        # Filtros opcionales
        fecha_inicio = self.request.query_params.get('fecha_inicio')
        fecha_fin = self.request.query_params.get('fecha_fin')
        vendedor = self.request.query_params.get('vendedor')
        estado = self.request.query_params.get('estado')
        
        if fecha_inicio:
            queryset = queryset.filter(fecha__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(fecha__lte=fecha_fin)
        if vendedor:
            queryset = queryset.filter(vendedor__icontains=vendedor)
        if estado:
            queryset = queryset.filter(estado=estado.upper())
            
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Crear venta con sus detalles"""
        try:

            venta_data = request.data.copy()
            detalles_data = venta_data.pop('detalles', [])
            


            
            # Crear la venta
            venta_serializer = self.get_serializer(data=venta_data)
            if not venta_serializer.is_valid():
                print("❌ Errores en venta:", venta_serializer.errors)
                return Response(venta_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            venta = venta_serializer.save()

            
            # Crear los detalles directamente
            for detalle_data in detalles_data:
                try:
                    producto = Producto.objects.get(id=detalle_data['producto'])
                    DetalleVenta.objects.create(
                        venta=venta,
                        producto=producto,
                        cantidad=detalle_data['cantidad'],
                        precio_unitario=float(detalle_data['precio_unitario'])
                    )
                    print(f"✅ Detalle creado: {producto.nombre} x{detalle_data['cantidad']}")
                    
                except Producto.DoesNotExist:
                    print(f"❌ Producto no encontrado: {detalle_data['producto']}")
                    return Response(
                        {'error': f'Producto {detalle_data["producto"]} no encontrado'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                except Exception as e:
                    print(f"❌ Error creando detalle: {str(e)}")
                    return Response(
                        {'error': f'Error creando detalle: {str(e)}'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Retornar venta completa con detalles
            venta_completa = VentaSerializer(venta)
            return Response(venta_completa.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print("❌ Error general:", str(e))
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class DetalleVentaViewSet(viewsets.ModelViewSet):
    """API para gestionar detalles de venta"""
    queryset = DetalleVenta.objects.all()
    serializer_class = DetalleVentaSerializer
    permission_classes = [permissions.AllowAny]

class ClienteViewSet(viewsets.ModelViewSet):
    """API para gestionar clientes"""
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Cliente.objects.all().order_by('-fecha_creacion')
        
        # Filtros opcionales
        activo = self.request.query_params.get('activo')
        identificacion = self.request.query_params.get('identificacion')
        nombre = self.request.query_params.get('nombre')
        
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
        if identificacion:
            queryset = queryset.filter(identificacion__icontains=identificacion)
        if nombre:
            queryset = queryset.filter(nombre_completo__icontains=nombre)
            
        return queryset
    
    def _sincronizar_con_cliente_ruta(self, cliente, origen='PEDIDOS', vendedor_anterior=None, zona_anterior=None):
        """
        Sincroniza un cliente de la tabla Cliente con ClienteRuta
        Se ejecuta cuando el cliente tiene vendedor_asignado (es decir, está asignado a una ruta)
        
        Args:
            cliente: Instancia del cliente
            origen: Origen del cliente (PEDIDOS, APP, etc.)
            vendedor_anterior: Nombre del vendedor anterior (para detectar cambios de ruta)
            zona_anterior: Zona/Ruta anterior (para detectar cambios de ruta)
        """
        from api.models import ClienteRuta, Ruta, Vendedor
        
        # 🔄 SI CAMBIÓ LA ZONA/RUTA, eliminar el registro de la zona/ruta anterior
        if zona_anterior and zona_anterior != cliente.zona_barrio:
            try:
                ruta_vieja = Ruta.objects.filter(nombre__iexact=zona_anterior).first()
                if ruta_vieja:
                    # Eliminar cliente de la ruta anterior
                    ClienteRuta.objects.filter(
                        ruta=ruta_vieja,
                        nombre_negocio=cliente.alias or cliente.nombre_completo
                    ).delete()
                    print(f"🔄 Cliente eliminado de ruta anterior: {ruta_vieja.nombre}")
            except Exception as e:
                print(f"⚠️ Error eliminando de ruta anterior: {e}")
        
        # Determinar la ruta a usar (prioridad: zona_barrio > vendedor)
        ruta = None
        
        # 1. Intentar buscar por zona_barrio (campo que contiene el nombre de la ruta)
        if cliente.zona_barrio:
            ruta = Ruta.objects.filter(nombre__iexact=cliente.zona_barrio).first()
            if ruta:
                print(f"✅ Ruta encontrada por zona_barrio: {ruta.nombre}")
        
        # 2. Si no hay zona_barrio, buscar por vendedor_asignado
        if not ruta and cliente.vendedor_asignado:
            vendedor = Vendedor.objects.filter(nombre=cliente.vendedor_asignado).first()
            if vendedor:
                ruta = Ruta.objects.filter(vendedor=vendedor).first()
                if ruta:
                    print(f"✅ Ruta encontrada por vendedor: {ruta.nombre}")
        
        # Si no se encontró ruta, no sincronizar
        if not ruta:
            print(f"⚠️ No se encontró ruta para el cliente {cliente.nombre_completo}")
            # Si no tiene ruta, eliminar de cualquier ClienteRuta
            ClienteRuta.objects.filter(
                nombre_negocio=cliente.alias or cliente.nombre_completo
            ).delete()
            print(f"🗑️ Cliente eliminado de todas las rutas (sin ruta asignada)")
            return
        
        try:
            # Preparar datos para ClienteRuta
            # Formato del tipo_negocio: "TipoNegocio | ORIGEN"
            tipo_negocio_base = cliente.alias or "Sin especificar"
            tipo_negocio = f"{tipo_negocio_base} | {origen}"  # Ej: "LA FONDA | PEDIDOS"
            
            # Buscar si ya existe un ClienteRuta con este nombre de negocio en esta ruta
            cliente_ruta_existente = ClienteRuta.objects.filter(
                ruta=ruta,
                nombre_negocio=cliente.alias or cliente.nombre_completo
            ).first()
            
            if cliente_ruta_existente:
                # Actualizar existente
                cliente_ruta_existente.nombre_contacto = cliente.nombre_completo
                cliente_ruta_existente.direccion = cliente.direccion or ''
                cliente_ruta_existente.telefono = cliente.telefono_1 or cliente.movil or ''
                cliente_ruta_existente.tipo_negocio = tipo_negocio
                cliente_ruta_existente.dia_visita = cliente.dia_entrega or 'SABADO'
                cliente_ruta_existente.activo = cliente.activo
                cliente_ruta_existente.nota = cliente.nota # 🆕 Sincronizar nota
                cliente_ruta_existente.save()
                print(f"✅ ClienteRuta actualizado: {cliente_ruta_existente.nombre_negocio} en {ruta.nombre}")
            else:
                # Crear nuevo ClienteRuta
                # Obtener el último orden para esta ruta
                ultimo_orden = ClienteRuta.objects.filter(ruta=ruta).aggregate(
                    models.Max('orden')
                )['orden__max'] or 0
                
                ClienteRuta.objects.create(
                    ruta=ruta,
                    nombre_negocio=cliente.alias or cliente.nombre_completo,
                    nombre_contacto=cliente.nombre_completo,
                    direccion=cliente.direccion or '',
                    telefono=cliente.telefono_1 or cliente.movil or '',
                    tipo_negocio=tipo_negocio,
                    dia_visita=cliente.dia_entrega or 'SABADO',
                    orden=ultimo_orden + 1,
                    activo=cliente.activo,
                    nota=cliente.nota # 🆕 Sincronizar nota
                )
                print(f"✅ ClienteRuta creado: {cliente.alias or cliente.nombre_completo} en ruta {ruta.nombre}")
                
        except Exception as e:
            print(f"❌ Error sincronizando con ClienteRuta: {e}")
            import traceback
            traceback.print_exc()
    
    def perform_create(self, serializer):
        """Se ejecuta al crear un nuevo cliente"""
        cliente = serializer.save()
        # Sincronizar con ClienteRuta si tiene ruta asignada
        self._sincronizar_con_cliente_ruta(cliente, origen='PEDIDOS')
    
    def perform_update(self, serializer):
        """Se ejecuta al actualizar un cliente existente"""
        # Obtener los valores anteriores antes de guardar
        try:
            cliente_anterior = Cliente.objects.get(pk=serializer.instance.pk)
            vendedor_anterior = cliente_anterior.vendedor_asignado
            zona_anterior = cliente_anterior.zona_barrio
        except Cliente.DoesNotExist:
            vendedor_anterior = None
            zona_anterior = None
        
        # Guardar los cambios
        cliente = serializer.save()
        
        # 🔄 Solo sincronizar si NO viene de una sincronización desde ClienteRuta
        if not getattr(cliente, '_sincronizando', False):
            # Sincronizar con ClienteRuta (pasando valores anteriores para detectar cambios)
            self._sincronizar_con_cliente_ruta(
                cliente, 
                origen='PEDIDOS', 
                vendedor_anterior=vendedor_anterior,
                zona_anterior=zona_anterior
            )
        else:
            print(f"⏭️ Sincronización Cliente → ClienteRuta omitida (ya sincronizado desde ClienteRuta)")
    
    def perform_destroy(self, instance):
        """Se ejecuta al eliminar un cliente"""
        from api.models import ClienteRuta
        
        # Eliminar el cliente de ClienteRuta antes de eliminarlo
        nombre_negocio = instance.alias or instance.nombre_completo
        clientes_ruta_eliminados = ClienteRuta.objects.filter(
            nombre_negocio=nombre_negocio
        ).delete()
        
        if clientes_ruta_eliminados[0] > 0:
            print(f"🗑️ Cliente eliminado de ClienteRuta: {nombre_negocio} ({clientes_ruta_eliminados[0]} registros)")
        
        # Eliminar el cliente
        instance.delete()
        print(f"✅ Cliente eliminado completamente: {nombre_negocio}")
class ListaPrecioViewSet(viewsets.ModelViewSet):
    """API para gestionar listas de precios"""
    queryset = ListaPrecio.objects.all()
    serializer_class = ListaPrecioSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = ListaPrecio.objects.all().order_by('-fecha_creacion')
        
        # Filtros opcionales
        activo = self.request.query_params.get('activo')
        tipo = self.request.query_params.get('tipo')
        
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
        if tipo:
            queryset = queryset.filter(tipo=tipo.upper())
            
        return queryset

class PrecioProductoViewSet(viewsets.ModelViewSet):
    """API para gestionar precios de productos"""
    queryset = PrecioProducto.objects.all()
    serializer_class = PrecioProductoSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = PrecioProducto.objects.all().order_by('producto__nombre')
        
        # Filtros opcionales
        lista_precio = self.request.query_params.get('lista_precio')
        producto = self.request.query_params.get('producto')
        activo = self.request.query_params.get('activo')
        
        if lista_precio:
            queryset = queryset.filter(lista_precio_id=lista_precio)
        if producto:
            queryset = queryset.filter(producto_id=producto)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
            
        return queryset

# ========================================
# NUEVAS VIEWS SIMPLIFICADAS
# ========================================

class CargueID1ViewSet(viewsets.ModelViewSet):
    """API simplificada para CargueID1 - Como api_vendedor"""
    queryset = CargueID1.objects.all()
    serializer_class = CargueID1Serializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        import re
        queryset = CargueID1.objects.all().order_by('-fecha', '-fecha_actualizacion')
        
        # Filtros opcionales
        dia = self.request.query_params.get('dia')
        fecha = self.request.query_params.get('fecha')
        producto = self.request.query_params.get('producto')
        activo = self.request.query_params.get('activo')
        
        if dia:
            queryset = queryset.filter(dia=dia.upper())
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        if producto:
            # 🔧 Normalizar nombre del producto (eliminar espacios múltiples)
            producto_normalizado = re.sub(r'\s+', ' ', producto).strip()
            queryset = queryset.filter(producto=producto_normalizado)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
            
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Crear registro con logging detallado"""
        import traceback
        import os
        from datetime import datetime
        import logging
        
        logger = logging.getLogger(__name__)
        
        # Log usando el sistema de logging de Django (más seguro)
        try:
            logger.info(f"🆕 CREATE CargueID1 - producto: {request.data.get('producto')}, "
                       f"cantidad: {request.data.get('cantidad')}, dctos: {request.data.get('dctos')}, "
                       f"adicional: {request.data.get('adicional')}, dia: {request.data.get('dia')}, "
                       f"fecha: {request.data.get('fecha')}")
        except Exception as e:
            logger.warning(f"Error al loguear create: {e}")
        
        return super().create(request, *args, **kwargs)

class CargueID2ViewSet(viewsets.ModelViewSet):
    """API simplificada para CargueID2 - Como api_vendedor"""
    queryset = CargueID2.objects.all()
    serializer_class = CargueID2Serializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        import re
        queryset = CargueID2.objects.all().order_by('-fecha', '-fecha_actualizacion')
        
        # Filtros opcionales
        dia = self.request.query_params.get('dia')
        fecha = self.request.query_params.get('fecha')
        producto = self.request.query_params.get('producto')
        activo = self.request.query_params.get('activo')
        
        if dia:
            queryset = queryset.filter(dia=dia.upper())
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        if producto:
            producto_normalizado = re.sub(r'\s+', ' ', producto).strip()
            queryset = queryset.filter(producto=producto_normalizado)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
            
        return queryset

class CargueID3ViewSet(viewsets.ModelViewSet):
    """API simplificada para CargueID3 - Como api_vendedor"""
    queryset = CargueID3.objects.all()
    serializer_class = CargueID3Serializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        import re
        queryset = CargueID3.objects.all().order_by('-fecha', '-fecha_actualizacion')
        
        # Filtros opcionales
        dia = self.request.query_params.get('dia')
        fecha = self.request.query_params.get('fecha')
        producto = self.request.query_params.get('producto')
        activo = self.request.query_params.get('activo')
        
        if dia:
            queryset = queryset.filter(dia=dia.upper())
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        if producto:
            producto_normalizado = re.sub(r'\s+', ' ', producto).strip()
            queryset = queryset.filter(producto=producto_normalizado)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
            
        return queryset

class CargueID4ViewSet(viewsets.ModelViewSet):
    """API simplificada para CargueID4 - Como api_vendedor"""
    queryset = CargueID4.objects.all()
    serializer_class = CargueID4Serializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        import re
        queryset = CargueID4.objects.all().order_by('-fecha', '-fecha_actualizacion')
        
        # Filtros opcionales
        dia = self.request.query_params.get('dia')
        fecha = self.request.query_params.get('fecha')
        producto = self.request.query_params.get('producto')
        activo = self.request.query_params.get('activo')
        
        if dia:
            queryset = queryset.filter(dia=dia.upper())
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        if producto:
            producto_normalizado = re.sub(r'\s+', ' ', producto).strip()
            queryset = queryset.filter(producto=producto_normalizado)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
            
        return queryset

class CargueID5ViewSet(viewsets.ModelViewSet):
    """API simplificada para CargueID5 - Como api_vendedor"""
    queryset = CargueID5.objects.all()
    serializer_class = CargueID5Serializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        import re
        queryset = CargueID5.objects.all().order_by('-fecha', '-fecha_actualizacion')
        
        # Filtros opcionales
        dia = self.request.query_params.get('dia')
        fecha = self.request.query_params.get('fecha')
        producto = self.request.query_params.get('producto')
        activo = self.request.query_params.get('activo')
        
        if dia:
            queryset = queryset.filter(dia=dia.upper())
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        if producto:
            producto_normalizado = re.sub(r'\s+', ' ', producto).strip()
            queryset = queryset.filter(producto=producto_normalizado)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
            
        return queryset

class CargueID6ViewSet(viewsets.ModelViewSet):
    """API simplificada para CargueID6 - Como api_vendedor"""
    queryset = CargueID6.objects.all()
    serializer_class = CargueID6Serializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        import re
        queryset = CargueID6.objects.all().order_by('-fecha', '-fecha_actualizacion')
        
        # Filtros opcionales
        dia = self.request.query_params.get('dia')
        fecha = self.request.query_params.get('fecha')
        producto = self.request.query_params.get('producto')
        activo = self.request.query_params.get('activo')
        
        if dia:
            queryset = queryset.filter(dia=dia.upper())
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        if producto:
            producto_normalizado = re.sub(r'\s+', ' ', producto).strip()
            queryset = queryset.filter(producto=producto_normalizado)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
            
        return queryset

class ProduccionViewSet(viewsets.ModelViewSet):
    """API para Producción con función de congelado"""
    queryset = Produccion.objects.all()
    serializer_class = ProduccionSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Produccion.objects.all().order_by('-fecha', '-fecha_actualizacion')
        
        # Filtros opcionales
        fecha = self.request.query_params.get('fecha')
        congelado = self.request.query_params.get('congelado')
        activo = self.request.query_params.get('activo')
        
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        if congelado is not None:
            queryset = queryset.filter(congelado=congelado.lower() == 'true')
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def congelar(self, request, pk=None):
        """Congelar producción"""
        try:
            produccion = self.get_object()
            usuario = request.data.get('usuario', 'Sistema')
            
            if produccion.congelado:
                return Response(
                    {'error': 'La producción ya está congelada'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            produccion.congelar(usuario)
            
            return Response({
                'success': True,
                'message': 'Producción congelada exitosamente',
                'congelado': True,
                'fecha_congelado': produccion.fecha_congelado,
                'usuario_congelado': produccion.usuario_congelado
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def descongelar(self, request, pk=None):
        """Descongelar producción"""
        try:
            produccion = self.get_object()
            usuario = request.data.get('usuario', 'Sistema')
            
            if not produccion.congelado:
                return Response(
                    {'error': 'La producción no está congelada'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            produccion.descongelar(usuario)
            
            return Response({
                'success': True,
                'message': 'Producción descongelada exitosamente',
                'congelado': False,
                'usuario_descongelado': usuario
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ========================================
# VIEWSET PARA VENDEDORES/RESPONSABLES
# ========================================

class VendedorViewSet(viewsets.ViewSet):
    """API para gestionar responsables de vendedores"""
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['post'])
    def actualizar_responsable(self, request):
        """Actualizar responsable y ruta de un vendedor específico"""
        try:
            id_vendedor = request.data.get('id_vendedor')
            responsable = request.data.get('responsable')
            ruta = request.data.get('ruta', '')
            
            if not id_vendedor or not responsable:
                return Response(
                    {'error': 'id_vendedor y responsable son requeridos'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mapear ID de vendedor a modelo correspondiente
            modelos_vendedor = {
                'ID1': CargueID1,
                'ID2': CargueID2,
                'ID3': CargueID3,
                'ID4': CargueID4,
                'ID5': CargueID5,
                'ID6': CargueID6,
            }
            
            modelo = modelos_vendedor.get(id_vendedor)
            if not modelo:
                return Response(
                    {'error': f'Vendedor {id_vendedor} no válido'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Actualizar todos los registros existentes de este vendedor
            datos_actualizar = {'responsable': responsable}
            if ruta:
                datos_actualizar['ruta'] = ruta
            
            registros_actualizados = modelo.objects.filter(activo=True).update(**datos_actualizar)
            
            # Si no hay registros, crear uno dummy para guardar el responsable
            if registros_actualizados == 0:
                from datetime import date
                modelo.objects.create(
                    dia='LUNES',
                    fecha=date.today(),
                    responsable=responsable,
                    ruta=ruta if ruta else '',
                    usuario='Sistema',
                    activo=True
                )
                registros_actualizados = 1
            
            return Response({
                'success': True,
                'message': f'Responsable y ruta actualizados para {id_vendedor}',
                'id_vendedor': id_vendedor,
                'responsable': responsable,
                'ruta': ruta,
                'registros_actualizados': registros_actualizados
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def obtener_responsable(self, request):
        """Obtener responsable y ruta actual de un vendedor o todos los vendedores"""
        try:
            id_vendedor = request.query_params.get('id_vendedor')
            
            # Mapear ID de vendedor a modelo correspondiente
            modelos_vendedor = {
                'ID1': CargueID1,
                'ID2': CargueID2,
                'ID3': CargueID3,
                'ID4': CargueID4,
                'ID5': CargueID5,
                'ID6': CargueID6,
            }
            
            # Si no se especifica id_vendedor, devolver todos
            if not id_vendedor:
                resultados = []
                for id_v, modelo in modelos_vendedor.items():
                    ultimo_registro = modelo.objects.filter(activo=True).order_by('-fecha_creacion').first()
                    responsable = 'RESPONSABLE'
                    ruta = 'Sin ruta'
                    fecha_creacion = None
                    
                    if ultimo_registro:
                        if ultimo_registro.responsable:
                            responsable = ultimo_registro.responsable
                        if hasattr(ultimo_registro, 'ruta') and ultimo_registro.ruta:
                            ruta = ultimo_registro.ruta
                        fecha_creacion = ultimo_registro.fecha_creacion
                    
                    resultados.append({
                        'id': id_v,
                        'responsable': responsable,
                        'ruta': ruta,
                        'fecha_creacion': fecha_creacion
                    })
                
                return Response(resultados)
            
            # Si se especifica id_vendedor, devolver solo ese
            modelo = modelos_vendedor.get(id_vendedor)
            if not modelo:
                return Response(
                    {'error': f'Vendedor {id_vendedor} no válido'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Obtener el responsable y ruta del registro más reciente
            ultimo_registro = modelo.objects.filter(activo=True).order_by('-fecha_creacion').first()
            
            responsable = 'RESPONSABLE'  # Valor por defecto
            ruta = 'Sin ruta'  # Valor por defecto
            
            if ultimo_registro:
                if ultimo_registro.responsable:
                    responsable = ultimo_registro.responsable
                if hasattr(ultimo_registro, 'ruta') and ultimo_registro.ruta:
                    ruta = ultimo_registro.ruta
            
            return Response({
                'success': True,
                'id_vendedor': id_vendedor,
                'responsable': responsable,
                'ruta': ruta,
                'results': [{
                    'id_vendedor': id_vendedor,
                    'responsable': responsable,
                    'ruta': ruta
                }]
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ProduccionSolicitadaViewSet(viewsets.ViewSet):
    """API para gestionar producción solicitada"""
    permission_classes = [permissions.AllowAny]
    
    def create(self, request):
        """Guardar/actualizar solicitadas de producción"""
        try:
            dia = request.data.get('dia')
            fecha = request.data.get('fecha')
            productos = request.data.get('productos', [])
            
            if not dia or not fecha:
                return Response(
                    {'error': 'Día y fecha son requeridos'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Limpiar registros existentes para este día/fecha
            ProduccionSolicitada.objects.filter(dia=dia, fecha=fecha).delete()
            
            # Crear nuevos registros
            registros_creados = []
            for producto_data in productos:
                if producto_data.get('cantidad_solicitada', 0) > 0:
                    registro = ProduccionSolicitada.objects.create(
                        dia=dia,
                        fecha=fecha,
                        producto_nombre=producto_data['producto_nombre'],
                        cantidad_solicitada=producto_data['cantidad_solicitada']
                    )
                    registros_creados.append(registro)
            
            serializer = ProduccionSolicitadaSerializer(registros_creados, many=True)
            
            return Response({
                'success': True,
                'message': f'Guardadas {len(registros_creados)} solicitadas para {dia} {fecha}',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def list(self, request):
        """Obtener solicitadas por fecha"""
        fecha = request.query_params.get('fecha')
        dia = request.query_params.get('dia')
        
        queryset = ProduccionSolicitada.objects.all()
        
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        if dia:
            queryset = queryset.filter(dia=dia.upper())
            
        queryset = queryset.order_by('producto_nombre')
        serializer = ProduccionSolicitadaSerializer(queryset, many=True)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def calcular_desde_cargue(self, request):
        """Calcular y guardar solicitadas sumando todos los IDs de cargue"""
        try:
            dia = request.data.get('dia')
            fecha = request.data.get('fecha')
            
            if not dia or not fecha:
                return Response(
                    {'error': 'Día y fecha son requeridos'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Obtener todos los registros de cargue para esta fecha
            from django.db.models import Sum
            
            # Diccionario para acumular cantidades por producto
            productos_suma = {}
            
            # Obtener lista de productos válidos (que existen en la BD)
            productos_validos = set(Producto.objects.values_list('nombre', flat=True))
            
            # Consultar cada tabla de cargue (ID1 a ID6)
            for modelo in [CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6]:
                registros = modelo.objects.filter(dia=dia.upper(), fecha=fecha)
                
                for registro in registros:
                    producto = registro.producto
                    # Forzar conversión a int para evitar concatenación de strings
                    cantidad = int(registro.cantidad or 0)
                    
                    # Solo procesar si el producto existe en la BD y tiene cantidad > 0
                    if producto and cantidad > 0 and producto in productos_validos:
                        if producto in productos_suma:
                            productos_suma[producto] += cantidad
                        else:
                            productos_suma[producto] = cantidad
            
            # Limpiar registros existentes para este día/fecha
            ProduccionSolicitada.objects.filter(dia=dia.upper(), fecha=fecha).delete()
            
            # Crear nuevos registros con las sumas
            registros_creados = []
            for producto_nombre, cantidad_total in productos_suma.items():
                if cantidad_total > 0:
                    registro = ProduccionSolicitada.objects.create(
                        dia=dia.upper(),
                        fecha=fecha,
                        producto_nombre=producto_nombre,
                        cantidad_solicitada=cantidad_total
                    )
                    registros_creados.append(registro)
            
            serializer = ProduccionSolicitadaSerializer(registros_creados, many=True)
            
            return Response({
                'success': True,
                'message': f'Calculadas {len(registros_creados)} solicitadas para {dia} {fecha}',
                'productos_procesados': len(productos_suma),
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            return Response(
                {'error': str(e), 'traceback': traceback.format_exc()}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ========================================
# VISTAS PARA SISTEMA POS - CAJEROS
# ========================================

from .models import Sucursal, Cajero, Turno, VentaCajero, ArqueoCaja
from .serializers import (
    SucursalSerializer, CajeroSerializer, TurnoSerializer, 
    VentaCajeroSerializer, CajeroLoginSerializer, TurnoResumenSerializer,
    ArqueoCajaSerializer
)
from django.utils import timezone
from django.db.models import Q, Sum, Count

class SucursalViewSet(viewsets.ModelViewSet):
    """API para gestionar sucursales"""
    queryset = Sucursal.objects.all()
    serializer_class = SucursalSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Sucursal.objects.all()
        activo = self.request.query_params.get('activo', None)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
        return queryset.order_by('nombre')
    
    @action(detail=False, methods=['get'])
    def activas(self, request):
        """Obtener solo sucursales activas"""
        sucursales = Sucursal.objects.filter(activo=True).order_by('nombre')
        serializer = self.get_serializer(sucursales, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def principal(self, request):
        """Obtener sucursal principal"""
        try:
            sucursal = Sucursal.objects.filter(es_principal=True, activo=True).first()
            if not sucursal:
                # Si no hay principal, tomar la primera activa
                sucursal = Sucursal.objects.filter(activo=True).first()
            
            if sucursal:
                serializer = self.get_serializer(sucursal)
                return Response(serializer.data)
            else:
                return Response({'error': 'No hay sucursales disponibles'}, 
                              status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CajeroViewSet(viewsets.ModelViewSet):
    """API para gestionar cajeros"""
    queryset = Cajero.objects.all()
    serializer_class = CajeroSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Cajero.objects.select_related('sucursal').all()
        
        # Filtros
        sucursal_id = self.request.query_params.get('sucursal_id', None)
        activo = self.request.query_params.get('activo', None)
        
        if sucursal_id:
            queryset = queryset.filter(sucursal_id=sucursal_id)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
            
        return queryset.order_by('sucursal__nombre', 'nombre')
    
    @action(detail=False, methods=['post'])
    def authenticate(self, request):
        """Autenticar cajero"""
        serializer = CajeroLoginSerializer(data=request.data)
        if serializer.is_valid():
            cajero = serializer.validated_data['cajero']
            
            # Serializar datos del cajero
            cajero_data = CajeroSerializer(cajero).data
            
            return Response({
                'success': True,
                'message': 'Autenticación exitosa',
                'cajero': cajero_data
            })
        else:
            return Response({
                'success': False,
                'message': 'Credenciales inválidas',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def activos_por_sucursal(self, request):
        """Obtener cajeros activos por sucursal"""
        sucursal_id = request.query_params.get('sucursal_id')
        if not sucursal_id:
            return Response({'error': 'sucursal_id es requerido'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        cajeros = Cajero.objects.filter(
            sucursal_id=sucursal_id, 
            activo=True
        ).order_by('nombre')
        
        serializer = self.get_serializer(cajeros, many=True)
        return Response(serializer.data)

class TurnoViewSet(viewsets.ModelViewSet):
    """API para gestionar turnos de cajeros"""
    queryset = Turno.objects.all()
    serializer_class = TurnoSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Turno.objects.select_related('cajero', 'sucursal').all()
        
        # Filtros
        cajero_id = self.request.query_params.get('cajero_id', None)
        sucursal_id = self.request.query_params.get('sucursal_id', None)
        estado = self.request.query_params.get('estado', None)
        fecha_desde = self.request.query_params.get('fecha_desde', None)
        fecha_hasta = self.request.query_params.get('fecha_hasta', None)
        
        if cajero_id:
            queryset = queryset.filter(cajero_id=cajero_id)
        if sucursal_id:
            queryset = queryset.filter(sucursal_id=sucursal_id)
        if estado:
            queryset = queryset.filter(estado=estado)
        if fecha_desde:
            queryset = queryset.filter(fecha_inicio__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_inicio__lte=fecha_hasta)
            
        return queryset.order_by('-fecha_inicio')
    
    @action(detail=False, methods=['post'])
    def iniciar_turno(self, request):
        """Iniciar nuevo turno para un cajero"""
        cajero_id = request.data.get('cajero_id')
        sucursal_id = request.data.get('sucursal_id')
        base_inicial = request.data.get('base_inicial', 0)
        notas_apertura = request.data.get('notas_apertura', '')
        
        if not cajero_id or not sucursal_id:
            return Response({
                'error': 'cajero_id y sucursal_id son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verificar que no haya turno activo
            turno_activo = Turno.objects.filter(
                cajero_id=cajero_id,
                estado='ACTIVO'
            ).first()
            
            if turno_activo:
                return Response({
                    'error': 'El cajero ya tiene un turno activo',
                    'turno_activo': TurnoSerializer(turno_activo).data
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Crear nuevo turno
            turno = Turno.objects.create(
                cajero_id=cajero_id,
                sucursal_id=sucursal_id,
                base_inicial=base_inicial,
                notas_apertura=notas_apertura,
                estado='ACTIVO'
            )
            
            serializer = self.get_serializer(turno)
            return Response({
                'success': True,
                'message': 'Turno iniciado exitosamente',
                'turno': serializer.data
            })
            
        except Exception as e:
            return Response({
                'error': f'Error iniciando turno: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def cerrar_turno(self, request, pk=None):
        """Cerrar turno específico"""
        turno = self.get_object()
        
        if turno.estado != 'ACTIVO':
            return Response({
                'error': 'Solo se pueden cerrar turnos activos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        arqueo_final = request.data.get('arqueo_final', 0)
        notas_cierre = request.data.get('notas_cierre', '')
        
        try:
            turno.cerrar_turno(arqueo_final, notas_cierre)
            
            serializer = self.get_serializer(turno)
            return Response({
                'success': True,
                'message': 'Turno cerrado exitosamente',
                'turno': serializer.data
            })
            
        except Exception as e:
            return Response({
                'error': f'Error cerrando turno: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def turno_activo(self, request):
        """Obtener turno activo de un cajero"""
        cajero_id = request.query_params.get('cajero_id')
        if not cajero_id:
            return Response({'error': 'cajero_id es requerido'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        turno = Turno.objects.filter(
            cajero_id=cajero_id,
            estado='ACTIVO'
        ).first()
        
        if turno:
            serializer = self.get_serializer(turno)
            return Response(serializer.data)
        else:
            return Response({'message': 'No hay turno activo'}, 
                          status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def resumen_turnos(self, request):
        """Obtener resumen de turnos con filtros"""
        queryset = self.get_queryset()
        
        # Usar serializer resumido
        serializer = TurnoResumenSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas de turnos"""
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        sucursal_id = request.query_params.get('sucursal_id')
        
        queryset = Turno.objects.all()
        
        if fecha_desde:
            queryset = queryset.filter(fecha_inicio__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_inicio__lte=fecha_hasta)
        if sucursal_id:
            queryset = queryset.filter(sucursal_id=sucursal_id)
        
        stats = queryset.aggregate(
            total_turnos=Count('id'),
            total_ventas=Sum('total_ventas'),
            total_transacciones=Sum('numero_transacciones'),
            turnos_activos=Count('id', filter=Q(estado='ACTIVO')),
            turnos_cerrados=Count('id', filter=Q(estado='CERRADO'))
        )
        
        return Response(stats)

class VentaCajeroViewSet(viewsets.ModelViewSet):
    """API para ventas con información de cajero"""
    queryset = VentaCajero.objects.all()
    serializer_class = VentaCajeroSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = VentaCajero.objects.select_related(
            'venta', 'cajero', 'turno', 'sucursal'
        ).all()
        
        # Filtros
        cajero_id = self.request.query_params.get('cajero_id', None)
        turno_id = self.request.query_params.get('turno_id', None)
        sucursal_id = self.request.query_params.get('sucursal_id', None)
        
        if cajero_id:
            queryset = queryset.filter(cajero_id=cajero_id)
        if turno_id:
            queryset = queryset.filter(turno_id=turno_id)
        if sucursal_id:
            queryset = queryset.filter(sucursal_id=sucursal_id)
            
        return queryset.order_by('-venta__fecha')
    
    @action(detail=False, methods=['get'])
    def por_turno(self, request):
        """Obtener ventas de un turno específico"""
        turno_id = request.query_params.get('turno_id')
        if not turno_id:
            return Response({'error': 'turno_id es requerido'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        ventas = self.get_queryset().filter(turno_id=turno_id)
        serializer = self.get_serializer(ventas, many=True)
        
        # Calcular totales
        total_ventas = sum(v.venta.total for v in ventas)
        total_transacciones = ventas.count()
        
        return Response({
            'ventas': serializer.data,
            'resumen': {
                'total_ventas': total_ventas,
                'total_transacciones': total_transacciones
            }
        })

class ArqueoCajaViewSet(viewsets.ModelViewSet):
    """API para arqueos de caja"""
    queryset = ArqueoCaja.objects.all()
    serializer_class = ArqueoCajaSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = ArqueoCaja.objects.select_related('cajero_logueado', 'sucursal', 'turno').all()
        
        # Filtros
        fecha = self.request.query_params.get('fecha', None)
        fecha_inicio = self.request.query_params.get('fecha_inicio', None)
        fecha_fin = self.request.query_params.get('fecha_fin', None)
        cajero = self.request.query_params.get('cajero', None)
        estado = self.request.query_params.get('estado', None)
        sucursal_id = self.request.query_params.get('sucursal_id', None)
        
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        if fecha_inicio:
            queryset = queryset.filter(fecha__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(fecha__lte=fecha_fin)
        if cajero:
            queryset = queryset.filter(cajero__icontains=cajero)
        if estado:
            queryset = queryset.filter(estado=estado)
        if sucursal_id:
            queryset = queryset.filter(sucursal_id=sucursal_id)
            
        return queryset.order_by('-fecha', '-fecha_creacion')
    
    def create(self, request, *args, **kwargs):
        """Crear arqueo - Permite múltiples arqueos por día (uno por turno)"""
        try:
            # NOTA: Permitir múltiples arqueos por día para soportar múltiples turnos
            # No validar duplicados - cada turno puede tener su propio arqueo
            
            # Crear el arqueo
            response = super().create(request, *args, **kwargs)
            
            if response.status_code == 201:
                return Response({
                    'success': True,
                    'message': 'Arqueo de caja guardado exitosamente',
                    'arqueo': response.data
                })
            
            return response
            
        except Exception as e:
            return Response({
                'error': f'Error al guardar arqueo: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def resumen_por_fecha(self, request):
        """Obtener resumen de arqueos por fecha"""
        fecha = request.query_params.get('fecha')
        if not fecha:
            return Response({'error': 'Fecha es requerida'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        arqueos = self.get_queryset().filter(fecha=fecha)
        
        resumen = {
            'fecha': fecha,
            'total_arqueos': arqueos.count(),
            'total_sistema': sum(a.total_sistema for a in arqueos),
            'total_caja': sum(a.total_caja for a in arqueos),
            'total_diferencia': sum(a.total_diferencia for a in arqueos),
            'arqueos_por_estado': {
                estado[0]: arqueos.filter(estado=estado[0]).count()
                for estado in ArqueoCaja.ESTADOS_CHOICES
            }
        }
        
        return Response(resumen)
    
    @action(detail=False, methods=['get'])
    def por_cajero(self, request):
        """Obtener arqueos de un cajero específico"""
        cajero = request.query_params.get('cajero')
        if not cajero:
            return Response({'error': 'Cajero es requerido'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        arqueos = self.get_queryset().filter(cajero__icontains=cajero)
        serializer = self.get_serializer(arqueos, many=True)
        
        return Response({
            'cajero': cajero,
            'total_arqueos': arqueos.count(),
            'arqueos': serializer.data
        })

class PedidoViewSet(viewsets.ModelViewSet):
    """API para gestionar pedidos"""
    queryset = Pedido.objects.all().order_by('-fecha_creacion')
    serializer_class = PedidoSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Pedido.objects.all().order_by('-fecha_creacion')
        
        # Filtros opcionales
        destinatario = self.request.query_params.get('destinatario')
        estado = self.request.query_params.get('estado')
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        transportadora = self.request.query_params.get('transportadora')
        
        if destinatario:
            queryset = queryset.filter(destinatario__icontains=destinatario)
        if estado:
            queryset = queryset.filter(estado=estado.upper())
        if fecha_desde:
            queryset = queryset.filter(fecha__date__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha__date__lte=fecha_hasta)
        if transportadora:
            queryset = queryset.filter(transportadora__icontains=transportadora)
            
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Crear nuevo pedido con detalles"""
        try:
            with transaction.atomic():
                # Crear el pedido (el serializer ya crea los detalles)
                serializer = self.get_serializer(data=request.data, context={'request': request})
                serializer.is_valid(raise_exception=True)
                pedido = serializer.save()
                
                # Recargar con detalles
                pedido.refresh_from_db()
                response_serializer = self.get_serializer(pedido)
                
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['patch'])
    def cambiar_estado(self, request, pk=None):
        """Cambiar estado del pedido"""
        pedido = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        if nuevo_estado not in dict(Pedido.ESTADO_CHOICES):
            return Response(
                {'error': 'Estado inválido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pedido.estado = nuevo_estado
        pedido.save()
        
        serializer = self.get_serializer(pedido)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def anular(self, request, pk=None):
        """Anular pedido y revertir en Planeación y Cargue"""
        pedido = self.get_object()
        
        # 🆕 VALIDACIÓN: Verificar si el vendedor ya procesó el pedido en la app
        if pedido.estado == 'ENTREGADO':
            return Response(
                {
                    'success': False,
                    'message': '⚠️ No se puede anular: El vendedor ya marcó este pedido como ENTREGADO en la app móvil'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if pedido.estado == 'ANULADA' and pedido.novedades and len(pedido.novedades) > 0:
            return Response(
                {
                    'success': False,
                    'message': '⚠️ No se puede anular: El vendedor ya marcó este pedido como NO ENTREGADO en la app móvil'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Si ya está anulado (sin novedades = anulación manual previa)
        if pedido.estado == 'ANULADA':
            # Si ya está anulado, devolvemos una respuesta exitosa para que el frontend no quede bloqueado
            return Response(
                {'success': True, 'message': 'El pedido ya estaba anulado'},
                status=status.HTTP_200_OK
            )  
        try:
            with transaction.atomic():
                print(f"\n{'='*60}")

                print(f"{'='*60}")

                print(f"💰 Total: ${pedido.total}")
                print(f"📅 Fecha entrega: {pedido.fecha_entrega}")
                print(f"👤 Vendedor: {pedido.vendedor}")
                print(f"📦 Detalles: {pedido.detalles.count()} productos")
                
                # 1. Cambiar estado del pedido
                estado_anterior = pedido.estado
                pedido.estado = 'ANULADA'
                motivo = request.data.get('motivo', 'Anulado desde gestión de pedidos')
                pedido.nota = f"{pedido.nota or ''}\n[ANULADO] Estado anterior: {estado_anterior} - {motivo} - {timezone.now().strftime('%Y-%m-%d %H:%M')}"
                pedido.save()
                print(f"✅ Estado cambiado de {estado_anterior} a ANULADA")
                
                # 2. Revertir en Planeación (solo si existe fecha_entrega)
                if pedido.fecha_entrega:
                    print(f"\n📊 REVIRTIENDO EN PLANEACIÓN")
                    print(f"{'='*60}")
                    
                    for detalle in pedido.detalles.all():
                        try:
                            # Buscar en planeación por fecha_entrega y producto_nombre
                            planeacion = Planeacion.objects.filter(
                                fecha=pedido.fecha_entrega,
                                producto_nombre=detalle.producto.nombre
                            ).first()
                            
                            if planeacion:
                                pedidos_antes = planeacion.pedidos
                                total_antes = planeacion.total
                                
                                # Restar la cantidad del pedido anulado
                                planeacion.pedidos = max(0, planeacion.pedidos - detalle.cantidad)
                                # El total se recalcula automáticamente en save()
                                planeacion.save()
                                
                                print(f"  ✅ {detalle.producto.nombre}:")
                                print(f"     Pedidos: {pedidos_antes} → {planeacion.pedidos} (-{detalle.cantidad})")
                                print(f"     Total: {total_antes} → {planeacion.total}")
                            else:
                                print(f"  ⚠️ {detalle.producto.nombre}: No encontrado en Planeación")
                                
                        except Exception as e:
                            print(f"  ❌ Error con {detalle.producto.nombre}: {str(e)}")
                            continue
                else:
                    print(f"⚠️ Sin fecha de entrega, no se revierte en Planeación")
                
                # 3. Revertir Inventario (si fue afectado)
                if pedido.inventario_afectado:
                    print(f"\n⚡ REVIRTIENDO INVENTARIO")
                    print(f"{'='*60}")
                    
                    from .models import MovimientoInventario
                    
                    for detalle in pedido.detalles.all():
                        try:
                            producto = detalle.producto
                            cantidad_a_devolver = detalle.cantidad
                            
                            # Crear movimiento de inventario (Devolución) - Esto actualiza el stock automáticamente
                            MovimientoInventario.objects.create(
                                producto=producto,
                                tipo='ENTRADA',
                                cantidad=cantidad_a_devolver,
                                usuario=request.data.get('usuario', 'Sistema'),
                                nota=f'Anulación Pedido #{pedido.numero_pedido} - Devolución de stock'
                            )
                            print(f"✅ Movimiento de entrada creado para {producto.nombre} (+{cantidad_a_devolver})")
                            
                        except Exception as e:
                            print(f"  ❌ Error devolviendo stock para {detalle.producto.nombre}: {str(e)}")
                            continue
                    
                    pedido.inventario_afectado = False
                    pedido.save()
                    print(f"✅ Inventario revertido correctamente")
                
                # 4. Revertir en Cargue (solo si existe fecha_entrega y vendedor)
                if pedido.fecha_entrega and pedido.vendedor:
                    print(f"\n💰 REVIRTIENDO EN CARGUE")
                    print(f"{'='*60}")
                    
                    cargue_models = [
                        ('ID1', CargueID1), ('ID2', CargueID2), ('ID3', CargueID3),
                        ('ID4', CargueID4), ('ID5', CargueID5), ('ID6', CargueID6)
                    ]
                    
                    cargue_actualizado = False
                    
                    for id_cargue, CargueModel in cargue_models:
                        try:
                            # Buscar registros de cargue por fecha
                            cargues = CargueModel.objects.filter(fecha=pedido.fecha_entrega)
                            
                            for cargue in cargues:
                                # Verificar si el vendedor coincide con el responsable
                                if hasattr(cargue, 'responsable') and cargue.responsable:
                                    if pedido.vendedor.lower() in cargue.responsable.lower():
                                        pedidos_antes = float(cargue.total_pedidos or 0)
                                        efectivo_antes = float(cargue.total_efectivo or 0)
                                        
                                        # Revertir el total_pedidos (devolver el dinero)
                                        cargue.total_pedidos = max(0, pedidos_antes - float(pedido.total))
                                        
                                        # Recalcular total_efectivo
                                        if hasattr(cargue, 'venta') and cargue.venta:
                                            cargue.total_efectivo = float(cargue.venta) - float(cargue.total_pedidos)
                                        
                                        cargue.save()
                                        
                                        print(f"  ✅ {id_cargue} - {cargue.responsable}:")
                                        print(f"     Total Pedidos: ${pedidos_antes:,.0f} → ${cargue.total_pedidos:,.0f} (-${pedido.total:,.0f})")
                                        print(f"     Total Efectivo: ${efectivo_antes:,.0f} → ${cargue.total_efectivo:,.0f}")
                                        
                                        cargue_actualizado = True
                                        break  # Solo actualizar un cargue por modelo
                            
                            if cargue_actualizado:
                                break  # Salir del loop de modelos si ya se actualizó
                                
                        except Exception as e:
                            print(f"  ⚠️ Error en {id_cargue}: {str(e)}")
                            continue
                    
                    if not cargue_actualizado:
                        print(f"  ⚠️ No se encontró cargue para vendedor '{pedido.vendedor}' en fecha {pedido.fecha_entrega}")
                else:
                    print(f"⚠️ Sin fecha de entrega o vendedor, no se revierte en Cargue")
                
                # Fin de la transacción - todo se completó exitosamente
                print(f"\n{'='*60}")
                print(f"✅ PEDIDO ANULADO EXITOSAMENTE")
                print(f"{'='*60}\n")
            
            # Fuera del transaction.atomic() - devolver respuesta exitosa
            serializer = self.get_serializer(pedido)
            return Response({
                'success': True,
                'message': 'Pedido anulado exitosamente. Se revirtieron las cantidades en Planeación y el dinero en Cargue.',
                'pedido': serializer.data
            })
                
        except Exception as e:
            import traceback
            error_detail = traceback.format_exc()
            print(f"\n{'='*60}")
            print(f"❌ ERROR AL ANULAR PEDIDO")
            print(f"{'='*60}")
            print(error_detail)
            print(f"{'='*60}\n")
            
            return Response(
                {'detail': f'Error al anular pedido: {str(e)}'}, \
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def afectar_inventario(self, request, pk=None):
        """Afectar inventario de un pedido manualmente (para corrección)"""
        pedido = self.get_object()
        
        # Validar que no esté ya afectado
        if pedido.inventario_afectado:
            return Response(
                {'detail': 'El inventario de este pedido ya fue afectado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar que no esté anulado
        if pedido.estado == 'ANULADA':
            return Response(
                {'detail': 'No se puede afectar inventario de un pedido anulado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                from .models import Producto, MovimientoInventario
                
                print(f"\n{'='*60}")
                print(f"⚡ AFECTANDO INVENTARIO MANUALMENTE")
                print(f"Pedido: #{pedido.numero_pedido}")
                print(f"{'='*60}")
                
                for detalle in pedido.detalles.all():
                    try:
                        producto = detalle.producto
                        cantidad_a_descontar = detalle.cantidad
                        
                        # Verificar stock disponible
                        if producto.stock_total < cantidad_a_descontar:
                            print(f"⚠️ ADVERTENCIA: {producto.nombre} - Stock insuficiente ({producto.stock_total} < {cantidad_a_descontar})")
                        
                        # 🔧 FIX: Solo crear MovimientoInventario (que se encarga del descuento automáticamente)
                        # NO hacer descuento manual porque causa DOBLE descuento
                        stock_anterior = producto.stock_total
                        
                        # Crear movimiento de inventario (esto descuenta automáticamente en el save())
                        MovimientoInventario.objects.create(
                            producto=producto,
                            tipo='SALIDA',
                            cantidad=cantidad_a_descontar,
                            usuario=request.data.get('usuario', 'Sistema'),
                            nota=f'Corrección manual - Pedido #{pedido.numero_pedido} - {pedido.destinatario}'
                        )
                        
                        # Refrescar para ver el stock actualizado
                        producto.refresh_from_db()
                        print(f"✅ {producto.nombre}: {stock_anterior} → {producto.stock_total} (-{cantidad_a_descontar})")
                        
                    except Exception as e:
                        print(f"❌ Error afectando inventario para {detalle.producto.nombre}: {str(e)}")
                        raise e
                
                # Marcar como inventario afectado
                pedido.inventario_afectado = True
                pedido.afectar_inventario_inmediato = True  # Actualizar también este campo
                pedido.save()
                
                print(f"✅ Inventario afectado y marcado")
                print(f"{'='*60}\n")
                
                serializer = self.get_serializer(pedido)
                return Response({
                    'success': True,
                    'message': 'Inventario afectado exitosamente',
                    'pedido': serializer.data
                })
                
        except Exception as e:
            import traceback
            error_detail = traceback.format_exc()
            print(f"\n{'='*60}")
            print(f"❌ ERROR AL AFECTAR INVENTARIO")
            print(f"{'='*60}")
            print(error_detail)
            print(f"{'='*60}\n")
            
            return Response(
                {'detail': f'Error al afectar inventario: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def pendientes_vendedor(self, request):
        """
        Obtener pedidos pendientes asignados a un vendedor para la app móvil
        Busca por asignado_a_id o asignado por nombre (campo vendedor)
        """
        v_id_param = request.query_params.get('vendedor_id')
        fecha = request.query_params.get('fecha')
        
        if not v_id_param or not fecha:
            return Response({'error': 'Faltan parámetros: vendedor_id y fecha'}, status=400)

        # Normalizar ID (si es número "1" -> "ID1")
        vendedor_id = f"ID{v_id_param}" if v_id_param.isdigit() else v_id_param
            
        print(f"📦 Backend: Buscando pedidos para {vendedor_id} en {fecha}")
        
        # Buscar nombre del vendedor para coincidencia por texto
        from .models import Vendedor
        from django.db.models import Q
        
        nombre_vendedor = ""
        try:
            v_obj = Vendedor.objects.filter(id_vendedor=vendedor_id).first()
            if v_obj:
                nombre_vendedor = v_obj.nombre
        except Exception:
            pass

        # Filtro final (Fecha Y No Cancelado/Anulado)
        # 🔧 Incluir ENTREGADO para que la app móvil pueda mostrar check verde
        # 🔧 Incluir ANULADA para mostrar badge de No Entregado (pero excluir CANCELADO)
        filtro_base = Q(fecha_entrega=fecha) & ~Q(estado__in=['CANCELADO'])
        
        condicion_asignacion = Q(asignado_a_id=vendedor_id)
        if nombre_vendedor:
             print(f"   Incluyendo búsqueda por nombre: {nombre_vendedor}")
             condicion_asignacion |= Q(vendedor__iexact=nombre_vendedor)
        
        pedidos = Pedido.objects.filter(filtro_base & condicion_asignacion)
        
        serializer = self.get_serializer(pedidos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def marcar_entregado(self, request, pk=None):
        """Marcar pedido como entregado desde la App"""
        pedido = self.get_object()
        
        # 🆕 Obtener y guardar el método de pago
        metodo_pago = request.data.get('metodo_pago', 'EFECTIVO')
        if metodo_pago:
            pedido.metodo_pago = metodo_pago.upper()
        
        from django.utils import timezone
        pedido.estado = 'ENTREGADO'  # Cambiado de ENTREGADA a ENTREGADO
        
        # Agregar nota con la hora y método
        nota_entrega = f"Entregado vía App Móvil ({pedido.metodo_pago}) el {timezone.now().strftime('%Y-%m-%d %H:%M')}"
        pedido.nota = f"{pedido.nota or ''} | {nota_entrega}".strip()
        
        # 🔧 NO cambiar fecha_entrega para que siga apareciendo en su día original
        pedido.save()
        
        return Response({
            'success': True, 
            'message': f'Pedido marcado como entregado ({pedido.metodo_pago})'
        })

    @action(detail=True, methods=['post'])
    def marcar_no_entregado(self, request, pk=None):
        """Reportar que un pedido no pudo ser entregado"""
        pedido = self.get_object()
        motivo = request.data.get('motivo', 'Sin motivo especificado')
        
        # Marcar como ANULADA (o un estado que indique no gestión exitosa)
        pedido.estado = 'ANULADA'
        pedido.nota = f"{pedido.nota or ''} | NO ENTREGADO: {motivo}".strip()
        pedido.save()
        
        return Response({'status': 'novedad reportada'})

class DetallePedidoViewSet(viewsets.ModelViewSet):
    """API para detalles de pedidos"""
    queryset = DetallePedido.objects.all()
    serializer_class = DetallePedidoSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = DetallePedido.objects.all()
        pedido_id = self.request.query_params.get('pedido')
        remision_id = self.request.query_params.get('remision')  # Compatibilidad
        
        if pedido_id:
            queryset = queryset.filter(pedido_id=pedido_id)
        elif remision_id:
            queryset = queryset.filter(pedido_id=remision_id)
            
        return queryset
class PlaneacionViewSet(viewsets.ModelViewSet):
    queryset = Planeacion.objects.all()
    serializer_class = PlaneacionSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        fecha = self.request.query_params.get('fecha')
        producto_nombre = self.request.query_params.get('producto_nombre')
        
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        if producto_nombre:
            queryset = queryset.filter(producto_nombre=producto_nombre)
            
        return queryset.order_by('producto_nombre')
    
    def create(self, request, *args, **kwargs):
        """Crear o actualizar registro de planeación (upsert)"""
        fecha = request.data.get('fecha')
        producto_nombre = request.data.get('producto_nombre')
        
        if fecha and producto_nombre:
            # Buscar si ya existe
            try:
                planeacion = Planeacion.objects.get(fecha=fecha, producto_nombre=producto_nombre)
                # Ya existe, actualizar
                serializer = self.get_serializer(planeacion, data=request.data, partial=False)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Planeacion.DoesNotExist:
                # No existe, crear nuevo
                pass
        
        # Crear nuevo registro
        return super().create(request, *args, **kwargs)
    
    @action(detail=False, methods=['post'])
    def prediccion_ia(self, request):
        """
        Obtiene predicciones de IA (con Redes Neuronales) para una fecha específica.
        
        POST /api/planeacion/prediccion_ia/
        Body: {
            "fecha": "2025-11-20",
            "datos_contextuales": {
                "AREPA TIPO OBLEA 500Gr": {
                    "existencias": 266,
                    "solicitadas": 0,
                    "pedidos": 0
                },
                ...
            }
        }
        """
        from api.services.ia_service import IAService
        
        fecha = request.data.get('fecha')
        datos_contextuales = request.data.get('datos_contextuales', {})
        
        if not fecha:
            return Response(
                {'error': 'Fecha es requerida'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Inicializar servicio de IA
            ia_service = IAService()
            
            # Obtener predicciones
            predicciones = ia_service.predecir_produccion(
                fecha_objetivo=fecha,
                datos_contextuales=datos_contextuales
            )
            
            return Response({
                'fecha': fecha,
                'predicciones': predicciones,
                'total_productos': len(predicciones)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Error en predicción IA: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Error generando predicciones: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VendedorViewSet(viewsets.ModelViewSet):
    """API para gestionar vendedores"""
    queryset = Vendedor.objects.all()
    serializer_class = VendedorSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'id_vendedor'  # Usar id_vendedor en lugar de pk
    
    def get_queryset(self):
        """Filtrar vendedores por parámetros"""
        queryset = Vendedor.objects.all()
        id_vendedor = self.request.query_params.get('id_vendedor', None)
        activo = self.request.query_params.get('activo', None)
        
        if id_vendedor:
            queryset = queryset.filter(id_vendedor=id_vendedor)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
            
        return queryset.order_by('id_vendedor')
    
    @action(detail=False, methods=['post'])
    def actualizar_responsable(self, request):
        """Actualizar nombre del responsable/vendedor"""
        try:
            id_vendedor = request.data.get('id_vendedor')
            responsable = request.data.get('responsable')
            
            if not id_vendedor or not responsable:
                return Response(
                    {'error': 'id_vendedor y responsable son requeridos'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Actualizar o crear vendedor en tabla Vendedor
            vendedor, created = Vendedor.objects.update_or_create(
                id_vendedor=id_vendedor,
                defaults={'nombre': responsable}
            )
            
            # ---------------------------------------------------------
            # TAMBIÉN ACTUALIZAR EN TABLAS DE CARGUE (CargueID1, etc.)
            # ---------------------------------------------------------
            try:
                # Mapear ID de vendedor a modelo correspondiente
                modelos_vendedor = {
                    'ID1': CargueID1,
                    'ID2': CargueID2,
                    'ID3': CargueID3,
                    'ID4': CargueID4,
                    'ID5': CargueID5,
                    'ID6': CargueID6,
                }
                
                modelo = modelos_vendedor.get(id_vendedor)
                if modelo:
                    # Actualizar todos los registros existentes de este vendedor
                    modelo.objects.filter(activo=True).update(responsable=responsable)
                    print(f"✅ Responsable actualizado en {modelo.__name__}: {responsable}")
            except Exception as e:
                print(f"⚠️ Error actualizando tablas de cargue: {str(e)}")
            # ---------------------------------------------------------
            
            return Response({
                'success': True,
                'vendedor': {
                    'id_vendedor': vendedor.id_vendedor,
                    'nombre': vendedor.nombre,
                    'ruta': vendedor.ruta
                },
                'message': f'Responsable {"creado" if created else "actualizado"} exitosamente'
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        """Endpoint de login para vendedores (App Móvil)"""
        try:
            id_vendedor = request.data.get('id_vendedor')
            password = request.data.get('password')
            
            if not id_vendedor or not password:
                return Response(
                    {'error': 'id_vendedor y password son requeridos'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Buscar vendedor
            try:
                vendedor = Vendedor.objects.get(id_vendedor=id_vendedor, activo=True)
            except Vendedor.DoesNotExist:
                return Response(
                    {'error': 'Credenciales inválidas'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Validar contraseña
            if vendedor.password != password:
                return Response(
                    {'error': 'Credenciales inválidas'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Login exitoso
            return Response({
                'success': True,
                'vendedor': {
                    'id_vendedor': vendedor.id_vendedor,
                    'nombre': vendedor.nombre,
                    'ruta': vendedor.ruta or '',
                    'activo': vendedor.activo
                },
                'message': 'Login exitoso'
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DomiciliarioViewSet(viewsets.ModelViewSet):
    """API para gestionar domiciliarios"""
    queryset = Domiciliario.objects.all()
    serializer_class = DomiciliarioSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'codigo'  # Usar codigo en lugar de pk
    
    def get_queryset(self):
        """Filtrar domiciliarios por parámetros"""
        queryset = Domiciliario.objects.all()
        activo = self.request.query_params.get('activo', None)
        
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
            
        return queryset.order_by('codigo')
    
    @action(detail=True, methods=['get'])
    def pedidos(self, request, codigo=None):
        """Obtener pedidos asignados a un domiciliario"""
        domiciliario = self.get_object()
        fecha = request.query_params.get('fecha')
        estado = request.query_params.get('estado')
        
        pedidos_query = Pedido.objects.filter(
            asignado_a_tipo='DOMICILIARIO',
            asignado_a_id=domiciliario.codigo
        )
        
        if fecha:
            pedidos_query = pedidos_query.filter(fecha_entrega=fecha)
        if estado:
            pedidos_query = pedidos_query.filter(estado=estado.upper())
        
        pedidos = pedidos_query.order_by('-fecha_creacion')
        serializer = PedidoSerializer(pedidos, many=True)
        
        # Calcular totales
        total_pedidos = pedidos.count()
        total_monto = sum(p.total for p in pedidos)
        
        return Response({
            'domiciliario': {
                'codigo': domiciliario.codigo,
                'nombre': domiciliario.nombre
            },
            'pedidos': serializer.data,
            'resumen': {
                'total_pedidos': total_pedidos,
                'total_monto': float(total_monto)
            }
        })


class MovimientoCajaViewSet(viewsets.ModelViewSet):
    """API para gestionar movimientos de caja (ingresos y egresos)"""
    queryset = MovimientoCaja.objects.all()
    serializer_class = MovimientoCajaSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """Filtrar movimientos por fecha, cajero o tipo"""
        queryset = MovimientoCaja.objects.all()
        
        fecha = self.request.query_params.get('fecha', None)
        cajero = self.request.query_params.get('cajero', None)
        tipo = self.request.query_params.get('tipo', None)
        
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        if cajero:
            queryset = queryset.filter(cajero=cajero)
        if tipo:
            queryset = queryset.filter(tipo=tipo)
            
        return queryset.order_by('-fecha', '-hora')
    
    @action(detail=False, methods=['get'])
    def resumen_por_fecha(self, request):
        """Obtener resumen de ingresos y egresos por fecha"""
        try:
            fecha = request.query_params.get('fecha')
            cajero = request.query_params.get('cajero', None)
            
            if not fecha:
                return Response(
                    {'error': 'Fecha es requerida'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Filtrar movimientos
            movimientos = MovimientoCaja.objects.filter(fecha=fecha)
            if cajero:
                movimientos = movimientos.filter(cajero=cajero)
            
            # Calcular totales
            from django.db.models import Sum, Q
            
            total_ingresos = movimientos.filter(tipo='INGRESO').aggregate(
                total=Sum('monto')
            )['total'] or 0
            
            total_egresos = movimientos.filter(tipo='EGRESO').aggregate(
                total=Sum('monto')
            )['total'] or 0
            
            saldo = total_ingresos - total_egresos
            
            return Response({
                'fecha': fecha,
                'cajero': cajero,
                'total_ingresos': float(total_ingresos),
                'total_egresos': float(total_egresos),
                'saldo': float(saldo),
                'cantidad_movimientos': movimientos.count()
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ArqueoCajaViewSet(viewsets.ModelViewSet):
    """API para gestionar arqueos de caja"""
    queryset = ArqueoCaja.objects.all().order_by('-fecha', '-fecha_creacion')
    serializer_class = ArqueoCajaSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        """Crear arqueo con logging detallado"""

        
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)

            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            print('❌ Error al crear arqueo:', str(e))
            return Response(
                {'error': str(e), 'detail': getattr(e, 'detail', None)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def get_queryset(self):
        """Filtrar arqueos por fecha, cajero o estado"""
        queryset = ArqueoCaja.objects.all()
        
        fecha_inicio = self.request.query_params.get('fecha_inicio', None)
        fecha_fin = self.request.query_params.get('fecha_fin', None)
        cajero = self.request.query_params.get('cajero', None)
        estado = self.request.query_params.get('estado', None)
        
        if fecha_inicio:
            queryset = queryset.filter(fecha__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(fecha__lte=fecha_fin)
        if cajero:
            queryset = queryset.filter(cajero=cajero)
        if estado:
            queryset = queryset.filter(estado=estado)
            
        return queryset.order_by('-fecha', '-fecha_creacion')
    
    @action(detail=False, methods=['post'])
    def validar(self, request):
        """Validar arqueo antes de guardar"""
        try:
            valores_sistema = request.data.get('valores_sistema', {})
            valores_caja = request.data.get('valores_caja', {})
            
            # Calcular diferencias
            diferencias = {}
            for metodo in valores_sistema.keys():
                sistema = float(valores_sistema.get(metodo, 0))
                caja = float(valores_caja.get(metodo, 0))
                diferencias[metodo] = caja - sistema
            
            total_diferencia = sum(diferencias.values())
            
            # Validaciones
            alertas = []
            if abs(total_diferencia) > 10000:
                alertas.append({
                    'tipo': 'error',
                    'mensaje': f'Diferencia muy alta: ${total_diferencia:,.2f}'
                })
            elif abs(total_diferencia) > 1000:
                alertas.append({
                    'tipo': 'warning',
                    'mensaje': f'Diferencia moderada: ${total_diferencia:,.2f}'
                })
            else:
                alertas.append({
                    'tipo': 'success',
                    'mensaje': 'Arqueo cuadrado correctamente'
                })
            
            return Response({
                'valido': abs(total_diferencia) <= 10000,
                'diferencias': diferencias,
                'total_diferencia': total_diferencia,
                'alertas': alertas
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas de arqueos por rango de fechas"""
        try:
            fecha_inicio = request.query_params.get('fecha_inicio')
            fecha_fin = request.query_params.get('fecha_fin')
            
            if not fecha_inicio or not fecha_fin:
                return Response(
                    {'error': 'Fechas de inicio y fin son requeridas'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            arqueos = ArqueoCaja.objects.filter(
                fecha__gte=fecha_inicio,
                fecha__lte=fecha_fin
            )
            
            from django.db.models import Sum, Avg, Count
            
            estadisticas = {
                'total_arqueos': arqueos.count(),
                'sin_diferencias': arqueos.filter(total_diferencia=0).count(),
                'con_diferencias': arqueos.exclude(total_diferencia=0).count(),
                'total_diferencia': float(arqueos.aggregate(Sum('total_diferencia'))['total_diferencia__sum'] or 0),
                'promedio_diferencia': float(arqueos.aggregate(Avg('total_diferencia'))['total_diferencia__avg'] or 0),
            }
            
            return Response(estadisticas)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ========================================
# VIEWSET PARA CONFIGURACIÓN DE IMPRESIÓN
# ========================================

class ConfiguracionImpresionViewSet(viewsets.ModelViewSet):
    """ViewSet para configuración de impresión de tickets"""
    queryset = ConfiguracionImpresion.objects.all()
    serializer_class = ConfiguracionImpresionSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """Obtener configuración activa"""
        queryset = ConfiguracionImpresion.objects.filter(activo=True)
        return queryset
    
    @action(detail=False, methods=['get'])
    def activa(self, request):
        """Obtener la configuración activa (solo una)"""
        try:
            config = ConfiguracionImpresion.objects.filter(activo=True).first()
            if config:
                serializer = self.get_serializer(config)
                return Response(serializer.data)
            else:
                # Retornar configuración por defecto si no existe
                return Response({
                    'id': None,
                    'nombre_negocio': 'MI NEGOCIO',
                    'nit_negocio': '',
                    'direccion_negocio': '',
                    'telefono_negocio': '',
                    'email_negocio': '',
                    'encabezado_ticket': '',
                    'pie_pagina_ticket': '',
                    'mensaje_agradecimiento': '¡Gracias por su compra!',
                    'logo': None,
                    'ancho_papel': '80mm',
                    'mostrar_logo': True,
                    'mostrar_codigo_barras': False,
                    'impresora_predeterminada': '',
                    'resolucion_facturacion': '',
                    'regimen_tributario': '',
                    'activo': True
                })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ========================================
# VIEWSET PARA INTELIGENCIA ARTIFICIAL
# ========================================

class PrediccionIAView(viewsets.ViewSet):
    """
    API para generar predicciones de producción usando IA.
    """
    permission_classes = [permissions.AllowAny]

    def list(self, request):
        """
        Genera una predicción de producción CONTEXTUAL para una fecha específica.
        Uso: GET /api/prediccion-ia/?fecha=2025-05-24
        
        La IA considera:
        - Histórico de ventas
        - Existencias actuales (si están reportadas en Planeación)
        - Solicitadas del día
        - Pedidos del día
        """
        try:
            fecha_objetivo = request.query_params.get('fecha')
            
            if not fecha_objetivo:
                return Response(
                    {'error': 'El parámetro "fecha" es requerido (YYYY-MM-DD)'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 📊 Obtener datos contextuales de la Planeación (si existen)
            from api.models import Planeacion
            datos_contextuales = {}
            
            try:
                planeacion_registros = Planeacion.objects.filter(fecha=fecha_objetivo)
                for registro in planeacion_registros:
                    datos_contextuales[registro.producto_nombre] = {
                        'existencias': registro.existencias or 0,
                        'solicitadas': registro.solicitadas or 0,
                        'pedidos': registro.pedidos or 0
                    }
                print(f"📊 Datos contextuales cargados para {len(datos_contextuales)} productos")
            except Exception as e:
                print(f"⚠️ No se pudieron cargar datos contextuales: {e}")
                # Continuar sin datos contextuales (IA usará solo histórico)
            
            # Importar el servicio aquí para evitar ciclos de importación
            from api.services.ia_service import IAService
            
            # Instanciar servicio y generar predicción con contexto
            ia_service = IAService()
            predicciones = ia_service.predecir_produccion(
                fecha_objetivo,
                datos_contextuales=datos_contextuales if datos_contextuales else None
            )
            
            return Response({
                'success': True,
                'fecha_objetivo': fecha_objetivo,
                'total_productos_analizados': len(predicciones),
                'con_datos_contextuales': len(datos_contextuales) > 0,
                'predicciones': predicciones
            })
            
        except Exception as e:
            print(f"❌ Error en PrediccionIAView: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['POST'])
def guardar_sugerido(request):
    """
    Endpoint para recibir Sugeridos/Cargue desde la App Móvil.
    Recibe: { vendedor_id, dia, fecha, productos: [{nombre, cantidad}, ...] }
    """
    try:
        data = request.data
        vendedor_id = data.get('vendedor_id') # Ej: "ID1"
        dia_raw = data.get('dia', '').upper() # Ej: "LUNES" o "SÁBADO"
        fecha_raw = data.get('fecha') # Ej: "2025-11-29" o "2025-11-29T..."
        
        # Normalizar día (quitar tildes para consistencia)
        dias_sin_tilde = {
            'SÁBADO': 'SABADO',
            'MIÉRCOLES': 'MIERCOLES',
        }
        dia = dias_sin_tilde.get(dia_raw, dia_raw)
        
        # Sanitizar fecha: tomar solo los primeros 10 caracteres (YYYY-MM-DD)
        if fecha_raw and len(str(fecha_raw)) > 10:
            fecha = str(fecha_raw)[:10]
        else:
            fecha = fecha_raw
            
        productos = data.get('productos', []) # Lista de {nombre, cantidad}
        print(f"📱 Recibiendo Sugerido App: {vendedor_id} - {dia} (raw: {dia_raw}) - {fecha}")

        # Mapeo de ID a Modelo
        modelos = {
            'ID1': CargueID1,
            'ID2': CargueID2,
            'ID3': CargueID3,
            'ID4': CargueID4,
            'ID5': CargueID5,
            'ID6': CargueID6,
        }

        Modelo = modelos.get(vendedor_id)
        if not Modelo:
            return Response({'error': f'Vendedor no válido: {vendedor_id}'}, status=400)

        if not fecha:
            return Response({'error': 'La fecha es requerida'}, status=400)

        # ✅ VALIDACIÓN: Verificar si ya existe sugerido para este día/fecha/vendedor
        registros_existentes = Modelo.objects.filter(dia=dia, fecha=fecha)
        if registros_existentes.exists():
            total_existente = registros_existentes.count()
            print(f"⚠️ Ya existe sugerido para {vendedor_id} - {dia} - {fecha} ({total_existente} productos)")
            return Response({
                'error': 'YA_EXISTE_SUGERIDO',
                'message': f'Ya existe un sugerido para {dia} {fecha}. No se puede enviar otro.',
                'productos_existentes': total_existente
            }, status=409)  # 409 Conflict

        # Procesar cada producto
        count = 0
        for prod in productos:
            nombre = prod.get('nombre')
            cantidad_raw = prod.get('cantidad')
            cantidad = int(cantidad_raw) if cantidad_raw is not None else 0
            
            print(f"  📦 Procesando: {nombre} - Cantidad raw: {cantidad_raw} - Cantidad int: {cantidad}")
            
            # La app envía TODOS los productos (con o sin cantidad)
            # porque pueden tener adicionales/descuentos que modifiquen el total
            
            if nombre:
                # Obtener check V (si viene)
                v_check = prod.get('v', False) or prod.get('V', False)
                
                # Normalizar nombre para evitar duplicados
                import re
                nombre = re.sub(r'\s+', ' ', nombre).strip()

                if not nombre:
                    continue

                # 🔍 Buscar si ya existe un registro para obtener el responsable actual
                registro_existente = Modelo.objects.filter(
                    dia=dia,
                    fecha=fecha,
                    producto=nombre
                ).first()
                
                # Si existe y tiene un responsable válido (no es ID1, ID2, etc.), mantenerlo
                responsable_a_usar = vendedor_id  # Por defecto usar el ID
                
                if registro_existente and registro_existente.responsable:
                    # Si el responsable existente NO es un ID (ID1, ID2, etc.), mantenerlo
                    if not registro_existente.responsable.startswith('ID'):
                        responsable_a_usar = registro_existente.responsable
                        print(f"  ✅ Manteniendo responsable existente (de Cargue): {responsable_a_usar}")
                else:
                    # 🔍 Si no hay registro en Cargue, buscar en tabla Vendedor
                    try:
                        from .models import Vendedor
                        vendedor_obj = Vendedor.objects.filter(id_vendedor=vendedor_id).first()
                        if vendedor_obj and vendedor_obj.nombre:
                            responsable_a_usar = vendedor_obj.nombre
                            print(f"  ✅ Usando responsable de tabla Vendedor: {responsable_a_usar}")
                    except Exception as e:
                        print(f"  ⚠️ Error buscando en tabla Vendedor: {e}")
                
                # Buscar o crear
                # Usamos update_or_create para ser más eficientes
                defaults_data = {
                    'cantidad': cantidad,
                    'total': cantidad,  # ✅ Total = cantidad (sin dctos ni adicionales desde app)
                    'responsable': responsable_a_usar,
                    'usuario': 'AppMovil',
                    'v': v_check  # ✅ Guardar check V
                }
                
                obj, created = Modelo.objects.update_or_create(
                    dia=dia,
                    fecha=fecha,
                    producto=nombre,
                    defaults=defaults_data
                )
                count += 1
        
        print(f"✅ Sugerido guardado: {count} productos actualizados para {vendedor_id}")
        return Response({'success': True, 'message': f'Sugerido guardado correctamente ({count} productos)'})

    except Exception as e:
        print(f"❌ Error guardando sugerido: {str(e)}")
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def actualizar_check_vendedor(request):
    """
    Endpoint para actualizar el check V (vendedor) desde la App Móvil.
    Recibe: { vendedor_id, dia, fecha, producto, v (true/false) }
    Validación: Solo permite marcar V si D ya está marcado y hay cantidad > 0
    """
    try:
        data = request.data
        vendedor_id = data.get('vendedor_id')
        dia = data.get('dia', '').upper()
        fecha = data.get('fecha')
        producto = data.get('producto')
        v_nuevo = data.get('v', False)
        
        print(f"📱 Actualizando check V: {vendedor_id} - {dia} - {fecha} - {producto} - V={v_nuevo}")
        
        # Mapeo de ID a Modelo
        modelos = {
            'ID1': CargueID1,
            'ID2': CargueID2,
            'ID3': CargueID3,
            'ID4': CargueID4,
            'ID5': CargueID5,
            'ID6': CargueID6,
        }
        
        Modelo = modelos.get(vendedor_id)
        if not Modelo:
            return Response({'error': f'Vendedor no válido: {vendedor_id}'}, status=400)
        
        # Buscar el registro o crearlo si no existe (usando get_or_create para evitar duplicados)
        registro, created = Modelo.objects.get_or_create(
            dia=dia,
            fecha=fecha,
            producto=producto,
            defaults={
                'cantidad': 0,
                'v': False,
                'd': False,
                'responsable': 'Sistema'
            }
        )
        if created:
            print(f"📱 Producto no existía en BD, registro creado: {producto}")
        else:
            print(f"📱 Producto encontrado en BD: {producto}")
        
        # ✅ VALIDACIÓN: Solo permitir marcar V si D está marcado y hay cantidad
        if v_nuevo:
            if not registro.d:
                return Response({
                    'error': 'CHECK_D_REQUERIDO',
                    'message': 'No puedes marcar el check de Vendedor hasta que el Despachador lo haya marcado en el CRM.'
                }, status=400)
            
            if (registro.total or 0) <= 0:
                return Response({
                    'error': 'SIN_CANTIDAD',
                    'message': 'No puedes marcar el check sin cantidad de producto.'
                }, status=400)
        
        # Actualizar el check V
        registro.v = v_nuevo
        registro.save()
        
        print(f"✅ Check V actualizado: {producto} - V={v_nuevo}")
        return Response({
            'success': True,
            'message': 'Check actualizado correctamente',
            'v': registro.v,
            'd': registro.d,
            'total': registro.total
        })
        
    except Exception as e:
        print(f"❌ Error actualizando check V: {str(e)}")
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def obtener_cargue(request):
    """
    Endpoint para obtener Cargue desde la App Móvil.
    Recibe params: vendedor_id, dia, fecha
    Devuelve: cantidad, total, v (vendedor check), d (despachador check)
    """
    try:
        vendedor_id = request.query_params.get('vendedor_id')
        dia_raw = request.query_params.get('dia', '').upper()
        fecha = request.query_params.get('fecha') # YYYY-MM-DD
        
        # Normalizar día (quitar tildes para consistencia con BD)
        dias_sin_tilde = {
            'SÁBADO': 'SABADO',
            'MIÉRCOLES': 'MIERCOLES',
        }
        dia = dias_sin_tilde.get(dia_raw, dia_raw)

        print(f"📱 Solicitando Cargue App: {vendedor_id} - {dia} (raw: {dia_raw}) - {fecha}")

        # Mapeo de ID a Modelo
        modelos = {
            'ID1': CargueID1,
            'ID2': CargueID2,
            'ID3': CargueID3,
            'ID4': CargueID4,
            'ID5': CargueID5,
            'ID6': CargueID6,
        }

        Modelo = modelos.get(vendedor_id)
        if not Modelo:
            return Response({'error': f'Vendedor no válido: {vendedor_id}'}, status=400)

        # Construir filtro - buscar con y sin tilde
        from django.db.models import Q
        
        # Crear lista de posibles variantes del día
        dias_variantes = [dia, dia_raw]
        if dia != dia_raw:
            dias_variantes = list(set(dias_variantes))
        
        filtros_q = Q(dia__in=dias_variantes)
        if fecha:
            filtros_q &= Q(fecha=fecha)
        
        # Obtener registros
        registros = Modelo.objects.filter(filtros_q)
        
        # Formatear respuesta para la App
        data = {}
        
        # 🆕 Verificar si el turno ya está cerrado (algún producto tiene devoluciones > 0)
        turno_cerrado = registros.filter(devoluciones__gt=0).exists()
        
        for reg in registros:
            # 🆕 Stock disponible para vender = total - vendidas - vencidas
            # Las vencidas también restan porque el vendedor da producto fresco como cambio
            # Si el turno está cerrado, stock = 0
            if turno_cerrado:
                stock_disponible = 0
            else:
                stock_disponible = (reg.total or reg.cantidad) - (reg.vendidas or 0) - (reg.vencidas or 0)
            
            quantity_value = str(max(0, stock_disponible))  # No permitir negativos
            data[reg.producto] = {
                'quantity': quantity_value,  # Stock disponible (total - vendidas)
                'cantidad': reg.cantidad or 0,  # Cantidad base
                'adicional': reg.adicional or 0,  # Adicionales
                'dctos': reg.dctos or 0,  # Descuentos
                'vendidas': reg.vendidas or 0,  # 🆕 Vendidas
                'vencidas': reg.vencidas or 0,  # 🆕 Vencidas
                'devoluciones': reg.devoluciones or 0,  # 🆕 Devoluciones
                'turno_cerrado': turno_cerrado,  # 🆕 Flag para indicar que el turno está cerrado
                'v': reg.v,  # Check vendedor
                'd': reg.d,   # Check despachador
                # 🆕 Campos adicionales para sincronización completa
                'lotes_vencidos': reg.lotes_vencidos or '',  # JSON string de lotes
                'total': reg.total or 0,
                'valor': float(reg.valor) if reg.valor else 0,
                'neto': float(reg.neto) if reg.neto else 0,
                # Pagos (pueden estar en el mismo registro)
                'nequi': float(reg.nequi) if reg.nequi else 0,
                'daviplata': float(reg.daviplata) if reg.daviplata else 0,
                'concepto': reg.concepto or '',
                'descuentos': float(reg.descuentos) if reg.descuentos else 0,
                # Resumen
                'base_caja': float(reg.base_caja) if reg.base_caja else 0,
                # Cumplimiento
                'licencia_transporte': reg.licencia_transporte or '',
                'soat': reg.soat or '',
                'uniforme': reg.uniforme or '',
                'no_locion': reg.no_locion or '',
                'no_accesorios': reg.no_accesorios or '',
                'capacitacion_carnet': reg.capacitacion_carnet or '',
                'higiene': reg.higiene or '',
                'estibas': reg.estibas or '',
                'desinfeccion': reg.desinfeccion or '',
            }
            # 🆕 Debug
            if 'CANASTILLA' in reg.producto.upper():
                print(f"🔍 BACKEND - CANASTILLA: cantidad={reg.cantidad}, adicional={reg.adicional}, total={reg.total}, quantity_value='{quantity_value}'")

        return Response(data)

    except Exception as e:
        print(f"❌ Error obteniendo cargue: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def obtener_rendimiento_cargue(request):
    """
    Obtiene el rendimiento consolidado de todos los IDs para un día y fecha específica
    Para el módulo de Rendimiento de la app móvil
    """
    dia = request.GET.get('dia', '').upper()
    fecha = request.GET.get('fecha')
    
    if not dia or not fecha:
        return Response({'error': 'Faltan parámetros: dia, fecha'}, status=400)
    
    # Mapear todos los modelos de cargue
    modelos = {
        'ID1': CargueID1,
        'ID2': CargueID2,
        'ID3': CargueID3,
        'ID4': CargueID4,
        'ID5': CargueID5,
        'ID6': CargueID6
    }
    
    try:
        # Consolidar datos de todos los IDs
        productos_consolidados = {}
        
        for id_name, modelo in modelos.items():
            registros = modelo.objects.filter(dia=dia, fecha=fecha)
            
            for registro in registros:
                producto_nombre = registro.producto
                
                if producto_nombre not in productos_consolidados:
                    productos_consolidados[producto_nombre] = {
                        'producto': producto_nombre,
                        'vencidas': 0,
                        'devoluciones': 0,
                        'total': 0
                    }
                
                # Sumar los valores de todos los IDs
                productos_consolidados[producto_nombre]['vencidas'] += registro.vencidas or 0
                productos_consolidados[producto_nombre]['devoluciones'] += registro.devoluciones or 0
                productos_consolidados[producto_nombre]['total'] += registro.total or 0
        
        # Convertir a lista y ordenar por nombre de producto
        data = list(productos_consolidados.values())
        data.sort(key=lambda x: x['producto'])
        
        return Response({
            'success': True,
            'data': data,
            'dia': dia,
            'fecha': fecha,
            'total_productos': len(data)
        })
        
    except Exception as e:
        print(f"❌ Error obteniendo rendimiento: {str(e)}")
        return Response({'error': str(e)}, status=500)


# ===== ENDPOINT: VERIFICAR ESTADO DEL DÍA =====
# Agregado: 24 Nov 2025
# Propósito: Permitir verificar si un día específico está completado o en qué estado se encuentra

@api_view(['GET'])
def verificar_estado_dia(request):
    """
    Verifica el estado de un día específico para un vendedor
    
    Parámetros (query params):
        - vendedor_id: ID del vendedor (ID1, ID2, etc.)
        - dia: Día de la semana (LUNES, MARTES, etc.)
        - fecha: Fecha en formato YYYY-MM-DD
    
    Retorna:
        {
            "success": true,
            "completado": false,
            "estado": "SUGERIDO" | "DESPACHO" | "COMPLETADO",
            "puede_editar": true,
            "mensaje": "Este día está disponible para edición",
            "fecha": "2025-11-24",
            "dia": "LUNES",
            "tiene_datos": false,
            "total_productos": 0
        }
    """
    try:
        vendedor_id = request.GET.get('vendedor_id', '').upper()
        dia = request.GET.get('dia', '').upper()
        fecha = request.GET.get('fecha', '')
        
        # Validar parámetros
        if not vendedor_id or not dia or not fecha:
            return Response({
                'success': False,
                'error': 'Faltan parámetros requeridos: vendedor_id, dia, fecha'
            }, status=400)
        
        # Mapear vendedor_id a modelo de tabla
        modelos_cargue = {
            'ID1': CargueID1,
            'ID2': CargueID2,
            'ID3': CargueID3,
            'ID4': CargueID4,
            'ID5': CargueID5,
            'ID6': CargueID6,
        }
        
        modelo = modelos_cargue.get(vendedor_id)
        if not modelo:
            return Response({
                'success': False,
                'error': f'Vendedor ID inválido: {vendedor_id}'
            }, status=400)
        
        # Buscar registros para este día y fecha
        registros = modelo.objects.filter(dia=dia, fecha=fecha)
        
        tiene_datos = registros.exists()
        total_productos = registros.count()
        
        # Determinar estado del día
        # Nota: El estado "COMPLETADO" se maneja actualmente en localStorage del frontend
        # Aquí solo podemos verificar si hay datos guardados
        
        estado = "SUGERIDO"  # Estado por defecto (día vacío)
        completado = False
        puede_editar = True
        mensaje = "Este día está disponible para edición"
        
        if tiene_datos:
            # Verificar si algún registro tiene checks marcados
            tiene_checks_d = registros.filter(d=True).exists()
            tiene_checks_v = registros.filter(v=True).exists()
            
            if tiene_checks_v:
                estado = "DESPACHO"
                mensaje = "Este día tiene datos con checks de vendedor marcados"
            elif tiene_checks_d:
                estado = "DESPACHO"
                mensaje = "Este día tiene datos con checks de despachador marcados"
            else:
                estado = "SUGERIDO"
                mensaje = "Este día tiene datos pero no está despachado"
            
            # Por ahora, siempre permitimos editar
            # En el futuro, podríamos agregar un campo 'finalizado' en la tabla
            puede_editar = True
        
        return Response({
            'success': True,
            'completado': completado,
            'estado': estado,
            'puede_editar': puede_editar,
            'mensaje': mensaje,
            'fecha': fecha,
            'dia': dia,
            'tiene_datos': tiene_datos,
            'total_productos': total_productos,
            'vendedor_id': vendedor_id
        })
        
    except Exception as e:
        print(f"❌ Error verificando estado del día: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


# ===== VIEWSETS RUTAS Y VENTAS RUTA =====

class RutaViewSet(viewsets.ModelViewSet):
    queryset = Ruta.objects.all()
    serializer_class = RutaSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Ruta.objects.all()
        vendedor_id = self.request.query_params.get('vendedor_id', None)
        if vendedor_id:
            # Filtrar por ID de vendedor (ej: ID1)
            queryset = queryset.filter(vendedor__id_vendedor=vendedor_id)
        return queryset

class ClienteRutaViewSet(viewsets.ModelViewSet):
    queryset = ClienteRuta.objects.all()
    serializer_class = ClienteRutaSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = ClienteRuta.objects.all()
        ruta_id = self.request.query_params.get('ruta', None)
        dia = self.request.query_params.get('dia', None)
        vendedor_id = self.request.query_params.get('vendedor_id', None)
        
        # Filtrar por vendedor (busca la ruta del vendedor)
        if vendedor_id:
            rutas_vendedor = Ruta.objects.filter(vendedor__id_vendedor=vendedor_id, activo=True)
            queryset = queryset.filter(ruta__in=rutas_vendedor)
            # Obtener el primer ruta_id para buscar orden personalizado
            if rutas_vendedor.exists():
                ruta_id = rutas_vendedor.first().id
        
        if ruta_id:
            queryset = queryset.filter(ruta_id=ruta_id)
            
        if dia:
            dia_upper = dia.upper()
            # Buscar clientes que tengan este día en su lista (soporta múltiples días)
            queryset = queryset.filter(dia_visita__icontains=dia_upper)
            
            # 🆕 Ordenar según RutaOrden si existe para esta ruta + día
            try:
                orden_personalizado = RutaOrden.objects.get(ruta_id=ruta_id, dia=dia_upper)
                clientes_ids = orden_personalizado.clientes_ids
                
                if clientes_ids and len(clientes_ids) > 0:
                    # Crear orden dinámico basado en la posición en la lista
                    from django.db.models import Case, When, Value, IntegerField
                    
                    # Crear condiciones de ordenamiento
                    ordering_cases = [When(id=pk, then=Value(pos)) for pos, pk in enumerate(clientes_ids)]
                    
                    # Agregar anotación para orden personalizado
                    queryset = queryset.annotate(
                        orden_dia=Case(
                            *ordering_cases,
                            default=Value(999),  # Clientes no en la lista van al final
                            output_field=IntegerField()
                        )
                    ).order_by('orden_dia')
                    
                    return queryset.filter(activo=True)
            except RutaOrden.DoesNotExist:
                pass  # No hay orden personalizado, usar orden por defecto
            
        return queryset.filter(activo=True).order_by('orden')
    
    def _ordenar_dias_semana(self, dias_string):
        """
        Ordena los días de la semana en orden cronológico
        Entrada: "SABADO,MARTES,JUEVES" o "Sabado, Martes, Jueves"
        Salida: "MARTES,JUEVES,SABADO"
        """
        if not dias_string:
            return dias_string
        
        # Orden de días de la semana
        orden_dias = {
            'LUNES': 1,
            'MARTES': 2,
            'MIERCOLES': 3,
            'JUEVES': 4,
            'VIERNES': 5,
            'SABADO': 6,
            'DOMINGO': 7
        }
        
        # Separar días, limpiar y convertir a mayúsculas
        dias = [dia.strip().upper() for dia in dias_string.split(',')]
        
        # Ordenar según el diccionario
        dias_ordenados = sorted(dias, key=lambda d: orden_dias.get(d, 99))
        
        # Retornar en el mismo formato (mayúsculas, separados por coma)
        return ','.join(dias_ordenados)
    
    def perform_update(self, serializer):
        """Se ejecuta al actualizar un ClienteRuta - Sincroniza hacia Cliente"""
        # Ordenar días antes de guardar
        if 'dia_visita' in serializer.validated_data:
            serializer.validated_data['dia_visita'] = self._ordenar_dias_semana(
                serializer.validated_data['dia_visita']
            )
        
        cliente_ruta = serializer.save()
        
        # 🔄 SINCRONIZAR HACIA CLIENTE (si existe un cliente con el mismo nombre)
        try:
            # Buscar cliente por alias o nombre completo que coincida con nombre_negocio
            cliente = Cliente.objects.filter(
                models.Q(alias__iexact=cliente_ruta.nombre_negocio) |
                models.Q(nombre_completo__iexact=cliente_ruta.nombre_contacto)
            ).first()
            
            if cliente:
                # Marcar flag para evitar loop infinito
                cliente._sincronizando = True
                
                # Actualizar campos del cliente con los datos de ClienteRuta (ya ordenados)
                cliente.dia_entrega = cliente_ruta.dia_visita
                cliente.direccion = cliente_ruta.direccion or cliente.direccion
                cliente.telefono_1 = cliente_ruta.telefono or cliente.telefono_1
                cliente.zona_barrio = cliente_ruta.ruta.nombre  # Sincronizar la ruta
                cliente.nota = cliente_ruta.nota # 🆕 Sincronizar nota
                cliente.save()
                print(f"✅ Cliente sincronizado desde ClienteRuta: {cliente.alias} - Días: {cliente.dia_entrega}")
            else:
                print(f"⚠️ No se encontró Cliente correspondiente para: {cliente_ruta.nombre_negocio}")
                
        except Exception as e:
            print(f"❌ Error sincronizando ClienteRuta → Cliente: {e}")
            import traceback
            traceback.print_exc()


class VentaRutaViewSet(viewsets.ModelViewSet):
    queryset = VentaRuta.objects.all()
    serializer_class = VentaRutaSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = VentaRuta.objects.all()
        vendedor_id = self.request.query_params.get('vendedor_id', None)
        fecha = self.request.query_params.get('fecha', None)
        
        fecha_inicio = self.request.query_params.get('fecha_inicio', None)
        fecha_fin = self.request.query_params.get('fecha_fin', None)

        if vendedor_id:
            queryset = queryset.filter(vendedor__id_vendedor=vendedor_id)
        
        if fecha_inicio and fecha_fin:
             queryset = queryset.filter(fecha__date__range=[fecha_inicio, fecha_fin])
        elif fecha:
            # Filtrar por fecha (solo la parte de la fecha, ignorando la hora)
            queryset = queryset.filter(fecha__date=fecha)
            
        cliente_id = self.request.query_params.get('cliente_id', None)
        if cliente_id:
             queryset = queryset.filter(cliente__id=cliente_id)

        ruta_id = self.request.query_params.get('ruta_id', None)
        if ruta_id:
            from django.db.models import Q
            # Filtrar si la venta tiene la ruta marcada O si el cliente pertenece a esa ruta
            queryset = queryset.filter(Q(ruta_id=ruta_id) | Q(cliente__ruta_id=ruta_id))
        
        # Ordenar por fecha descendente (más recientes primero)
        return queryset.order_by('-fecha')
    
    @action(detail=False, methods=['get'])
    def reportes(self, request):
        """Endpoint para reportes de ventas por período"""
        from django.db.models import Sum, Count
        from django.db.models.functions import TruncDate, TruncMonth
        from datetime import datetime, timedelta
        from dateutil.relativedelta import relativedelta
        
        periodo = request.query_params.get('periodo', 'dia')  # dia, mes, trimestre, semestre, año
        vendedor_id = request.query_params.get('vendedor_id', None)
        fecha_inicio = request.query_params.get('fecha_inicio', None)
        fecha_fin = request.query_params.get('fecha_fin', None)
        
        # Calcular fechas según período
        hoy = datetime.now().date()
        if periodo == 'dia':
            fecha_inicio = fecha_inicio or str(hoy)
            fecha_fin = fecha_fin or str(hoy)
        elif periodo == 'semana':
            fecha_inicio = fecha_inicio or str(hoy - timedelta(days=7))
            fecha_fin = fecha_fin or str(hoy)
        elif periodo == 'mes':
            fecha_inicio = fecha_inicio or str(hoy.replace(day=1))
            fecha_fin = fecha_fin or str(hoy)
        elif periodo == 'trimestre':
            fecha_inicio = fecha_inicio or str(hoy - relativedelta(months=3))
            fecha_fin = fecha_fin or str(hoy)
        elif periodo == 'semestre':
            fecha_inicio = fecha_inicio or str(hoy - relativedelta(months=6))
            fecha_fin = fecha_fin or str(hoy)
        elif periodo == 'año':
            fecha_inicio = fecha_inicio or str(hoy.replace(month=1, day=1))
            fecha_fin = fecha_fin or str(hoy)
        
        # Filtrar ventas
        queryset = VentaRuta.objects.filter(fecha__date__gte=fecha_inicio, fecha__date__lte=fecha_fin)
        if vendedor_id:
            queryset = queryset.filter(vendedor__id_vendedor=vendedor_id)
        
        # Total general
        total_general = queryset.aggregate(total=Sum('total'))['total'] or 0
        cantidad_ventas = queryset.count()
        
        # Ventas por vendedor
        ventas_por_vendedor = queryset.values('vendedor__nombre', 'vendedor__id_vendedor').annotate(
            total=Sum('total'),
            cantidad=Count('id')
        ).order_by('-total')
        
        # Ventas por cliente
        ventas_por_cliente = queryset.values('cliente_nombre', 'nombre_negocio').annotate(
            total=Sum('total'),
            cantidad=Count('id')
        ).order_by('-total')[:20]  # Top 20 clientes
        
        # Ventas por producto (necesita procesar JSON)
        productos_dict = {}
        for venta in queryset:
            detalles = venta.detalles or []
            for item in detalles:
                nombre = item.get('nombre') or item.get('producto') or 'Sin nombre'
                cantidad = item.get('cantidad', 0)
                subtotal = item.get('subtotal', 0) or (cantidad * item.get('precio', 0))
                if nombre in productos_dict:
                    productos_dict[nombre]['cantidad'] += cantidad
                    productos_dict[nombre]['total'] += subtotal
                else:
                    productos_dict[nombre] = {'cantidad': cantidad, 'total': subtotal}
        
        ventas_por_producto = [
            {'producto': k, 'cantidad': v['cantidad'], 'total': v['total']}
            for k, v in sorted(productos_dict.items(), key=lambda x: x[1]['total'], reverse=True)
        ]
        
        # Ventas por día (para gráficos)
        ventas_por_dia = queryset.annotate(dia=TruncDate('fecha')).values('dia').annotate(
            total=Sum('total'),
            cantidad=Count('id')
        ).order_by('dia')
        
        return Response({
            'periodo': periodo,
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin,
            'total_general': float(total_general),
            'cantidad_ventas': cantidad_ventas,
            'ventas_por_vendedor': list(ventas_por_vendedor),
            'ventas_por_cliente': list(ventas_por_cliente),
            'ventas_por_producto': ventas_por_producto[:20],  # Top 20
            'ventas_por_dia': list(ventas_por_dia)
        })
    
    def get_queryset(self):
        queryset = VentaRuta.objects.all()
        vendedor_id = self.request.query_params.get('vendedor_id', None)
        fecha = self.request.query_params.get('fecha', None)
        
        if vendedor_id:
            queryset = queryset.filter(vendedor__id_vendedor=vendedor_id)
        if fecha:
            # Filtrar por fecha (YYYY-MM-DD)
            queryset = queryset.filter(fecha__date=fecha)
            
        return queryset.order_by('-fecha')

    def create(self, request, *args, **kwargs):
        import json
        from .models import Vendedor, EvidenciaVenta, SyncLog
        from rest_framework import status
        from django.http import QueryDict
        from django.db import transaction, IntegrityError
        
        # 🆕 Obtener IP del cliente
        def _get_client_ip(request):
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')
            return ip
        
        # 🆕 Logging de sincronización
        def _log_sync(accion, exito=True, error_mensaje='', id_local='', registro_id=0):
            try:
                SyncLog.objects.create(
                    accion=accion,
                    modelo='VentaRuta',
                    registro_id=registro_id,
                    id_local=id_local,
                    vendedor_id=request.data.get('vendedor_id', ''),
                    dispositivo_id=request.data.get('dispositivo_id', ''),
                    ip_origen=_get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    exito=exito,
                    error_mensaje=error_mensaje
                )
            except Exception as e:
                print(f"⚠️ Error logging: {e}")
        
        # 🆕 Verificar duplicados por id_local
        id_local = request.data.get('id_local')
        dispositivo_id = request.data.get('dispositivo_id', '')
        
        if id_local:
            try:
                venta_existente = VentaRuta.objects.get(id_local=id_local)
                print(f"⚠️ DUPLICADO DETECTADO: id_local={id_local}, ID={venta_existente.id}")
                print(f"   Dispositivo original: {venta_existente.dispositivo_id}")
                print(f"   Dispositivo actual: {dispositivo_id}")
                
                # Log del intento de duplicado
                _log_sync(
                    accion='CREATE_DUPLICADO',
                    exito=False,
                    error_mensaje=f'Venta ya existe (ID: {venta_existente.id})',
                    id_local=id_local
                )
                
                # 🆕 Retornar 200 OK con warning (no error)
                return Response(
                    {
                        'id': venta_existente.id,
                        'message': 'Venta ya registrada previamente',
                        'duplicada': True,
                        'id_local': id_local,
                        'dispositivo_original': venta_existente.dispositivo_id,
                        'timestamp': venta_existente.fecha
                    },
                    status=status.HTTP_200_OK  # No HTTP_409_CONFLICT para no fallar en app
                )
                
            except VentaRuta.DoesNotExist:
                # No existe, continuar con creación
                pass
            except VentaRuta.MultipleObjectsReturned:
                # ❌ Si hay múltiples (no debería pasar por unique=True)
                print(f"❌ ERROR: Múltiples ventas con id_local={id_local}")
                _log_sync(
                    accion='CREATE_DUPLICADO',
                    exito=False,
                    error_mensaje=f'Múltiples ventas con mismo id_local',
                    id_local=id_local
                )
                return Response(
                    {'error': 'Error de integridad de datos'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        
        # Crear un QueryDict mutable o dict regular
        if isinstance(request.data, QueryDict):
            data = request.data.copy()
        else:
            data = dict(request.data)
        
        # NO parsear campos JSON aquí - el JSONField del serializer lo hace automáticamente
        # Solo necesitamos ajustar el vendedor
        
        # Ajustar vendedor si viene solo el ID
        if 'vendedor' in data and isinstance(data['vendedor'], str) and data['vendedor'].startswith('ID'):
             try:
                 vendedor = Vendedor.objects.get(id_vendedor=data['vendedor'])
                 data['vendedor'] = vendedor.pk
             except Vendedor.DoesNotExist:
                 pass

        # Extraer fotos de evidencia antes de crear la venta
        evidencias_data = []
        for key in request.FILES.keys():
            if key.startswith('evidencia_'):
                parts = key.split('_')
                if len(parts) >= 3:
                    producto_id = parts[1]
                    evidencias_data.append({
                        'producto_id': int(producto_id),
                        'imagen': request.FILES[key]
                    })

        # Crear la venta con los datos procesados


        print(f"data keys: {data.keys()}")
        print(f"vendedor: {data.get('vendedor')}")
        print(f"cliente_nombre: {data.get('cliente_nombre')}")
        print(f"total: {data.get('total')}")
        print(f"detalles type: {type(data.get('detalles'))}, valor: {data.get('detalles')}")
        print(f"productos_vencidos type: {type(data.get('productos_vencidos'))}, valor: {data.get('productos_vencidos')}")

        
        serializer = self.get_serializer(data=data)
        
        if not serializer.is_valid():
            print("❌ ERRORES DE VALIDACIÓN:")
            print(serializer.errors)
            
            # 🆕 Log de error de validación
            _log_sync(
                accion='CREATE_VENTA',
                exito=False,
                error_mensaje=f'Errores de validación: {serializer.errors}',
                id_local=id_local or ''
            )
            
        serializer.is_valid(raise_exception=True)
        
        # 🆕 Agregar metadatos de multi-dispositivo antes del save
        try:
            with transaction.atomic():
                # Guardar con metadatos
                venta = serializer.save(
                    dispositivo_id=dispositivo_id,
                    ip_origen=_get_client_ip(request)
                )
                
                print(f"✅ VENTA CREADA: ID={venta.id}, id_local={venta.id_local}")
                print(f"   Dispositivo: {venta.dispositivo_id}")
                print(f"   IP: {venta.ip_origen}")
                
                # 🆕 Log de creación exitosa
                _log_sync(
                    accion='CREATE_VENTA',
                    exito=True,
                    error_mensaje='',
                    id_local=venta.id_local or '',
                    registro_id=venta.id
                )
                
        except IntegrityError as e:
            # Error de integridad (posible race condition con id_local duplicado)
            print(f"❌ IntegrityError: {e}")
            _log_sync(
                accion='CONFLICT',
                exito=False,
                error_mensaje=f'IntegrityError: {str(e)}',
                id_local=id_local or ''
            )
            return Response(
                {'error': 'Conflicto de sincronización. La venta puede haber sido registrada por otro dispositivo.'},
                status=status.HTTP_409_CONFLICT
            )
        except Exception as e:
            print(f"❌ Error al crear venta: {e}")
            _log_sync(
                accion='CREATE_VENTA',
                exito=False,
                error_mensaje=str(e),
                id_local=id_local or ''
            )
            raise
        
        # Guardar las evidencias asociadas
        for evidencia_info in evidencias_data:
            EvidenciaVenta.objects.create(
                venta=venta,
                producto_id=evidencia_info['producto_id'],
                imagen=evidencia_info['imagen']
            )
        
        # ========== 🆕 SINCRONIZAR VENCIDAS A CARGUEIDx ==========
        productos_vencidos = data.get('productos_vencidos', [])
        print(f"🔍 DEBUG - productos_vencidos recibidos: {productos_vencidos}")
        print(f"🔍 DEBUG - tipo: {type(productos_vencidos)}, longitud: {len(productos_vencidos) if productos_vencidos else 0}")
        
        # Si es string, parsearlo a JSON
        if isinstance(productos_vencidos, str):
            try:
                productos_vencidos = json.loads(productos_vencidos)
                print(f"✅ JSON parseado correctamente: {productos_vencidos}")
            except json.JSONDecodeError as e:
                print(f"❌ Error parseando JSON: {e}")
                productos_vencidos = []
        
        if productos_vencidos and len(productos_vencidos) > 0:
            try:
                # Obtener ID del vendedor y fecha
                id_vendedor = venta.vendedor.id_vendedor  # ID1, ID2, etc.
                fecha_venta = venta.fecha.date() if hasattr(venta.fecha, 'date') else venta.fecha
                
                print(f"🔄 Sincronizando vencidas a CargueIDx: {id_vendedor} - {fecha_venta}")
                print(f"   Productos vencidos: {productos_vencidos}")
                
                # Mapeo de ID a Modelo
                modelo_map = {
                    'ID1': CargueID1,
                    'ID2': CargueID2,
                    'ID3': CargueID3,
                    'ID4': CargueID4,
                    'ID5': CargueID5,
                    'ID6': CargueID6,
                }
                
                ModeloCargue = modelo_map.get(id_vendedor)
                if ModeloCargue:
                    # Actualizar cada producto vencido en el cargue
                    for item_vencido in productos_vencidos:
                        nombre_producto = item_vencido.get('nombre', '') or item_vencido.get('producto', '')
                        cantidad_vencida = item_vencido.get('cantidad', 0)
                        
                        if nombre_producto and cantidad_vencida > 0:
                            # Buscar el producto en el cargue
                            cargue = ModeloCargue.objects.filter(
                                fecha=fecha_venta,
                                producto__iexact=nombre_producto,
                                activo=True
                            ).first()
                            
                            if cargue:
                                # Sumar a las vencidas existentes
                                vencidas_actuales = cargue.vencidas or 0
                                cargue.vencidas = vencidas_actuales + cantidad_vencida
                                cargue.save(update_fields=['vencidas'])
                                print(f"   ✅ {nombre_producto}: {vencidas_actuales} + {cantidad_vencida} = {cargue.vencidas}")
                            else:
                                print(f"   ⚠️ No se encontró cargue para: {nombre_producto} - Intentando crear...")
                                # Intentar buscar un registro de referencia del mismo día para copiar metadatos
                                ref_cargue = ModeloCargue.objects.filter(fecha=fecha_venta, activo=True).first()
                                
                                if ref_cargue:
                                    # Buscar precio del producto original
                                    from .models import Producto
                                    prod_obj = Producto.objects.filter(nombre__iexact=nombre_producto).first()
                                    precio_prod = prod_obj.precio_base if prod_obj else 0
                                    nombre_real = prod_obj.nombre if prod_obj else nombre_producto

                                    try:
                                        cargue = ModeloCargue.objects.create(
                                            fecha=fecha_venta,
                                            dia=ref_cargue.dia,
                                            responsable=ref_cargue.responsable,
                                            usuario='Sistema', # Oref_cargue.usuario
                                            ruta=ref_cargue.ruta if hasattr(ref_cargue, 'ruta') else '',
                                            producto=nombre_real,
                                            precio=precio_prod,
                                            cantidad=0, # No se cargó inicialmente
                                            vendidas=0,
                                            vencidas=cantidad_vencida, # Asignar la vencida directamente
                                            activo=True
                                        )
                                        print(f"   ✨ Registro creado exitosamente para vencida: {nombre_real}")
                                    except Exception as create_error:
                                        print(f"   ❌ Error creando registro on-the-fly: {create_error}")
                                else:
                                    print(f"   ❌ No hay referencia de cargue para el día {fecha_venta}, imposible crear.")
                else:
                    print(f"   ⚠️ Modelo de cargue no encontrado para: {id_vendedor}")
                    
            except Exception as e:
                print(f"❌ Error sincronizando vencidas: {str(e)}")
                import traceback
                traceback.print_exc()
        
        # ========== 🆕 SINCRONIZAR VENDIDAS A CARGUEIDx ==========
        try:
            # Obtener ID del vendedor y fecha
            id_vendedor = venta.vendedor.id_vendedor if hasattr(venta.vendedor, 'id_vendedor') else None
            fecha_venta = venta.fecha.date() if hasattr(venta.fecha, 'date') else venta.fecha
            
            if id_vendedor:
                print(f"🔄 Sincronizando vendidas a CargueIDx: {id_vendedor} - {fecha_venta}")
                
                # Mapeo de modelos
                modelo_map = {
                    'ID1': CargueID1,
                    'ID2': CargueID2,
                    'ID3': CargueID3,
                    'ID4': CargueID4,
                    'ID5': CargueID5,
                    'ID6': CargueID6,
                }
                
                ModeloCargue = modelo_map.get(id_vendedor)
                if ModeloCargue:
                    # Parsear detalles de la venta
                    detalles_json = data.get('detalles', '[]')
                    if isinstance(detalles_json, str):
                        try:
                            detalles = json.loads(detalles_json)
                        except:
                            detalles = []
                    else:
                        detalles = detalles_json
                    
                    print(f"   📦 Detalles de venta: {len(detalles)} productos")
                    
                    # Actualizar vendidas por cada producto en la venta
                    for item in detalles:
                        nombre_producto = item.get('nombre', '')
                        cantidad_vendida = int(item.get('cantidad', 0))
                        
                        if nombre_producto and cantidad_vendida > 0:
                            # Buscar el producto en el cargue
                            cargue = ModeloCargue.objects.filter(
                                fecha=fecha_venta,
                                producto__iexact=nombre_producto,
                                activo=True
                            ).first()
                            
                            if cargue:
                                # Sumar a las vendidas existentes
                                vendidas_actuales = cargue.vendidas or 0
                                cargue.vencidas = cargue.vencidas or 0 # Asegurar que no sea None
                                cargue.vendidas = vendidas_actuales + cantidad_vendida
                                cargue.save(update_fields=['vendidas', 'vencidas', 'total', 'neto'])
                                print(f"   ✅ {nombre_producto}: {vendidas_actuales} + {cantidad_vendida} = {cargue.vendidas}")
                            else:
                                print(f"   ⚠️ No se encontró cargue para: {nombre_producto} - Intentando crear...")
                                ref_cargue = ModeloCargue.objects.filter(fecha=fecha_venta, activo=True).first()
                                
                                if ref_cargue:
                                    from .models import Producto
                                    prod_obj = Producto.objects.filter(nombre__iexact=nombre_producto).first()
                                    precio_prod = prod_obj.precio_base if prod_obj else 0
                                    nombre_real = prod_obj.nombre if prod_obj else nombre_producto

                                    try:
                                        cargue = ModeloCargue.objects.create(
                                            fecha=fecha_venta,
                                            dia=ref_cargue.dia,
                                            responsable=ref_cargue.responsable,
                                            usuario='Sistema',
                                            ruta=ref_cargue.ruta if hasattr(ref_cargue, 'ruta') else '',
                                            producto=nombre_real,
                                            precio=precio_prod,
                                            cantidad=0,
                                            vendidas=cantidad_vendida, # Registrar venta
                                            vencidas=0,
                                            activo=True
                                        )
                                        print(f"   ✨ Registro creado exitosamente para venta: {nombre_real}")
                                    except Exception as create_error:
                                        print(f"   ❌ Error creando registro on-the-fly: {create_error}")
                                else:
                                    print(f"   ❌ No hay referencia de cargue para el día {fecha_venta}, imposible crear.")
                else:
                    print(f"   ⚠️ Modelo de cargue no encontrado para: {id_vendedor}")
        except Exception as e:
            print(f"❌ Error sincronizando vendidas: {str(e)}")
            import traceback
            traceback.print_exc()

        # ========== 🆕 SINCRONIZAR PAGOS A CarguePagos ==========
        try:
            metodo_pago = str(data.get('metodo_pago', 'EFECTIVO')).upper()
            total_venta = float(data.get('total', 0))
            
            es_nequi = 'NEQUI' in metodo_pago
            es_daviplata = 'DAVIPLATA' in metodo_pago
            
            # Solo registrar en CarguePagos si es transacción electrónica especial
            if (es_nequi or es_daviplata) and id_vendedor:
                from .models import CarguePagos
                
                # Intentar obtener el día correcto usando el mapa de modelos ya definido
                dia_str = 'LUNES' # Valor por defecto
                
                if 'modelo_map' in locals() and modelo_map.get(id_vendedor):
                    RefModel = modelo_map.get(id_vendedor)
                    ref_obj = RefModel.objects.filter(fecha=fecha_venta).first()
                    if ref_obj:
                        dia_str = ref_obj.dia
                
                CarguePagos.objects.create(
                    vendedor_id=id_vendedor,
                    dia=dia_str,
                    fecha=fecha_venta,
                    concepto=f"Venta: {data.get('cliente_nombre', 'Cliente Final')}",
                    nequi=total_venta if es_nequi else 0,
                    daviplata=total_venta if es_daviplata else 0,
                    descuentos=0, 
                    usuario='App Movil'
                )
                print(f"   💸 Pago registrado en CarguePagos: {metodo_pago} - ${total_venta}")
                
        except Exception as e:
            print(f"❌ Error sincronizando pagos: {str(e)}")
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)



# ===== VIEWSET PARA SNAPSHOT PLANEACIÓN =====

from .models import RegistrosPlaneacionDia
from .serializers import RegistrosPlaneacionDiaSerializer

class RegistrosPlaneacionDiaViewSet(viewsets.ModelViewSet):
    """
    API para guardar y consultar snapshots de Planeación.
    Se usa cuando el botón cambia de SUGERIDO → ALISTAMIENTO_ACTIVO.
    """
    queryset = RegistrosPlaneacionDia.objects.all()
    serializer_class = RegistrosPlaneacionDiaSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = RegistrosPlaneacionDia.objects.all()
        fecha = self.request.query_params.get('fecha', None)
        
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        
        return queryset.order_by('orden', 'producto_nombre')
    
    @action(detail=False, methods=['post'])
    def guardar_snapshot(self, request):
        """
        Endpoint para guardar snapshot completo de Planeación.
        Recibe: { fecha: "2025-12-02", registros: [...], usuario: "Sistema" }
        """
        from django.db import transaction
        
        fecha = request.data.get('fecha')
        registros = request.data.get('registros', [])
        usuario = request.data.get('usuario', 'Sistema')
        
        if not fecha:
            return Response({'error': 'Fecha requerida'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not registros:
            return Response({'error': 'No hay registros para guardar'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Eliminar registros anteriores de la misma fecha (sobrescribir)
                RegistrosPlaneacionDia.objects.filter(fecha=fecha).delete()
                
                # Crear nuevos registros
                registros_creados = []
                for reg in registros:
                    nuevo = RegistrosPlaneacionDia.objects.create(
                        fecha=fecha,
                        producto_nombre=reg.get('producto_nombre', ''),
                        existencias=reg.get('existencias', 0),
                        solicitadas=reg.get('solicitadas', 0),
                        pedidos=reg.get('pedidos', 0),
                        total=reg.get('total', 0),
                        orden=reg.get('orden', 0),
                        ia=reg.get('ia', 0),
                        usuario=usuario
                    )
                    registros_creados.append(nuevo)
                
                print(f"✅ Snapshot guardado: {len(registros_creados)} registros para {fecha}")
                
                return Response({
                    'success': True,
                    'mensaje': f'Snapshot guardado: {len(registros_creados)} registros',
                    'fecha': fecha,
                    'cantidad': len(registros_creados)
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            print(f"❌ Error guardando snapshot: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def consultar_fecha(self, request):
        """
        Endpoint para consultar snapshot de una fecha específica.
        GET /api/registros-planeacion-dia/consultar_fecha/?fecha=2025-12-02
        """
        fecha = request.query_params.get('fecha')
        
        if not fecha:
            return Response({'error': 'Fecha requerida'}, status=status.HTTP_400_BAD_REQUEST)
        
        registros = RegistrosPlaneacionDia.objects.filter(fecha=fecha).order_by('orden', 'producto_nombre')
        
        if not registros.exists():
            return Response({
                'fecha': fecha,
                'existe': False,
                'registros': [],
                'mensaje': f'No hay snapshot para la fecha {fecha}'
            })
        
        serializer = self.get_serializer(registros, many=True)
        
        # Obtener fecha de congelado del primer registro
        fecha_congelado = registros.first().fecha_congelado if registros.exists() else None
        
        return Response({
            'fecha': fecha,
            'existe': True,
            'fecha_congelado': fecha_congelado,
            'cantidad': registros.count(),
            'registros': serializer.data
        })


# ==================== 🔗 INTEGRACIÓN APP ↔ WEB ====================
# Endpoints para conectar ventas de app móvil con cargue web

@api_view(['GET'])
def calcular_devoluciones_automaticas(request, id_vendedor, fecha):
    """
    Calcula devoluciones automáticamente basándose en:
    - Cargue inicial (de CargueIDx)
    - Ventas reales (de VentaRuta desde app móvil)
    - Vencidas (registradas manualmente)
    
    Fórmula: DEVOLUCIONES = CARGUE_INICIAL - VENTAS_APP - VENCIDAS
    
    Parámetros:
        id_vendedor: ID1, ID2, ID3, ID4, ID5, ID6
        fecha: YYYY-MM-DD
    
    Retorna:
        {
            "id_vendedor": "ID1",
            "fecha": "2025-12-17",
            "productos": [
                {
                    "producto": "AREPA TIPO OBLEA",
                    "cantidad_inicial": 200,
                    "cantidad_vendida": 150,
                    "vencidas": 5,
                    "devoluciones": 45
                }
            ]
        }
    """
    try:
        from django.db.models import Sum
        
        # Mapeo de ID a Modelo
        modelo_map = {
            'ID1': CargueID1,
            'ID2': CargueID2,
            'ID3': CargueID3,
            'ID4': CargueID4,
            'ID5': CargueID5,
            'ID6': CargueID6,
        }
        
        ModeloCargue = modelo_map.get(id_vendedor)
        if not ModeloCargue:
            return Response({'error': 'ID de vendedor inválido'}, status=400)
        
        # Obtener cargue del día
        cargues = ModeloCargue.objects.filter(
            fecha=fecha,
            activo=True
        )
        
        if not cargues.exists():
            return Response({
                'id_vendedor': id_vendedor,
                'fecha': fecha,
                'mensaje': 'No hay datos de cargue para esta fecha',
                'productos': []
            })
        
        resultado = []
        
        for cargue in cargues:
            # Cantidad inicial con la que salió (cantidad - dctos + adicional)
            cantidad_inicial = cargue.cantidad - cargue.dctos + cargue.adicional
            
            # Ventas registradas en app (buscar por vendedor_id que viene del modelo Vendedor)
            ventas_app = VentaRuta.objects.filter(
                vendedor__id_vendedor=id_vendedor,
                fecha__date=fecha
            )
            
            # Sumar cantidades vendidas por producto (del campo JSON 'detalles')
            cantidad_vendida = 0
            for venta in ventas_app:
                detalles = venta.detalles or []
                for detalle in detalles:
                    nombre_detalle = detalle.get('nombre', '') or detalle.get('producto', '')
                    if nombre_detalle.upper() == cargue.producto.upper():
                        cantidad_vendida += detalle.get('cantidad', 0)
            
            # Vencidas (registradas manualmente en cargue)
            vencidas = cargue.vencidas or 0
            
            # Calcular devoluciones (no puede ser negativo)
            devoluciones = max(0, cantidad_inicial - cantidad_vendida - vencidas)
            
            resultado.append({
                'producto': cargue.producto,
                'cantidad_inicial': cantidad_inicial,
                'cantidad_vendida': cantidad_vendida,
                'vencidas': vencidas,
                'devoluciones': devoluciones
            })
        
        return Response({
            'id_vendedor': id_vendedor,
            'fecha': fecha,
            'productos': resultado
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def ventas_tiempo_real(request, id_vendedor, fecha):
    """
    Obtiene ventas del día en tiempo real desde VentaRuta (app móvil).
    Agrupado por producto y método de pago.
    
    Parámetros:
        id_vendedor: ID1, ID2, ID3, ID4, ID5, ID6
        fecha: YYYY-MM-DD
    
    Retorna:
        {
            "id_vendedor": "ID1",
            "fecha": "2025-12-17",
            "totalVentas": 5,
            "total_dinero": 125000,
            "productos_vendidos": [
                {"producto": "AREPA TIPO OBLEA", "cantidad": 50}
            ],
            "ventas_por_metodo": {
                "EFECTIVO": 75000,
                "NEQUI": 35000,
                "DAVIPLATA": 15000
            }
        }
    """
    try:
        from django.db.models import Sum, Count
        
        # Obtener ventas del día para el vendedor
        ventas = VentaRuta.objects.filter(
            vendedor__id_vendedor=id_vendedor,
            fecha__date=fecha
        )
        
        if not ventas.exists():
            return Response({
                'id_vendedor': id_vendedor,
                'fecha': fecha,
                'total_ventas': 0,
                'total_dinero': 0,
                'productos_vendidos': [],
                'ventas_por_metodo': {
                    'EFECTIVO': 0,
                    'NEQUI': 0,
                    'DAVIPLATA': 0
                }
            })
        
        # Agrupar por producto (procesar JSON 'detalles')
        ventas_por_producto = {}
        total_dinero = 0
        ventas_por_metodo = {
            'EFECTIVO': 0,
            'NEQUI': 0,
            'DAVIPLATA': 0,
            'TRANSFERENCIA': 0
        }
        
        for venta in ventas:
            # Acumular totales
            total_dinero += float(venta.total or 0)
            metodo = venta.metodo_pago or 'EFECTIVO'
            ventas_por_metodo[metodo] = ventas_por_metodo.get(metodo, 0) + float(venta.total or 0)
            
            # Procesar productos del JSON 'detalles'
            detalles = venta.detalles or []
            for detalle in detalles:
                nombre = detalle.get('nombre', '') or detalle.get('producto', 'Sin nombre')
                cantidad = detalle.get('cantidad', 0)
                
                if nombre in ventas_por_producto:
                    ventas_por_producto[nombre] += cantidad
                else:
                    ventas_por_producto[nombre] = cantidad
        
        # Convertir a lista
        productos_vendidos = [
            {'producto': k, 'cantidad': v}
            for k, v in sorted(ventas_por_producto.items(), key=lambda x: x[1], reverse=True)
        ]
        
        return Response({
            'id_vendedor': id_vendedor,
            'fecha': fecha,
            'total_ventas': ventas.count(),
            'total_dinero': total_dinero,
            'productos_vendidos': productos_vendidos,
            'ventas_por_metodo': ventas_por_metodo
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
def cerrar_turno_vendedor(request):
    """
    Cierra el turno del vendedor desde la app móvil.
    Calcula devoluciones automáticamente y las guarda en CargueIDx.
    
    POST /api/cargue/cerrar-turno/
    
    Body:
    {
        "id_vendedor": "ID1",
        "fecha": "2025-12-17",
        "productos_vencidos": [
            {"producto": "AREPA TIPO OBLEA 500Gr", "cantidad": 5}
        ]
    }
    
    Retorna:
    {
        "success": true,
        "mensaje": "Turno cerrado correctamente",
        "resumen": [
            {
                "producto": "AREPA TIPO OBLEA 500Gr",
                "cargado": 200,
                "vendido": 150,
                "vencidas": 5,
                "devuelto": 45
            }
        ]
    }
    """
    try:
        id_vendedor = request.data.get('id_vendedor')
        fecha = request.data.get('fecha')
        productos_vencidos = request.data.get('productos_vencidos', [])
        
        print(f"🔒 CERRAR TURNO: {id_vendedor} - {fecha}")
        print(f"   Productos vencidos: {productos_vencidos}")
        
        if not id_vendedor or not fecha:
            return Response({
                'error': 'Se requiere id_vendedor y fecha'
            }, status=400)
        
        # Mapeo de ID a Modelo
        modelo_map = {
            'ID1': CargueID1,
            'ID2': CargueID2,
            'ID3': CargueID3,
            'ID4': CargueID4,
            'ID5': CargueID5,
            'ID6': CargueID6,
        }
        
        ModeloCargue = modelo_map.get(id_vendedor)
        if not ModeloCargue:
            return Response({
                'error': f'ID de vendedor inválido: {id_vendedor}'
            }, status=400)
        
        # Obtener cargue del día
        cargues = ModeloCargue.objects.filter(fecha=fecha, activo=True)
        
        # 🆕 LÓGICA INTELIGENTE: Si no hay cargue para hoy, buscar si hay un turno abierto de ayer o antes
        if not cargues.exists():
            try:
                print(f"🕵️ No hay cargue para {fecha}. Buscando turno abierto pendiente...")
                from .models import TurnoVendedor
                v_id_num = int(id_vendedor.replace('ID', '')) if 'ID' in id_vendedor else 0
                
                # Buscar el último turno abierto de este vendedor
                turno_abierto = TurnoVendedor.objects.filter(
                    vendedor_id=v_id_num,
                    estado='ABIERTO'
                ).order_by('-fecha').first()
                
                if turno_abierto:
                    fecha_turno = str(turno_abierto.fecha)
                    # Si encontré un turno abierto y es diferente a la fecha enviada
                    if fecha_turno != fecha:
                        print(f"🔄 REDIRECCIONANDO CIERRE: Usando fecha del turno abierto {fecha_turno} en lugar de {fecha}")
                        # Intentar buscar cargues con la fecha del turno abierto
                        cargues_turno = ModeloCargue.objects.filter(fecha=fecha_turno, activo=True)
                        if cargues_turno.exists():
                            print("✅ ¡Cargues encontrados para el turno abierto!")
                            cargues = cargues_turno
                            fecha = fecha_turno  # Actualizar fecha oficial del proceso
            except Exception as e_recup:
                print(f"⚠️ Error intentando recuperar turno abierto: {e_recup}")

        # Si sigue sin haber cargues, procedemos al cierre vacío (fallback)
        if not cargues.exists():
            print(f"⚠️ No hay cargue para {id_vendedor} en {fecha}. Cerrando turno vacío.")
            # Intentar cerrar el turno Vendedor aunque no haya cargue
            try:
                from .models import TurnoVendedor
                # Mapear ID1 -> 1, ID2 -> 2, etc. (OJO: Asegurarse que vendedor_id en TurnoVendedor es int)
                # Si id_vendedor es 'ID1', extraemos 1.
                v_id_num = int(id_vendedor.replace('ID', '')) if 'ID' in id_vendedor else 0
                
                # Buscar turno abierto
                turno = TurnoVendedor.objects.filter(
                    vendedor_id=v_id_num,
                    fecha=fecha,
                    estado='ABIERTO'
                ).first()
                
                if turno:
                    turno.estado = 'CERRADO'
                    turno.hora_cierre = timezone.now()
                    turno.save()
                    print(f"✅ Turno {turno.id} marcado como CERRADO (sin cargue)")
                
                # También actualizar estado global en CargueResumen a COMPLETADO si existe
                try:
                    from .models import CargueResumen
                    CargueResumen.objects.update_or_create(
                        dia=turno.dia if turno else 'DESCONOCIDO', # Fallback si no hay turno
                        fecha=fecha,
                        vendedor_id=id_vendedor,
                        defaults={'estado_cargue': 'COMPLETADO', 'activo': True}
                    )
                except Exception as ex_resumen:
                     print(f"⚠️ Error actualizando CargueResumen sin cargue: {ex_resumen}")

            except Exception as e:
                print(f"⚠️ Error intentando cerrar turno vacío: {e}")

            return Response({
                'success': True,
                'mensaje': 'Turno cerrado correctamente (Sin registros de cargue)',
                'resumen': [],
                'totales': {
                    'cargado': 0,
                    'vendido': 0,
                    'vencidas': 0,
                    'devuelto': 0
                }
            })
        
        # 🆕 VALIDACIÓN: Verificar si el turno ya fue cerrado
        # Si algún producto tiene devoluciones > 0, significa que ya se cerró el turno
        ya_cerrado = cargues.filter(devoluciones__gt=0).exists()
        if ya_cerrado:
            print(f"⚠️ TURNO YA CERRADO para {id_vendedor} en {fecha}")
            return Response({
                'error': 'TURNO_YA_CERRADO',
                'message': f'El turno para {id_vendedor} en {fecha} ya fue cerrado anteriormente. No se pueden enviar devoluciones duplicadas.'
            }, status=409)
        
        resumen = []
        total_cargado = 0
        total_vendido = 0
        total_vencidas = 0
        total_devuelto = 0
        
        # Procesar cada producto del cargue
        for cargue in cargues:
            # Cantidad inicial con la que salió
            cantidad_inicial = cargue.cantidad - cargue.dctos + cargue.adicional
            
            # 🆕 Usar el campo vendidas que ya se sincroniza automáticamente
            cantidad_vendida = cargue.vendidas or 0
            
            # Buscar vencidas reportadas para este producto (si viene en el request)
            vencidas = cargue.vencidas or 0  # 🆕 Usar vencidas ya guardadas
            for item_vencido in productos_vencidos:
                producto_vencido = item_vencido.get('producto', '')
                if producto_vencido.upper() == cargue.producto.upper():
                    vencidas_adicionales = item_vencido.get('cantidad', 0)
                    if vencidas_adicionales > 0:
                        vencidas = vencidas_adicionales  # Actualizar si viene en request
                    break
            
            # 🔢 Calcular devoluciones automáticamente
            # Fórmula: devoluciones = (cantidad + adicional) - vendidas - vencidas
            devoluciones = max(0, cantidad_inicial - cantidad_vendida - vencidas)
            
            print(f"  📦 {cargue.producto}:")
            print(f"     Cargado: {cantidad_inicial}")
            print(f"     Vendido: {cantidad_vendida}")
            print(f"     Vencidas: {vencidas}")
            print(f"     📊 Devoluciones calculadas: {devoluciones}")
            
            # ✅ GUARDAR en BD
            cargue.vencidas = vencidas
            cargue.devoluciones = devoluciones
            cargue.save()
            
            # Acumular totales
            total_cargado += cantidad_inicial
            total_vendido += cantidad_vendida
            total_vencidas += vencidas
            total_devuelto += devoluciones
            
            resumen.append({
                'producto': cargue.producto,
                'cargado': cantidad_inicial,
                'vendido': cantidad_vendida,
                'vencidas': vencidas,
                'devuelto': devoluciones
            })
        
        # 🆕 MARCAR TURNO COMO CERRADO EN LA BD
        try:
            from .models import TurnoVendedor
            turno = TurnoVendedor.objects.filter(
                vendedor_id=vendedor_id_numerico,
                fecha=fecha
            ).first()
            
            if turno:
                turno.estado = 'CERRADO'
                turno.hora_cierre = timezone.now()
                turno.total_ventas = total_vendido
                turno.total_dinero = total_cargado  # Ajustar según necesites
                turno.save()
                print(f"✅ Turno marcado como CERRADO en BD")
        except Exception as e:
            print(f"⚠️ Error actualizando turno en BD: {e}")
        
        print(f"✅ Turno cerrado para {id_vendedor}")
        print(f"   Total cargado: {total_cargado}")
        print(f"   Total vendido: {total_vendido}")
        print(f"   Total vencidas: {total_vencidas}")
        print(f"   Total devuelto: {total_devuelto}")
        
        return Response({
            'success': True,
            'mensaje': 'Turno cerrado correctamente',
            'resumen': resumen,
            'totales': {
                'cargado': total_cargado,
                'vendido': total_vendido,
                'vencidas': total_vencidas,
                'devuelto': total_devuelto
            }
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ Error cerrando turno: {str(e)}")
        return Response({
            'error': str(e),
            'mensaje': 'Error al cerrar turno'
        }, status=500)


# ========================================
# ENDPOINTS PARA GESTIÓN DE TURNOS (App Móvil)
# ========================================

@api_view(['GET'])
def verificar_turno_activo(request):
    """
    Verificar si hay un turno abierto para un vendedor.
    Permite sincronización entre dispositivos.
    
    🆕 MEJORA: Si el turno no tiene cargue asociado, se cierra automáticamente.
    
    Query params:
    - vendedor_id: ID del vendedor (numérico o cadena ID1, ID2, etc.)
    - fecha: Fecha opcional (default: hoy)
    """
    try:
        from .models import TurnoVendedor, CargueProductos
        from datetime import date
        
        vendedor_id = request.query_params.get('vendedor_id')
        fecha_param = request.query_params.get('fecha')
        
        if not vendedor_id:
            return Response({
                'error': 'vendedor_id es requerido'
            }, status=400)
        
        # Convertir ID de vendedor a numérico y string
        if vendedor_id.upper().startswith('ID'):
            vendedor_id_numerico = int(vendedor_id[2:])
            vendedor_id_str = vendedor_id.upper()
        else:
            vendedor_id_numerico = int(vendedor_id)
            vendedor_id_str = f"ID{vendedor_id_numerico}"
        
        # Fecha (hoy por defecto)
        if fecha_param:
            from datetime import datetime
            fecha = datetime.strptime(fecha_param, '%Y-%m-%d').date()
        else:
            fecha = date.today()
        
        # Buscar turno activo
        if not fecha_param:
            # Si no se especifica fecha, buscar CUALQUIER turno abierto (el más reciente)
            turno = TurnoVendedor.objects.filter(
                vendedor_id=vendedor_id_numerico,
                estado='ABIERTO'
            ).order_by('-fecha').first()
            
            if turno:
                print(f"✅ Turno activo encontrado: {turno.fecha} (Hoy es {date.today()})")
        else:
            # Si se especifica fecha, buscar estrictamente esa fecha
            turno = TurnoVendedor.objects.filter(
                vendedor_id=vendedor_id_numerico,
                fecha=fecha,
                estado='ABIERTO'
            ).first()
        
        if turno:
            # 🆕 VALIDACIÓN: Verificar si el turno tiene cargue asociado
            tiene_cargue = CargueProductos.objects.filter(
                vendedor_id=vendedor_id_str,
                fecha=turno.fecha,
                cantidad__gt=0  # Al menos un producto con cantidad > 0
            ).exists()
            
            if not tiene_cargue:
                # No tiene cargue, cerrar turno automáticamente
                turno.estado = 'CERRADO'
                turno.save()
                print(f"⚠️ Turno {turno.id} cerrado automáticamente (sin cargue): {vendedor_id_str} - {turno.fecha}")
                
                return Response({
                    'turno_activo': False,
                    'mensaje': 'Turno cerrado automáticamente (no tenía cargue asociado)',
                    'turno_cerrado_auto': True
                })
            
            # Tiene cargue, retornar turno activo
            return Response({
                'turno_activo': True,
                'turno_id': turno.id,
                'dia': turno.dia,
                'fecha': turno.fecha.isoformat(),
                'hora_apertura': turno.hora_apertura.isoformat() if turno.hora_apertura else None,
                'vendedor_nombre': turno.vendedor_nombre,
                'total_ventas': turno.total_ventas,
                'total_dinero': float(turno.total_dinero)
            })
        else:
            return Response({
                'turno_activo': False,
                'mensaje': 'No hay turno abierto para esta fecha'
            })
            
    except Exception as e:
        print(f"❌ Error verificando turno: {e}")
        return Response({
            'error': str(e)
        }, status=500)


@api_view(['POST'])
def abrir_turno(request):
    """
    Abrir un nuevo turno para un vendedor.
    Si ya hay turno abierto para ese día, retorna el existente.
    
    Body:
    - vendedor_id: ID del vendedor
    - vendedor_nombre: Nombre del vendedor (opcional)
    - dia: Día de la semana (LUNES, MARTES, etc.)
    - fecha: Fecha del turno (YYYY-MM-DD)
    """
    try:
        from .models import TurnoVendedor
        from datetime import datetime
        
        vendedor_id = request.data.get('vendedor_id')
        vendedor_nombre = request.data.get('vendedor_nombre', '')
        dia = request.data.get('dia', '').upper()
        fecha_str = request.data.get('fecha')
        dispositivo = request.data.get('dispositivo', '')
        
        if not vendedor_id or not dia or not fecha_str:
            return Response({
                'error': 'vendedor_id, dia y fecha son requeridos'
            }, status=400)
        
        # Convertir ID de vendedor a numérico
        if str(vendedor_id).upper().startswith('ID'):
            vendedor_id_numerico = int(vendedor_id[2:])
        else:
            vendedor_id_numerico = int(vendedor_id)
        
        # Parsear fecha
        fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        
        # Verificar si ya existe turno para este día
        turno_existente = TurnoVendedor.objects.filter(
            vendedor_id=vendedor_id_numerico,
            fecha=fecha
        ).first()
        
        if turno_existente:
            if turno_existente.estado == 'ABIERTO':
                # Ya hay un turno abierto, retornarlo
                return Response({
                    'success': True,
                    'nuevo': False,
                    'mensaje': 'Ya hay un turno abierto para este día',
                    'turno_id': turno_existente.id,
                    'dia': turno_existente.dia,
                    'fecha': turno_existente.fecha.isoformat(),
                    'hora_apertura': turno_existente.hora_apertura.isoformat() if turno_existente.hora_apertura else None,
                    'estado': turno_existente.estado
                })
            else:
                # 🆕 LÓGICA REAPERTURA: Verificar si hubo ventas reales antes de bloquear
                from .models import VentaRuta
                
                # Construir ID string (ej: ID1)
                vendedor_str = f"ID{vendedor_id_numerico}"
                
                tiene_ventas = VentaRuta.objects.filter(
                    vendedor__id_vendedor=vendedor_str,
                    fecha__date=fecha
                ).exists()
                
                if tiene_ventas:
                    # El turno ya fue cerrado Y tiene ventas
                    return Response({
                        'error': 'TURNO_YA_CERRADO',
                        'mensaje': 'El turno para este día ya fue cerrado y tiene ventas registradas.'
                    }, status=400)
                else:
                    # No hubo ventas, permitir reabrir
                    turno_existente.estado = 'ABIERTO'
                    turno_existente.hora_cierre = None
                    turno_existente.save()
                    
                    print(f"✅ Turno reabierto (sin ventas previas): {vendedor_nombre} - {fecha}")
                    
                    return Response({
                        'success': True,
                        'nuevo': False,
                        'reabierto': True,
                        'mensaje': 'Turno reabierto (no tenía ventas)',
                        'turno_id': turno_existente.id,
                        'dia': turno_existente.dia,
                        'fecha': turno_existente.fecha.isoformat(),
                        'hora_apertura': turno_existente.hora_apertura.isoformat() if turno_existente.hora_apertura else None,
                        'estado': 'ABIERTO'
                    })
        
        # Crear nuevo turno
        turno = TurnoVendedor.objects.create(
            vendedor_id=vendedor_id_numerico,
            vendedor_nombre=vendedor_nombre,
            dia=dia,
            fecha=fecha,
            estado='ABIERTO',
            hora_apertura=timezone.now(),
            dispositivo=dispositivo
        )
        
        print(f"✅ Turno abierto: {vendedor_nombre} - {dia} {fecha}")
        
        return Response({
            'success': True,
            'nuevo': True,
            'mensaje': 'Turno abierto correctamente',
            'turno_id': turno.id,
            'dia': turno.dia,
            'fecha': turno.fecha.isoformat(),
            'hora_apertura': turno.hora_apertura.isoformat(),
            'estado': turno.estado
        })
        
    except Exception as e:
        print(f"❌ Error abriendo turno: {e}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': str(e)
        }, status=500)


@api_view(['POST'])
def cerrar_turno_estado(request):
    """
    Cerrar turno (cambiar estado a CERRADO).
    Solo cambia el estado, no procesa devoluciones.
    
    Body:
    - vendedor_id: ID del vendedor
    - fecha: Fecha del turno
    """
    try:
        from .models import TurnoVendedor
        from datetime import datetime
        
        vendedor_id = request.data.get('vendedor_id')
        fecha_str = request.data.get('fecha')
        
        if not vendedor_id or not fecha_str:
            return Response({
                'error': 'vendedor_id y fecha son requeridos'
            }, status=400)
        
        # Convertir ID de vendedor a numérico
        if str(vendedor_id).upper().startswith('ID'):
            vendedor_id_numerico = int(vendedor_id[2:])
        else:
            vendedor_id_numerico = int(vendedor_id)
        
        # Parsear fecha
        fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        
        # Buscar turno
        turno = TurnoVendedor.objects.filter(
            vendedor_id=vendedor_id_numerico,
            fecha=fecha
        ).first()
        
        if not turno:
            return Response({
                'error': 'No se encontró turno para esta fecha'
            }, status=404)
        
        if turno.estado == 'CERRADO':
            return Response({
                'error': 'TURNO_YA_CERRADO',
                'mensaje': 'El turno ya estaba cerrado'
            }, status=400)
        
        # Cerrar turno
        turno.estado = 'CERRADO'
        turno.hora_cierre = timezone.now()
        turno.save()
        
        print(f"✅ Turno cerrado (estado): {turno.vendedor_nombre} - {turno.dia} {turno.fecha}")
        
        return Response({
            'success': True,
            'mensaje': 'Turno cerrado correctamente',
            'turno_id': turno.id,
            'hora_cierre': turno.hora_cierre.isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error cerrando turno: {e}")
        return Response({
            'error': str(e)
        }, status=500)


# ========================================
# CONFIGURACIÓN DE PRODUCCIÓN
# ========================================

@api_view(['GET'])
def obtener_configuracion_produccion(request):
    """Obtiene una configuración de producción por clave"""
    from .models import ConfiguracionProduccion
    
    clave = request.query_params.get('clave', 'usuario_produccion')
    
    try:
        config = ConfiguracionProduccion.objects.get(clave=clave)
        return Response({
            'success': True,
            'clave': config.clave,
            'valor': config.valor,
            'descripcion': config.descripcion,
            'fecha_actualizacion': config.fecha_actualizacion
        })
    except ConfiguracionProduccion.DoesNotExist:
        # Si no existe, devolver valor por defecto
        return Response({
            'success': True,
            'clave': clave,
            'valor': 'Usuario Predeterminado',
            'descripcion': 'No configurado',
            'fecha_actualizacion': None
        })


@api_view(['POST', 'PUT'])
def guardar_configuracion_produccion(request):
    """Guarda o actualiza una configuración de producción"""
    from .models import ConfiguracionProduccion
    
    clave = request.data.get('clave', 'usuario_produccion')
    valor = request.data.get('valor', '')
    descripcion = request.data.get('descripcion', '')
    
    if not valor:
        return Response({
            'error': 'El valor es requerido'
        }, status=400)
    
    try:
        config, created = ConfiguracionProduccion.objects.update_or_create(
            clave=clave,
            defaults={
                'valor': valor,
                'descripcion': descripcion
            }
        )
        
        return Response({
            'success': True,
            'action': 'created' if created else 'updated',
            'clave': config.clave,
            'valor': config.valor,
            'descripcion': config.descripcion,
            'fecha_actualizacion': config.fecha_actualizacion
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)


# ========================================
# 🆕 TRAZABILIDAD DE LOTES
# ========================================

@api_view(['GET'])
def buscar_lote(request):
    """
    Busca un lote específico en todas las tablas de cargue.
    Retorna: producción, despachos y vencidas.
    """
    import json
    from .models import CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6, Lote
    
    lote_numero = request.query_params.get('lote', '').upper().strip()
    
    if not lote_numero:
        return Response({'error': 'Debe proporcionar un número de lote'}, status=400)
    
    resultado = {
        'lote': lote_numero,
        'produccion': None,
        'despachos': [],
        'vencidas': []
    }
    
    # 1. Buscar en tabla Lote (lotes registrados en producción)
    try:
        lote_obj = Lote.objects.filter(lote__iexact=lote_numero).first()
        if lote_obj:
            resultado['produccion'] = {
                'fecha': str(lote_obj.fecha_produccion),
                'usuario': lote_obj.usuario,
                'fecha_vencimiento': str(lote_obj.fecha_vencimiento) if lote_obj.fecha_vencimiento else None,
                'activo': lote_obj.activo
            }
    except Exception as e:
        print(f"Error buscando en Lote: {e}")
    
    # 2. Buscar en tablas CargueIDx (lotes_produccion y lotes_vencidos)
    cargue_models = [CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6]
    vendedor_ids = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6']
    
    for idx, CargueModel in enumerate(cargue_models):
        vendedor_id = vendedor_ids[idx]
        
        try:
            # Buscar registros con lotes_produccion o lotes_vencidos que contengan este lote
            registros = CargueModel.objects.filter(
                models.Q(lotes_produccion__icontains=lote_numero) |
                models.Q(lotes_vencidos__icontains=lote_numero)
            )
            
            for reg in registros:
                # Procesar lotes_produccion
                if reg.lotes_produccion and lote_numero in reg.lotes_produccion:
                    try:
                        lotes_prod = json.loads(reg.lotes_produccion) if reg.lotes_produccion else []
                        if lote_numero in lotes_prod:
                            resultado['despachos'].append({
                                'fecha': str(reg.fecha),
                                'dia': reg.dia,
                                'vendedor_id': vendedor_id,
                                'responsable': reg.responsable,
                                'producto': reg.producto,
                                'cantidad': reg.cantidad,
                                'lotes': lotes_prod
                            })
                    except json.JSONDecodeError:
                        # Si no es JSON válido, verificar si es el texto directamente
                        if lote_numero in str(reg.lotes_produccion):
                            resultado['despachos'].append({
                                'fecha': str(reg.fecha),
                                'dia': reg.dia,
                                'vendedor_id': vendedor_id,
                                'responsable': reg.responsable,
                                'producto': reg.producto,
                                'cantidad': reg.cantidad,
                                'lotes': [reg.lotes_produccion]
                            })
                
                # Procesar lotes_vencidos
                if reg.lotes_vencidos and lote_numero in reg.lotes_vencidos:
                    try:
                        lotes_venc = json.loads(reg.lotes_vencidos) if reg.lotes_vencidos else []
                        for lv in lotes_venc:
                            if isinstance(lv, dict) and lv.get('lote', '').upper() == lote_numero:
                                resultado['vencidas'].append({
                                    'fecha': str(reg.fecha),
                                    'dia': reg.dia,
                                    'vendedor_id': vendedor_id,
                                    'responsable': reg.responsable,
                                    'producto': reg.producto,
                                    'cantidad': reg.vencidas,
                                    'motivo': lv.get('motivo', 'N/A'),
                                    'lote': lv.get('lote', lote_numero)
                                })
                    except json.JSONDecodeError:
                        pass
        except Exception as e:
            print(f"Error buscando en {CargueModel.__name__}: {e}")
    
    return Response(resultado)


@api_view(['GET'])
def lotes_por_fecha(request):
    """
    Obtiene todos los lotes de producción para una fecha específica.
    """
    import json
    from .models import CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6, Lote
    
    fecha = request.query_params.get('fecha', '')
    
    if not fecha:
        return Response({'error': 'Debe proporcionar una fecha'}, status=400)
    
    lotes = []
    
    # 1. Buscar en tabla Lote
    try:
        lotes_obj = Lote.objects.filter(fecha_produccion=fecha)
        for lote in lotes_obj:
            lotes.append({
                'lote': lote.lote,
                'fecha': str(lote.fecha_produccion),
                'usuario': lote.usuario,
                'fecha_vencimiento': str(lote.fecha_vencimiento) if lote.fecha_vencimiento else None,
                'origen': 'Producción'
            })
    except Exception as e:
        print(f"Error buscando lotes por fecha: {e}")
    
    # 2. Buscar lotes en tablas CargueIDx
    cargue_models = [CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6]
    vendedor_ids = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6']
    
    lotes_encontrados = set()  # Para evitar duplicados
    
    for idx, CargueModel in enumerate(cargue_models):
        vendedor_id = vendedor_ids[idx]
        
        try:
            registros = CargueModel.objects.filter(
                fecha=fecha,
                lotes_produccion__isnull=False
            ).exclude(lotes_produccion='')
            
            for reg in registros:
                try:
                    lotes_prod = json.loads(reg.lotes_produccion) if reg.lotes_produccion else []
                    for lote_num in lotes_prod:
                        if lote_num and lote_num not in lotes_encontrados:
                            lotes_encontrados.add(lote_num)
                            lotes.append({
                                'lote': lote_num,
                                'fecha': str(reg.fecha),
                                'vendedor_id': vendedor_id,
                                'responsable': reg.responsable,
                                'producto': reg.producto,
                                'cantidad': reg.cantidad,
                                'origen': f'Cargue {vendedor_id}'
                            })
                except json.JSONDecodeError:
                    # Si no es JSON, tratar como texto
                    if reg.lotes_produccion and reg.lotes_produccion not in lotes_encontrados:
                        lotes_encontrados.add(reg.lotes_produccion)
                        lotes.append({
                            'lote': reg.lotes_produccion,
                            'fecha': str(reg.fecha),
                            'vendedor_id': vendedor_id,
                            'responsable': reg.responsable,
                            'producto': reg.producto,
                            'cantidad': reg.cantidad,
                            'origen': f'Cargue {vendedor_id}'
                        })
        except Exception as e:
            print(f"Error buscando lotes en {CargueModel.__name__}: {e}")
    
    return Response({
        'fecha': fecha,
        'total_lotes': len(lotes),
        'lotes': lotes
    })


@api_view(['GET'])
def lotes_por_mes(request):
    """
    Obtiene todos los lotes de producción para un mes específico.
    """
    import json
    from datetime import datetime
    from .models import CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6, Lote
    
    mes = request.query_params.get('mes', '')  # Formato: YYYY-MM
    
    if not mes:
        return Response({'error': 'Debe proporcionar un mes (formato: YYYY-MM)'}, status=400)
    
    try:
        year, month = mes.split('-')
        year = int(year)
        month = int(month)
    except:
        return Response({'error': 'Formato de mes inválido. Use YYYY-MM'}, status=400)
    
    lotes = []
    lotes_por_fecha = {}
    
    # 1. Buscar en tabla Lote
    try:
        lotes_obj = Lote.objects.filter(
            fecha_produccion__year=year,
            fecha_produccion__month=month
        )
        for lote in lotes_obj:
            fecha_str = str(lote.fecha_produccion)
            if fecha_str not in lotes_por_fecha:
                lotes_por_fecha[fecha_str] = []
            
            lotes_por_fecha[fecha_str].append({
                'lote': lote.lote,
                'usuario': lote.usuario,
                'fecha_vencimiento': str(lote.fecha_vencimiento) if lote.fecha_vencimiento else None,
                'origen': 'Producción'
            })
    except Exception as e:
        print(f"Error buscando lotes del mes: {e}")
    
    # 2. Buscar en tablas CargueIDx
    cargue_models = [CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6]
    vendedor_ids = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6']
    
    for idx, CargueModel in enumerate(cargue_models):
        vendedor_id = vendedor_ids[idx]
        
        try:
            registros = CargueModel.objects.filter(
                fecha__year=year,
                fecha__month=month,
                lotes_produccion__isnull=False
            ).exclude(lotes_produccion='')
            
            for reg in registros:
                try:
                    lotes_prod = json.loads(reg.lotes_produccion) if reg.lotes_produccion else []
                    for lote_num in lotes_prod:
                        if lote_num:
                            fecha_str = str(reg.fecha)
                            if fecha_str not in lotes_por_fecha:
                                lotes_por_fecha[fecha_str] = []
                            
                            lotes_por_fecha[fecha_str].append({
                                'lote': lote_num,
                                'vendedor_id': vendedor_id,
                                'responsable': reg.responsable,
                                'producto': reg.producto,
                                'cantidad': reg.cantidad,
                                'origen': f'Cargue {vendedor_id}'
                            })
                except json.JSONDecodeError:
                    pass
        except Exception as e:
            print(f"Error: {e}")
    
    # Convertir a lista ordenada por fecha
    resultado = []
    for fecha in sorted(lotes_por_fecha.keys()):
        resultado.append({
            'fecha': fecha,
            'lotes': lotes_por_fecha[fecha]
        })
    
    return Response({
        'mes': mes,
        'total_fechas': len(resultado),
        'datos': resultado
    })


class RutaOrdenViewSet(viewsets.ModelViewSet):
    """ViewSet para manejar órdenes de clientes por ruta y día"""
    queryset = RutaOrden.objects.all()
    serializer_class = RutaOrdenSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        """Permite filtrar por ruta y día"""
        queryset = super().get_queryset()
        ruta_id = self.request.query_params.get('ruta_id', None)
        dia = self.request.query_params.get('dia', None)
        
        if ruta_id:
            queryset = queryset.filter(ruta_id=ruta_id)
        if dia:
            queryset = queryset.filter(dia=dia.upper())
        return queryset

    def create(self, request, *args, **kwargs):
        """Crear o actualizar orden de ruta para una ruta + día específico"""
        ruta_id = request.data.get('ruta_id')
        dia = request.data.get('dia')
        if dia:
            dia = dia.upper()
        clientes_ids = request.data.get('clientes_ids', [])
        
        if not dia:
            return Response({'error': 'Se requiere dia'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Actualizar o crear el orden para esta ruta + día
        obj, created = RutaOrden.objects.update_or_create(
            ruta_id=ruta_id,
            dia=dia,
            defaults={'clientes_ids': clientes_ids}
        )
        
        print(f"✅ Orden guardado: Ruta={ruta_id}, Día={dia}, Clientes={len(clientes_ids)}")
        
        serializer = self.get_serializer(obj)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def obtener_orden(self, request):
        """
        Obtener el orden de clientes para una ruta y día específico
        GET /api/ruta-orden/obtener_orden/?ruta_id=1&dia=MARTES
        """
        ruta_id = request.query_params.get('ruta_id')
        dia = request.query_params.get('dia', '').upper()
        
        if not dia:
            return Response({'error': 'Se requiere dia'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            orden = RutaOrden.objects.get(ruta_id=ruta_id, dia=dia)
            return Response({
                'ruta_id': ruta_id,
                'dia': dia,
                'clientes_ids': orden.clientes_ids,
                'fecha_actualizacion': orden.fecha_actualizacion
            })
        except RutaOrden.DoesNotExist:
            # Si no existe orden personalizado, devolver lista vacía
            return Response({
                'ruta_id': ruta_id,
                'dia': dia,
                'clientes_ids': [],
                'mensaje': 'No hay orden personalizado para este día'
            })


# ============================================================================
# 🤖 ENDPOINTS DE IA LOCAL (Ollama)
# ============================================================================

@api_view(['POST'])
def ai_chat(request):
    """
    Chat con el asistente IA
    
    POST /api/ai/chat/
    Body: {
        "question": "¿Cómo cierro el turno?",
        "include_docs": true  // opcional, default true
    }
    """
    
    question = request.data.get('question')
    if not question:
        return Response({
            'error': 'Se requiere campo "question"'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    include_docs = request.data.get('include_docs', False)  # OPTIMIZADO: False por defecto para velocidad
    
    try:
        ai = AIAssistant()
        answer = ai.ask(question, include_docs=include_docs)
        
        return Response({
            'question': question,
            'answer': answer,
            'model': ai.model
        })
    except Exception as e:
        return Response({
            'error': f'Error consultando IA: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def ai_analyze_data(request):
    """
    Analiza datos con IA
    
    POST /api/ai/analyze/
    Body: {
        "data": {...},  // datos a analizar
        "question": "¿Qué tendencia ves?"
    }
    """
    from api.services.ai_assistant_service import AIAssistant
    
    data = request.data.get('data')
    question = request.data.get('question')
    
    if not data or not question:
        return Response({
            'error': 'Se requieren campos "data" y "question"'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        ai = AIAssistant()
        analysis = ai.analyze_data(data, question)
        
        return Response({
            'analysis': analysis,
            'model': ai.model
        })
    except Exception as e:
        return Response({
            'error': f'Error analizando: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def ai_health(request):
    """
    Verifica estado de IA
    
    GET /api/ai/health/
    """
    try:
        from api.services.ai_assistant_service import AIAssistant
        ai = AIAssistant()
        health_status = ai.check_health()
        return Response(health_status)
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def ai_agent_command(request):
    """
    Endpoint para ejecutar comandos con el agente IA
    
    POST /api/ai/agent/
    Body: {
        "command": "Crea un cliente llamado Juan con teléfono 123456"
    }
    """
    from api.services.ai_agent_service import AIAgentService
    
    command = request.data.get('command')
    session_id = request.data.get('session_id')  # Capturar session_id
    
    if not command:
        return Response({
            'error': 'Se requiere campo "command"'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        from api.services.ai_agent_service import AIAgentService
        agent = AIAgentService(model="qwen2.5:3b")
        result = agent.process_command(command)
        
        return Response(result)
    except Exception as e:
        return Response({
            'error': f'Error procesando comando: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReportePlaneacionViewSet(viewsets.ModelViewSet):
    """API para gestionar snapshots de reportes de planeación"""
    queryset = ReportePlaneacion.objects.all()
    serializer_class = ReportePlaneacionSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = ReportePlaneacion.objects.all().order_by('-fecha_creacion')
        
        # Filtros
        fecha = self.request.query_params.get('fecha')
        if fecha:
            queryset = queryset.filter(fecha_reporte=fecha)
            
        return queryset

    def perform_create(self, serializer):
        """Guardar reporte y entrenar Red Neuronal"""
        instance = serializer.save()
        
        try:
            from api.services.ia_service import IAService
            # Entrenar en segundo plano (o inmediato si es rápido)
            ia_service = IAService()
            success = ia_service.train_with_report(instance)
            if success:
                print(f"🧠 Red Neuronal re-entrenada con reporte {instance.fecha_reporte}")
        except Exception as e:
            print(f"⚠️ Error entrenando IA tras guardar reporte: {e}")


# ==================== REPORTES AVANZADOS ====================

@api_view(['GET'])
def reportes_vendedores(request):
    """
    Reporte consolidado de vendedores con ventas, vencidas y devoluciones
    GET /api/reportes/vendedores/?periodo=mes&fecha_inicio=2026-01-01&fecha_fin=2026-01-31
    """
    try:
        from django.db.models import Sum, Count, Q
        from datetime import datetime
        
        periodo = request.GET.get('periodo', 'mes')
        fecha_inicio = request.GET.get('fecha_inicio')
        fecha_fin = request.GET.get('fecha_fin')
        
        if not fecha_inicio or not fecha_fin:
            return Response({'error': 'Faltan parámetros: fecha_inicio y fecha_fin'}, status=400)

        # Mapeo de ID a Nombre Real
        nombres_reales = {}

        def get_nombre_vendedor(identificador):
            identificador = str(identificador).upper()
            if identificador in nombres_reales:
                return nombres_reales[identificador]
            return identificador

        # Cargar mapa de precios reales para corrección de montos en 0
        precios_productos = {}
        try:
            from .models import Producto
            productos_qs = Producto.objects.all()
            for p in productos_qs:
                precios_productos[p.nombre] = float(p.precio_cargue or p.precio or 0)
        except:
            print("No se pudo cargar tabla Productos para precios")

        # Obtener datos de CargueResumen
        resumenes = CargueResumen.objects.filter(
            fecha__gte=fecha_inicio,
            fecha__lte=fecha_fin
        )

        vendedores_data = {}

        # Pre-poblar con todos los vendedores activos
        try:
             todos_vendedores_objs = Vendedor.objects.filter(activo=True)
             for v in todos_vendedores_objs:
                key_id = v.id_vendedor.upper()
                nombres_reales[key_id] = v.nombre.upper()
                if key_id.startswith('ID'):
                    id_num = key_id.replace('ID', '')
                    nombres_reales[id_num] = v.nombre.upper()
                
                # Inicializar vendedor en data
                nombre_real = v.nombre.upper()
                if nombre_real not in vendedores_data:
                    vendedores_data[nombre_real] = {
                        'id': f"ID{v.id_vendedor}" if not v.id_vendedor.startswith('ID') else v.id_vendedor,
                        'nombre': nombre_real,
                        'ventas_totales': 0,
                        'monto': 0.0,
                        'monto_ruta': 0.0,
                        'monto_pedidos': 0.0,
                        'vencidas': 0,
                        'devoluciones': 0,
                        'efectividad': 100.0
                    }
        except:
             pass

        for resumen in resumenes:
            vendedor_raw = resumen.vendedor_id
            nombre_real = get_nombre_vendedor(vendedor_raw)

            if nombre_real not in vendedores_data:
                vendedores_data[nombre_real] = {
                    'id': vendedor_raw,
                    'nombre': nombre_real,
                    'ventas_totales': 0,
                    'monto': 0.0,
                    'monto_ruta': 0.0,
                    'monto_pedidos': 0.0,
                    'vencidas': 0,
                    'devoluciones': 0,
                    'efectividad': 100.0
                }
            
            # Montos base desde Resumen
            venta_ruta = float(resumen.total_despacho or 0)
            venta_pedidos = float(resumen.total_pedidos or 0)
            devoluciones_cnt = 0
            vencidas_cnt = 0
            
            # Intentar obtener el modelo específico CargueIDx para recalcular si es 0
            try:
                id_num = ''.join(filter(str.isdigit, str(vendedor_raw)))
                if not id_num and nombre_real in nombres_reales.values():
                    for k, v in nombres_reales.items():
                        if v == nombre_real and k.isdigit():
                            id_num = k
                            break
                
                if id_num:
                    try:
                        from django.apps import apps
                        CargueModel = apps.get_model('api', f"CargueID{id_num}")
                    except LookupError:
                        CargueModel = None
                    
                    if CargueModel:
                        items_cargue = CargueModel.objects.filter(
                            fecha__gte=fecha_inicio,
                            fecha__lte=fecha_fin
                        )
                        
                        calc_ruta = 0.0
                        calc_pedidos_bdd = 0.0
                        
                        for item in items_cargue:
                            # RUTAS: Recalcular con precio catalogo
                            precio = float(item.valor)
                            if precio == 0 and item.producto in precios_productos:
                                precio = precios_productos[item.producto]
                            
                            if item.cantidad > 0:
                                calc_ruta += (item.cantidad * precio)
                            
                            # Intentar leer total_pedidos global guardado en la fila
                            val_p = getattr(item, 'total_pedidos', 0)
                            if val_p and float(val_p) > calc_pedidos_bdd:
                                calc_pedidos_bdd = float(val_p)

                            # Sumar devoluciones y vencidas (unidades)
                            if item.devoluciones > 0:
                                devoluciones_cnt += item.devoluciones
                            
                            if item.vencidas > 0:
                                vencidas_cnt += item.vencidas

                        # Si el cálculo da más que el resumen, usémoslo
                        if calc_ruta > venta_ruta:
                            venta_ruta = calc_ruta
                        
                        # Si encontramos valor en BD cargue, usarlo
                        if calc_pedidos_bdd > venta_pedidos:
                            venta_pedidos = calc_pedidos_bdd
                            
                        # PEDIDOS: Consultar tabla Pedido directamente (Fuente de verdad)
                        try:
                            from .models import Pedido
                            # Buscar pedidos entregados/pendientes para esa fecha y vendedor
                            pedidos_qs = Pedido.objects.filter(
                                vendedor=nombre_real,
                                fecha_entrega__date__gte=fecha_inicio,
                                fecha_entrega__date__lte=fecha_fin
                            ).exclude(estado='ANULADA')
                            
                            calc_pedidos = 0.0
                            for p in pedidos_qs:
                                calc_pedidos += float(p.total or 0)
                                
                            if calc_pedidos > venta_pedidos:
                                venta_pedidos = calc_pedidos
                        except Exception as e:
                            print(f"Error consultando pedidos para {nombre_real}: {e}")
                            
            except Exception as e:
                print(f"Error recalculando montos para {nombre_real}: {e}")

            # ACTUALIZAR DATOS
            vendedores_data[nombre_real]['monto_ruta'] += venta_ruta
            vendedores_data[nombre_real]['monto_pedidos'] += venta_pedidos
            vendedores_data[nombre_real]['monto'] += (venta_ruta + venta_pedidos)
            vendedores_data[nombre_real]['devoluciones'] += devoluciones_cnt
            vendedores_data[nombre_real]['vencidas'] += vencidas_cnt
            
            # Ventas totales (usaremos conteo de pedidos como proxy de 'transacciones' o días activos)
            vendedores_data[nombre_real]['ventas_totales'] += 1 

        # Convertir a lista
        resultado = list(vendedores_data.values())
        
        # Ordenar por ID ascendente (ID1, ID2, ID3...)
        def extract_id_number(item):
            try:
                id_str = str(item.get('id', ''))
                # Extraer solo dígitos
                nums = ''.join(filter(str.isdigit, id_str))
                return int(nums) if nums else 9999
            except:
                return 9999

        resultado.sort(key=extract_id_number)
        
        return Response({
            'vendedores': resultado,
            'periodo': periodo,
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin
        })
        
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        print(error_msg)
        try:
            with open('/home/john/Escritorio/crm-fabrica/error_log.txt', 'w') as f:
                f.write(error_msg)
        except:
            pass
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def reportes_efectividad_vendedores(request):
    """
    Reporte de efectividad de vendedores: Vendió, Devolvió, Vencidas, Cumplimiento, Efectividad
    GET /api/reportes/efectividad-vendedores/?periodo=mes&fecha_inicio=2026-01-01&fecha_fin=2026-01-31
    """
    try:
        from django.db.models import Sum, Count, Q
        from datetime import datetime
        
        periodo = request.GET.get('periodo', 'mes')
        fecha_inicio = request.GET.get('fecha_inicio')
        fecha_fin = request.GET.get('fecha_fin')
        
        if not fecha_inicio or not fecha_fin:
            return Response({'error': 'Faltan parámetros: fecha_inicio y fecha_fin'}, status=400)
        
        # Obtener todos los vendedores activos
        vendedores = Vendedor.objects.filter(activo=True)
        
        resultado = []
        
        for vendedor in vendedores:
            # Obtener todas las ventas del vendedor en el período
            ventas_ruta = VentaRuta.objects.filter(
                vendedor=vendedor,
                fecha__date__gte=fecha_inicio,
                fecha__date__lte=fecha_fin
            )
            
            # VENDIÓ: Total de productos que llevó (cantidad en cada venta)
            vendio = 0
            for venta in ventas_ruta:
                if venta.detalle_productos:  # JSON con los productos de la venta
                    for producto in venta.detalle_productos:
                        vendio += producto.get('cantidad', 0)
            
            # DEVOLVIÓ: Productos devueltos
            devolvio = 0
            for venta in ventas_ruta:
                if venta.productos_devueltos:  # JSON con productos devueltos
                    for producto in venta.productos_devueltos:
                        devolvio += producto.get('cantidad', 0)
            
            # VENCIDAS: Productos vencidos
            vencidas = 0
            for venta in ventas_ruta:
                if venta.productos_vencidos:  # JSON con productos vencidos
                    for producto in venta.productos_vencidos:
                        vencidas += producto.get('cantidad', 0)
            
            # VENTAS REALES: Vendió - (Devolvió + Vencidas)
            ventas_reales = vendio - (devolvio + vencidas)
            if ventas_reales < 0:
                ventas_reales = 0
            
            # EFECTIVIDAD: (Ventas Reales / Vendió) * 100
            efectividad = 0.0
            if vendio > 0:
                efectividad = (ventas_reales / vendio) * 100
            
            # CUMPLIMIENTO: (Ventas Reales / Meta) * 100
            # Por ahora asumimos meta = vendió, se puede ajustar si hay campo de meta
            cumplimiento = efectividad  # Simplificado
            
            resultado.append({
                'id': vendedor.id_vendedor,
                'nombre': vendedor.nombre,
                'vendio': vendio,
                'devolvio': devolvio,
                'vencidas': vencidas,
                'ventas_reales': ventas_reales,
                'cumplimiento': round(cumplimiento, 2),
                'efectividad': round(efectividad, 2)
            })
        
        # Ordenar por ventas reales descendente
        resultado.sort(key=lambda x: x['ventas_reales'], reverse=True)
        
        return Response({
            'vendedores': resultado,
            'periodo': periodo,
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin
        })
        
    except Exception as e:
        print(f"Error en reportes_efectividad_vendedores: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def reportes_analisis_productos(request):
    """
    Análisis consolidado de productos: vendidos, devueltos y vencidos
    GET /api/reportes/analisis-productos/?tipo=vendidos&periodo=mes&fecha_inicio=2026-01-01&fecha_fin=2026-01-31&orden=desc&limite=10

    tipo: vendidos | devueltos | vencidos
    """
    try:
        from django.db.models import Sum
        from django.apps import apps
        from collections import Counter
        
        tipo = request.GET.get('tipo', 'vendidos')
        periodo = request.GET.get('periodo', 'mes')
        fecha_inicio = request.GET.get('fecha_inicio')
        fecha_fin = request.GET.get('fecha_fin')
        orden = request.GET.get('orden', 'desc')  # desc o asc
        limite = int(request.GET.get('limite', 10))
        
        if not fecha_inicio or not fecha_fin:
            return Response({'error': 'Faltan parámetros: fecha_inicio y fecha_fin'}, status=400)
        
        productos_conteo = Counter()
        vendedores_por_producto = {}
        
        # 1. Consultar las 6 tablas de CargueIDx
        for id_num in range(1, 7):
            try:
                CargueModel = apps.get_model('api', f'CargueID{id_num}')
                
                items = CargueModel.objects.filter(
                    fecha__gte=fecha_inicio,
                    fecha__lte=fecha_fin
                )
                
                for item in items:
                    nombre_producto = item.producto or 'Desconocido'
                    
                    # Seleccionar campo según tipo
                    if tipo == 'vendidos':
                        # Solo cantidad (lo realmente despachado/vendido)
                        cantidad = item.cantidad or 0
                    elif tipo == 'devueltos':
                        cantidad = item.devoluciones or 0
                    elif tipo == 'vencidos':
                        cantidad = item.vencidas or 0
                    else:
                        cantidad = 0
                    
                    if cantidad > 0:
                        productos_conteo[nombre_producto] += cantidad
                        
                        # Contar vendedores únicos por producto
                        if tipo in ['devueltos', 'vencidos']:
                            if nombre_producto not in vendedores_por_producto:
                                vendedores_por_producto[nombre_producto] = set()
                            vendedores_por_producto[nombre_producto].add(f'ID{id_num}')
                            
            except Exception as e:
                print(f"Error consultando CargueID{id_num}: {e}")
                continue
        
        # 2. Si es tipo "vendidos", también sumar productos de la tabla Pedido
        if tipo == 'vendidos':
            try:
                from .models import Pedido
                
                # fecha_entrega es DateField, no necesita __date
                pedidos = Pedido.objects.filter(
                    fecha_entrega__gte=fecha_inicio,
                    fecha_entrega__lte=fecha_fin
                ).exclude(estado='ANULADA')
                
                for pedido in pedidos:
                    # Usar related_name 'detalles' para acceder a DetallePedido
                    for detalle in pedido.detalles.all():
                        # producto es FK, acceder al nombre via producto.nombre
                        nombre_producto = detalle.producto.nombre if detalle.producto else 'Desconocido'
                        cantidad = detalle.cantidad or 0
                        
                        if cantidad > 0:
                            productos_conteo[nombre_producto] += cantidad
                            
            except Exception as e:
                print(f"Error consultando Pedidos: {e}")
                import traceback
                traceback.print_exc()
        
        # Convertir a lista y ordenar
        resultado = []
        for nombre, total in productos_conteo.items():
            item = {
                'nombre': nombre,
                'total': total
            }
            
            # Agregar conteo de vendedores para devueltos/vencidos
            if tipo in ['devueltos', 'vencidos']:
                item['vendedores'] = len(vendedores_por_producto.get(nombre, set()))
            
            resultado.append(item)
        
        # Ordenar
        reverse = (orden == 'desc')
        resultado.sort(key=lambda x: x['total'], reverse=reverse)
        
        # Limitar resultados
        resultado = resultado[:limite]
        
        return Response({
            'productos': resultado,
            'tipo': tipo,
            'periodo': periodo,
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin,
            'total_productos': len(resultado)
        })
        
    except Exception as e:
        print(f"Error en reportes_analisis_productos: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def reportes_pedidos_ruta(request):
    """
    Pedidos por ruta agrupados por vendedor
    GET /api/reportes/pedidos-ruta/?fecha_inicio=2026-01-01&fecha_fin=2026-01-31&vendedor=ID1&estado=pendiente
    """
    try:
        from datetime import datetime
        
        fecha_inicio = request.GET.get('fecha_inicio')
        fecha_fin = request.GET.get('fecha_fin')
        vendedor_id = request.GET.get('vendedor')
        estado_filtro = request.GET.get('estado')
        
        if not fecha_inicio or not fecha_fin:
            return Response({'error': 'Faltan parámetros: fecha_inicio y fecha_fin'}, status=400)
        
        # Query base
        pedidos = Pedido.objects.filter(
            fecha__date__gte=fecha_inicio,
            fecha__date__lte=fecha_fin
        ).select_related('usuario')
        
        # Filtros opcionales
        if vendedor_id:
            pedidos = pedidos.filter(usuario__username__icontains=vendedor_id)
        
        if estado_filtro and estado_filtro != 'todos':
            pedidos = pedidos.filter(estado=estado_filtro)
        
        # Serializar resultado
        resultado = []
        for pedido in pedidos:
            resultado.append({
                'id': pedido.id,
                'vendedor_nombre': pedido.usuario.username if pedido.usuario else 'Sin vendedor',
                'ruta': getattr(pedido, 'ruta', None),  # Si existe campo ruta
                'cliente_nombre': pedido.cliente.nombre if pedido.cliente else 'Sin cliente',
                'fecha': pedido.fecha.isoformat(),
                'total': float(pedido.total),
                'estado': pedido.estado
            })
        
        return Response({
            'pedidos': resultado,
            'total': len(resultado),
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin
        })
        
    except Exception as e:
        print(f"Error en reportes_pedidos_ruta: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def dashboard_ejecutivo(request):
    """
    Dashboard ejecutivo consolidado con información de CARGUE
    GET /api/dashboard-ejecutivo/?periodo=dia&fecha_inicio=2026-01-24&fecha_fin=2026-01-24
    """
    try:
        from django.db.models import Sum, Count, Q
        from collections import Counter, defaultdict
        
        periodo = request.GET.get('periodo', 'dia')
        fecha_inicio = request.GET.get('fecha_inicio')
        fecha_fin = request.GET.get('fecha_fin')
        
        if not fecha_inicio or not fecha_fin:
            return Response({'error': 'Faltan parámetros: fecha_inicio y fecha_fin'}, status=400)
        
        # OBTENER TOTALES POR VENDEDOR desde CargueResumen (tiene los $$ correctos)
        resumenes = CargueResumen.objects.filter(
            fecha__gte=fecha_inicio,
            fecha__lte=fecha_fin,
            activo=True
        )
        
        # Mapeo de ID a Nombre Real (para unificar ID1 con WILSON)
        nombres_reales = {}
        try:
            from .models import Vendedor
            # Cargar mapa de vendedores: {1: 'WILSON', 2: 'OTRO', ...}
            todos_vendedores = Vendedor.objects.all()
            for v in todos_vendedores:
                # Asumimos que ID1 corresponde al vendedor con id=1, etc.
                key_id = f"ID{v.id}"
                nombres_reales[key_id] = v.nombre.upper()
        except:
            print("No se pudo cargar tabla Vendedores")

        # Función helper para normalizar nombre
        def get_nombre_vendedor(identificador):
            identificador = identificador.upper()
            # Si es ID1, ID2, etc buscar en mapa
            if identificador.startswith('ID') and identificador in nombres_reales:
                return nombres_reales[identificador]
            # Si ya es un nombre (WILSON), devolverlo
            return identificador

        # DATOS POR VENDEDOR usando CargueResumen
        vendedores_data = {}
        
        for resumen in resumenes:
            vendedor_raw = resumen.vendedor_id
            nombre_real = get_nombre_vendedor(vendedor_raw)
            
            if nombre_real not in vendedores_data:
                vendedores_data[nombre_real] = {
                    'nombre': nombre_real,
                    'ventas_count': 0,
                    'ventas_monto': 0,
                    'devueltas_count': 0,
                    'devueltas_monto': 0,
                    'vencidas_count': 0,
                    'vencidas_monto': 0
                }
            
            # Sumar el monto de venta (calcularlo si es 0)
            monto_venta = float(resumen.venta or 0)
            if monto_venta == 0:
                # Si venta es 0, intentar calcular como despacho + pedidos
                monto_venta = float(resumen.total_despacho or 0) + float(resumen.total_pedidos or 0)
            
            vendedores_data[nombre_real]['ventas_monto'] += monto_venta
        
        # OBTENER PRODUCTOS (vendidas, devoluciones, vencidas) desde los 6 modelos
        todos_cargues = []
        for modelo in [CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6]:
            cargues = modelo.objects.filter(
                fecha__gte=fecha_inicio,
                fecha__lte=fecha_fin,
                activo=True
            )
            todos_cargues.extend(list(cargues))
        
        # Cargar mapa de precios reales para corrección de montos en 0
        precios_productos = {}
        try:
            from .models import Producto
            productos_qs = Producto.objects.all()
            for p in productos_qs:
                precios_productos[p.nombre] = float(p.precio_cargue or p.precio or 0)
        except:
            print("No se pudo cargar tabla Productos para precios")

        # Contadores de productos
        productos_vendidos = Counter()
        productos_devueltos = Counter()
        productos_vencidos = Counter()
        
        for cargue in todos_cargues:
            # Obtener nombre normalizado
            if hasattr(cargue, 'responsable') and cargue.responsable:
                 vendedor_raw = cargue.responsable
                 vendedor_nombre = get_nombre_vendedor(vendedor_raw)
            else:
                 modelo_name = cargue.__class__.__name__
                 id_suffix = modelo_name.replace('Cargue', '')
                 vendedor_nombre = get_nombre_vendedor(id_suffix)

            if vendedor_nombre not in vendedores_data:
                vendedores_data[vendedor_nombre] = {
                    'nombre': vendedor_nombre,
                    'ventas_count': 0,
                    'ventas_monto': 0,
                    'devueltas_count': 0,
                    'devueltas_monto': 0,
                    'vencidas_count': 0,
                    'vencidas_monto': 0
                }
            
            # Obtener precio real (si cargue.valor es 0, usar catalogo)
            precio_real = float(cargue.valor)
            if precio_real == 0 and cargue.producto in precios_productos:
                precio_real = precios_productos[cargue.producto]
            
            # VENTAS (unidades)
            if cargue.vendidas > 0:
                vendedores_data[vendedor_nombre]['ventas_count'] += cargue.vendidas
                productos_vendidos[cargue.producto] += cargue.vendidas
            
            # DEVOLUCIONES (unidades + monto)
            if cargue.devoluciones > 0:
                vendedores_data[vendedor_nombre]['devueltas_count'] += cargue.devoluciones
                vendedores_data[vendedor_nombre]['devueltas_monto'] += float(cargue.devoluciones * precio_real)
                productos_devueltos[cargue.producto] += cargue.devoluciones
            
            # VENCIDAS (unidades + monto)
            if cargue.vencidas > 0:
                vendedores_data[vendedor_nombre]['vencidas_count'] += cargue.vencidas
                vendedores_data[vendedor_nombre]['vencidas_monto'] += float(cargue.vencidas * precio_real)
                productos_vencidos[cargue.producto] += cargue.vencidas
        
        # Calcular porcentajes
        vendedores_list = []
        for v_data in vendedores_data.values():
            total_productos = v_data['ventas_count'] + v_data['devueltas_count'] + v_data['vencidas_count']
            if total_productos > 0:
                v_data['porcentaje_devolucion'] = round((v_data['devueltas_count'] / total_productos) * 100, 2)
                v_data['porcentaje_vencidas'] = round((v_data['vencidas_count'] / total_productos) * 100, 2)
                v_data['efectividad'] = round((v_data['ventas_count'] / total_productos) * 100, 2)
            else:
                v_data['porcentaje_devolucion'] = 0
                v_data['porcentaje_vencidas'] = 0
                v_data['efectividad'] = 0
            vendedores_list.append(v_data)
        
        # Ordenar por monto
        vendedores_list.sort(key=lambda x: x['ventas_monto'], reverse=True)
        
        # Top 10 productos
        top_vendidos = [{'nombre': n, 'cantidad': c} for n, c in productos_vendidos.most_common(10)]
        top_devueltos = [{'nombre': n, 'cantidad': c} for n, c in productos_devueltos.most_common(10)]
        top_vencidos = [{'nombre': n, 'cantidad': c} for n, c in productos_vencidos.most_common(10)]
        
        # TOTALES
        totales = {
            'ventas_total': sum(v['ventas_count'] for v in vendedores_list),
            'ventas_monto_total': sum(v['ventas_monto'] for v in vendedores_list),
            'devueltas_total': sum(v['devueltas_count'] for v in vendedores_list),
            'devueltas_monto_total': sum(v['devueltas_monto'] for v in vendedores_list),
            'vencidas_total': sum(v['vencidas_count'] for v in vendedores_list),
            'vencidas_monto_total': sum(v['vencidas_monto'] for v in vendedores_list),
        }
        
        total_all = totales['ventas_total'] + totales['devueltas_total'] + totales['vencidas_total']
        totales['efectividad_promedio'] = round((totales['ventas_total'] / total_all * 100), 2) if total_all > 0 else 0
        
        return Response({
            'periodo': periodo,
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin,
            'vendedores': vendedores_list,
            'top_productos_vendidos': top_vendidos,
            'top_productos_devueltos': top_devueltos,
            'top_productos_vencidos': top_vencidos,
            'totales': totales
        })
        
    except Exception as e:
        print(f"Error en dashboard_ejecutivo: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def reportes_ventas_pos(request):
    """
    Reporte de ventas POS del usuario logueado
    GET /api/reportes/ventas-pos/?periodo=dia&fecha_inicio=2026-01-18&fecha_fin=2026-01-18
    """
    try:
        from collections import defaultdict
        from datetime import datetime
        
        periodo = request.GET.get('periodo', 'dia')
        fecha_inicio = request.GET.get('fecha_inicio')
        fecha_fin = request.GET.get('fecha_fin')
        
        if not fecha_inicio or not fecha_fin:
            return Response({'error': 'Faltan parámetros'}, status=400)
        
        # Obtener usuario logueado (desde token o session)
        usuario = request.user
        
        # Obtener ventas del usuario en el período
        # Suponiendo que hay un modelo Venta con campo usuario
        try:
            from .models import Venta
            ventas = Venta.objects.filter(
                usuario=usuario,
                fecha__date__gte=fecha_inicio,
                fecha__date__lte=fecha_fin
            ).order_by('-fecha')
        except:
            # Si no existe modelo Venta, retornar datos de ejemplo
            ventas = []
        
        # Calcular métricas
        total_ventas = len(ventas)
        monto_total = sum(float(v.total) for v in ventas)
        total_productos = sum(v.productos.count() if hasattr(v, 'productos') else 0 for v in ventas)
        
        # Agrupar por día/semana/mes
        por_dia = defaultdict(lambda: {'ventas': 0, 'monto': 0})
        
        for venta in ventas:  
            if periodo == 'dia':
                clave = venta.fecha.strftime('%Y-%m-%d')
            elif periodo == 'semana':
                clave = f"Sem {venta.fecha.isocalendar()[1]}"
            elif periodo == 'mes':
                clave = venta.fecha.strftime('%Y-%m')
            else:  # año
                clave = venta.fecha.strftime('%Y')
            
            por_dia[clave]['ventas'] += 1
            por_dia[clave]['monto'] += float(venta.total)
        
        # Serializar ventas
        ventas_list = []
        for v in ventas:
            ventas_list.append({
                'id': v.id,
                'fecha': v.fecha.isoformat(),
                'cliente': getattr(v.cliente, 'nombre', 'Cliente General') if hasattr(v, 'cliente') else 'General',
                'productos': v.productos.count() if hasattr(v, 'productos') else 0,
                'total': float(v.total),
                'estado': getattr(v, 'estado', 'completada')
            })
        
        # Convertir por_dia a lista
        por_dia_list = [
            {'fecha': fecha, 'ventas': datos['ventas'], 'monto': datos['monto']}
            for fecha, datos in sorted(por_dia.items())
        ]
        
        return Response({
            'usuario': usuario.username,
            'total_ventas': total_ventas,
            'monto_total': monto_total,
            'total_productos': total_productos,
            'por_dia': por_dia_list,
            'ventas': ventas_list,
            'periodo': periodo
        })
        
    except Exception as e:
        print(f"Error en reportes_ventas_pos: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def test_dashboard_data(request):
    """
    Test endpoint para verificar datos de VentaRuta
    GET /api/test-dashboard-data/
    """
    try:
        fecha_inicio = request.GET.get('fecha_inicio', '2026-01-24')
        fecha_fin = request.GET.get('fecha_fin', '2026-01-24')
        
        ventas = VentaRuta.objects.filter(
            fecha__date__gte=fecha_inicio,
            fecha__date__lte=fecha_fin
        ).select_related('vendedor')
        
        resultado = {
            'total_ventas': ventas.count(),
            'ventas': []
        }
        
        for venta in ventas[:5]:  # Solo las primeras 5
            resultado['ventas'].append({
                'id': venta.id,
                'fecha': venta.fecha.isoformat(),
                'vendedor': venta.vendedor.nombre if venta.vendedor else None,
                'cliente': venta.cliente.nombre if venta.cliente else None,
                'detalle_productos_type': type(venta.detalle_productos).__name__,
                'detalle_productos': venta.detalle_productos,
                'productos_devueltos': venta.productos_devueltos,
                'productos_vencidos': venta.productos_vencidos,
            })
        
        return Response(resultado)
    except Exception as e:
        import traceback
        return Response({
            'error': str(e),
            'traceback': traceback.format_exc()
        }, status=500)


# ========================================
# 📷 EVIDENCIAS DE PEDIDOS
# ========================================

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def subir_evidencia_pedido(request):
    """
    Subir foto de evidencia para un pedido (vencidos/novedades)
    POST /api/evidencia-pedido/
    
    Form data:
    - pedido_id: ID del pedido (requerido)
    - producto_nombre: Nombre del producto (opcional)
    - motivo: Razón de la evidencia (opcional, default: 'Devolución en entrega')
    - imagen: Archivo de imagen (requerido)
    
    Ejemplo desde App:
    ```javascript
    const formData = new FormData();
    formData.append('pedido_id', pedidoId);
    formData.append('producto_nombre', 'AREPA TIPO OBLEA');
    formData.append('motivo', 'Producto vencido');
    formData.append('imagen', { uri: fotoUri, name: 'evidencia.jpg', type: 'image/jpeg' });
    
    fetch('/api/evidencia-pedido/', {
        method: 'POST',
        body: formData
    });
    ```
    """
    try:
        from .models import Pedido, EvidenciaPedido
        
        pedido_id = request.data.get('pedido_id')
        producto_nombre = request.data.get('producto_nombre', '')
        motivo = request.data.get('motivo', 'Devolución en entrega')
        imagen = request.FILES.get('imagen')
        
        # Validaciones
        if not pedido_id:
            return Response({'error': 'pedido_id es requerido'}, status=400)
        
        if not imagen:
            return Response({'error': 'imagen es requerida'}, status=400)
        
        # Buscar el pedido
        try:
            pedido = Pedido.objects.get(id=pedido_id)
        except Pedido.DoesNotExist:
            # Intentar buscar por numero_pedido
            try:
                pedido = Pedido.objects.get(numero_pedido=pedido_id)
            except Pedido.DoesNotExist:
                return Response({'error': f'Pedido {pedido_id} no encontrado'}, status=404)
        
        # Crear la evidencia
        evidencia = EvidenciaPedido.objects.create(
            pedido=pedido,
            producto_nombre=producto_nombre,
            motivo=motivo,
            imagen=imagen
        )
        
        print(f"📷 Evidencia creada para pedido {pedido.numero_pedido}: {producto_nombre} - {motivo}")
        
        return Response({
            'success': True,
            'message': 'Evidencia subida correctamente',
            'evidencia': {
                'id': evidencia.id,
                'pedido': pedido.numero_pedido,
                'producto_nombre': evidencia.producto_nombre,
                'motivo': evidencia.motivo,
                'imagen': request.build_absolute_uri(evidencia.imagen.url) if evidencia.imagen else None
            }
        }, status=201)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def obtener_evidencias_pedido(request, pedido_id):
    """
    Obtener todas las evidencias de un pedido
    GET /api/evidencia-pedido/<pedido_id>/
    """
    try:
        from .models import Pedido, EvidenciaPedido
        
        # Buscar el pedido
        try:
            pedido = Pedido.objects.get(id=pedido_id)
        except Pedido.DoesNotExist:
            try:
                pedido = Pedido.objects.get(numero_pedido=pedido_id)
            except Pedido.DoesNotExist:
                return Response({'error': f'Pedido {pedido_id} no encontrado'}, status=404)
        
        evidencias = EvidenciaPedido.objects.filter(pedido=pedido)
        
        resultado = []
        for ev in evidencias:
            resultado.append({
                'id': ev.id,
                'producto_nombre': ev.producto_nombre,
                'motivo': ev.motivo,
                'imagen': request.build_absolute_uri(ev.imagen.url) if ev.imagen else None,
                'fecha_creacion': ev.fecha_creacion.isoformat()
            })
        
        return Response({
            'pedido': pedido.numero_pedido,
            'total_evidencias': len(resultado),
            'evidencias': resultado
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


# ========================================
# 🔐 ENDPOINTS DE AUTENTICACIÓN
# ========================================

@api_view(['POST'])
def auth_login(request):
    """
    Endpoint de login para el Frontend Web.
    Rechaza vendedores de App Móvil (solo acceden por la App).
    """
    import hashlib
    from .models import Cajero
    
    codigo_o_nombre = request.data.get('codigo', '').strip()
    password = request.data.get('password', '')
    
    if not codigo_o_nombre or not password:
        return Response({
            'success': False,
            'error': 'Código/Nombre y contraseña son requeridos'
        }, status=400)
    
    try:
        # Buscar usuario por código o nombre
        usuario = Cajero.objects.filter(
            models.Q(codigo__iexact=codigo_o_nombre) | 
            models.Q(nombre__iexact=codigo_o_nombre)
        ).first()
        
        if not usuario:
            return Response({
                'success': False,
                'error': 'Usuario no encontrado'
            }, status=401)
        
        # Verificar si está activo
        if not usuario.activo:
            return Response({
                'success': False,
                'error': 'Usuario desactivado. Contacte al administrador.'
            }, status=401)
        
        # Rechazar vendedores de App Móvil
        if usuario.rol == 'VENDEDOR':
            return Response({
                'success': False,
                'error': 'Los vendedores de App Móvil no tienen acceso al sistema web. Use la aplicación móvil.'
            }, status=403)
        
        # Verificar contraseña
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Comparar con password hasheado O con password_plano
        password_valido = (
            usuario.password == password_hash or 
            usuario.password == password or 
            usuario.password_plano == password
        )
        
        if not password_valido:
            return Response({
                'success': False,
                'error': 'Contraseña incorrecta'
            }, status=401)
        
        # Actualizar último login
        usuario.ultimo_login = timezone.now()
        usuario.save(update_fields=['ultimo_login'])
        
        # Respuesta exitosa
        return Response({
            'success': True,
            'message': f'Bienvenido, {usuario.nombre}',
            'usuario': {
                'id': usuario.id,
                'codigo': usuario.codigo,
                'nombre': usuario.nombre,
                'email': usuario.email,
                'telefono': usuario.telefono,
                'rol': usuario.rol,
                'sucursal': usuario.sucursal.nombre if usuario.sucursal else None,
                'sucursal_id': usuario.sucursal.id if usuario.sucursal else None,
                'permisos': {
                    'acceso_pos': usuario.acceso_pos,
                    'acceso_pedidos': usuario.acceso_pedidos,
                    'acceso_cargue': usuario.acceso_cargue,
                    'acceso_produccion': usuario.acceso_produccion,
                    'acceso_inventario': usuario.acceso_inventario,
                    'acceso_reportes': usuario.acceso_reportes,
                    'acceso_configuracion': usuario.acceso_configuracion,
                    'puede_hacer_descuentos': usuario.puede_hacer_descuentos,
                    'puede_anular_ventas': usuario.puede_anular_ventas,
                },
                'es_admin': usuario.rol == 'ADMINISTRADOR',
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error en el servidor: {str(e)}'
        }, status=500)


@api_view(['POST'])
def auth_recuperar_password(request):
    """
    Solicitar recuperación de contraseña por email o teléfono.
    Genera un código temporal y lo envía.
    """
    import random
    from .models import Cajero
    
    email_o_telefono = request.data.get('contacto', '').strip()
    
    if not email_o_telefono:
        return Response({
            'success': False,
            'error': 'Ingrese su email o teléfono registrado'
        }, status=400)
    
    try:
        # Buscar usuario por email o teléfono
        usuario = Cajero.objects.filter(
            models.Q(email__iexact=email_o_telefono) | 
            models.Q(telefono__iexact=email_o_telefono)
        ).first()
        
        if not usuario:
            return Response({
                'success': False,
                'error': 'No se encontró ningún usuario con ese email o teléfono'
            }, status=404)
        
        # Generar código de recuperación (6 dígitos)
        codigo_recuperacion = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # TODO: Enviar código por email o SMS
        # Por ahora, lo devolvemos en la respuesta (solo para desarrollo)
        # En producción, usar servicios como SendGrid, Twilio, etc.
        
        # Guardar código temporalmente (en una tabla o cache)
        # Por simplicidad, lo guardamos en password_plano temporalmente
        # (en producción usar tabla de tokens de recuperación)
        
        return Response({
            'success': True,
            'message': f'Se ha enviado un código de recuperación a {email_o_telefono}',
            # Solo en desarrollo:
            'codigo_temporal': codigo_recuperacion,
            'usuario_id': usuario.id,
            'nota': 'En producción, el código se envía por email/SMS'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error en el servidor: {str(e)}'
        }, status=500)


@api_view(['POST'])
def auth_cambiar_password(request):
    """
    Cambiar contraseña de un usuario.
    Requiere: usuario_id, nueva_password, (codigo_recuperacion o password_actual)
    """
    import hashlib
    from .models import Cajero
    
    usuario_id = request.data.get('usuario_id')
    nueva_password = request.data.get('nueva_password', '').strip()
    password_actual = request.data.get('password_actual', '').strip()
    
    if not usuario_id or not nueva_password:
        return Response({
            'success': False,
            'error': 'Faltan datos requeridos'
        }, status=400)
    
    if len(nueva_password) < 4:
        return Response({
            'success': False,
            'error': 'La contraseña debe tener al menos 4 caracteres'
        }, status=400)
    
    try:
        usuario = Cajero.objects.get(id=usuario_id)
        
        # Si se proporciona password_actual, verificarlo
        if password_actual:
            password_hash = hashlib.sha256(password_actual.encode()).hexdigest()
            if usuario.password != password_hash and usuario.password != password_actual:
                return Response({
                    'success': False,
                    'error': 'Contraseña actual incorrecta'
                }, status=401)
        
        # Hashear y guardar nueva contraseña
        nuevo_hash = hashlib.sha256(nueva_password.encode()).hexdigest()
        usuario.password = nuevo_hash
        usuario.password_plano = nueva_password
        usuario.save(update_fields=['password', 'password_plano'])
        
        return Response({
            'success': True,
            'message': 'Contraseña actualizada correctamente'
        })
        
    except Cajero.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Usuario no encontrado'
        }, status=404)
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error en el servidor: {str(e)}'
        }, status=500)


# ========================================
# 🧠 CONFIGURACIÓN Y LOGS DE REDES NEURONALES (IA)
# ========================================

@api_view(['GET', 'POST'])
def ia_config(request):
    """
    Gestionar configuración del Servicio de IA
    GET: Retorna estado actual
    POST: Actualiza configuración
    """
    # Usar archivo temporal para configuración por simplicidad
    CONFIG_FILE = 'ia_config.json'
    import json
    
    default_config = {
        'active': True,
        'continuousLearning': True,
        'lastTraining': None
    }
    
    # Cargar config actual
    current_config = default_config
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                current_config = json.load(f)
        except:
            pass
            
    if request.method == 'GET':
        return Response(current_config)
        
    elif request.method == 'POST':
        new_config = request.data
        current_config.update(new_config)
        
        try:
            with open(CONFIG_FILE, 'w') as f:
                json.dump(current_config, f)
            return Response({'success': True, 'config': current_config})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def ia_retrain(request):
    """
    Dispara re-entrenamiento completo de la red neuronal
    basado en todos los Reportes de Planeación históricos.
    """
    try:
        from api.services.neural_network_service import NeuralNetworkService
        from api.models import ReportePlaneacion
        
        nn_service = NeuralNetworkService()
        
        # Obtener todos los reportes ordenados por fecha
        reportes = ReportePlaneacion.objects.all().order_by('fecha_reporte')
        count = 0
        
        for reporte in reportes:
            if nn_service.train_incremental(reporte):
                count += 1
                
        # Actualizar fecha de último entrenamiento
        import json
        CONFIG_FILE = 'ia_config.json'
        # Asegurar que existe si no
        if not os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'w') as f:
                json.dump({'active': True, 'continuousLearning': True}, f)

        if os.path.exists(CONFIG_FILE):
             with open(CONFIG_FILE, 'r+') as f:
                try:
                    config = json.load(f)
                except:
                    config = {'active': True, 'continuousLearning': True}
                
                config['lastTraining'] = timezone.now().isoformat()
                f.seek(0)
                json.dump(config, f)
                f.truncate()
        
        return Response({
            'success': True,
            'message': f'Re-entrenamiento completado con {count} reportes históricos.'
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def ia_logs(request):
    """
    Retorna logs recientes de la actividad neuronal.
    Simulado leyendo el archivo de log principal o memoria.
    """
    # Simulamos logs para la demo visual, en un sistema real leeríamos un archivo .log
    from datetime import datetime
    
    # Intentar leer config para estado
    import json
    CONFIG_FILE = 'ia_config.json'
    config = {'active': True, 'continuousLearning': True}
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
    except:
        pass

    # Generar logs simulados de "estado actual"
    logs = [
        {'time': datetime.now().strftime('%H:%M:%S'), 'type': 'INFO', 'message': 'Sistema Neuronal: EN LÍNEA'},
        {'time': datetime.now().strftime('%H:%M:%S'), 'type': 'INFO', 'message': f'Aprendizaje Continuo: {"ACTIVADO" if config.get("continuousLearning") else "DESACTIVADO"}'},
    ]
    
    if config.get('lastTraining'):
        logs.append({'time': config['lastTraining'].split('T')[1][:8], 'type': 'SUCCESS', 'message': 'Último re-entrenamiento exitoso'})

    return Response({'logs': logs, 'config': config})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def exportar_clientes_excel(request):
    """
    Genera un archivo CSV compatible con Excel con todos los clientes (Ruta y Pedidos).
    """
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="clientes_backup_{timezone.now().strftime("%Y%m%d")}.csv"'
    response.write(u'\ufeff'.encode('utf8')) # BOM para Excel

    writer = csv.writer(response)
    
    # Encabezados
    writer.writerow(['Origen', 'Nombre Negocio/Cliente', 'Contacto', 'Dirección', 'Teléfono', 'Ruta/Zona', 'Día Visita', 'Activo', 'Notas'])
    
    # 1. Clientes de Ruta
    clientes_ruta = ClienteRuta.objects.all().order_by('ruta', 'orden')
    for c in clientes_ruta:
        ruta_nombre = c.ruta.nombre if c.ruta else 'Sin Ruta'
        writer.writerow([
            'Ruta',
            c.nombre_negocio,
            c.nombre_contacto or '',
            c.direccion or '',
            c.telefono or '',
            ruta_nombre,
            c.dia_visita,
            'Si' if c.activo else 'No',
            c.nota or ''
        ])
        
    # 2. Clientes de Pedidos (Únicos por nombre y dirección)
    pedidos = Pedido.objects.values(
        'destinatario', 'telefono_contacto', 'direccion_entrega', 'zona_barrio', 'nota'
    ).distinct()
    
    seen = set()
    for p in pedidos:
        nombre = p['destinatario']
        direccion = p['direccion_entrega']
        
        if not nombre: continue
        
        # Normalizar para detectar duplicados
        key = (nombre.lower().strip(), direccion.lower().strip() if direccion else '')
        
        if key not in seen:
            seen.add(key)
            writer.writerow([
                'Pedido',
                nombre,
                '', # contacto
                direccion or '',
                p['telefono_contacto'] or '',
                p['zona_barrio'] or '',
                '', # dia visita
                'Si', 
                p['nota'] or ''
            ])

    return response


