from rest_framework import viewsets, permissions, status, parsers
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from django.conf import settings
from django.db import transaction
from django.utils import timezone
import os
import base64
import re
import uuid
from .models import Planeacion, Registro, Producto, Categoria, Stock, Lote, MovimientoInventario, RegistroInventario, Venta, DetalleVenta, Cliente, ListaPrecio, PrecioProducto, CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6, Produccion, ProduccionSolicitada, Pedido, DetallePedido, Vendedor, Domiciliario, MovimientoCaja, ArqueoCaja, ConfiguracionImpresion, Ruta, ClienteRuta, VentaRuta
from .serializers import (
    PlaneacionSerializer,
    RegistroSerializer, ProductoSerializer, CategoriaSerializer, StockSerializer,
    LoteSerializer, MovimientoInventarioSerializer, RegistroInventarioSerializer,
    VentaSerializer, DetalleVentaSerializer, ClienteSerializer, ListaPrecioSerializer, PrecioProductoSerializer,
    CargueID1Serializer, CargueID2Serializer, CargueID3Serializer, CargueID4Serializer, CargueID5Serializer, CargueID6Serializer, ProduccionSerializer, ProduccionSolicitadaSerializer, PedidoSerializer, DetallePedidoSerializer, VendedorSerializer, DomiciliarioSerializer, MovimientoCajaSerializer, ArqueoCajaSerializer, ConfiguracionImpresionSerializer,
    RutaSerializer, ClienteRutaSerializer, VentaRutaSerializer
)

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
    queryset = Producto.objects.all().order_by('id')  # Orden consistente por ID
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
            print("📊 Datos recibidos:", request.data)
            venta_data = request.data.copy()
            detalles_data = venta_data.pop('detalles', [])
            
            print("📊 Datos de venta:", venta_data)
            print("📊 Datos de detalles:", detalles_data)
            
            # Crear la venta
            venta_serializer = self.get_serializer(data=venta_data)
            if not venta_serializer.is_valid():
                print("❌ Errores en venta:", venta_serializer.errors)
                return Response(venta_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            venta = venta_serializer.save()
            print("✅ Venta creada:", venta.id)
            
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
            queryset = queryset.filter(producto=producto)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
            
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Crear registro con logging detallado"""
        import traceback
        import os
        from datetime import datetime
        
        # Log a archivo
        log_file = '/home/john/Escritorio/crm-fabrica/cargue_create.log'
        with open(log_file, 'a') as f:
            f.write("=" * 80 + "\n")
            f.write(f"🆕 CREATE CargueID1 - {datetime.now()}\n")
            f.write(f"   producto: {request.data.get('producto')}\n")
            f.write(f"   cantidad: {request.data.get('cantidad')}\n")
            f.write(f"   dctos: {request.data.get('dctos')}\n")
            f.write(f"   adicional: {request.data.get('adicional')}\n")
            f.write(f"   dia: {request.data.get('dia')}\n")
            f.write(f"   fecha: {request.data.get('fecha')}\n")
            f.write("STACK TRACE:\n")
            f.write(''.join(traceback.format_stack()))
            f.write("=" * 80 + "\n\n")
        
        print("=" * 80)
        print(f"🆕 CREATE CargueID1 - Datos recibidos:")
        print(f"   producto: {request.data.get('producto')}")
        print(f"   cantidad: {request.data.get('cantidad')}")
        print(f"   dctos: {request.data.get('dctos')}")
        print(f"   adicional: {request.data.get('adicional')}")
        print(f"   dia: {request.data.get('dia')}")
        print(f"   fecha: {request.data.get('fecha')}")
        print("=" * 80)
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Actualizar registro con logging detallado"""
        instance = self.get_object()
        print(f"🔄 UPDATE CargueID1 - Producto: {instance.producto}")
        print(f"   ANTES - cantidad: {instance.cantidad}, dctos: {instance.dctos}, adicional: {instance.adicional}")
        print(f"   DATOS RECIBIDOS:")
        print(f"   cantidad: {request.data.get('cantidad')}")
        print(f"   dctos: {request.data.get('dctos')}")
        print(f"   adicional: {request.data.get('adicional')}")
        
        response = super().update(request, *args, **kwargs)
        
        # Recargar para ver valores después del save()
        instance.refresh_from_db()
        print(f"   DESPUÉS - cantidad: {instance.cantidad}, dctos: {instance.dctos}, adicional: {instance.adicional}, total: {instance.total}")
        
        return response

class CargueID2ViewSet(viewsets.ModelViewSet):
    """API simplificada para CargueID2 - Como api_vendedor"""
    queryset = CargueID2.objects.all()
    serializer_class = CargueID2Serializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
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
            queryset = queryset.filter(producto=producto)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
            
        return queryset

class CargueID3ViewSet(viewsets.ModelViewSet):
    """API simplificada para CargueID3 - Como api_vendedor"""
    queryset = CargueID3.objects.all()
    serializer_class = CargueID3Serializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
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
            queryset = queryset.filter(producto=producto)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
            
        return queryset

class CargueID4ViewSet(viewsets.ModelViewSet):
    """API simplificada para CargueID4 - Como api_vendedor"""
    queryset = CargueID4.objects.all()
    serializer_class = CargueID4Serializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
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
            queryset = queryset.filter(producto=producto)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
            
        return queryset

class CargueID5ViewSet(viewsets.ModelViewSet):
    """API simplificada para CargueID5 - Como api_vendedor"""
    queryset = CargueID5.objects.all()
    serializer_class = CargueID5Serializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
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
            queryset = queryset.filter(producto=producto)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
            
        return queryset

class CargueID6ViewSet(viewsets.ModelViewSet):
    """API simplificada para CargueID6 - Como api_vendedor"""
    queryset = CargueID6.objects.all()
    serializer_class = CargueID6Serializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
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
            queryset = queryset.filter(producto=producto)
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
        if pedido.estado == 'ANULADA':
            # Si ya está anulado, devolvemos una respuesta exitosa para que el frontend no quede bloqueado
            return Response(
                {'success': True, 'message': 'El pedido ya estaba anulado'},
                status=status.HTTP_200_OK
            )  
        try:
            with transaction.atomic():
                print(f"\n{'='*60}")
                print(f"🔄 ANULANDO PEDIDO #{pedido.numero_pedido}")
                print(f"{'='*60}")
                print(f"📋 Destinatario: {pedido.destinatario}")
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
                        
                        # Descontar del stock
                        stock_anterior = producto.stock_total
                        producto.stock_total -= cantidad_a_descontar
                        producto.save()
                        
                        print(f"✅ {producto.nombre}: {stock_anterior} → {producto.stock_total} (-{cantidad_a_descontar})")
                        
                        # Crear movimiento de inventario
                        MovimientoInventario.objects.create(
                            producto=producto,
                            tipo='SALIDA',
                            cantidad=cantidad_a_descontar,
                            usuario=request.data.get('usuario', 'Sistema'),
                            nota=f'Corrección manual - Pedido #{pedido.numero_pedido} - {pedido.destinatario}'
                        )
                        
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
        print('📦 Datos recibidos para crear arqueo:', request.data)
        
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            print('✅ Arqueo creado exitosamente:', serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            print('❌ Error al crear arqueo:', str(e))
            if hasattr(e, 'detail'):
                print('   Detalles:', e.detail)
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
            
            # Solo procesar si hay cantidad > 0 (o si se quiere resetear a 0)
            # Asumiremos que la app envía todo, o solo lo modificado.
            # Lo mejor es actualizar siempre si viene el dato.
            
            if nombre:
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
                obj, created = Modelo.objects.update_or_create(
                    dia=dia,
                    fecha=fecha,
                    producto=nombre,
                    defaults={
                        'cantidad': cantidad,
                        'total': cantidad,  # ✅ Total = cantidad (sin dctos ni adicionales desde app)
                        'responsable': responsable_a_usar,
                        'usuario': 'AppMovil'
                    }
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
        
        # Buscar el registro
        try:
            registro = Modelo.objects.get(dia=dia, fecha=fecha, producto=producto)
        except Modelo.DoesNotExist:
            return Response({'error': 'Producto no encontrado en cargue'}, status=404)
        
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
        
        # Normalizar día (manejar con y sin tildes)
        dias_con_tilde = {
            'SABADO': 'SÁBADO',
            'MIERCOLES': 'MIÉRCOLES',
        }
        dia = dias_con_tilde.get(dia_raw, dia_raw)

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
        for reg in registros:
            data[reg.producto] = {
                'quantity': str(reg.total or reg.cantidad),  # Total calculado
                'cantidad': reg.cantidad or 0,  # Cantidad base
                'adicional': reg.adicional or 0,  # Adicionales
                'dctos': reg.dctos or 0,  # Descuentos
                'v': reg.v,  # Check vendedor
                'd': reg.d   # Check despachador
            }
            
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
        
        if ruta_id:
            queryset = queryset.filter(ruta_id=ruta_id)
        if dia:
            # Buscar clientes que tengan este día en su lista (soporta múltiples días)
            # Ej: Si dia="MIERCOLES", encuentra "LUNES,MIERCOLES,VIERNES"
            queryset = queryset.filter(dia_visita__icontains=dia.upper())
            
        return queryset.filter(activo=True).order_by('orden')

class VentaRutaViewSet(viewsets.ModelViewSet):
    queryset = VentaRuta.objects.all()
    serializer_class = VentaRutaSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = VentaRuta.objects.all()
        vendedor_id = self.request.query_params.get('vendedor_id', None)
        fecha = self.request.query_params.get('fecha', None)
        
        if vendedor_id:
            queryset = queryset.filter(vendedor__id_vendedor=vendedor_id)
        if fecha:
            # Filtrar por fecha (solo la parte de la fecha, ignorando la hora)
            queryset = queryset.filter(fecha__date=fecha)
        
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
        from .models import Vendedor, EvidenciaVenta
        from rest_framework import status
        from django.http import QueryDict
        
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
        print("=" * 60)
        print("📦 DATOS A VALIDAR:")
        print(f"data keys: {data.keys()}")
        print(f"vendedor: {data.get('vendedor')}")
        print(f"cliente_nombre: {data.get('cliente_nombre')}")
        print(f"total: {data.get('total')}")
        print(f"detalles type: {type(data.get('detalles'))}, valor: {data.get('detalles')}")
        print(f"productos_vencidos type: {type(data.get('productos_vencidos'))}, valor: {data.get('productos_vencidos')}")
        print("=" * 60)
        
        serializer = self.get_serializer(data=data)
        
        if not serializer.is_valid():
            print("❌ ERRORES DE VALIDACIÓN:")
            print(serializer.errors)
            print("=" * 60)
            
        serializer.is_valid(raise_exception=True)
        venta = serializer.save()
        
        # ========== AUTO-CREAR CLIENTE SI NO EXISTE ==========
        from .models import ClienteRuta, Ruta
        nombre_negocio = data.get('nombre_negocio', '')
        cliente_nombre = data.get('cliente_nombre', '')
        
        if nombre_negocio and nombre_negocio.strip():
            # Buscar si ya existe el cliente por nombre de negocio
            cliente_existente = ClienteRuta.objects.filter(nombre_negocio__iexact=nombre_negocio.strip()).first()
            
            if not cliente_existente:
                # Buscar la ruta del vendedor
                try:
                    vendedor_obj = venta.vendedor
                    ruta_vendedor = Ruta.objects.filter(vendedor=vendedor_obj).first()
                    
                    if ruta_vendedor:
                        # Crear el cliente automáticamente
                        nuevo_cliente = ClienteRuta.objects.create(
                            ruta=ruta_vendedor,
                            nombre_negocio=nombre_negocio.strip(),
                            nombre_contacto=cliente_nombre.strip() if cliente_nombre else '',
                            orden=ClienteRuta.objects.filter(ruta=ruta_vendedor).count() + 1
                        )
                        # Asociar el cliente a la venta
                        venta.cliente = nuevo_cliente
                        venta.save(update_fields=['cliente'])
                        print(f"✅ Cliente creado automáticamente: {nombre_negocio}")
                except Exception as e:
                    print(f"⚠️ No se pudo crear cliente automático: {e}")
            else:
                # Asociar cliente existente a la venta
                venta.cliente = cliente_existente
                venta.save(update_fields=['cliente'])
                print(f"✅ Cliente existente asociado: {nombre_negocio}")
        
        # Guardar las evidencias asociadas
        for evidencia_info in evidencias_data:
            EvidenciaVenta.objects.create(
                venta=venta,
                producto_id=evidencia_info['producto_id'],
                imagen=evidencia_info['imagen']
            )
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


