# Solución: Problema de Fecha y Día en App Guerrero

## Problema Identificado

Cuando se enviaba desde la app móvil el día **LUNES 24**, se guardaba como **25 de noviembre** en el backend y se mostraba incorrectamente en el frontend.

## Causas

1. **App Móvil - Problema de Zona Horaria**: El método `toISOString()` convierte la fecha a UTC, lo que causaba que la fecha cambiara de día (24 → 25)
2. **App Móvil**: No validaba que la fecha seleccionada correspondiera al día de la semana elegido
3. **Frontend**: La función `calcularFechaPorDia` siempre calculaba fechas futuras, incluso cuando el día actual coincidía con el día seleccionado

## Soluciones Implementadas

### 1. App Móvil (ProductList.js)

✅ **CRÍTICO: Corregido formato de fecha (Problema de Zona Horaria)**

**ANTES (INCORRECTO):**
```javascript
const formattedDate = currentDate.toISOString().split('T')[0];
// ❌ toISOString() convierte a UTC, cambiando el día: 24 → 25
```

**AHORA (CORRECTO):**
```javascript
// ✅ Usar fecha local para evitar cambio de día por zona horaria
const year = currentDate.getFullYear();
const month = String(currentDate.getMonth() + 1).padStart(2, '0');
const day = String(currentDate.getDate()).padStart(2, '0');
const formattedDate = `${year}-${month}-${day}`;
```

**Resultado**: La fecha seleccionada (24) se envía como 24, no como 25.

---

✅ **Agregada validación de día y fecha**

Ahora la app verifica que la fecha seleccionada en el DatePicker corresponda al día de la semana elegido en el Navbar.

```javascript
// Validar que el día seleccionado coincida con la fecha
const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const diaDeLaFecha = diasSemana[currentDate.getDay()];

if (diaDeLaFecha.toUpperCase() !== selectedDay.toUpperCase()) {
  Alert.alert(
    'Error de Fecha',
    `La fecha seleccionada es ${diaDeLaFecha}, pero seleccionaste ${selectedDay}...`
  );
  return;
}
```

**Resultado**: Si seleccionas LUNES pero eliges una fecha que es Domingo, la app mostrará un error y no enviará los datos.

### 2. Frontend (MenuSheets.jsx)

✅ **Corregida función calcularFechaPorDia**

Ahora la función respeta el día actual cuando coincide con el día seleccionado.

```javascript
// Si diferenciaDias === 0, significa que es HOY, no sumar nada
if (diferenciaDias < 0) {
  diferenciaDias += 7;
}
```

**Resultado**: Si hoy es LUNES y seleccionas LUNES, mostrará la fecha de hoy, no la del próximo lunes.

### 3. Limpieza de Datos

✅ **Eliminados datos incorrectos del 25 de noviembre**

Se creó y ejecutó el script `limpiar_datos_25_nov.py` que eliminó:
- **Primera ejecución**: 2 registros de CargueID1 (AREPA TIPO OBLEA 500Gr y AREPA MEDIANA 330Gr)
- **Segunda ejecución**: 3 registros de CargueID1 (AREPA TIPO OBLEA 500Gr, AREPA MEDIANA 330Gr, AREPA TIPO PINCHO 330Gr)
- Fecha incorrecta: LUNES 25/11/2025

**Total eliminado**: 5 registros con fecha incorrecta

## Cómo Usar Ahora

### En la App Móvil:

1. Selecciona el día en el Navbar (ej: LUNES)
2. Agrega las cantidades de productos
3. Presiona "Enviar Sugerido"
4. Selecciona la fecha en el DatePicker
5. **La app validará automáticamente** que la fecha corresponda al día seleccionado
6. Si hay error, mostrará un mensaje y no enviará los datos

### En el Frontend:

1. Selecciona el día en la URL (ej: /cargue/LUNES)
2. La fecha se calculará automáticamente para ese día
3. Si hoy es LUNES, mostrará la fecha de hoy
4. Si hoy no es LUNES, mostrará la fecha del próximo LUNES
5. Puedes cambiar manualmente la fecha con el input de fecha

## Validaciones Implementadas

✅ **Dos condiciones que se cumplen ahora:**

1. **Día y Fecha deben coincidir**: Si envías LUNES, la fecha debe ser un lunes
2. **Frontend muestra la fecha correcta**: Si envías datos del 24, el frontend muestra el 24

## Archivos Modificados

- `AP GUERRERO/components/ProductList.js` - Validación de día/fecha
- `frontend/src/components/Cargue/MenuSheets.jsx` - Cálculo correcto de fecha
- `limpiar_datos_25_nov.py` - Script de limpieza (nuevo)

## Pruebas Recomendadas

1. Desde la app, selecciona LUNES y elige una fecha que sea lunes → ✅ Debe enviar
2. Desde la app, selecciona LUNES y elige una fecha que NO sea lunes → ❌ Debe mostrar error
3. En el frontend, entra a /cargue/LUNES en un día lunes → Debe mostrar la fecha de hoy
4. En el frontend, entra a /cargue/LUNES en otro día → Debe mostrar la fecha del próximo lunes
