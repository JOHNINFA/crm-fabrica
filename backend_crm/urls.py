from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.http import FileResponse
import os

# Vista personalizada para servir archivos con headers de caché
def serve_media_with_cache(request, path, document_root=None):
    """Sirve archivos multimedia con headers de caché para mejor rendimiento"""
    full_path = os.path.join(document_root, path)
    if os.path.exists(full_path):
        response = FileResponse(open(full_path, 'rb'))
        # Caché por 30 días (2592000 segundos)
        response['Cache-Control'] = 'public, max-age=2592000, immutable'
        response['Vary'] = 'Accept-Encoding'
        return response
    else:
        from django.http import Http404
        raise Http404("Archivo no encontrado")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]

# Agregar URLs para servir archivos multimedia durante el desarrollo
if settings.DEBUG:
    # Usar la vista personalizada con caché
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve_media_with_cache, {'document_root': settings.MEDIA_ROOT}),
    ]
