# 📅 Plan de Trabajo: Selector de Fecha en Cargue

**Fecha de inicio**: 24 de Noviembre 2025  
**Estado**: En desarrollo  
**Prioridad**: Alta

---

## 🎯 Objetivo

Permitir que la aplicación móvil (AP GUERRERO) pueda distinguir entre diferentes días de la misma semana (ej: Lunes 24 Nov vs Lunes 1 Dic) mediante un selector de fecha, y validar si un día ya está completado antes de permitir su edición.

---

## 📊 Problema Actual

### Escenario:
1. **Lunes 24 Nov** → Usuario trabaja y finaliza el día
2. **Lunes 1 Dic** → Nueva semana, nuevo Lunes
3. Cuando abre "LUNES" en la app → No hay forma de seleccionar cuál Lunes
4. Los datos se mezclan o sobrescriben

### Consecuencias:
- ❌ Datos de diferentes semanas se confunden
- ❌ No se puede reabrir un día ya finalizado
- ❌ No hay validación de estado del día

---

## ✅ Solución Propuesta

### Componentes a Modificar:

#### 1. **Backend (Django)**
- Crear endpoint de verificación de estado
- Validar día completado antes de guardar

#### 2. **Frontend App Móvil (AP GUERRERO)**
- Agregar selector de fecha (DateTimePicker)
- Mostrar indicador de estado del día
- Bloquear edición si está finalizado

#### 3. **Frontend Web (CRM-Fabrica)**
- Ya tiene selector de fecha ✅
- Agregar indicador visual de estado

---

## 🗓️ Plan de Trabajo Detallado

### **FASE 1: Backend - API de Estado** ⏱️ 30-40 min

#### Tarea 1.1: Crear endpoint de verificación
**Archivo**: `/api/views.py`

```python
@api_view(['GET'])
def verificar_estado_dia(request):
    """
    Verifica el estado de un día específico
    Parámetros: vendedor_id, dia, fecha
    Retorna: { completado, estado, puede_editar, mensaje }
    """
    pass
```

**Funcionalidad**:
- Consultar tabla `CargueID{X}` según `vendedor_id`
- Verificar si existe registro con `dia` + `fecha`
- Determinar estado basado en localStorage del vendedor
- Retornar información completa

**Endpoint**: `GET /api/verificar-estado-dia/?vendedor_id=ID1&dia=LUNES&fecha=2025-11-24`

**Response esperado**:
```json
{
  "success": true,
  "completado": true,
  "estado": "COMPLETADO",
  "puede_editar": false,
  "mensaje": "Este día ya fue finalizado",
  "fecha": "2025-11-24",
  "dia": "LUNES",
  "tiene_datos": true
}
```

#### Tarea 1.2: Agregar validación en guardado
**Archivo**: `/api/views.py` (endpoints de guardado)

Antes de guardar, verificar:
```python
if dia_completado and not force_update:
    return Response({
        'error': 'DIA_COMPLETADO',
        'message': 'No puedes modificar un día ya finalizado'
    }, status=400)
```

#### Tarea 1.3: Registrar ruta
**Archivo**: `/api/urls.py`

```python
path('verificar-estado-dia/', verificar_estado_dia, name='verificar-estado-dia'),
```

---

### **FASE 2: App Móvil - Selector de Fecha** ⏱️ 1-1.5 horas

#### Tarea 2.1: Instalar dependencias
```bash
npm install @react-native-community/datetimepicker
```

#### Tarea 2.2: Modificar componente Cargue
**Archivo**: `/AP GUERRERO/components/Cargue.js`

**Cambios**:
1. Importar DateTimePicker
2. Agregar estado para fecha seleccionada
3. Agregar estado para estado del día
4. Crear función para verificar estado

**Código adicional**:
```javascript
import DateTimePicker from '@react-native-community/datetimepicker';

const [selectedDate, setSelectedDate] = useState(new Date());
const [showDatePicker, setShowDatePicker] = useState(false);
const [diaEstado, setDiaEstado] = useState(null);
```

