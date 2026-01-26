# 🛠️ Instrucciones de Corrección - Módulo Cargue y Visualización

Estas son las correcciones técnicas necesarias para solucionar los problemas de visualización y discrepancias de inventario en el módulo de Cargue.

## 1. 🎨 Corrección de Visualización (Scroll Horizontal)

**Problema:** La tabla operativa se corta en pantallas pequeñas y no muestra la barra de desplazamiento.
**Archivo:** `frontend/src/index.css`
**Acción:** Buscar la clase `.main-content` y cambiar `overflow-x`.

```css
/* ANTES */
.main-content {
  overflow-x: hidden;
}

/* DESPUÉS (CORRECTO) */
.main-content {
  overflow-x: auto; /* Permite scroll horizontal si es necesario */
}
```

---

## 2. 📝 Corrección de Nombres de Productos (Discrepancia Obleas)

**Problema:** El producto "AREPA TIPO OBLEA" aparecía como "AREPA TIPO OBLEAS" (plural) en el código, causando que no cruzara con la base de datos (singular).
**Archivo:** `frontend/src/components/Cargue/MenuSheets.jsx`
**Acción:** Buscar y reemplazar todas las ocurrencias.

```javascript
/* BUSCAR */
{ producto: "AREPA TIPO OBLEAS", ... }

/* REEMPLAZAR POR */
{ producto: "AREPA TIPO OBLEA", ... }
```

---

## 3. 🧠 Mejora en Lógica de Coincidencia (BotonLimpiar)

**Problema:** El modal de descuento no mostraba productos si tenían ligeras variaciones en el nombre (espacios extra, puntos, "GR", etc.).
**Archivo:** `frontend/src/components/Cargue/BotonLimpiar.jsx`
**Ubicación:** Función `cargarDatosCargue` o `manejarFinalizarDelID`.

**Lógica a Implementar:**
Se debe mejorar la búsqueda del producto usando normalización "agresiva":

```javascript
// Normalización para comparar nombres
const normalizar = (t) => t.trim().toUpperCase()
  .replace(/\s+/g, '') // Quitar espacios
  .replace(/\./g, '')  // Quitar puntos
  .replace(/GR$/, '')  // Quitar "GR" final
  .replace(/S$/, '');  // Quitar "S" final (singular/plural)

// Lógica de búsqueda
let pReal = todosProds.find(tp => normalizar(tp.nombre) === normalizar(p.producto));

// Si no encuentra exacto, intentar "contiene" o "empieza con"
if (!pReal) {
  pReal = todosProds.find(tp => {
    const tpNorm = normalizar(tp.nombre);
    const pNorm = normalizar(p.producto);
    return tpNorm.startsWith(pNorm) || pNorm.startsWith(tpNorm);
  });
}
```

---

## 4. 🔄 Sincronización de Inventario (Finalización)

**Problema:** Las devoluciones y vencidas registradas al finalizar no descontaban correctamente del inventario en algunos casos.
**Archivo:** `frontend/src/components/Cargue/PlantillaOperativa.jsx`

**Acción:** Asegurar que `actualizarInventarioPorTOTAL` se llame también para devoluciones y vencidas cuando el estado es `FINALIZAR`.

```javascript
// En la función actualizarProducto / setProductosOperativos

if (estadoBoton === 'FINALIZAR' && 
   (campo === 'cantidad' || campo === 'devoluciones' || campo === 'vencidas')) {
     
     // Calcular diferencia y actualizar
     const diferenciaTOTAL = totalNuevo - totalAnterior;
     if (diferenciaTOTAL !== 0) {
        actualizarInventarioPorTOTAL(id, diferenciaTOTAL);
     }
}
```
