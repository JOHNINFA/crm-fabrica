# PENDIENTE: Responsable no se guarda en BD al completar Cargue

## Problema
Cuando se completa el cargue (botón DESPACHO), el campo `responsable` en la BD queda como "RESPONSABLE" en lugar del nombre real del vendedor (ej: "WILSON").

El nombre SÍ se guarda correctamente cuando se edita en la interfaz, pero al momento de enviar a la BD no lo está tomando.

## Ubicación del problema

### Archivos involucrados:
1. `frontend/src/components/Cargue/BotonLimpiar.jsx` (líneas 700-730) - Obtiene el responsable
2. `frontend/src/utils/responsableStorage.js` - Almacena/recupera responsables
3. `frontend/src/services/cargueService.js` (línea 291) - Envía a BD

### Flujo actual:
```
1. Usuario edita nombre → responsableStorage.set("ID1", "WILSON") ✅
2. Se guarda en localStorage["responsables_cargue"] = {"ID1": "WILSON"} ✅
3. Usuario presiona DESPACHO
4. BotonLimpiar llama responsableStorage.get("ID1") → retorna null o "RESPONSABLE" ❌
5. Se envía a BD con responsable: "RESPONSABLE" ❌
```

## Diagnóstico pendiente
Verificar en consola (F12) al presionar DESPACHO:
- Si aparece: `📦 ResponsableStorage.get(ID1): "WILSON"` → El problema está después
- Si aparece: `⚠️ ResponsableStorage.get(ID1): No encontrado` → El problema está en la lectura

## Plan de trabajo

### Paso 1: Diagnóstico
- [ ] Abrir consola F12
- [ ] Editar nombre del vendedor (ej: "WILSON")
- [ ] Verificar que aparezca: `💾 ResponsableStorage.set(ID1): "WILSON"`
- [ ] Presionar DESPACHO
- [ ] Verificar qué aparece en consola sobre el responsable

### Paso 2: Posibles soluciones
1. **Si no encuentra el valor:** Revisar que la clave `responsables_cargue` en localStorage tenga el valor correcto
2. **Si lo encuentra pero no lo usa:** Revisar la lógica de prioridad en BotonLimpiar.jsx
3. **Si lo envía pero no llega:** Revisar cargueService.js

### Paso 3: Implementar fix
Según el diagnóstico, modificar el archivo correspondiente.

## Datos técnicos

### Clave localStorage:
```
responsables_cargue = {"ID1": "WILSON", "ID2": "OTRO", ...}
```

### Código que obtiene el responsable (BotonLimpiar.jsx):
```javascript
const responsableRS = responsableStorage.get(idVendedor);
// Si retorna null, usa fallbacks...
```

### Código que envía a BD (cargueService.js):
```javascript
responsable: datosParaGuardar.responsable || 'RESPONSABLE',
```

## Fecha: 2025-12-01
