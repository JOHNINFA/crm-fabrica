# 🚀 PLAN DE IMPLEMENTACIÓN - SISTEMA MULTI-DISPOSITIVO

**Fecha:** 17 de enero de 2026  
**Objetivo:** Evitar colisiones cuando múltiples dispositivos envían datos simultáneamente

---

## 📋 FASES DE IMPLEMENTACIÓN

### **FASE 1: IDs Únicos Globales** ⭐ CRÍTICO
**Tiempo:** 2-3 horas  
**Prioridad:** ALTA

#### **1.1 Backend - Actualizar Modelo VentaRuta**
```python
# api/models.py - Línea 1851

class VentaRuta(models.Model):
    # ✅ Cambiar id_local a formato UUID
    id_local = models.CharField(
        max_length=100,  # Aumentar de 50 a 100
        unique=True,
        null=True,
        blank=True,
        help_text="ID único: vendedor-dispositivo-timestamp-random"
    )
    
    # 🆕 Nuevos campos de tracking
    dispositivo_id = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text="Identificador del dispositivo (ej: TABLET-01, CELULAR-02)"
    )
    
    ip_origen = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP desde donde se registró la venta"
    )
    
    # ... rest of model
```

**Migración:**
```bash
cd /home/john/Escritorio/crm-fabrica
python manage.py makemigrations
python manage.py migrate
```

#### **1.2 App Móvil - Generar IDs Únicos**
```javascript
// AP GUERRERO/services/ventasService.js

import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 🆕 Obtiene ID único del dispositivo
 */
const obtenerDispositivoId = async () => {
    try {
        let deviceId = await AsyncStorage.getItem('DEVICE_ID');
        
        if (!deviceId) {
            // Generar ID basado en info del dispositivo
            const modelo = Device.modelName || 'UNKNOWN';
            const os = Device.osName || 'UNKNOWN';
            const timestamp = Date.now();
            const random = Math.random().toString(36).substr(2, 6);
            
            deviceId = `${os}-${modelo}-${random}`.toUpperCase();
            await AsyncStorage.setItem('DEVICE_ID', deviceId);
            console.log('📱 Dispositivo ID generado:', deviceId);
        }
        
        return deviceId;
    } catch (error) {
        console.error('Error obteniendo device ID:', error);
        return `DEVICE-${Math.random().toString(36).substr(2, 9)}`;
    }
};

/**
 * 🆕 Genera ID único para venta con formato anti-colisión
 */
const generarIdVenta = async (vendedorId) => {
    try {
        const deviceId = await obtener DispositivoId();
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        
        // Formato: VENDEDOR-DISPOSITIVO-TIMESTAMP-RANDOM
        // Ejemplo: ID1-ANDROID-SAMSUNG-K3J9X2-1737145200000-P9Q2X1
        return `${vendedorId}-${deviceId}-${timestamp}-${random}`;
    } catch (error) {
        // Fallback
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `${vendedorId}-UNKNOWN-${timestamp}-${random}`;
    }
};
```

---

### **FASE 2: Bloqueo Optimista Backend** ⭐ ALTA
**Tiempo:** 3-4 horas  
**Prioridad:** ALTA

#### **2.1 Agregar Campos de Versión**
```python
# api/models.py

class VentaRuta(models.Model):
    # ... campos existentes ...
    
    # 🆕 Control de concurrencia
    version = models.IntegerField(
        default=1,
        help_text="Versión para bloqueo optimista"
    )
    
    server_timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp del servidor al crear"
    )
    
    ultima_modificacion = models.DateTimeField(
        auto_now=True,
        help_text="Última modificación (auto)"
    )
```

