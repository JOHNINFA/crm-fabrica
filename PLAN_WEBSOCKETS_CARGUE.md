# Plan: WebSockets para Sincronización de Checks en Cargue

## Fecha de Creación: 2 de Diciembre 2025
## Estado: PENDIENTE DE IMPLEMENTAR

---

## Problema Actual

1. Cuando el vendedor marca el check V en la app móvil, el CRM no lo ve automáticamente
2. El despachador tiene que hacer clic en "Recargar Checks" manualmente
3. Esto ralentiza la operación de cargue

---

## Objetivo

Implementar WebSockets para que cuando el vendedor marque el check V en la app móvil, el CRM lo vea instantáneamente sin recargar.

---

## Flujo Propuesto

```
┌─────────────────────────────────────────────────────────────┐
│  1. Usuario entra a módulo CARGUE en CRM                    │
│           ↓                                                  │
│  2. Frontend abre conexión WebSocket al servidor            │
│           ↓                                                  │
│  3. Vendedor marca check V en App Móvil                     │
│           ↓                                                  │
│  4. Backend guarda en BD + envía mensaje por WebSocket      │
│           ↓                                                  │
│  5. CRM recibe mensaje → Actualiza check V en pantalla      │
│           ↓                                                  │
│  6. Usuario sale de CARGUE → WebSocket se cierra            │
└─────────────────────────────────────────────────────────────┘
```

---

## Arquitectura Técnica

### Backend (Django Channels)

```
backend_crm/
├── settings.py          # Configurar ASGI y Channels
├── asgi.py              # Configurar aplicación ASGI
├── routing.py           # Rutas de WebSocket (NUEVO)
└── api/
    ├── consumers.py     # WebSocket consumers (NUEVO)
    └── views.py         # Modificar actualizar_check_vendedor
```

### Frontend (React)

```
frontend/src/
├── services/
│   └── websocketService.js    # Servicio de WebSocket (NUEVO)
└── components/Cargue/
    └── PlantillaOperativa.jsx # Conectar al WebSocket
```

---

## Requisitos

### Dependencias Backend
```bash
pip install channels channels-redis
```

### Redis (Opcional para desarrollo)
- **Producción**: Requiere Redis instalado
- **Desarrollo**: Puede usar `InMemoryChannelLayer` (sin Redis)

---

## Implementación Paso a Paso

### Paso 1: Instalar dependencias
```bash
pip install channels channels-redis
```

### Paso 2: Configurar settings.py
```python
INSTALLED_APPS = [
    ...
    'channels',
]

# Configuración de Channels
ASGI_APPLICATION = 'backend_crm.asgi.application'

# Para desarrollo (sin Redis)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer'
    }
}

# Para producción (con Redis)
# CHANNEL_LAYERS = {
#     'default': {
#         'BACKEND': 'channels_redis.core.RedisChannelLayer',
#         'CONFIG': {
#             'hosts': [('127.0.0.1', 6379)],
#         },
#     },
# }
```

### Paso 3: Configurar asgi.py
```python
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')

django_asgi_app = get_asgi_application()

from api import routing

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AuthMiddlewareStack(
        URLRouter(
            routing.websocket_urlpatterns
        )
    ),
})
```

### Paso 4: Crear routing.py en api/
```python
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/cargue/(?P<vendedor_id>\w+)/$', consumers.CargueConsumer.as_asgi()),
]
```

### Paso 5: Crear consumers.py en api/
```python
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class CargueConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.vendedor_id = self.scope['url_route']['kwargs']['vendedor_id']
        self.room_group_name = f'cargue_{self.vendedor_id}'

        # Unirse al grupo del vendedor
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        print(f'✅ WebSocket conectado: {self.vendedor_id}')

    async def disconnect(self, close_code):
        # Salir del grupo
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f'❌ WebSocket desconectado: {self.vendedor_id}')

    # Recibir mensaje del WebSocket (desde frontend)
    async def receive(self, text_data):
        data = json.loads(text_data)
        print(f'📩 Mensaje recibido: {data}')

    # Enviar actualización de check (llamado desde views.py)
    async def check_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'check_update',
            'producto': event['producto'],
            'v': event['v'],
            'd': event['d'],
            'dia': event['dia'],
            'fecha': event['fecha']
        }))
```

