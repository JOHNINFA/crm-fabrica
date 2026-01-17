# 📱 FASE 4: CÓDIGO PARA APP MÓVIL - SISTEMA MULTI-DISPOSITIVO

**Archivo:** `AP GUERRERO/services/ventasService.js`  
**Objetivo:** Generar IDs únicos y enviar dispositivo_id al backend

---

## 📝 CAMBIOS A REALIZAR

### **1. Instalar Dependencias (si no están)**

```bash
# En la carpeta AP GUERRERO:
expo install expo-device expo-constants
```

---

### **2. Agregar Imports al Inicio del Archivo**

```javascript
// AP GUERRERO/services/ventasService.js
// Línea 5-8 (después de imports existentes)

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { enviarVentaRuta } from './rutasApiService';
import { API_URL } from '../config';
import * as Device from 'expo-device';  // 🆕 AGREGAR
import Constants from 'expo-constants';  // 🆕 AGREGAR

const API_BASE = `${API_URL}/api`;
```

---

### **3. Agregar Función para Obtener ID del Dispositivo**

```javascript
// AP GUERRERO/services/ventasService.js
// Agregar DESPUÉS de la línea 10 (después de const API_BASE)

/**
 * 🆕 Obtiene o genera un ID único del dispositivo
 * Formato: OS-MODELO-RANDOM (ej: ANDROID-SM-G991B-K3J9X2)
 */
export const obtenerDispositivoId = async () => {
    try {
        // Intentar obtener de caché
        let deviceId = await AsyncStorage.getItem('DEVICE_ID');
        
        if (!deviceId) {
            // Generar nuevo ID basado en info del dispositivo
            const os = Device.osName || 'UNKNOWN';  // ANDROID, IOS, etc.
            const modelo = Device.modelName || Device.deviceName || 'DEVICE';
            const random = Math.random().toString(36).substr(2, 6).toUpperCase();
            
            // Limpiar modelo (remover espacios y caracteres especiales)
            const modeloLimpio = modelo.replace(/[^a-zA-Z0-9]/g, '-').substr(0, 20);
            
            deviceId = `${os}-${modeloLimpio}-${random}`.toUpperCase();
            
            // Guardar en caché para futuras ejecuciones
            await AsyncStorage.setItem('DEVICE_ID', deviceId);
            console.log('📱 Dispositivo ID generado:', deviceId);
        } else {
            console.log('📱 Dispositivo ID desde caché:', deviceId);
        }
        
        return deviceId;
    } catch (error) {
        console.error('Error obteniendo device ID:', error);
        // Fallback: generar ID aleatorio
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9).toUpperCase();
        return `DEVICE-${timestamp}-${random}`;
    }
};
```

---

### **4. Actualizar Función generarIdVenta()**

```javascript
// AP GUERRERO/services/ventasService.js
// REEMPLAZAR la función existente (líneas 487-496 aprox)

/**
 * 🆕 Genera ID único para venta con formato anti-colisión
 * Formato: VENDEDOR-DISPOSITIVO-TIMESTAMP-RANDOM
 * Ejemplo: ID1-ANDROID-SAMSUNG-K3J9X2-1737145200000-P9Q2X1
 */
const generarIdVenta = async (vendedorId) => {
    try {
        const deviceId = await obtenerDispositivoId();
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        
        // Formato largo y único
        const idVenta = `${vendedorId}-${deviceId}-${timestamp}-${random}`;
        
        console.log('🆔 ID Venta generado:', idVenta);
        return idVenta;
    } catch (error) {
        console.error('Error generando ID venta:', error);
        // Fallback
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9).toUpperCase();
        return `${vendedorId}-UNKNOWN-${timestamp}-${random}`;
    }
};
```

---

### **5. Actualizar Función guardarVenta()**

