# README - Estado Cargue / Auditoria / App Guerrero

Fecha: 2026-03-19

Este archivo resume en que punto quedo el trabajo de `Cargue`, `Auditoria de Liquidacion`, backend relacionado y `AP GUERRERO`, para poder retomarlo si se reinicia el computador o se pierde el hilo.

---

## 1. Ya desplegado en VPS

Se subio y despliego el commit:

- `a6aec81`
- `feat(cargue): preserve local edits during outages`

Ese commit ya quedo en produccion y corresponde a:

- persistencia offline en `Cargue`
- proteccion anti-borrado de columnas editables
- reintentos de sincronizacion al volver internet
- limpieza correcta de pendientes al finalizar

Validacion ya hecha:

- en VPS se confirmo que los datos de `Cargue` se sostienen sin internet
- al volver la conexion, los datos no se borran
- se dio por corregido el reporte principal de despachadores sobre borrado intermitente

Archivos principales de ese bloque:

- `frontend/src/components/Cargue/PlantillaOperativa.jsx`
- `frontend/src/components/Cargue/ResumenVentas.jsx`
- `frontend/src/components/Cargue/ControlCumplimiento.jsx`
- `frontend/src/components/Cargue/RegistroLotes.jsx`
- `frontend/src/components/Cargue/BotonLimpiar.jsx`

---

## 2. Cambios locales actuales en frontend web CRM

Estos cambios siguen locales al momento de crear este README.

Archivos:

- `frontend/src/components/Cargue/PlantillaOperativa.jsx`
- `frontend/src/components/Cargue/TablaProductos.jsx`
- `frontend/src/components/Cargue/BotonLimpiar.jsx`
- `frontend/src/components/rutas/ReporteVentasRuta.jsx`
- `frontend/src/components/rutas/ReporteVentasRuta.css`
- `AI_CONTEXT.md`

### 2.1. Tabla principal de Cargue

Se agrego marca visual roja en la tabla para:

- `devoluciones`
- `vencidas`

Regla:

- si el despachador modifica manualmente esos campos en fase operativa de despacho/finalizacion, el numero queda en rojo
- si el valor vuelve al original, la marca se quita
- la marca se guarda en localStorage con:
  - `cargue_despachador_overrides_<dia>_<id>_<fecha>`
- al finalizar/limpiar, esa marca se elimina

Objetivo:

- saber rapido que filas toco manualmente el despachador

### 2.2. Modal de Auditoria de Liquidacion

El modal fue simplificado para que sea mas legible y sirva para detectar si el `ID` esta reportando bien o no.

Columnas finales:

- `TOTAL LIQ.`
- `APP VEND.`
- `APP VENC.`
- `RESTANTE`
- `DEV. FIS. / ESTADO`

Reglas finales acordadas:

- si el numero esta rojo en la tabla principal de `Cargue`, ya se entiende que el despachador intervino esa fila
- el modal no debe llenarse de demasiados badges
- debe ser rapido de leer

Estados finales del modal:

- `OK`
  - la fila cuadra
- `Pendiente`
  - hay restante por cerrar, sin evidencia clara de mala reportería
- `Ajustado manualmente`
  - el despachador corrigio manualmente la fila
- `No reporto vencida`
  - la app no reporto la vencida y esta aparecio en CRM/cargue
- `Ajusto dev. y vencida`
  - caso combinado: la app no reporto la vencida y ademas el despachador ajusto manualmente devolucion/vencida

Comportamiento importante:

- el modal ya no usa la semantica vieja engañosa de `FISICO vs APP`
- se abre a partir de datos de backend + cargue liquidable
- ahora tambien muestra filas aunque la app no haya reportado nada, si existen:
  - devoluciones
  - vencidas
  - ajuste manual / conteo del despachador

Campo `DEV. FIS.`:

- se autocompleta desde `devoluciones`
- se puede sobreescribir manualmente

Notas operativas:

