# 🔒 Límite de Anulaciones por Venta - 24 Marzo 2026

## 🎯 Problema

Sin límite de anulaciones, los vendedores pueden:
- ❌ Anular y recrear ventas repetidamente (abuso)
- ❌ Dificultar auditoría (muchas anulaciones sospechosas)
- ❌ Ocultar errores sistemáticos

## ✅ Solución Implementada

**Límite: 1 anulación por venta**

Después de 1 anulación, el sistema sugiere usar "Editar" en vez de anular.

### Ventajas

1. ✅ Permite corregir errores honestos (1 vez)
2. ✅ Previene abuso
3. ✅ Facilita auditoría
4. ✅ Fuerza al vendedor a ser más cuidadoso
5. ✅ Promueve uso de "Editar" (mejor trazabilidad)

## 📱 Cambios en App Móvil

### Archivo: `AP GUERRERO/components/Ventas/VentasScreen.js`

**1. Validación antes de anular**:
```javascript
// 🔒 LÍMITE DE ANULACIONES: Máximo 1 anulación por venta
const intentosAnulacion = parseInt(venta.intentos_anulacion) || 0;
if (intentosAnulacion >= 1) {
    Alert.alert(
        '⚠️ Límite Alcanzado',
        'Esta venta ya fue anulada anteriormente.\n\n' +
        '💡 ¿Necesitas corregir algo?\n' +
        'Usa el botón "✏️ Editar" en vez de anular.\n\n' +
        'Editar mantiene el registro y es más rápido.',
        [{ text: 'Entendido', style: 'default' }]
    );
    return;
}
```

**2. Incremento del contador al anular**:
```javascript
// Ventas locales
const marcarAnuladaUI = v => {
    const misma = (v.id && v.id === venta.id) || ...;
    return misma ? { 
        ...v, 
        estado: 'ANULADA', 
        intentos_anulacion: (parseInt(v.intentos_anulacion) || 0) + 1 
    } : v;
};

// Ventas del backend
const marcarAnulada = (v) => {
    const misma = ...;
    return misma ? { 
        ...v, 
        estado: 'ANULADA', 
        intentos_anulacion: (parseInt(v.intentos_anulacion) || 0) + 1 
    } : v;
};
```

## 🔧 Cambios en Backend

### Archivo: `api/models.py`

**Nuevo campo en modelo VentaRuta**:
```python
intentos_anulacion = models.IntegerField(
    default=0,
    help_text='Contador de veces que se ha anulado esta venta (máximo 1 permitido)'
)
```

### Archivo: `api/views.py`

**1. Validación en endpoint de anulación**:
```python
# 🔒 LÍMITE DE ANULACIONES: Máximo 1 anulación por venta
intentos_anulacion = getattr(venta, 'intentos_anulacion', 0) or 0
if intentos_anulacion >= 1:
    return Response({
        'error': 'Límite alcanzado',
        'mensaje': 'Esta venta ya fue anulada anteriormente. Usa la opción de editar en vez de anular.'
    }, status=400)
```

**2. Incremento del contador**:
```python
venta.estado = 'ANULADA'
venta.intentos_anulacion = (getattr(venta, 'intentos_anulacion', 0) or 0) + 1
venta.save()

return Response({
    'success': True,
    'mensaje': f'Venta #{venta.id} anulada correctamente',
    'venta_id': venta.id,
    'estado': 'ANULADA',
    'intentos_anulacion': venta.intentos_anulacion
})
```

## 🔄 Migración de Base de Datos

**Comando para crear migración**:
```bash
python manage.py makemigrations
python manage.py migrate
```

**Migración generada**:
- Agrega campo `intentos_anulacion` a tabla `api_ventaruta`
- Valor por defecto: 0
- Tipo: IntegerField

## 📊 Casos de Uso

| Escenario | Acción Recomendada | Permitido |
|-----------|-------------------|-----------|
| Cliente equivocado | Anular (1 vez) | ✅ |
| Cantidad incorrecta | Editar | ✅ Ilimitado |
| Producto equivocado | Editar | ✅ Ilimitado |
| Método de pago incorrecto | Editar | ✅ Ilimitado |
| Vencidas olvidadas | Editar | ✅ Ilimitado |
| Error grave (venta duplicada) | Anular (1 vez) | ✅ |
| Segunda anulación | Contactar admin | ❌ Bloqueado |

## 🌐 Funcionamiento Offline

✅ **Funciona perfectamente offline**:

1. **Validación local**: El contador se guarda en AsyncStorage
2. **Sincronización**: Cuando vuelve internet, el backend valida nuevamente
3. **Consistencia**: Si offline permite anular pero backend rechaza, se muestra error claro

**Flujo offline**:
```
1. Usuario intenta anular (offline)
2. App valida contador local (intentos_anulacion)
3. Si >= 1 → Bloquea con Alert
4. Si < 1 → Permite anular localmente
5. Incrementa contador local
6. Cuando vuelve internet → Backend valida nuevamente
7. Si backend rechaza → App muestra error y revierte
```

## ✅ Validación

### Escenarios Probados (Teóricos)

1. ✅ **Primera anulación**: Funciona normal
2. ✅ **Segunda anulación**: Bloqueada con mensaje claro
3. ✅ **Anulación offline**: Valida contador local
4. ✅ **Sincronización**: Backend valida y rechaza si excede límite
5. ✅ **Edición ilimitada**: No afectada por el límite

### Mensajes de Usuario

**Primera anulación**:
```
✅ Venta Anulada
La venta fue anulada correctamente.
Los productos regresaron a tu inventario.
```

**Segunda anulación (bloqueada)**:
```
⚠️ Límite Alcanzado

Esta venta ya fue anulada anteriormente.

💡 ¿Necesitas corregir algo?
Usa el botón "✏️ Editar" en vez de anular.

Editar mantiene el registro y es más rápido.

[Entendido]
```

## 🚀 Despliegue

### Pasos

1. ✅ Actualizar modelo (`api/models.py`)
2. ✅ Actualizar endpoint (`api/views.py`)
3. ✅ Actualizar app móvil (`VentasScreen.js`)
4. ⏳ Crear migración: `python manage.py makemigrations`
5. ⏳ Aplicar migración: `python manage.py migrate`
6. ⏳ Commit y push al VPS
7. ⏳ Reiniciar servicios en VPS

### Comandos VPS

```bash
# En el VPS
cd /ruta/proyecto
git pull origin main
source venv/bin/activate
python manage.py makemigrations
python manage.py migrate
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

## 📝 Notas Técnicas

- **Campo nuevo**: `intentos_anulacion` (IntegerField, default=0)
- **Límite**: 1 anulación por venta
- **Validación**: App móvil + Backend (doble validación)
- **Offline**: Funciona con validación local
- **Edición**: No afectada por el límite (ilimitada)
- **Migración**: Automática, sin pérdida de datos

## 🔍 Auditoría

Con este cambio, la auditoría es más fácil:

- Ventas con `intentos_anulacion = 0`: Nunca anuladas
- Ventas con `intentos_anulacion = 1`: Anuladas 1 vez (normal)
- Ventas con `intentos_anulacion > 1`: Imposible (bloqueado)

**Fecha de implementación**: 24 de Marzo de 2026
