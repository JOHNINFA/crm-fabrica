# api/views.py
from rest_framework import viewsets, permissions, status, parsers
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from .models import Registro, Producto, Categoria, Lote, MovimientoInventario
from .serializers import (
    RegistroSerializer, ProductoSerializer, CategoriaSerializer,
    LoteSerializer, MovimientoInventarioSerializer
)

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.AllowAny]

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        categoria = self.request.query_params.get('categoria')
        activo = self.request.query_params.get('activo')
        
        if categoria:
            queryset = queryset.filter(categoria__id=categoria)
        
        if activo is not None:
            is_active = activo.lower() == 'true'
            queryset = queryset.filter(activo=is_active)
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def actualizar_stock(self, request, pk=None):
        producto = self.get_object()
        nueva_cantidad = request.data.get('cantidad')
        
        if nueva_cantidad is None:
            return Response(
                {"error": "Se requiere el campo 'cantidad'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            nueva_cantidad = int(nueva_cantidad)
            diferencia = nueva_cantidad - producto.stock_total
            
            if diferencia != 0:
                tipo = 'ENTRADA' if diferencia > 0 else 'SALIDA'
                
                # Crear movimiento de inventario
                MovimientoInventario.objects.create(
                    producto=producto,
                    tipo=tipo,
                    cantidad=abs(diferencia),
                    usuario=request.data.get('usuario', 'Sistema'),
                    nota=request.data.get('nota', 'Ajuste manual de inventario')
                )
                
                # El stock se actualiza automáticamente en el método save() de MovimientoInventario
                
                return Response({
                    "mensaje": f"Stock actualizado correctamente. Nuevo stock: {producto.stock_total}",
                    "stock_actual": producto.stock_total
                })
            else:
                return Response({
                    "mensaje": "No hubo cambios en el stock",
                    "stock_actual": producto.stock_total
                })
                
        except ValueError:
            return Response(
                {"error": "La cantidad debe ser un número entero"},
                status=status.HTTP_400_BAD_REQUEST
            )

class LoteViewSet(viewsets.ModelViewSet):
    queryset = Lote.objects.all()
    serializer_class = LoteSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        producto = self.request.query_params.get('producto')
        
        if producto:
            queryset = queryset.filter(producto__id=producto)
            
        return queryset
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Obtener datos del lote
        producto_id = request.data.get('producto')
        cantidad = request.data.get('cantidad')
        
        try:
            producto = Producto.objects.get(id=producto_id)
            cantidad = int(cantidad)
            
            # Crear el lote
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            lote = serializer.save()
            
            # Crear movimiento de inventario para la entrada
            MovimientoInventario.objects.create(
                producto=producto,
                lote=lote,
                tipo='ENTRADA',
                cantidad=cantidad,
                usuario=request.data.get('usuario', 'Sistema'),
                nota=f"Entrada por nuevo lote: {lote.codigo}"
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Producto.DoesNotExist:
            return Response(
                {"error": "El producto especificado no existe"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except ValueError:
            return Response(
                {"error": "La cantidad debe ser un número entero"},
                status=status.HTTP_400_BAD_REQUEST
            )

class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.all()
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        producto = self.request.query_params.get('producto')
        tipo = self.request.query_params.get('tipo')
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        
        if producto:
            queryset = queryset.filter(producto__id=producto)
        
        if tipo:
            queryset = queryset.filter(tipo=tipo.upper())
            
        if fecha_desde:
            queryset = queryset.filter(fecha__gte=fecha_desde)
            
        if fecha_hasta:
            queryset = queryset.filter(fecha__lte=fecha_hasta)
            
        return queryset



class RegistroViewSet(viewsets.ModelViewSet):
    queryset = Registro.objects.all()
    serializer_class = RegistroSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    def get_queryset(self):
        qs = super().get_queryset()
        dia      = self.request.query_params.get('dia')
        id_sheet = self.request.query_params.get('id_sheet')
        id_usr   = self.request.query_params.get('id_usuario')
        if dia:
            qs = qs.filter(dia=dia)
        if id_sheet:
            qs = qs.filter(id_sheet=id_sheet)
        if id_usr:
            qs = qs.filter(id_usuario=id_usr)
        return qs
