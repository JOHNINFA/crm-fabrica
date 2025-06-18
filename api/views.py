# api/views.py
from rest_framework import viewsets, permissions, status, parsers
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from django.conf import settings
import os
import base64
import re
import uuid
from .models import Registro, Producto, Categoria, Lote, MovimientoInventario
from .serializers import (
    RegistroSerializer, ProductoSerializer, CategoriaSerializer,
    LoteSerializer, MovimientoInventarioSerializer
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
    """
    API para gestionar productos.
    
    ENDPOINTS:
    - GET /api/productos/ - Lista todos los productos
    - POST /api/productos/ - Crea un nuevo producto
    - GET /api/productos/{id}/ - Obtiene un producto específico
    - PUT/PATCH /api/productos/{id}/ - Actualiza un producto
    - DELETE /api/productos/{id}/ - Elimina un producto
    - POST /api/productos/save_image/ - Guarda una imagen de producto
    - POST /api/productos/{id}/actualizar_stock/ - Actualiza el stock de un producto
    
    FLUJO DE COMUNICACIÓN:
    1. Frontend envía solicitud HTTP a uno de los endpoints
    2. Django REST Framework valida la solicitud y los permisos
    3. El viewset procesa la solicitud y accede a la base de datos
    4. Se serializa la respuesta y se devuelve al frontend
    
    NOTAS IMPORTANTES:
    - El campo 'categoria' espera un ID numérico, no un nombre de categoría
    - Las imágenes se guardan en dos ubicaciones: media/productos/ y frontend/public/images/productos/
    """
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [permissions.AllowAny]
    # Soporta múltiples formatos de datos: form-data, multipart y JSON
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    
    @action(detail=False, methods=['post'])
    def save_image(self, request):
        """
        Guarda una imagen base64 en el sistema de archivos y devuelve la URL.
        
        FLUJO DE COMUNICACIÓN:
        1. Frontend envía POST con imagen en base64
        2. Backend decodifica la imagen y la guarda en dos ubicaciones
        3. Backend devuelve las URLs de las imágenes guardadas
        
        PARÁMETROS:
        - image: String base64 de la imagen
        - productId: ID del producto (opcional)
        - productName: Nombre del producto (opcional)
        
        RESPUESTA:
        - success: Boolean indicando éxito
        - frontendUrl: URL para acceso desde el frontend
        - mediaUrl: URL para acceso desde Django
        - filename: Nombre del archivo guardado
        """
        try:
            # Obtener datos de la solicitud
            image_data = request.data.get('image')
            product_id = request.data.get('productId')
            product_name = request.data.get('productName', 'producto')
            
            if not image_data or not image_data.startswith('data:'):
                return Response({'error': 'Datos de imagen no válidos'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Extraer tipo MIME y datos base64
            match = re.match(r'data:([^;]+);base64,(.+)', image_data)
            if not match:
                return Response({'error': 'Formato de imagen no válido'}, status=status.HTTP_400_BAD_REQUEST)
            
            mime_type, base64_data = match.groups()
            extension = mime_type.split('/')[-1]
            
            # Crear nombre de archivo único
            filename = f"producto_{product_id or uuid.uuid4()}_{uuid.uuid4().hex[:8]}.{extension}"
            
            # Crear carpetas si no existen
            # Se guarda en dos ubicaciones:
            # 1. frontend/public/images/productos/ - Para acceso directo desde el frontend
            # 2. media/productos/ - Para acceso a través de Django
            frontend_path = os.path.join(settings.BASE_DIR, 'frontend', 'public', 'images', 'productos')
            media_path = os.path.join(settings.MEDIA_ROOT, 'productos')
            
            os.makedirs(frontend_path, exist_ok=True)
            os.makedirs(media_path, exist_ok=True)
            
            # Guardar en frontend/public/images/productos
            frontend_filepath = os.path.join(frontend_path, filename)
            with open(frontend_filepath, 'wb') as f:
                f.write(base64.b64decode(base64_data))
            
            # Guardar también en media/productos
            media_filepath = os.path.join(media_path, filename)
            with open(media_filepath, 'wb') as f:
                f.write(base64.b64decode(base64_data))
            
            # Devolver URLs
            frontend_url = f"/images/productos/{filename}"
            media_url = f"/media/productos/{filename}"
            
            return Response({
                'success': True,
                'frontendUrl': frontend_url,
                'mediaUrl': media_url,
                'filename': filename
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def actualizar_stock(self, request, pk=None):
        """
        Actualiza el stock de un producto y registra un movimiento de inventario.
        
        FLUJO DE COMUNICACIÓN:
        1. Frontend envía POST con la cantidad a modificar
        2. Backend actualiza el stock del producto
        3. Backend crea un registro de movimiento en la tabla api_movimientoinventario
        4. Backend devuelve el stock actualizado y el ID del movimiento
        
        PARÁMETROS:
        - cantidad: Número entero (positivo para entrada, negativo para salida)
        - usuario: Nombre del usuario que realiza el movimiento
        - nota: Descripción opcional del movimiento
        
        RESPUESTA:
        - success: Boolean indicando éxito
        - stock_actual: Nuevo valor de stock
        - movimiento_id: ID del movimiento creado
        """
        try:
            # Obtener el producto por ID (pk)
            producto = self.get_object()
            cantidad = request.data.get('cantidad', 0)
            usuario = request.data.get('usuario', 'Sistema')
            nota = request.data.get('nota', '')
            
            # Validar cantidad
            try:
                cantidad = int(cantidad)
            except (ValueError, TypeError):
                return Response({'error': 'La cantidad debe ser un número entero'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Determinar tipo de movimiento
            tipo = 'ENTRADA' if cantidad > 0 else 'SALIDA'
            
            # Actualizar stock en la tabla api_producto
            producto.stock_total += cantidad
            producto.save()
            
            # Registrar movimiento en la tabla api_movimientoinventario
            movimiento = MovimientoInventario.objects.create(
                producto=producto,
                tipo=tipo,
                cantidad=abs(cantidad),
                usuario=usuario,
                nota=nota
            )
            
            return Response({
                'success': True,
                'stock_actual': producto.stock_total,
                'movimiento_id': movimiento.id
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoteViewSet(viewsets.ModelViewSet):
    queryset = Lote.objects.all()
    serializer_class = LoteSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Lote.objects.all()
        producto_id = self.request.query_params.get('producto')
        if producto_id:
            queryset = queryset.filter(producto_id=producto_id)
        return queryset

class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.all()
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = MovimientoInventario.objects.all().order_by('-fecha')
        
        # Filtrar por producto
        producto_id = self.request.query_params.get('producto')
        if producto_id:
            queryset = queryset.filter(producto_id=producto_id)
        
        # Filtrar por tipo
        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo=tipo.upper())
        
        # Filtrar por fecha
        fecha_inicio = self.request.query_params.get('fecha_inicio')
        if fecha_inicio:
            queryset = queryset.filter(fecha__gte=fecha_inicio)
        
        fecha_fin = self.request.query_params.get('fecha_fin')
        if fecha_fin:
            queryset = queryset.filter(fecha__lte=fecha_fin)
        
        return queryset