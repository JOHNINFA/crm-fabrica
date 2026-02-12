# 📋 TAREAS PENDIENTES - CRM Fábrica

## Última actualización: 2026-02-11

---

## 🔴 PRIORIDAD ALTA

### TAREA 1: Archivar Productos Inactivos
**Módulo:** Productos (`/#/productos`)
**Estado:** ⏳ Pendiente

**Descripción:**
Crear una funcionalidad para "archivar" productos que no se pueden eliminar porque tienen historial (ventas, movimientos, cargues, etc.), pero que ya no se usan.

**Requisitos:**
1. Agregar un botón "Archivar" (o icono) en la lista de Productos
2. Los productos archivados se mueven a una sección separada (ej: pestaña "Archivados" o al final de la lista con un indicador visual)
3. El producto archivado se marca como `activo = False` en la BD
4. Los productos archivados NO aparecen en:
   - POS (catálogo)
   - Pedidos (selector de productos)
   - Planeación (lista)
   - Kardex (inventario)
5. Los productos archivados SÍ se mantienen en:
   - Reportes históricos
   - Ventas pasadas
   - Movimientos de stock pasados
6. Opción de "Restaurar" un producto archivado (volver a `activo = True`)

**Modelo existente:**
```python
# api/models.py - Producto
activo = models.BooleanField(default=True)  # ✅ Ya existe este campo
```

**Archivos a modificar:**
- `frontend/src/pages/ProductosScreen.jsx` o componente equivalente (agregar botón y sección)
- `api/views.py` (endpoint para cambiar `activo`)
- Verificar filtros en todos los módulos que listen productos

**Productos a archivar actualmente:**
- Almojabanas x5 und
- Arepa Boy x5 und

---

### TAREA 2: Sistema de Backup Completo
**Módulo:** Otros (`/#/otros`)
**Estado:** ⏳ Pendiente

**Descripción:**
Crear un botón en el módulo "Otros" para descargar un backup completo de TODA la base de datos del sistema, útil para migración de servidor o respaldo manual.

**Requisitos:**
1. Botón "Descargar Backup" en el módulo Otros
2. El backup debe incluir TODAS las tablas:
   - 👤 **Clientes** (datos completos)
   - 🛒 **Ventas** (facturas, detalles, pagos)
   - 📦 **Pedidos** (con detalles)
   - 📊 **Inventario** (stock actual, movimientos)
   - 🚛 **Cargues** (ID1 a ID6, todos los registros)
   - 👥 **Usuarios** (cajeros, vendedores)
   - 🏭 **Productos** (con categorías, precios, orden)
   - 📋 **Planeación** (registros diarios, snapshots)
   - 📈 **Reportes** (reportes históricos guardados)
   - 💰 **Transacciones** (movimientos de caja)
   - 🗺️ **Rutas** (asignaciones de clientes)
   - 📄 **Listas de Precios** (todas las listas)
   - ⚙️ **Configuración** (turnos, estados)
3. Formato: JSON (legible y fácil de importar) o SQL dump
4. El archivo se descarga como `.json` o `.sql` con fecha en el nombre
5. Indicador de progreso durante la generación
6. Opcionalmente: botón "Restaurar Backup" para importar

**Implementación sugerida:**

**Backend (Django):**
```python
# api/views.py
@api_view(['GET'])
def backup_completo(request):
    """Genera y descarga un backup completo del sistema"""
    from django.core import serializers
    
    datos = {
        'fecha_backup': datetime.now().isoformat(),
        'version': '1.0',
        'clientes': list(Cliente.objects.all().values()),
        'productos': list(Producto.objects.all().values()),
        'ventas': list(Venta.objects.all().values()),
        # ... todas las tablas
    }
    
    response = JsonResponse(datos)
    response['Content-Disposition'] = f'attachment; filename="backup_crm_{fecha}.json"'
    return response
```

