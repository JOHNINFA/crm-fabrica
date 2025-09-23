from rest_framework import viewsets, permissions, status, parsers
from rest_framework.response import Response
from rest_framework.decorators import action
from django.conf import settings
from django.db import transaction
import os
import base64
import re
import uuid
from .models import Registro, Producto, Categoria, Lote, MovimientoInventario, RegistroInventario, Venta, DetalleVenta, Cliente, ListaPrecio, PrecioProducto, Vendedor, CargueOperativo, DetalleCargue, ResumenPagos, ResumenTotales, LoteVencido, ControlCumplimiento
from .serializers import (
    RegistroSerializer, ProductoSerializer, CategoriaSerializer,
    LoteSerializer, MovimientoInventarioSerializer, RegistroInventarioSerializer,
    VentaSerializer, DetalleVentaSerializer, ClienteSerializer, ListaPrecioSerializer, PrecioProductoSerializer,
    VendedorSerializer, CargueOperativoSerializer, DetalleCargueSerializer, ResumenPagosSerializer, ResumenTotalesSerializer, LoteVencidoSerializer, ControlCumplimientoSerializer
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

class VendedorViewSet(viewsets.ModelViewSet):
    """API para gestionar vendedores"""
    queryset = Vendedor.objects.all()
    serializer_class = VendedorSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Vendedor.objects.all().order_by('id_vendedor')
        
        # Filtros opcionales
        activo = self.request.query_params.get('activo')
        id_vendedor = self.request.query_params.get('id_vendedor')
        
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
        if id_vendedor:
            queryset = queryset.filter(id_vendedor=id_vendedor)
            
        return queryset
    
    @action(detail=False, methods=['post'])
    def actualizar_responsable(self, request):
        """Actualizar responsable de un vendedor por id_vendedor"""
        try:
            import datetime
            timestamp = datetime.datetime.now().strftime('%H:%M:%S.%f')[:-3]
            
            id_vendedor = request.data.get('id_vendedor')
            nuevo_responsable = request.data.get('responsable', '').strip()
            
            print(f"\n=== 🔥 ACTUALIZANDO RESPONSABLE [{timestamp}] ===")
            print(f"ID Vendedor: {id_vendedor}")
            print(f"Nuevo Responsable: '{nuevo_responsable}'")
            print(f"Request IP: {request.META.get('REMOTE_ADDR', 'Unknown')}")
            print(f"Request User-Agent: {request.META.get('HTTP_USER_AGENT', 'Unknown')[:50]}...")
            
            if not id_vendedor:
                print("❌ Error: id_vendedor es requerido")
                return Response(
                    {'error': 'id_vendedor es requerido'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not nuevo_responsable:
                print("❌ Error: responsable no puede estar vacío")
                return Response(
                    {'error': 'responsable no puede estar vacío'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Buscar o crear vendedor
            vendedor, created = Vendedor.objects.get_or_create(
                id_vendedor=id_vendedor,
                defaults={
                    'nombre': f'Vendedor {id_vendedor}',
                    'ruta': f'Ruta {id_vendedor}',
                    'responsable': nuevo_responsable
                }
            )
            
            if created:
                print(f"🆕 Vendedor creado: {vendedor.nombre} ({vendedor.id_vendedor})")
            else:
                responsable_anterior = vendedor.responsable
                vendedor.responsable = nuevo_responsable
                vendedor.save()
                print(f"🔄 Vendedor actualizado: {vendedor.nombre} ({vendedor.id_vendedor})")
                print(f"Responsable ANTES: '{responsable_anterior}'")
                print(f"Responsable DESPUÉS: '{vendedor.responsable}'")
            
            print(f"=== ✅ RESPONSABLE ACTUALIZADO [{timestamp}] ===\n")
            
            return Response({
                'success': True,
                'vendedor': {
                    'id': vendedor.id,
                    'id_vendedor': vendedor.id_vendedor,
                    'nombre': vendedor.nombre,
                    'responsable': vendedor.responsable,
                    'ruta': vendedor.ruta
                },
                'created': created,
                'message': f'Responsable {"asignado" if created else "actualizado"} exitosamente'
            })
            
        except Exception as e:
            print(f"❌ Error actualizando responsable: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Error interno: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CargueOperativoViewSet(viewsets.ModelViewSet):
    """API para gestionar cargues operativos con lógica Crear o Actualizar (Upsert)"""
    queryset = CargueOperativo.objects.all()
    serializer_class = CargueOperativoSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = CargueOperativo.objects.all().order_by('-fecha')
        
        # Filtros opcionales
        dia = self.request.query_params.get('dia')
        vendedor = self.request.query_params.get('vendedor')
        fecha = self.request.query_params.get('fecha')
        
        if dia:
            queryset = queryset.filter(dia=dia.upper())
        if vendedor:
            queryset = queryset.filter(vendedor_id=vendedor)
        if fecha:
            queryset = queryset.filter(fecha=fecha)
            
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Crear o Actualizar cargue operativo con datos anidados (Lógica Upsert)"""
        try:
            print("🚛 Datos recibidos para CargueOperativo:", request.data)
            
            # 1. Extraer datos anidados del request
            data = request.data.copy()
            productos_data = data.pop('productos', [])
            pagos_data = data.pop('pagos', [])
            resumen_data = data.pop('resumen', {})
            vendedor_id = data.get('vendedor_id')
            dia = data.get('dia', '').upper()
            fecha = data.get('fecha')
            
            print(f"📦 Productos: {len(productos_data)} items")
            print(f"💰 Pagos: {len(pagos_data)} items")
            print(f"📊 Resumen: {bool(resumen_data)}")
            print(f"👤 Vendedor ID: {vendedor_id}")
            print(f"📅 Día: {dia}, Fecha: {fecha}")
            
            # 2. Buscar vendedor por id_vendedor
            try:
                vendedor = Vendedor.objects.get(id_vendedor=vendedor_id)
                data['vendedor'] = vendedor.id
                print(f"✅ Vendedor encontrado: {vendedor.nombre} ({vendedor.id_vendedor})")
            except Vendedor.DoesNotExist:
                return Response(
                    {'error': f'Vendedor con ID {vendedor_id} no encontrado'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 3. Usar transacción atómica para toda la operación
            with transaction.atomic():
                # 4. Buscar si ya existe un CargueOperativo (Lógica Upsert)
                cargue_existente = None
                es_actualizacion = False
                
                try:
                    cargue_existente = CargueOperativo.objects.get(
                        dia=dia,
                        vendedor=vendedor,
                        fecha=fecha
                    )
                    es_actualizacion = True
                    print(f"🔄 CargueOperativo existente encontrado: ID {cargue_existente.id}")
                except CargueOperativo.DoesNotExist:
                    print("🆕 No existe CargueOperativo, se creará uno nuevo")
                
                # 5. Crear o actualizar CargueOperativo principal
                if es_actualizacion:
                    # Actualizar el existente
                    cargue_existente.usuario = data.get('usuario', 'Sistema Web')
                    cargue_existente.activo = data.get('activo', True)
                    cargue_existente.save()
                    cargue = cargue_existente
                    print(f"🔄 CargueOperativo actualizado: ID {cargue.id}")
                    
                    # Eliminar datos anidados antiguos
                    print("🗑️ Eliminando datos anidados antiguos...")
                    DetalleCargue.objects.filter(cargue=cargue).delete()
                    ResumenPagos.objects.filter(cargue=cargue).delete()
                    ResumenTotales.objects.filter(cargue=cargue).delete()
                    print("✅ Datos anidados antiguos eliminados")
                    
                else:
                    # Crear nuevo
                    cargue_serializer = self.get_serializer(data=data)
                    if not cargue_serializer.is_valid():
                        print("❌ Errores en cargue:", cargue_serializer.errors)
                        return Response(cargue_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                    
                    cargue = cargue_serializer.save()
                    print(f"🆕 CargueOperativo creado: ID {cargue.id}")
                
                # 6. Crear nuevos DetalleCargue para cada producto
                productos_creados = 0
                for producto_data in productos_data:
                    try:
                        # Buscar producto por nombre
                        producto_nombre = producto_data.get('producto_nombre') or producto_data.get('nombre')
                        if not producto_nombre:
                            print(f"⚠️ Producto sin nombre, saltando: {producto_data}")
                            continue
                            
                        producto = Producto.objects.get(nombre=producto_nombre)
                        
                        # Crear DetalleCargue
                        DetalleCargue.objects.create(
                            cargue=cargue,
                            producto=producto,
                            vendedor_check=producto_data.get('vendedor_check', False),
                            despachador_check=producto_data.get('despachador_check', False),
                            cantidad=int(producto_data.get('cantidad', 0)),
                            dctos=int(producto_data.get('dctos', 0)),
                            adicional=int(producto_data.get('adicional', 0)),
                            devoluciones=int(producto_data.get('devoluciones', 0)),
                            vencidas=int(producto_data.get('vencidas', 0)),
                            valor=float(producto_data.get('valor', 0))
                        )
                        productos_creados += 1
                        print(f"✅ DetalleCargue creado: {producto.nombre}")
                        
                    except Producto.DoesNotExist:
                        print(f"❌ Producto no encontrado: {producto_nombre}")
                        return Response(
                            {'error': f'Producto "{producto_nombre}" no encontrado'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    except (ValueError, TypeError) as e:
                        print(f"❌ Error en datos del producto {producto_nombre}: {e}")
                        return Response(
                            {'error': f'Datos inválidos para producto "{producto_nombre}": {str(e)}'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                print(f"📦 Total productos creados: {productos_creados}")
                
                # 7. Crear nuevos ResumenPagos si existen
                pagos_creados = 0
                for pago_data in pagos_data:
                    try:
                        ResumenPagos.objects.create(
                            cargue=cargue,
                            concepto=pago_data.get('concepto', ''),
                            descuentos=float(pago_data.get('descuentos', 0)),
                            nequi=float(pago_data.get('nequi', 0)),
                            daviplata=float(pago_data.get('daviplata', 0))
                        )
                        pagos_creados += 1
                        print(f"✅ ResumenPagos creado: {pago_data.get('concepto', 'Sin concepto')}")
                    except (ValueError, TypeError) as e:
                        print(f"❌ Error en datos de pago: {e}")
                        return Response(
                            {'error': f'Datos inválidos en pagos: {str(e)}'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                print(f"💰 Total pagos creados: {pagos_creados}")
                
                # 8. Crear nuevo ResumenTotales si existe
                if resumen_data:
                    try:
                        ResumenTotales.objects.create(
                            cargue=cargue,
                            base_caja=float(resumen_data.get('base_caja', 0)),
                            total_despacho=float(resumen_data.get('total_despacho', 0)),
                            total_pedidos=float(resumen_data.get('total_pedidos', 0)),
                            total_dctos=float(resumen_data.get('total_dctos', 0)),
                            venta=float(resumen_data.get('venta', 0)),
                            total_efectivo=float(resumen_data.get('total_efectivo', 0))
                        )
                        print("✅ ResumenTotales creado")
                    except (ValueError, TypeError) as e:
                        print(f"❌ Error en datos de resumen: {e}")
                        return Response(
                            {'error': f'Datos inválidos en resumen: {str(e)}'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                # 9. Retornar cargue completo con todos los detalles
                cargue_completo = CargueOperativoSerializer(cargue)
                
                # Determinar código de estado según si fue creación o actualización
                status_code = status.HTTP_200_OK if es_actualizacion else status.HTTP_201_CREATED
                action = "actualizado" if es_actualizacion else "creado"
                
                print(f"🎉 CargueOperativo {action} exitosamente: ID {cargue.id}")
                print(f"📊 Resumen: {productos_creados} productos, {pagos_creados} pagos, resumen: {bool(resumen_data)}")
                
                return Response(cargue_completo.data, status=status_code)
                
        except Exception as e:
            print(f"❌ Error general en CargueOperativo: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Error interno del servidor: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class DetalleCargueViewSet(viewsets.ModelViewSet):
    """API para gestionar detalles de cargue"""
    queryset = DetalleCargue.objects.all()
    serializer_class = DetalleCargueSerializer
    permission_classes = [permissions.AllowAny]

class ResumenPagosViewSet(viewsets.ModelViewSet):
    """API para gestionar resumen de pagos"""
    queryset = ResumenPagos.objects.all()
    serializer_class = ResumenPagosSerializer
    permission_classes = [permissions.AllowAny]

class ResumenTotalesViewSet(viewsets.ModelViewSet):
    """API para gestionar resumen de totales"""
    queryset = ResumenTotales.objects.all()
    serializer_class = ResumenTotalesSerializer
    permission_classes = [permissions.AllowAny]

class LoteVencidoViewSet(viewsets.ModelViewSet):
    """API para gestionar lotes vencidos"""
    queryset = LoteVencido.objects.all()
    serializer_class = LoteVencidoSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = LoteVencido.objects.all().order_by('-fecha_registro')
        
        # Filtros opcionales
        detalle_cargue = self.request.query_params.get('detalle_cargue')
        motivo = self.request.query_params.get('motivo')
        
        if detalle_cargue:
            queryset = queryset.filter(detalle_cargue_id=detalle_cargue)
        if motivo:
            queryset = queryset.filter(motivo=motivo.upper())
            
        return queryset

class ControlCumplimientoViewSet(viewsets.ModelViewSet):
    """API para gestionar control de cumplimiento"""
    queryset = ControlCumplimiento.objects.all()
    serializer_class = ControlCumplimientoSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = ControlCumplimiento.objects.all().order_by('-fecha')
        
        # Filtros opcionales
        dia = self.request.query_params.get('dia')
        id_sheet = self.request.query_params.get('id_sheet')
        fecha = self.request.query_params.get('fecha')
        
        if dia:
            queryset = queryset.filter(dia=dia.upper())
        if id_sheet:
            queryset = queryset.filter(id_sheet=id_sheet)
        if fecha:
            queryset = queryset.filter(fecha=fecha)
            
        return queryset

    