#### **2.2 Middleware de Detección de Conflictos**
```python
# api/views.py - Agregar a VentaRutaViewSet

from django.db import transaction, IntegrityError
from rest_framework import status
from rest_framework.response import Response

class VentaRutaViewSet(viewsets.ModelViewSet):
    queryset = VentaRuta.objects.all()
    serializer_class = VentaRutaSerializer
    
    def create(self, request, *args, **kwargs):
        """
        🆕 Crear venta con manejo de conflictos multi-dispositivo
        """
        try:
            with transaction.atomic():
                # Extraer id_local del request
                id_local = request.data.get('id_local')
                
                if not id_local:
                    return Response(
                        {'error': 'id_local es requerido'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # ✅ Verificar si ya existe (prevenir duplicados)
                if VentaRuta.objects.filter(id_local=id_local).exists():
                    venta_existente = VentaRuta.objects.get(id_local=id_local)
                    
                    # Log del intento duplicado
                    self._log_conflicto(
                        accion='CREATE_DUPLICADO',
                        id_local=id_local,
                        dispositivo=request.data.get('dispositivo_id', 'UNKNOWN'),
                        ip=self._get_client_ip(request)
                    )
                    
                    return Response(
                        {
                            'warning': 'Venta ya existe',
                            'id': venta_existente.id,
                            'id_local': id_local,
                            'timestamp': venta_existente.server_timestamp
                        },
                        status=status.HTTP_200_OK  # ⚠️ 200 no error
                    )
                
                # 🆕 Agregar metadatos del dispositivo
                data_con_meta = {
                    **request.data,
                    'dispositivo_id': request.data.get('dispositivo_id', 'UNKNOWN'),
                    'ip_origen': self._get_client_ip(request),
                    'version': 1
                }
                
                # Crear venta
                serializer = self.get_serializer(data=data_con_meta)
                serializer.is_valid(raise_exception=True)
                self.perform_create(serializer)
                
                # Log exitoso
                self._log_sincronizacion(
                    accion='CREATE_VENTA',
                    registro_id=serializer.instance.id,
                    dispositivo=data_con_meta['dispositivo_id'],
                    ip=data_con_meta['ip_origen'],
                    exito=True
                )
                
                headers = self.get_success_headers(serializer.data)
                return Response(
                    serializer.data,
                    status=status.HTTP_201_CREATED,
                    headers=headers
                )
                
        except IntegrityError as e:
            # Manejo de constraint violado (id_local duplicado)
            return Response(
                {
                    'error': 'CONFLICT',
                    'message': 'ID local ya existe. Este registro fue enviado por otro dispositivo.',
                    'id_local': id_local,
                    'sugerencia': 'La venta ya fue registrada. No es necesario reenviar.'
                },
                status=status.HTTP_409_CONFLICT
            )
        
        except Exception as e:
            # Otros errores
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_client_ip(self, request):
        """Obtiene IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _log_sincronizacion(self, accion, registro_id, dispositivo, ip, exito):
        """Registra log de sincronización"""
        try:
            SyncLog.objects.create(
                accion=accion,
                modelo='VentaRuta',
                registro_id=registro_id,
                dispositivo_id=dispositivo,
                ip_origen=ip,
                exito=exito,
                timestamp=timezone.now()
            )
        except:
            pass  # No fallar por logging
    
    def _log_conflicto(self, accion, id_local, dispositivo, ip):
        """Registra intento de duplicado"""
        try:
            SyncLog.objects.create(
                accion=accion,
                modelo='VentaRuta',
                registro_id=0,
                dispositivo_id=dispositivo,
                ip_origen=ip,
                exito=False,
                error_mensaje=f'id_local duplicado: {id_local}',
                timestamp=timezone.now()
            )
        except:
            pass
```

---

### **FASE 3: Modelo de Logs** ⭐ MEDIA
**Tiempo:** 1-2 horas  
**Prioridad:** MEDIA

#### **3.1 Crear Modelo SyncLog**
```python
# api/models.py - Agregar al final

class SyncLog(models.Model):
    """Modelo para trackear sincronización multi-dispositivo"""
    
    ACCION_CHOICES = [
        ('CREATE_VENTA', 'Crear Venta'),
        ('CREATE_DUPLICADO', 'Intento Duplicado'),
        ('UPDATE_CARGUE', 'Actualizar Cargue'),
        ('CLOSE_TURNO', 'Cerrar Turno'),
    ]
    
    # Qué se hizo
    accion = models.CharField(max_length=50, choices=ACCION_CHOICES)
    modelo = models.CharField(max_length=50)  # VentaRuta, CargueID1, etc.
    registro_id = models.IntegerField()
    
    # Quién lo hizo
    vendedor_id = models.CharField(max_length=10, blank=True)
    dispositivo_id = models.CharField(max_length=100)
    ip_origen = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Resultado
    exito = models.BooleanField(default=True)
    error_mensaje = models.TextField(blank=True)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'api_sync_log'
        verbose_name = 'Log de Sincronización'
        verbose_name_plural = 'Logs de Sincronización'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['accion', 'timestamp']),
            models.Index(fields=['dispositivo_id', 'timestamp']),
        ]
    
    def __str__(self):
        status_emoji = '✅' if self.exito else '❌'
        return f"{status_emoji} {self.accion} - {self.dispositivo_id} - {self.timestamp}"
```

