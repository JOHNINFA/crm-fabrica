from rest_framework import viewsets, permissions, status, parsers
from rest_framework.response import Response
from rest_framework.decorators import action
from django.conf import settings
from django.db import transaction
import os
import base64
import re
import uuid
from .models import Planeacion, Registro, Producto, Categoria, Lote, MovimientoInventario, RegistroInventario, Venta, DetalleVenta, Cliente, ListaPrecio, PrecioProducto, CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6, Produccion, ProduccionSolicitada, Pedido, DetallePedido, Vendedor
from .serializers import (
    PlaneacionSerializer,
    RegistroSerializer, ProductoSerializer, CategoriaSerializer,
    LoteSerializer, MovimientoInventarioSerializer, RegistroInventarioSerializer,
    VentaSerializer, DetalleVentaSerializer, ClienteSerializer, ListaPrecioSerializer, PrecioProductoSerializer,
    CargueID1Serializer, CargueID2Serializer, CargueID3Serializer, CargueID4Serializer, CargueID5Serializer, CargueID6Serializer, ProduccionSerializer, ProduccionSolicitadaSerializer, PedidoSerializer, DetallePedidoSerializer, VendedorSerializer
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
    queryset = Producto.objects.all()
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
        activo = self.request.query_params.get('activo')
        
        if dia:
            queryset = queryset.filter(dia=dia.upper())
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
            
        return queryset

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
        activo = self.request.query_params.get('activo')
        
        if dia:
            queryset = queryset.filter(dia=dia.upper())
        if fecha:
            queryset = queryset.filter(fecha=fecha)
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
        activo = self.request.query_params.get('activo')
        
        if dia:
            queryset = queryset.filter(dia=dia.upper())
        if fecha:
            queryset = queryset.filter(fecha=fecha)
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
        activo = self.request.query_params.get('activo')
        
        if dia:
            queryset = queryset.filter(dia=dia.upper())
        if fecha:
            queryset = queryset.filter(fecha=fecha)
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
        activo = self.request.query_params.get('activo')
        
        if dia:
            queryset = queryset.filter(dia=dia.upper())
        if fecha:
            queryset = queryset.filter(fecha=fecha)
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
        activo = self.request.query_params.get('activo')
        
        if dia:
            queryset = queryset.filter(dia=dia.upper())
        if fecha:
            queryset = queryset.filter(fecha=fecha)
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
        """Crear arqueo con validaciones"""
        try:
            # Validar que no exista un arqueo para la misma fecha, cajero y banco
            fecha = request.data.get('fecha')
            cajero = request.data.get('cajero')
            banco = request.data.get('banco', 'Caja General')
            
            arqueo_existente = ArqueoCaja.objects.filter(
                fecha=fecha,
                cajero=cajero,
                banco=banco
            ).first()
            
            if arqueo_existente:
                return Response({
                    'error': f'Ya existe un arqueo para {cajero} en {banco} el {fecha}',
                    'arqueo_existente': ArqueoCajaSerializer(arqueo_existente).data
                }, status=status.HTTP_400_BAD_REQUEST)
            
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
        """Anular pedido"""
        pedido = self.get_object()
        
        if pedido.estado == 'ANULADA':
            return Response(
                {'error': 'El pedido ya está anulado'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cambiar estado
        pedido.estado = 'ANULADA'
        pedido.nota = f"{pedido.nota or ''}\nAnulada: {request.data.get('motivo', 'Sin motivo especificado')}"
        pedido.save()
        
        # Opcional: devolver productos al inventario
        devolver_inventario = request.data.get('devolver_inventario', False)
        if devolver_inventario:
            for detalle in pedido.detalles.all():
                producto = detalle.producto
                producto.stock_total += detalle.cantidad
                producto.save()
                
                # Registrar movimiento
                MovimientoInventario.objects.create(
                    producto=producto,
                    tipo='ENTRADA',
                    cantidad=detalle.cantidad,
                    usuario=request.user.username if request.user.is_authenticated else 'Sistema',
                    nota=f'Devolución por anulación de pedido {pedido.numero_pedido}'
                )
        
        serializer = self.get_serializer(pedido)
        return Response({
            'success': True,
            'message': 'Pedido anulado exitosamente',
            'pedido': serializer.data
        })

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
        if fecha:
            queryset = queryset.filter(fecha=fecha)
        return queryset.order_by('producto_nombre')


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
            
            # Actualizar o crear vendedor
            vendedor, created = Vendedor.objects.update_or_create(
                id_vendedor=id_vendedor,
                defaults={'nombre': responsable}
            )
            
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