```javascript
// AP GUERRERO/services/ventasService.js
// MODIFICAR la función existente (líneas 505-580 aprox)
// SOLO modificar estas partes específicas:

export const guardarVenta = async (venta) => {
    try {
        const ventas = await obtenerVentas();
        const fechaVenta = venta.fecha || new Date().toISOString();
        
        // 🆕 Generar ID único con nuevo formato
        const idVenta = await generarIdVenta(venta.vendedor_id);
        
        const nuevaVenta = {
            id: idVenta,  // 🆕 ID largo y único
            ...venta,
            fecha: fechaVenta,
            estado: 'completada',
            sincronizada: false
        };
        
        ventas.push(nuevaVenta);
        await AsyncStorage.setItem('ventas', JSON.stringify(ventas));
        console.log('✅ Venta guardada localmente:', nuevaVenta.id);
        
        // Formatear productos vencidos
        const productosVencidosFormateados = (venta.vencidas || []).map(item => ({
            id: item.id,
            producto: item.nombre,
            cantidad: item.cantidad,
            motivo: item.motivo || 'No especificado'
        }));
        
        // 🆕 Obtener dispositivo_id
        const dispositivoId = await obtenerDispositivoId();
        
        const ventaBackend = {
            id_local: nuevaVenta.id,  // 🆕 ID largo y único
            dispositivo_id: dispositivoId,  // 🆕 Tracking de dispositivo
            vendedor_id: venta.vendedor_id || venta.vendedor,
            cliente_nombre: venta.cliente_nombre,
            nombre_negocio: venta.cliente_negocio || '',
            total: venta.total,
            detalles: venta.productos,
            metodo_pago: venta.metodo_pago || 'EFECTIVO',
            productos_vencidos: productosVencidosFormateados,
            foto_vencidos: venta.fotoVencidas || {},
            fecha: fechaVenta
        };
        
        // 🆕 SINCRONIZAR EN SEGUNDO PLANO
        (async () => {
            try {
                const conectado = await hayConexion();
                
                if (conectado) {
                    try {
                        const resultado = await enviarVentaRuta(ventaBackend);
                        
                        if (resultado.success) {
                            // ✅ Sincronizada
                            nuevaVenta.sincronizada = true;
                            const ventasActuales = await obtenerVentas();
                            const ventasActualizadas = ventasActuales.map(v => 
                                v.id === nuevaVenta.id ? {...v, sincronizada: true} : v
                            );
                            await AsyncStorage.setItem('ventas', JSON.stringify(ventasActualizadas));
                            
                            // 🆕 Manejar duplicados
                            if (resultado.warning === 'DUPLICADO') {
                                console.log('⚠️ Venta ya existía en servidor (otro dispositivo)');
                            }
                        }
                    } catch (err) {
                        console.warn('⚠️ Error enviando, agregando a cola:', err.message);
                        await agregarAColaPendientes(ventaBackend, nuevaVenta.id);
                    }
                } else {
                    console.log('📥 Sin conexión, agregando a cola de pendientes');
                    await agregarAColaPendientes(ventaBackend, nuevaVenta.id);
                }
            } catch (bgError) {
                console.error('❌ Error en sincronización background:', bgError);
            }
        })();
        
        // Retornar inmediatamente
        return nuevaVenta;
    } catch (error) {
        console.error('Error al guardar venta:', error);
        throw error;
    }
};
```

---

### **6. Actualizar rutasApiService.js**

