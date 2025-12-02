# 🚀 Sistema de Auto-Guardado y Congelación en Planeación

## 📋 Resumen

Se implementaron dos funcionalidades críticas en el módulo de Planeación:

1. **Auto-guardado en tiempo real** de la columna ORDEN
2. **Congelación de datos** después de activar ALISTAMIENTO

---

## 🔄 Auto-Guardado en Tiempo Real

### Funcionamiento

Cuando el usuario escribe en la columna **ORDEN**:

1. ✏️ El valor se actualiza instantáneamente en la UI
2. ⏱️ Se espera **1 segundo** sin cambios (debounce)
3. 💾 Se guarda automáticamente en la BD
4. ✅ Se muestra un indicador visual de guardado

### Características

- **Debouncing**: Evita múltiples llamadas a la API mientras el usuario escribe
- **Upsert automático**: Crea o actualiza el registro según corresponda
- **Indicador visual**: Muestra un spinner mientras guarda
- **Sin botón "Guardar"**: Todo es automático

### Código Relevante

**Frontend** (`InventarioPlaneacion.jsx`):
```javascript
const updateProducto = (id, field, value) => {
  // 🔒 BLOQUEAR si el día está congelado
  if (diaCongelado) {
    mostrarMensaje('⚠️ No se pueden modificar datos después de activar ALISTAMIENTO', 'warning');
    return;
  }

  // Actualizar estado local
  const nuevosProductos = productos.map(producto =>
    producto.id === id ? { ...producto, [field]: parseInt(value) || 0 } : producto
  );
  setProductos(nuevosProductos);

  // 🚀 Guardar en BD después de 1 segundo sin cambios
  if (field === 'orden' || field === 'ia') {
    // Mostrar indicador de "guardando..."
    setGuardandoIndicadores(prev => ({ ...prev, [id]: true }));

    // Cancelar timer anterior si existe
    if (saveTimers[id]) {
      clearTimeout(saveTimers[id]);
    }

    // Crear nuevo timer
    const timer = setTimeout(async () => {
      const productoActualizado = nuevosProductos.find(p => p.id === id);
      if (productoActualizado) {
        await guardarEnBD(productoActualizado);
        setGuardandoIndicadores(prev => ({ ...prev, [id]: false }));
      }
    }, 1000);

    setSaveTimers({ ...saveTimers, [id]: timer });
  }
};
```

**Backend** (`api/views.py`):
```python
class PlaneacionViewSet(viewsets.ModelViewSet):
    def create(self, request, *args, **kwargs):
        """Crear o actualizar registro de planeación (upsert)"""
        fecha = request.data.get('fecha')
        producto_nombre = request.data.get('producto_nombre')
        
        if fecha and producto_nombre:
            try:
                planeacion = Planeacion.objects.get(fecha=fecha, producto_nombre=producto_nombre)
                # Ya existe, actualizar
                serializer = self.get_serializer(planeacion, data=request.data, partial=False)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Planeacion.DoesNotExist:
                pass
        
        # Crear nuevo registro
        return super().create(request, *args, **kwargs)
```

---

## 🔒 Congelación de Datos

### Funcionamiento

Cuando se activa **ALISTAMIENTO** en el módulo de Cargue:

1. 📸 Se guarda un snapshot de EXISTENCIAS, SOLICITADAS y PEDIDOS
2. 🔒 Los datos quedan **congelados** (no modificables)
3. ⚠️ Se muestra un banner de advertencia
4. 🚫 Los inputs quedan deshabilitados

### Estados del Día

| Estado | Descripción | Editable |
|--------|-------------|----------|
| **No iniciado** | Día sin datos de cargue | ✅ Sí |
| **ALISTAMIENTO** | Fase inicial, antes de activar | ✅ Sí |
| **ALISTAMIENTO_ACTIVO** | Alistamiento activado | ❌ No |
| **COMPLETADO** | Día finalizado | ❌ No |

### Verificación de Estado

El sistema verifica el estado cada **2 segundos** leyendo desde `localStorage`:

```javascript
useEffect(() => {
  const verificarCongelacion = () => {
    const diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    const diaSemana = diasSemana[fechaSeleccionada.getDay()];
    const fechaParaKey = fechaSeleccionada.toISOString().split('T')[0];
    const estadoBoton = localStorage.getItem(`estado_boton_${diaSemana}_${fechaParaKey}`);
    
    // 🔒 Día congelado si está en ALISTAMIENTO_ACTIVO o COMPLETADO
    const congelado = estadoBoton === 'ALISTAMIENTO_ACTIVO' || estadoBoton === 'COMPLETADO';
    setDiaCongelado(congelado);
  };

  verificarCongelacion();
  const interval = setInterval(verificarCongelacion, 2000);
  
  return () => clearInterval(interval);
}, [fechaSeleccionada]);
```

### UI Bloqueada

Cuando el día está congelado:

```jsx
{/* 🔒 Banner de advertencia */}
{diaCongelado && (
  <Alert variant="warning" className="d-flex align-items-center">
    <i className="bi bi-lock-fill me-2"></i>
    <strong>Día congelado:</strong>&nbsp;Los datos están bloqueados porque el ALISTAMIENTO ya fue activado.
  </Alert>
)}

{/* Input deshabilitado */}
<input
  type="number"
  value={producto.orden || 0}
  onChange={(e) => handleOrdenChange(producto.id, e.target.value)}
  disabled={diaCongelado}
  style={{ 
    cursor: diaCongelado ? 'not-allowed' : 'text',
    backgroundColor: diaCongelado ? '#f8f9fa' : 'white',
    opacity: diaCongelado ? 0.6 : 1
  }}
  title={diaCongelado ? 'Bloqueado - Día congelado' : 'Editable'}
/>
```

