# 🔧 FIX: Botón "Corregir Cantidades" - Persistencia en BD

**Fecha:** 2026-02-11  
**Problema:** El botón "Corregir Cantidades" no persiste cambios cuando hay datos de la app móvil  
**Estado:** DOCUMENTADO - Pendiente implementación

---

## 🎯 PROBLEMA IDENTIFICADO

### Situación Actual
1. Vendedor envía cantidades desde app móvil → se guardan en BD con `usuario='AppMovil'`
2. Usuario abre el módulo Cargue en el CRM
3. Ve el botón "Corregir Cantidades" (solo visible en estado `ALISTAMIENTO`)
4. Abre el modal, edita cantidades, guarda
5. ❌ **PROBLEMA:** Los cambios solo se guardan en `localStorage`, NO en BD
6. Al recargar la página, los datos vuelven a cargarse desde BD (se pierden las correcciones)

### Flujo del Código Actual

**Backend (`api/views.py`):**
- Endpoint `guardar_sugerido` (línea 2880-3031):
  - Recibe datos desde app móvil
  - Guarda con `usuario='AppMovil'`
  - Validación: **Bloquea duplicados** (línea 2924-2933)
  - Si ya existe sugerido para ese día/fecha → Error 409

**Frontend:**
- `BotonCorreccion.jsx` (línea 1-87):
  - Solo visible cuando `estadoBoton === 'ALISTAMIENTO'`
  - Abre el modal `ModalCorreccionSimple`
  
- `ModalCorreccionSimple.jsx` (línea 1-187):
  - Edita cantidades en memoria (línea 14-19)
  - Guarda cambios **SOLO en localStorage** (línea 26-68)
  - **NO hace PATCH/PUT a la BD**

---

## ✅ SOLUCIÓN PROPUESTA

### 1. Crear Endpoint Backend de Corrección

**Archivo:** `api/views.py`  
**Nuevo endpoint:** `POST /api/cargue-corregir-cantidad/`

**Payload:**
```json
{
  "vendedor_id": "ID1",
  "dia": "LUNES",
  "fecha": "2026-02-11",
  "producto": "AREPA TIPO OBLEA",
  "nueva_cantidad": 50
}
```

**Lógica:**
1. Buscar registro existente en `CargueID1-6` según `vendedor_id`, `dia`, `fecha`, `producto`
2. Si NO existe → Error 404 `"Producto no encontrado"`
3. Si existe → Actualizar:
   - `cantidad = nueva_cantidad`
   - `total = cantidad - dctos + adicional - devoluciones - vencidas`
   - **NO modificar `usuario`** (preservar si es `AppMovil` o `CRM`)
4. Retornar éxito con total recalculado

**Código a agregar:**
```python
@api_view(['POST'])
def corregir_cantidad_cargue(request):
    """
    Endpoint para corregir cantidad de un producto específico.
    NO crea registros nuevos, solo actualiza existentes.
    """
    try:
        data = request.data
        vendedor_id = data.get('vendedor_id')
        dia = data.get('dia', '').upper()
        fecha = data.get('fecha')
        producto = data.get('producto')
        nueva_cantidad = data.get('nueva_cantidad')
        
        # Validación
        if not all([vendedor_id, dia, fecha, producto, nueva_cantidad is not None]):
            return Response({'error': 'Faltan campos requeridos'}, status=400)
        
        # Mapeo de modelos
        modelos = {
            'ID1': CargueID1,
            'ID2': CargueID2,
            'ID3': CargueID3,
            'ID4': CargueID4,
            'ID5': CargueID5,
            'ID6': CargueID6,
        }
        
        Modelo = modelos.get(vendedor_id)
        if not Modelo:
            return Response({'error': 'Vendedor no válido'}, status=400)
        
        # Buscar registro existente
        registro = Modelo.objects.filter(
            dia=dia,
            fecha=fecha,
            producto=producto
        ).first()
        
        if not registro:
            return Response({
                'error': 'Producto no encontrado',
                'message': f'No existe {producto} para {dia} {fecha}'
            }, status=404)
        
        # Actualizar cantidad
        registro.cantidad = int(nueva_cantidad)
        
        # Recalcular total
        cantidad = int(nueva_cantidad)
        dctos = int(registro.dctos) if registro.dctos else 0
        adicional = int(registro.adicional) if registro.adicional else 0
        devoluciones = int(registro.devoluciones) if registro.devoluciones else 0
        vencidas = int(registro.vencidas) if registro.vencidas else 0
        
        registro.total = cantidad - dctos + adicional - devoluciones - vencidas
        
        # Guardar (preserva campo 'usuario')
        registro.save()
        
        print(f"✅ Cantidad corregida: {producto} - {nueva_cantidad} (Total: {registro.total})")
        
        return Response({
            'success': True,
            'message': 'Cantidad actualizada correctamente',
            'producto': producto,
            'nueva_cantidad': cantidad,
            'total_recalculado': registro.total
        })
        
    except Exception as e:
        print(f"❌ Error corrigiendo cantidad: {str(e)}")
        return Response({'error': str(e)}, status=500)
```