#### Tarea 2.3: Crear función de verificación
```javascript
const verificarEstadoDia = async (dia, fecha) => {
  try {
    const url = `${API_URL_VERIFICAR}?vendedor_id=${userId}&dia=${dia}&fecha=${fecha}`;
    const response = await fetch(url);
    const data = await response.json();
    
    setDiaEstado(data);
    
    if (data.completado) {
      Alert.alert(
        'Día Finalizado',
        data.mensaje,
        [{ text: 'Entendido' }]
      );
    }
  } catch (error) {
    console.error('Error verificando estado:', error);
  }
};
```

#### Tarea 2.4: Agregar UI del selector
Agregar antes de la tabla de productos:

```javascript
{/* Selector de Fecha */}
<View style={styles.dateSelector}>
  <TouchableOpacity onPress={() => setShowDatePicker(true)}>
    <Text style={styles.dateText}>
      📅 {formatDate(selectedDate)}
    </Text>
  </TouchableOpacity>
  
  {diaEstado?.completado && (
    <View style={styles.badgeCompletado}>
      <Text style={styles.badgeText}>✓ DÍA FINALIZADO</Text>
    </View>
  )}
</View>

{showDatePicker && (
  <DateTimePicker
    value={selectedDate}
    mode="date"
    display="default"
    onChange={onDateChange}
  />
)}
```

#### Tarea 2.5: Agregar estilos
```javascript
dateSelector: {
  backgroundColor: '#007bff',
  padding: 15,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
  borderRadius: 8,
},
dateText: {
  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',
},
badgeCompletado: {
  backgroundColor: '#28a745',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 15,
},
badgeText: {
  color: 'white',
  fontSize: 12,
  fontWeight: 'bold',
}
```

#### Tarea 2.6: Bloquear edición si está completado
```javascript
const handleQuantityChange = (productName, value) => {
  if (diaEstado?.completado) {
    Alert.alert('No Permitido', 'No puedes modificar un día finalizado');
    return;
  }
  
  // Lógica normal...
};
```

---

### **FASE 3: Frontend Web - Indicadores** ⏱️ 20-30 min

#### Tarea 3.1: Agregar badge de estado
**Archivo**: `/frontend/src/components/Cargue/BotonLimpiar.jsx`

En el botón de estado, agregar indicador visual más claro:

```javascript
{estado === 'COMPLETADO' && (
  <div className="alert alert-success mt-2">
    ✓ Este día ya fue completado el {fechaFinalizacion}
  </div>
)}
```

#### Tarea 3.2: Deshabilitar inputs si está completado
**Archivo**: `/frontend/src/components/Cargue/TablaProductos.jsx`

```javascript
disabled={estado === 'COMPLETADO'}
```

---

### **FASE 4: Validaciones y Seguridad** ⏱️ 20-30 min

#### Tarea 4.1: Validar en todos los endpoints de guardado

Endpoints a modificar:
- `cargue-id1/` (POST/PATCH)
- `cargue-id2/` (POST/PATCH)
- ... hasta id6
- `actualizar-check-vendedor/`

Agregar verificación:
```python
# Verificar si el día está completado
estado_dia = verificar_si_dia_completado(vendedor_id, dia, fecha)
if estado_dia['completado']:
    return Response({
        'error': 'DIA_COMPLETADO',
        'message': 'No se puede modificar un día finalizado'
    }, status=403)
```

#### Tarea 4.2: Crear función auxiliar
```python
def verificar_si_dia_completado(vendedor_id, dia, fecha):
    """
    Verifica si un día específico está marcado como completado
    """
    # Buscar en localStorage del backend (si existe)
    # O verificar flag en la tabla
    return {
        'completado': False,  # o True
        'estado': 'SUGERIDO',  # o 'DESPACHO' o 'COMPLETADO'
    }
```

---

### **FASE 5: Testing** ⏱️ 30-40 min