---

### **FASE 4: Manejo en App Móvil** ⭐ ALTA
**Tiempo:** 2-3 horas  
**Prioridad:** ALTA

#### **4.1 Actualizar Función de Envío**
```javascript
// AP GUERRERO/services/rutasApiService.js

export const enviarVentaRuta = async (ventaData) => {
    try {
        // 🆕 Obtener ID del dispositivo
        const deviceId = await obtenerDispositivoId();
        
        // 🆕 Agregar dispositivo_id al payload
        const payload = {
            ...ventaData,
            dispositivo_id: deviceId
        };
        
        console.log('📤 Enviando venta:', payload.id_local);
        
        const response = await fetch(`${API_BASE}/ventas-ruta/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        // 🆕 Manejo de respuestas
        if (response.status === 201) {
            // ✅ Creada exitosamente
            const data = await response.json();
            console.log('✅ Venta creada:', data.id);
            return { success: true, data };
        }
        
        if (response.status === 200) {
            // ⚠️ Ya existía (warning, no error)
            const data = await response.json();
            console.log('⚠️ Venta ya existía:', data.id_local);
            return { success: true, warning: 'DUPLICADO', data };
        }
        
        if (response.status === 409) {
            // ⚠️ Conflicto: otro dispositivo la envió primero
            const error = await response.json();
            console.warn('⚠️ Conflicto detectado:', error.message);
            return { success: true, warning: 'CONFLICT', data: error };
        }
        
        // ❌ Otros errores
        throw new Error(`HTTP ${response.status}`);
        
    } catch (error) {
        console.error('❌ Error enviando venta:', error);
        throw error;
    }
};
```

#### **4.2 Actualizar guardarVenta**
```javascript
// AP GUERRERO/services/ventasService.js - Línea 505

export const guardarVenta = async (venta) => {
    try {
        const ventas = await obtenerVentas();
        const fechaVenta = venta.fecha || new Date().toISOString();
        
        // 🆕 Generar ID único con nuevo formato
        const idVenta = await generarIdVenta(venta.vendedor_id);
        
        const nuevaVenta = {
            id: idVenta,  // Ejemplo: "ID1-ANDROID-SAMSUNG-K3J9X2-1737145200000-P9Q2X1"
            ...venta,
            fecha: fechaVenta,
            estado: 'completada',
            sincronizada: false
        };
        
        // Guardar localmente
        ventas.push(nuevaVenta);
        await AsyncStorage.setItem('ventas', JSON.stringify(ventas));
        
        // Preparar para backend
        const dispositivoId = await obtenerDispositivoId();
        const ventaBackend = {
            id_local: nuevaVenta.id,  // 🆕 ID largo y único
            dispositivo_id: dispositivoId,  // 🆕 Tracking
            vendedor_id: venta.vendedor_id,
            cliente_nombre: venta.cliente_nombre,
            nombre_negocio: venta.cliente_negocio || '',
            total: venta.total,
            detalles: venta.productos,
            metodo_pago: venta.metodo_pago || 'EFECTIVO',
            productos_vencidos: (venta.vencidas || []).map(...),
            fecha: fechaVenta
        };
        
        // Sincronizar en background
        (async () => {
            try {
                if (await hayConexion()) {
                    const resultado = await enviarVentaRuta(ventaBackend);
                    
                    if (resultado.success) {
                        // ✅ Sincronizada (nueva o duplicado detectado)
                        nuevaVenta.sincronizada = true;
                        const ventasActuales = await obtenerVentas();
                        const ventasActualizadas = ventasActuales.map(v => 
                            v.id === nuevaVenta.id ? {...v, sincronizada: true} : v
                        );
                        await AsyncStorage.setItem('ventas', JSON.stringify(ventasActualizadas));
                        
                        if (resultado.warning === 'DUPLICADO') {
                            console.log('⚠️ Venta ya existía en servidor (otro dispositivo)');
                        }
                    }
                } else {
                    console.log('📥 Sin conexión, agregando a cola');
                    await agregarAColaPendientes(ventaBackend, nuevaVenta.id);
                }
            } catch (err) {
                console.warn('⚠️ Error en background, agregando a cola');
                await agregarAColaPendientes(ventaBackend, nuevaVenta.id);
            }
        })();
        
        return nuevaVenta;
    } catch (error) {
        console.error('Error guardando venta:', error);
        throw error;
    }
};
```

---

### **FASE 5: Celery + Redis (OPCIONAL)** ⭐ BAJA
**Tiempo:** 4-6 horas  
**Prioridad:** BAJA (para después del despliegue inicial)

#### **5.1 Instalar Redis**
```bash
# VPS Hostinger
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