**Ubicación:** Después de la función `guardar_sugerido` (aprox. línea 3032)

---

### 2. Registrar Endpoint en URLs

**Archivo:** `api/urls.py`

**Agregar:**
```python
path('cargue-corregir-cantidad/', views.corregir_cantidad_cargue, name='corregir-cantidad-cargue'),
```

---

### 3. Modificar Modal Frontend

**Archivo:** `frontend/src/components/Cargue/ModalCorreccionSimple.jsx`

**Cambio en función `handleGuardar` (línea 21-69):**

**ANTES:**
```javascript
const handleGuardar = () => {
    alert('💾 Función guardar ejecutada');
    
    // Solo actualiza localStorage
    try {
        const fechaAUsar = fechaSeleccionada;
        const key = `cargue_${dia}_${idSheet}_${fechaAUsar}`;
        
        const datosActuales = localStorage.getItem(key);
        // ... actualiza solo localStorage ...
        
        alert('✅ Cambios guardados exitosamente');
        onGuardar();
        onClose();
    } catch (error) {
        console.error('❌ Error guardando:', error);
        alert('❌ Error guardando cambios');
    }
};
```

**DESPUÉS:**
```javascript
const handleGuardar = async () => {
    console.log('💾 Guardando correcciones...');
    
    // Filtrar solo productos modificados
    const productosModificados = productosEditados.filter(
        p => p.cantidadOriginal !== p.cantidadNueva
    );
    
    if (productosModificados.length === 0) {
        alert('⚠️ No hay cambios para guardar');
        return;
    }
    
    try {
        // 1. Guardar en BD primero
        console.log(`🔄 Sincronizando ${productosModificados.length} productos con BD...`);
        
        const promesas = productosModificados.map(producto => 
            fetch('/api/cargue-corregir-cantidad/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vendedor_id: idSheet,
                    dia: dia.toUpperCase(),
                    fecha: fechaSeleccionada,
                    producto: producto.nombre,
                    nueva_cantidad: producto.cantidadNueva
                })
            }).then(res => res.json())
        );
        
        const resultados = await Promise.all(promesas);
        
        // Verificar errores
        const errores = resultados.filter(r => !r.success);
        if (errores.length > 0) {
            console.error('❌ Errores guardando:', errores);
            alert(`❌ Error guardando ${errores.length} producto(s)`);
            return;
        }
        
        console.log('✅ Todos los productos guardados en BD');
        
        // 2. Actualizar localStorage (sincronización local)
        const fechaAUsar = fechaSeleccionada;
        const key = `cargue_${dia}_${idSheet}_${fechaAUsar}`;
        
        const datosActuales = localStorage.getItem(key);
        if (datosActuales) {
            const datos = JSON.parse(datosActuales);
            
            productosEditados.forEach(productoEditado => {
                const productoEnDatos = datos.productos.find(p => p.id === productoEditado.id);
                if (productoEnDatos && productoEditado.cantidadOriginal !== productoEditado.cantidadNueva) {
                    productoEnDatos.cantidad = productoEditado.cantidadNueva;
                    
                    const cantidad = parseInt(productoEditado.cantidadNueva) || 0;
                    const dctos = parseInt(productoEnDatos.dctos) || 0;
                    const adicional = parseInt(productoEnDatos.adicional) || 0;
                    const devoluciones = parseInt(productoEnDatos.devoluciones) || 0;
                    const vencidas = parseInt(productoEnDatos.vencidas) || 0;
                    
                    productoEnDatos.total = cantidad - dctos + adicional - devoluciones - vencidas;
                    productoEnDatos.neto = Math.round(productoEnDatos.total * productoEnDatos.valor);
                    
                    console.log(`✅ localStorage: ${productoEditado.nombre} - ${productoEditado.cantidadOriginal} → ${productoEditado.cantidadNueva}`);
                }
            });
            
            datos.timestamp = Date.now();
            localStorage.setItem(key, JSON.stringify(datos));
        }
        
        alert(`✅ ${productosModificados.length} producto(s) corregido(s) exitosamente`);
        
        if (onGuardar) {
            onGuardar();
        }
        
        onClose();
        
    } catch (error) {
        console.error('❌ Error guardando:', error);
        alert('❌ Error guardando cambios. Intenta de nuevo.');
    }
};
```