```javascript
// AP GUERRERO/services/rutasApiService.js
// REEMPLAZAR la función enviarVentaRuta()

export const enviarVentaRuta = async (ventaData) => {
    try {
        console.log('📤 Enviando venta al backend...');
        console.log('   id_local:', ventaData.id_local);
        console.log('   dispositivo_id:', ventaData.dispositivo_id);
        
        const response = await fetch(`${API_BASE}/ventas-ruta/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(ventaData)
        });
        
        // 🆕 Manejo mejorado de respuestas
        if (response.status === 201) {
            // ✅ Creada exitosamente
            const data = await response.json();
            console.log('✅ Venta creada en servidor:', data.id);
            return { success: true, data };
        }
        
        if (response.status === 200) {
            // ⚠️ Ya existía (duplicado detectado por backend)
            const data = await response.json();
            if (data.duplicada) {
                console.log('⚠️ Venta ya existía (duplicado):', data.id_local);
                console.log('   Dispositivo original:', data.dispositivo_original);
                return { success: true, warning: 'DUPLICADO', data };
            }
            console.log('✅ Venta procesada:', data.id);
            return { success: true, data };
        }
        
        if (response.status === 409) {
            // ⚠️ Conflicto: otro dispositivo la envió al mismo tiempo
            const error = await response.json();
            console.warn('⚠️ Conflicto de sincronización:', error.error);
            // Retornar como éxito para no fallar la app
            return { success: true, warning: 'CONFLICT', data: error };
        }
        
        // ❌ Otros errores
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
        
    } catch (error) {
        console.error('❌ Error enviando venta:', error);
        throw error;
    }
};
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **Paso 1: Instalar dependencias**
```bash
cd "AP GUERRERO"
expo install expo-device expo-constants
```

### **Paso 2: Modificar archivos**
- [ ] Agregar imports (expo-device, expo-constants)
- [ ] Agregar función `obtenerDispositivoId()`
- [ ] Actualizar función `generarIdVenta()`
- [ ] Modificar función `guardarVenta()`
- [ ] Actualizar `enviarVentaRuta()` en rutasApiService.js

### **Paso 3: Testing**
- [ ] Probar generar venta desde la app
- [ ] Verificar ID largo en logs
- [ ] Verificar dispositivo_id se envía
- [ ] Probar con 2 dispositivos
- [ ] Verificar duplicados se detectan
- [ ] Verificar logs en SyncLog (admin Django)

---

## 🧪 TESTING

### **Caso 1: Venta Normal**
```
1. Registrar venta desde tablet
2. Verificar en backend:
   - id_local: "ID1-ANDROID-SAMSUNG-K3J9X2-1737145200000-P9Q2X1"
   - dispositivo_id: "ANDROID-SAMSUNG-K3J9X2"
   - ip_origen: 192.168.1.100
3. Verificar SyncLog muestra: CREATE_VENTA ✅
```

### **Caso 2: Duplicado Detectado**
```
1. Tabla offline, registrar venta
2. Conectar, sincronizar
3. Desconectar, sincronizar de nuevo
4. Verificar:
   - Backend retorna HTTP 200
   - response.duplicada === true
   - SyncLog muestra: CREATE_DUPLICADO ❌
```

### **Caso 3: Dos Dispositivos Simultáneos**
```
1. Tablet A y Celular B online
2. Ambos registran venta del mismo cliente al mismo tiempo
3. Verificar:
   - Solo 1 venta en BD
   - SyncLog muestra 2 intentos
   - Uno con CREATE_VENTA ✅
   - Otro con CREATE_DUPLICADO ❌
```

---

## 📊 FORMATO DE IDs

### **Antes (con colisiones):**
```
Dispositivo A: VEN-0001
Dispositivo B: VEN-0001  ❌ DUPLICADO
```

### **Después (sin colisiones):**
```
Dispositivo A: ID1-ANDROID-SAMSUNG-A52-K3J9X2-1737145200000-P9Q2X1
Dispositivo B: ID1-IOS-IPHONE-13-L4K8Y3-1737145200123-R8T3W5
✅ ÚNICOS GARANTIZADOS
```

---

## 🔍 VERIFICACIÓN EN ADMIN DJANGO

```python
# Acceder a: http://localhost:8000/admin/
# Login con superuser

# Ver modelo SyncLog:
http://localhost:8000/admin/api/synclog/

# Filtrar por:
- Acción: CREATE_VENTA, CREATE_DUPLICADO
- Dispositivo: ANDROID-SAMSUNG-K3J9X2
- Fecha: Hoy
```

---

**LISTO PARA IMPLEMENTAR** ✅