#### **5.2 Configurar Celery**
```python
# backend_crm/celery.py
import os
from celery import Celery

os.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')

app = Celery('crm_fabrica')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# settings.py
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
```

#### **5.3 Task de Procesamiento**
```python
# api/tasks.py
from celery import shared_task
from .models import VentaRuta

@shared_task(bind=True, max_retries=3)
def procesar_venta_background(self, venta_data):
    """
    Procesa venta en background con retry automático
    """
    try:
        # Crear con atomic transaction
        with transaction.atomic():
            venta = VentaRuta.objects.create(**venta_data)
            return {'success': True, 'id': venta.id}
    except IntegrityError as e:
        # Ya existe, no es error
        existing = VentaRuta.objects.get(id_local=venta_data['id_local'])
        return {'success': True, 'warning': 'DUPLICADO', 'id': existing.id}
    except Exception as exc:
        # Retry automático
        raise self.retry(exc=exc, countdown=60)  # Reintentar en 1 min
```

---

##  📊 CHECKLIST DE IMPLEMENTACIÓN

### **Backend**
- [ ] Actualizar modelo `VentaRuta` con nuevos campos
- [ ] Crear migraciones y aplicar
- [ ] Crear modelo `SyncLog`
- [ ] Modificar `VentaRutaViewSet.create()` con manejo de conflictos
- [ ] Agregar métodos helper `_get_client_ip()` y `_log_sincronizacion()`
- [ ] Testear con requests duplicados

### **App Móvil**
- [ ] Implementar `obtenerDispositivoId()`
- [ ] Actualizar `generarIdVenta()` con nuevo formato
- [ ] Agregar `dispositivo_id` al payload de ventas
- [ ] Manejar respuestas 200 (duplicado) y 409 (conflicto)
- [ ] Actualizar `sincronizarVentasPendientes()`
- [ ] Testear con 2 dispositivos

### **Despliegue VPS**
- [ ] Hacer backup de BD
- [ ] Aplicar migraciones en producción
- [ ] Monitorear logs de sync
- [ ] (Opcional) Instalar Redis
- [ ] (Opcional) Configurar Celery

---

## 🧪 PLAN DE TESTING

### **Test 1: Un Dispositivo**
1. Registrar venta desde tablet
2. Verificar que se crea con id_local largo
3. Verificar que se registra en SyncLog

### **Test 2: Dos Dispositivos Offline**
1. Desconectar ambos dispositivos
2. Registrar 3 ventas en cada uno
3. Conectar ambos
4. Sincronizar con pull to refresh
5. Verificar: 6 ventas en BD, sin duplicados

### **Test 3: Dos Dispositivos Online Simultáneos**
1. Ambos conectados
2. Enviar venta al mismo tiempo
3. Verificar: solo 1 venta en BD
4. Ambos dispositivos reciben confirmación

### **Test 4: Mismo Cliente, Diferente Venta**
1. Dispositivo A: Vende $50,000 a "Tienda Sol"
2. Dispositivo B: Vende $30,000 a "Tienda Sol"
3. Verificar: 2 ventas diferentes en BD

---

## 🚀 ORDEN DE EJECUCIÓN

1. **Hoy:** Fase 1 + Fase 2 (IDs + Bloqueo)
2. **Mañana:** Fase 3 + Fase 4 (Logs + App)
3. **Testing:** 2-3 días
4. **Despliegue:** VPS producción
5. **Opcional:** Fase 5 (Celery) - si se necesita

---

**LISTO PARA INICIAR** ✅