---

## 🔒 SEGURIDAD Y VALIDACIONES

### No Hay Conflicto Con App Móvil

✅ **Endpoint diferente:** `corregir_cantidad_cargue` ≠ `guardar_sugerido`  
✅ **Solo actualiza:** No crea registros nuevos  
✅ **Preserva origen:** No modifica campo `usuario`  
✅ **Validación de duplicados NO se activa:** Solo se activa en `guardar_sugerido`

### Casos de Uso Válidos

1. **Vendedor envía mal la cantidad desde app móvil**
   - Se guarda con `usuario='AppMovil'`
   - Usuario corrige desde CRM
   - Se actualiza cantidad pero preserva `usuario='AppMovil'`
   - ✅ Funciona correctamente

2. **Usuario carga manual en CRM y se equivoca**
   - Se guarda con `usuario='CRM'`
   - Usuario corrige
   - Se actualiza preservando `usuario='CRM'`
   - ✅ Funciona correctamente

3. **Intento de re-envío desde app móvil**
   - App intenta enviar de nuevo
   - Endpoint `guardar_sugerido` devuelve Error 409
   - ❌ Bloqueado (protección OK)

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [ ] Agregar función `corregir_cantidad_cargue` en `api/views.py`
- [ ] Registrar endpoint en `api/urls.py`
- [ ] Probar endpoint con Postman/Thunder Client
- [ ] Verificar que preserva campo `usuario`
- [ ] Verificar que recalcula `total` correctamente

### Frontend
- [ ] Modificar `handleGuardar` en `ModalCorreccionSimple.jsx`
- [ ] Probar corrección de 1 producto
- [ ] Probar corrección de múltiples productos
- [ ] Verificar que actualiza localStorage
- [ ] Verificar que los cambios persisten al recargar

### Testing
- [ ] Caso 1: Corregir cantidad de producto desde app móvil
- [ ] Caso 2: Corregir cantidad de producto manual CRM
- [ ] Caso 3: Intentar re-enviar desde app (debe bloquearse)
- [ ] Caso 4: Recargar página y verificar persistencia

---

## 🔄 PLAN DE REVERSIÓN

### Si algo sale mal:

1. **Reversar cambios en frontend:**
   ```bash
   git checkout HEAD -- frontend/src/components/Cargue/ModalCorreccionSimple.jsx
   ```

2. **Reversar cambios en backend:**
   ```bash
   git checkout HEAD -- api/views.py api/urls.py
   ```

3. **Reiniciar servicios:**
   ```bash
   docker compose -f docker-compose.prod.yml restart backend
   docker compose -f docker-compose.prod.yml restart frontend
   ```

---

## 📊 ARCHIVOS A MODIFICAR

1. `api/views.py` - Nuevo endpoint (≈60 líneas)
2. `api/urls.py` - Registro de URL (1 línea)
3. `frontend/src/components/Cargue/ModalCorreccionSimple.jsx` - Función handleGuardar (≈80 líneas)

**Total estimado:** ≈140 líneas de código nuevo/modificado

---

## ✅ ESTADO

- [x] Problema identificado
- [x] Solución diseñada
- [x] Documentación completa
- [ ] **Pendiente:** Implementación
- [ ] **Pendiente:** Testing
- [ ] **Pendiente:** Despliegue a producción