---

## 📊 Flujo Completo

### Fase 1: SUGERIDO (Antes de ALISTAMIENTO)

```
Usuario abre Planeación
    ↓
Carga SOLICITADAS desde Cargue (dinámico)
Carga PEDIDOS desde API (dinámico)
Carga EXISTENCIAS desde Stock (tiempo real)
    ↓
Usuario escribe en ORDEN
    ↓
⏱️ Espera 1 segundo (debounce)
    ↓
💾 Guarda automáticamente en BD
    ↓
✅ Muestra indicador de guardado
```

### Fase 2: ALISTAMIENTO ACTIVADO

```
Usuario activa ALISTAMIENTO en Cargue
    ↓
📸 Se guarda snapshot en api_planeacion:
   - EXISTENCIAS (del momento)
   - SOLICITADAS (congeladas)
   - PEDIDOS (congelados)
   - ORDEN (preservado)
   - IA (preservado)
    ↓
🔒 Estado cambia a ALISTAMIENTO_ACTIVO
    ↓
⚠️ Planeación detecta el cambio (cada 2s)
    ↓
🚫 Inputs quedan deshabilitados
    ↓
📋 Banner de advertencia visible
```

### Fase 3: Consulta Histórica

```
Usuario selecciona fecha pasada
    ↓
Sistema verifica estado del día
    ↓
Si está COMPLETADO:
   ✅ Carga solo desde api_planeacion (optimizado)
   🔒 Muestra datos congelados
   📊 No consulta Cargue ni Pedidos
```

---

## 🎯 Beneficios

### 1. **Experiencia de Usuario Mejorada**
- ✅ No necesita hacer clic en "Guardar"
- ✅ Feedback visual inmediato
- ✅ Previene pérdida de datos

### 2. **Integridad de Datos**
- ✅ Snapshot inmutable después de ALISTAMIENTO
- ✅ Historial confiable para análisis
- ✅ Trazabilidad completa

### 3. **Performance Optimizado**
- ✅ Debouncing reduce llamadas a la API
- ✅ Días completados no consultan APIs dinámicas
- ✅ Cache en localStorage para carga instantánea

### 4. **Seguridad**
- ✅ Datos no modificables después de congelación
- ✅ Validación en frontend y backend
- ✅ Registro de usuario en cada cambio

---

## 🔧 Configuración

### Variables de Entorno

No requiere configuración adicional. Usa las mismas variables que el resto del sistema:

```env
REACT_APP_API_URL=http://localhost:8000/api
```

### Base de Datos

El modelo `Planeacion` ya está migrado:

```python
class Planeacion(models.Model):
    fecha = models.DateField()
    producto_nombre = models.CharField(max_length=255)
    existencias = models.IntegerField(default=0)
    solicitadas = models.IntegerField(default=0)
    pedidos = models.IntegerField(default=0)
    total = models.IntegerField(default=0)
    orden = models.IntegerField(default=0)
    ia = models.IntegerField(default=0)
    usuario = models.CharField(max_length=100, default='Sistema')
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('fecha', 'producto_nombre')
```

---

## 🧪 Testing

### Probar Auto-Guardado

1. Abrir Planeación
2. Seleccionar una fecha sin ALISTAMIENTO activado
3. Escribir un valor en la columna ORDEN
4. Esperar 1 segundo
5. Verificar en consola: `✅ Actualizado: [producto] - Orden: [valor]`
6. Recargar página y verificar que el valor persiste

### Probar Congelación

1. Abrir Cargue para un día específico
2. Agregar productos con cantidades
3. Activar ALISTAMIENTO
4. Ir a Planeación
5. Verificar banner de advertencia
6. Intentar editar ORDEN
7. Verificar que muestra mensaje de error

---

## 📝 Notas Técnicas

### LocalStorage Keys

- **Estado del día**: `estado_boton_${dia}_${fecha}`
- **Cache de planeación**: `planeacion_${fecha}`
- **Producción congelada**: `produccion_congelada_${dia}_${fecha}`

### Eventos Personalizados

El sistema escucha estos eventos para actualizar datos:

- `cargueActualizado`: Cuando se guarda en Cargue
- `pedidoGuardado`: Cuando se crea/modifica un pedido
- `inventarioActualizado`: Cuando cambia el stock
- `productosUpdated`: Cuando se modifican productos

### Limpieza Automática

El sistema limpia automáticamente datos de localStorage con más de **7 días** de antigüedad.

---

## 🚀 Próximas Mejoras

### Módulo de Reportes (Futuro)

- 📊 Consulta de historial de planeación
- 📈 Análisis de tendencias
- 🤖 Predicciones con IA
- 📉 Comparativas entre fechas
- 📋 Exportación a Excel/PDF

### Mejoras de UX

- ⚡ Indicador de "guardado exitoso" más visible
- 🔔 Notificaciones push cuando se congela un día
- 📱 Versión móvil optimizada
- 🎨 Temas personalizables

---

## 📞 Soporte

Para reportar problemas o sugerencias, revisar los logs en:

- **Frontend**: Consola del navegador (F12)
- **Backend**: Terminal del servidor Django

Buscar mensajes con estos prefijos:
- `✅` = Operación exitosa
- `❌` = Error
- `🔒` = Congelación/bloqueo
- `💾` = Guardado
- `📸` = Snapshot
