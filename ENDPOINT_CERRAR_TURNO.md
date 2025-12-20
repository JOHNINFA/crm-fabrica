# ✅ ENDPOINT CERRAR TURNO - COMPLETO

**Fecha:** 2025-12-17 01:16  
**Estado:** BACKEND COMPLETADO ✅

---

## 🎯 ENDPOINT CREADO

### POST /api/cargue/cerrar-turno/

**Descripción:**  
Cierra el turno del vendedor desde la app móvil. Calcula devoluciones automáticamente y las guarda en la BD.

**URL:**
```
POST http://localhost:8000/api/cargue/cerrar-turno/
```

**Body (JSON):**
```json
{
  "id_vendedor": "ID1",
  "fecha": "2025-12-17",
  "productos_vencidos": [
    {
      "producto": "AREPA TIPO OBLEA 500Gr",
      "cantidad": 5
    }
  ]
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "mensaje": "Turno cerrado correctamente",
  "resumen": [
    {
      "producto": "AREPA TIPO OBLEA 500Gr",
      "cargado": 200,
      "vendido": 150,
      "vencidas": 5,
      "devuelto": 45
    }
  ],
  "totales": {
    "cargado": 200,
    "vendido": 150,
    "vencidas": 5,
    "devuelto": 45
  }
}
```

---

## 📋 LÓGICA DEL ENDPOINT

1. **Recibe:**
   - `id_vendedor` (ID1-ID6)
   - `fecha` (YYYY-MM-DD)
   - `productos_vencidos` (array opcional)

2. **Proceso:**
   ```python
   for producto in cargue:
       cantidad_inicial = cantidad - dctos + adicional
       
       # Sumar ventas desde VentaRuta
       cantidad_vendida = suma_ventas_app(producto)
       
       # Obtener vencidas reportadas
       vencidas = productos_vencidos[producto]
       
       # Calcular devoluciones
       devoluciones = cantidad_inicial - cantidad_vendida - vencidas
       
       # ✅ GUARDAR EN BD
       cargue.vencidas = vencidas
       cargue.devoluciones = devoluciones
       cargue.save()
   ```

3. **Retorna:**
   - Resumen por producto
   - Totales generales

---

## 📁 ARCHIVOS MODIFICADOS

1. **`api/views.py`**
   - Función `cerrar_turno_vendedor()` (líneas 3346-3505)
   - +160 líneas

2. **`api/urls.py`**
   - Import agregado (línea 13)
   - Ruta agregada (líneas 77-79)

---

## 🧪 CÓMO PROBAR

### Con curl:
```bash
curl -X POST http://localhost:8000/api/cargue/cerrar-turno/ \
  -H "Content-Type: application/json" \
  -d '{
    "id_vendedor": "ID1",
    "fecha": "2025-12-17",
    "productos_vencidos": [
      {"producto": "AREPA TIPO OBLEA 500Gr", "cantidad": 5}
    ]
  }'
```

### Con Postman:
1. Método: POST
2. URL: `http://localhost:8000/api/cargue/cerrar-turno/`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON): ver ejemplo arriba

---

## 🔄 FLUJO COMPLETO

```
1. VENDEDOR EN APP:
   ├─ Termina jornada
   ├─ Presiona "Cerrar Turno"
   ├─ Ingresa vencidas (si hay)
   └─ App llama: POST /api/cargue/cerrar-turno/

2. BACKEND:
   ├─ Obtiene cargue del día
   ├─ Suma ventas desde VentaRuta
   ├─ Calcula devoluciones
   └─ GUARDA en CargueID.devoluciones ✅

3. VENDEDOR VE RESUMEN:
   ├─ "Cargaste: 200"
   ├─ "Vendiste: 150"
   ├─ "Vencidas: 5"
   └─ "Devuelves: 45" ✅

4. EN WEB (CARGUE):
   └─ Columna "devoluciones" = 45 (ya está guardado) ✅
```

---

## ✅ SIGUIENTE PASO

Crear pantalla en APP GUERRERO para cerrar turno.

**Archivo a crear:**  
`AP GUERRERO/components/Ventas/CerrarTurnoScreen.js`

---

**Estado:** ✅ Backend completado y listo para usar
