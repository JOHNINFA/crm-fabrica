# 🚀 Guía de Despliegue a VPS (Docker)

Esta guía documenta el proceso paso a paso para actualizar el sistema en producción.

---
## 📅 DESPLIEGUE ACTUAL - Sistema POS (Caja) - Feb 03 2026

### ✅ **Cambios Aplicados:**
1. **Fix Crítico: Turnos Fantasma Resuelto**
   - `cajeroService.js`: Evita fallback a localStorage si la API retorna array vacío
   - `CajeroContext.jsx`: Validación doble de IDs antes de aceptar un turno (evita contaminación entre usuarios)
   - `CajeroContext.jsx`: Auto-limpieza de localStorage si no hay turno real en BD

2. **Mejoras UI/UX:**
   - Etiqueta "BASE EN CAJA" destacada en verde
   - Columnas de Arqueo alineadas correctamente
   - Inputs numéricos: Ahora permiten borrar contenido completamente (fix en `handleInputChange`)

3. **Ticket de Arqueo:**
   - Desglose de Efectivo: BASE CAJA + VENTAS EFECTIVO = TOTAL EFECTIVO
   - Eliminación de fila "BONOS" del ticket

4. **Búsqueda en Reportes:**
   - `InformeVentasGeneral.jsx`: Barra de búsqueda por Cliente o # Pedido
   - `CajaScreen.jsx`: Barra de búsqueda en Transacciones de Ventas

5. **Modal Detalle de Venta:**
   - Eliminado botón "Anular Venta" (solo Admin puede anular desde otros módulos)

6. **Historial de Arqueos:**
   - `CajaScreen.jsx`: Acceso garantizado para Administradores mediante `useAuth().esAdmin()`

### ⚠️ **IMPORTANTE:**
- **NO hay migraciones de BD nuevas** (solo cambios en Frontend)
- **SÍ requiere rebuild completo** (cambios en 5+ archivos JS/JSX)
- El Admin verá indicador "X Cajas Abiertas" pero su botón Logout NO estará verde (correcto)

---
## 📅 CAMBIOS RECIENTES APP VENDEDOR (Turnos y Bloqueos) - [Fecha Previa]
No hay migraciones de BD nuevas, pero **SÍ** hay cambios críticos en la lógica de `views.py` para bloquear turnos cerrados.

1.  **Backend:** Se modificó `api/views.py` para impedir estrictamente reabrir turnos cerrados.
2.  **App Móvil (Expo):** Se ajustaron visuales (Ticket en una línea, Alerta Roja de Cierre).
    *   *Nota: La App Móvil se actualiza vía OTA (Expo) o reconstruyendo el APK si cambiaste dependencias nativas.*

**Pasos en VPS:**
Simple actualización de código Backend:
```bash
cd ~/crm-fabrica
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build backend
```
*(No es necesario `migrate` esta vez, solo reiniciar con el nuevo código).*

---

## 📅 TAREA ESPECÍFICA PARA HOY (Actualización Caja y Pedidos)
**Cambios incluidos (Migraciones que se aplicarán):**
*   `0081_productosfrecuentes`
*   `0082_productosfrecuentes_nota`
*   `0083_listaprecio_visible_pos`
*   `0084_venta_creado_por`
*   `0085_add_turno_to_movimientocaja` (La de hoy)

**⚠️ IMPORTANTE:** Detecté y corregí un error en tus modelos (una clase duplicada). Ya está limpio. Al subir, se aplicarán estas 5 migraciones en orden automáticamente.

**⚠️ PASO IMPORTANTE:** Hoy **SÍ** debes ejecutar migraciones porque tocamos la base de datos.

---

## 💻 1. En tu Computador (Local)

1.  **Guarda y Sube los cambios:**
    Abre tu terminal en la carpeta del proyecto y ejecuta:
    ```bash
    git add .
    git commit -m "POS Completo: Migraciones + Fix Turnos + UI/UX"
    git push origin main
    ```

---

## ☁️ 2. En el Servidor (VPS)

1.  **Conéctate al servidor:**
    ```bash
    ssh root@76.13.96.225
    ```

2.  **Ve a la carpeta y baja los cambios:**
    ```bash
    cd ~/crm-fabrica
    git pull origin main
    ```

3.  **Aplicar Cambios (Rebuild + Migraciones):**

    **⚠️ HOY (Seguridad Primero):** Sigue estos 3 pasos exactos.
    
    **Paso 1: 🛡️ CREAR RESPALDO DE SEGURIDAD (Por si acaso)**
    ```bash
    mkdir -p ~/backups
    docker exec crm_postgres_prod pg_dump -U crm_user crm_db > ~/backups/backup_seguridad_$(date +%F_%H-%M).sql
    echo "Backup Completo"
    ```

    **Paso 2: ⬇️ ACTUALIZAR CÓDIGO**
    ```bash
    git pull origin main
    docker compose -f docker-compose.prod.yml up -d --build
    ```
    *(Espera a que termine de construir y levantar los contenedores)*

    **Paso 3: 🏗️ APLICAR CAMBIOS EN BASE DE DATOS**
    (Estas migraciones SOLO AGREGAN columnas nuevas, NO borran nada. Es seguro).
    ```bash
    docker exec crm_backend_prod python manage.py migrate
    ```
    *Deberías ver OK en:* `0081`, `0082`, `0083`, `0084`, `0085`.

4.  **✅ Verificación Final:**
    - Abre el navegador en `http://76.13.96.225` (o tu dominio)
    - Login como Admin, ve al POS
    - Verifica que el botón "Logout" NO esté verde (debe estar rojo/gris)
    - Verifica que puedas ver "X Cajas Abiertas" si hay cajeros trabajando
    - Prueba abrir/cerrar turno como cajero
    - Verifica el Historial de Arqueos (visible para Admin)

---

## 🛠️ Comandos Útiles (Referencia Rápida)

### ¿Solo cambiaste Frontend (React/Visual)?
```bash
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build frontend
```

### ¿Solo cambiaste lógica Backend (Python) SIN base de datos?
```bash
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build backend
```
*(Luego reiniciar Gunicorn si es necesario, aunque el build suele bastar)*

### Ver logs (si algo falla)
```bash
docker compose -f docker-compose.prod.yml logs -f --tail=50 backend
```
o
```bash
docker compose -f docker-compose.prod.yml logs -f --tail=50 frontend
```