### Paso 6: Modificar views.py - actualizar_check_vendedor
```python
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

@api_view(['POST'])
def actualizar_check_vendedor(request):
    # ... código existente ...
    
    # Después de guardar el check, enviar notificación por WebSocket
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'cargue_{vendedor_id}',
        {
            'type': 'check_update',
            'producto': producto,
            'v': registro.v,
            'd': registro.d,
            'dia': dia,
            'fecha': str(fecha)
        }
    )
    
    return Response({...})
```

### Paso 7: Crear websocketService.js en frontend
```javascript
class CargueWebSocketService {
    constructor() {
        this.socket = null;
        this.callbacks = [];
    }

    connect(vendedorId) {
        const wsUrl = `ws://localhost:8000/ws/cargue/${vendedorId}/`;
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log(`✅ WebSocket conectado: ${vendedorId}`);
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('📩 Mensaje WebSocket:', data);
            
            // Notificar a todos los callbacks registrados
            this.callbacks.forEach(cb => cb(data));
        };

        this.socket.onclose = () => {
            console.log('❌ WebSocket desconectado');
        };
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    onMessage(callback) {
        this.callbacks.push(callback);
    }

    removeCallback(callback) {
        this.callbacks = this.callbacks.filter(cb => cb !== callback);
    }
}

export const cargueWebSocket = new CargueWebSocketService();
```

### Paso 8: Modificar PlantillaOperativa.jsx
```javascript
import { cargueWebSocket } from '../../services/websocketService';

// En el componente:
useEffect(() => {
    // Conectar WebSocket al montar
    cargueWebSocket.connect(idSheet);

    // Escuchar actualizaciones de checks
    const handleCheckUpdate = (data) => {
        if (data.type === 'check_update') {
            console.log(`📩 Check actualizado: ${data.producto} - V=${data.v}`);
            
            // Actualizar el producto en el estado
            setProductosOperativos(prev => prev.map(p => {
                if (p.producto === data.producto) {
                    return { ...p, vendedor: data.v, despachador: data.d };
                }
                return p;
            }));
        }
    };

    cargueWebSocket.onMessage(handleCheckUpdate);

    // Desconectar al desmontar
    return () => {
        cargueWebSocket.removeCallback(handleCheckUpdate);
        cargueWebSocket.disconnect();
    };
}, [idSheet]);
```

---

## Optimización de Rendimiento

### Cuándo se activa el WebSocket:
- ✅ Solo cuando el usuario está en el módulo de Cargue
- ✅ Se desconecta automáticamente al salir de Cargue
- ✅ Una conexión por pestaña de vendedor (ID1, ID2, etc.)

### Impacto en servidor:
- **Mínimo**: Solo 1-6 conexiones activas simultáneas
- **Eficiente**: Solo envía mensajes cuando hay cambios reales
- **Ligero**: Mensajes pequeños (solo el check que cambió)

---

## Orden de Implementación

1. 🔲 Instalar dependencias (`channels`, `channels-redis`)
2. 🔲 Configurar `settings.py` con Channels
3. 🔲 Configurar `asgi.py`
4. 🔲 Crear `api/routing.py`
5. 🔲 Crear `api/consumers.py`
6. 🔲 Modificar `actualizar_check_vendedor` para enviar notificación
7. 🔲 Crear `frontend/src/services/websocketService.js`
8. 🔲 Modificar `PlantillaOperativa.jsx` para conectar al WebSocket
9. 🔲 Probar sincronización en tiempo real
10. 🔲 Configurar Redis para producción (opcional)

---

## Pruebas a Realizar

- [ ] Conectar WebSocket al entrar a Cargue
- [ ] Desconectar WebSocket al salir de Cargue
- [ ] Marcar check V en app móvil → Ver actualización instantánea en CRM
- [ ] Verificar que no hay duplicados de conexiones
- [ ] Verificar rendimiento con 6 vendedores simultáneos

---

## Notas

- Para desarrollo se usa `InMemoryChannelLayer` (sin Redis)
- Para producción se recomienda Redis
- El WebSocket solo se activa en el módulo de Cargue, no en todo el sistema

---

Fecha última actualización: 2 de Diciembre 2025