#### Test 1: Día sin datos
- Seleccionar fecha futura
- Verificar que muestre estado "Vacío"
- Permitir ingresar datos

#### Test 2: Día con datos pero no finalizado
- Seleccionar Lunes 24 Nov
- Si no está finalizado, permitir edición
- Verificar que se guarden correctamente

#### Test 3: Día finalizado
- Finalizar un día
- Cerrar y reabrir app
- Seleccionar ese día
- Verificar badge "DÍA FINALIZADO"
- Intentar editar → Debe mostrar alerta
- Verificar que no se guarde en BD

#### Test 4: Cambio de fecha
- Cambiar fecha desde el selector
- Verificar que cargue datos correctos
- Verificar estado correcto

#### Test 5: Múltiples Lunes
- Crear datos para Lunes 24 Nov
- Crear datos para Lunes 1 Dic
- Alternar entre ambas fechas
- Verificar que cada una muestre sus datos correctos

---

## 📝 Checklist de Implementación

### Backend
- [ ] Crear función `verificar_estado_dia` en views.py
- [ ] Crear función auxiliar `verificar_si_dia_completado`
- [ ] Agregar ruta en urls.py
- [ ] Agregar validación en endpoints de guardado
- [ ] Probar endpoint con Postman/Thunder Client

### App Móvil (AP GUERRERO)
- [ ] Instalar `@react-native-community/datetimepicker`
- [ ] Agregar estado para fecha y estado del día
- [ ] Crear función `verificarEstadoDia`
- [ ] Agregar UI del selector de fecha
- [ ] Agregar badge de estado
- [ ] Bloquear edición si está completado
- [ ] Agregar estilos
- [ ] Probar en emulador/dispositivo

### Frontend Web (CRM-Fabrica)
- [ ] Agregar indicador de estado más visible
- [ ] Deshabilitar inputs si está completado
- [ ] Mejorar feedback visual

### Testing
- [ ] Test: Día vacío
- [ ] Test: Día con datos
- [ ] Test: Día finalizado
- [ ] Test: Cambio de fecha
- [ ] Test: Múltiples días de la misma semana

---

## 🚀 Orden de Ejecución

1. **Primero**: Backend (Fase 1) - 40 min
2. **Segundo**: Testing Backend con Postman - 10 min
3. **Tercero**: App Móvil (Fase 2) - 1.5 horas
4. **Cuarto**: Frontend Web (Fase 3) - 30 min
5. **Quinto**: Validaciones (Fase 4) - 30 min
6. **Sexto**: Testing completo (Fase 5) - 40 min

**Total estimado**: 3-3.5 horas

---

## 📊 Datos de Prueba Disponibles

Tenemos disponible para testing:
- **Fecha**: 24 de Noviembre 2025 (Lunes)
- **Vendedor**: ID1 (CARLOS)
- **Datos**: 1 registro con devoluciones, vencidas y lotes
- **Estado**: Puede estar COMPLETADO o no (verificar)

---

## 🎯 Criterios de Éxito

✅ El usuario puede seleccionar cualquier fecha desde la app móvil  
✅ El sistema muestra claramente si un día está finalizado  
✅ No se puede editar un día finalizado sin confirmación especial  
✅ Cada día mantiene sus datos independientes  
✅ La sincronización funciona correctamente con múltiples fechas  

---

## 📌 Notas Importantes

1. La fecha por defecto debe ser la fecha actual del dispositivo
2. El formato de fecha debe ser consistente: `YYYY-MM-DD`
3. Los días finalizados deben tener un indicador visual muy claro
4. Considerar timezone del dispositivo vs servidor
5. El estado debe verificarse cada vez que se cambia la fecha

---

## 🔄 Próximos Pasos

Una vez completado este plan:
1. Documentar el flujo completo
2. Crear manual de usuario
3. Considerar backup automático de días finalizados
4. Implementar historial de cambios por día

---

**Última actualización**: 24 Nov 2025, 13:39
**Responsable**: Desarrollo
**Revisión**: Pendiente