- `No reporto venta` no aparece como texto explicito en el modal
- en la practica se interpreta combinando:
  - rojo en tabla principal
  - estado del modal
  - restante
  - vencidas no reportadas

### 2.3. Ventas Ruta - badge visual de vencidas

Se agrego una señal visual en el listado principal de `Ventas de Ruta`:

- badge `VENCIDAS X` en la columna `TOTAL` cuando la venta trae `productos_vencidos`
- el badge `EDITADA` se conserva
- ambos badges quedan en linea horizontal junto al valor total, con salto controlado si no caben

Objetivo:

- detectar desde el listado principal si la venta reporto vencidas
- no depender de abrir el detalle para ver esa novedad

---

## 3. Cambios locales actuales en backend

Archivos:

- `api/models.py`
- `api/views.py`
- `api/serializers.py`

Objetivo de este bloque:

- corregir desfaces de `total/neto` cuando cambian `vencidas` o `devoluciones`
- evitar casos donde la app mostraba un restante y la auditoria otro diferente por `total` viejo en BD

Que se hizo:

- se agrego helper para recalcular totales en `api/models.py`
- se aplico en puntos donde antes se usaba `update()` o `bulk_update()` y el `save()` no recalculaba `total`

Motivo:

- habia casos como:
  - app mostrando `5`
  - auditoria mostrando `3`
- porque `vencidas/devoluciones` cambiaban pero `total` quedaba viejo

Validacion hecha:

- `python3 manage.py check`
- resultado: OK

Importante:

- este bloque sigue local
- si se quisiera desplegar, toca backend en VPS

---

## 4. Cambio local actual en AP GUERRERO

Archivo:

- `AP GUERRERO/components/Ventas/VentasScreen.js`

Que se hizo:

- al guardar una venta, el descuento del stock visible local ya no usa el estado vivo del carrito
- ahora usa el snapshot exacto de la venta armada (`ventaConDatos`)

Objetivo:

- evitar desfaces raros del stock visible justo despues de vender

Importante:

- este cambio tambien sigue local
- no hace parte del modal de auditoria
- si se quiere sacar a produccion movil, toca generar APK nueva

---

## 5. Que SI requiere VPS y que SI requiere APK

### Solo frontend web CRM

Si solo se suben los cambios del modal/tabla de auditoria:

- requiere deploy frontend web en VPS
- NO requiere APK nueva

### Backend

Si se sube el bloque de recalculo de `total/neto`:

- requiere deploy backend en VPS
- NO requiere APK nueva

### AP GUERRERO

Si se incluye el cambio de `VentasScreen.js`:

- SI requiere nueva APK

---

## 6. Validaciones realizadas en esta sesion

Frontend:

- `npm run build`
- resultado: OK varias veces durante los ajustes

Backend:

- `python3 manage.py check`
- resultado: OK

Pruebas funcionales observadas con usuario:

- persistencia de `Cargue` sin internet
- reconexion sin borrado de columnas editables
- coherencia entre app y auditoria en casos de ventas/vencidas
- lectura del modal con intervencion manual del despachador

---

## 7. Siguiente paso recomendado

Separar en commits distintos:

1. `frontend web CRM`
   - modal de auditoria
   - rojo manual en tabla
   - limpieza de overrides
   - documentacion

2. `backend`
   - recalculo robusto de `total/neto`

3. `AP GUERRERO`
   - ajuste de stock local postventa

Asi se puede decidir por separado:

- que subir al VPS
- que dejar pendiente
- y si vale la pena generar APK nueva

---

## 8. Resumen corto para retomarlo rapido

- lo de persistencia offline de `Cargue` ya esta desplegado en VPS
- el modal de auditoria quedo mas simple y orientado a detectar si el `ID` reporta bien
- el rojo en `Cargue` significa que el despachador toco manualmente esa fila
- hay backend local pendiente para recalcular bien `total/neto`
- hay un ajuste local en `AP GUERRERO` que solo pisaria produccion si se genera APK nueva