**Frontend:**
```javascript
// Botón en módulo Otros
const descargarBackup = async () => {
    const response = await fetch(`${API_URL}/backup/`);
    const blob = await response.blob();
    // Descargar archivo
};
```

**Archivos a crear/modificar:**
- `api/views.py` (nuevo endpoint `/api/backup/`)
- `api/urls.py` (nueva ruta)
- Componente frontend en módulo Otros (botón + progreso)

---

## 🟡 PRIORIDAD MEDIA

### TAREA 3: Limpieza y Mantenimiento de Datos (Purga)
**Módulo:** Otros / Mantenimiento
**Estado:** ⏳ Pendiente

**Descripción:**
Funcionalidad para eliminar datos antiguos y mantener la base de datos liviana. Vital para evitar lentitud a largo plazo.

**Requisitos:**
1. Botón "Limpiar Datos Históricos"
2. Selector de periodo (ej: "Eliminar datos de hace más de 6 meses", o seleccionar meses específicos: "Julio-Agosto-Septiembre 2025")
3. Confirmación de seguridad doble (es una acción destructiva)
4. Tablas a purgar:
   - Ventas y Detalles de venta (solo si ya están cerradas/pagadas)
   - Pedidos antiguos
   - Registros de Cargue (ID1-ID6) de meses pasados
   - Reportes de Planeación antiguos
5. **IMPORTANTE:** Antes de purgar, el sistema debe obligar a hacer un Backup (Tarea 2).

---

### TAREA 4: Auditoría de Escalabilidad y Rendimiento
**Estado:** ⏳ Pendiente

**Descripción:**
Realizar un barrido completo del sistema para asegurar que no haya problemas de rendimiento a medida que crezca la base de datos (millones de registros).

**Puntos de control:**
1. **Índices de BD:** Asegurar que `fecha`, `cliente_id`, y `producto_id` tengan índices en todas las tablas transaccionales.
2. **Consultas Pesadas:** Revisar `PlaneacionViewSet` y `ReportePlaneacionViewSet` para que no carguen archivos JSON gigantes innecesariamente.
3. **Paginación:** Forzar paginación en el Backend para todos los listados de Ventas y Cargues.
4. **Optimización de Media:** Asegurar que las imágenes de productos no pesen megabytes.

---

### TAREA 5: Implementar MCP (Model Context Protocol)
**Estado:** ⏳ Pendiente
**Documentación:** `.kiro/MCP_PLAN.md`

**Descripción:**
Implementar el sistema MCP para respaldo automático de datos según el plan documentado.

**Fases:**
1. ⏳ Elegir opción (PostgreSQL externo, Google Sheets, o SQLite)
2. ⏳ Configurar credenciales y conexión
3. ⏳ Implementar sincronización automática
4. ⏳ Crear interfaz de monitoreo
5. ⏳ Documentar procedimiento de emergencia

**Relación con Tarea 2:**
El sistema de Backup (Tarea 2) es un respaldo MANUAL.
El MCP (Tarea 4) sería un respaldo AUTOMÁTICO y continuo.
Ambos se complementan.

---

## 🟢 COMPLETADAS

### ✅ Fix Planeación: Orden Visual vs Cantidad (2026-02-11)
- Separado `ordenVisual` de `orden` (cantidad)
- Rescate de datos desde Reporte Histórico
- Documentado en `.kiro/docs/PLANEACION_ORDEN_FIX.md`

### ✅ Fix POS: Ordenamiento por campo `orden` (2026-02-11)
- POS ahora ordena por `orden` de Productos en vez de por ID

### ✅ Fix Planeación: Corrección de snapshot en BotonLimpiar (2026-02-11)
- Snapshots ahora guardan cantidad correcta (0) en vez de posición

---

## 📝 Notas

- Los cambios deben desplegarse con: `git pull`, `docker compose build`, `docker compose up -d`
- Siempre verificar en VPS después de cada deploy
- Hacer backup manual antes de cambios grandes en la BD
