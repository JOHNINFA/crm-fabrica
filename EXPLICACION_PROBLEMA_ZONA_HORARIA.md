# Explicación del Problema de Zona Horaria

## ¿Por qué la fecha cambiaba de 24 a 25?

### El Problema: `toISOString()`

Cuando usas `toISOString()` en JavaScript, convierte la fecha a **UTC (Tiempo Universal Coordinado)**.

Si estás en una zona horaria con **offset negativo** (como Colombia UTC-5), esto causa que la fecha cambie.

### Ejemplo Real:

```javascript
// Supongamos que seleccionas: Lunes 24 de noviembre de 2025
const fecha = new Date(2025, 10, 24); // Mes 10 = noviembre (0-indexed)

// En tu zona horaria local (Colombia UTC-5):
console.log(fecha.toString());
// "Mon Nov 24 2025 00:00:00 GMT-0500"

// Usando toISOString() (convierte a UTC):
console.log(fecha.toISOString());
// "2025-11-24T05:00:00.000Z"  ← Nota: 05:00 en UTC

// Al hacer split('T')[0]:
console.log(fecha.toISOString().split('T')[0]);
// "2025-11-24"  ← Parece correcto, pero...
```

### El Problema Real:

Cuando el DatePicker crea la fecha, puede incluir la hora actual:

```javascript
// Si son las 8:00 PM (20:00) en Colombia (UTC-5)
const fecha = new Date(2025, 10, 24, 20, 0, 0);

console.log(fecha.toString());
// "Mon Nov 24 2025 20:00:00 GMT-0500"

console.log(fecha.toISOString());
// "2025-11-25T01:00:00.000Z"  ← ¡Cambió a 25!
//  Porque 20:00 - 5 horas = 01:00 del día siguiente en UTC

console.log(fecha.toISOString().split('T')[0]);
// "2025-11-25"  ← ❌ FECHA INCORRECTA
```

## La Solución

Usar los métodos locales en lugar de UTC:

```javascript
// ✅ CORRECTO: Usar fecha local
const year = fecha.getFullYear();        // 2025
const month = String(fecha.getMonth() + 1).padStart(2, '0');  // "11"
const day = String(fecha.getDate()).padStart(2, '0');         // "24"
const formattedDate = `${year}-${month}-${day}`;              // "2025-11-24"
```

### Comparación:

| Método | Zona Horaria | Resultado | Correcto |
|--------|--------------|-----------|----------|
| `toISOString().split('T')[0]` | UTC | "2025-11-25" | ❌ |
| `getFullYear() + getMonth() + getDate()` | Local | "2025-11-24" | ✅ |

## Logs de Depuración Agregados

Para verificar que la fecha se está formateando correctamente, agregamos estos logs:

```javascript
console.log('📅 Fecha seleccionada:', currentDate);
console.log('📅 Fecha formateada:', formattedDate);
console.log('📅 Día de la semana:', currentDate.getDay());
console.log('📅 Día calculado:', diaDeLaFecha);
console.log('📅 Día seleccionado:', selectedDay);
```

## Verificación

Después de la corrección, deberías ver en los logs:

```
📅 Fecha seleccionada: Mon Nov 24 2025 20:00:00 GMT-0500
📅 Fecha formateada: 2025-11-24
📅 Día de la semana: 1
📅 Día calculado: Lunes
📅 Día seleccionado: Lunes
LOG  Enviando Sugerido: {"dia": "LUNES", "fecha": "2025-11-24", ...}
```

✅ **Ahora la fecha 24 se envía como 24, no como 25**
