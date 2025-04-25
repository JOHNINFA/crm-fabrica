# api/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Registro
from .serializers import RegistroSerializer

class RegistroViewSet(viewsets.ModelViewSet):
    queryset = Registro.objects.all()
    serializer_class = RegistroSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        print("========== LLEGÓ AL BACKEND ==========")
        print(request.data)
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(">>> ERRORES DE SERIALIZER:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        print("====================================")
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        print("========== UPDATE AL BACKEND ==========")
        print(request.data)
        print("=======================================")
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
