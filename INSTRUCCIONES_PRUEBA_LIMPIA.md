# Instrucciones para Prueba Limpia

## ✅ Tabla Limpiada

La tabla `api_cargueid1` ha sido limpiada completamente. Ahora está lista para recibir datos frescos desde la app.

## 📱 Pasos para Probar desde la App Móvil

### 1. Enviar datos desde la app:

1. Abre la app móvil
2. Selecciona **LUNES** en el navbar
3. Agrega cantidades a algunos productos (ej: 10, 20, 30)
4. Presiona **"Enviar Sugerido"**
5. Selecciona la fecha: **24 de noviembre de 2025** (debe ser un lunes)
6. Confirma el envío

### 2. Verificar en los logs de la app:

Deberías ver algo como:
```
📅 Fecha seleccionada: Mon Nov 24 2025 ...
📅 Fecha formateada: 2025-11-24
📅 Día de la semana: 1
📅 Día calculado: Lunes
📅 Día seleccionado: Lunes
LOG  Enviando Sugerido: {"dia": "LUNES", "fecha": "2025-11-24", "productos": [...], "vendedor_id": "ID1"}
```

### 3. Verificar en la base de datos:

Ejecuta esta consulta para ver los datos guardados:
```sql
SELECT * FROM api_cargueid1 WHERE fecha = '2025-11-24' ORDER BY id;
```

O usa este comando:
```bash
python3 -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()
from api.models import CargueID1
registros = CargueID1.objects.filter(fecha='2025-11-24')
print(f'Total registros: {registros.count()}')
for r in registros:
    print(f'{r.dia} {r.fecha} - {r.producto}: {r.cantidad}')
"
```

### 4. Limpiar localStorage del Frontend (IMPORTANTE):

Antes de verificar en el frontend, abre la consola del navegador (F12) y ejecuta:

```javascript
// Limpiar todos los datos de cargue del localStorage
Object.keys(localStorage).forEach(key => {
    if (key.startsWith('cargue_')) {
        localStorage.removeItem(key);
        console.log('🗑️ Eliminado:', key);
    }
});
console.log('✅ localStorage limpiado');
```

### 5. Verificar en el Frontend:

1. Abre el navegador en: `http://localhost:3000/cargue/LUNES`
2. Verifica que la fecha sea: **24/11/2025**
3. Selecciona el vendedor: **ID1**
4. Abre la consola del navegador (F12) y busca estos logs:

```
🔍 HYBRID: Cargando datos - LUNES ID1 2025-11-24
🔍 HYBRID: Consultando servidor primero...
🔍 API: Cargando datos desde servidor - LUNES ID1 2025-11-24
🔍 API: Respuesta del servidor: {...}
✅ API: Datos cargados desde app móvil - X productos
✅ HYBRID: Datos cargados desde app móvil y guardados localmente
```

5. Los productos deberían aparecer con las cantidades que enviaste desde la app

## 🔍 Verificación de Problemas

### Si los datos NO aparecen en el frontend:

1. **Verifica la consola del navegador** para ver los logs
2. **Verifica que el backend esté corriendo**: `http://localhost:8000/api/obtener-cargue/?vendedor_id=ID1&dia=LUNES&fecha=2025-11-24`
3. **Verifica CORS**: El frontend debe poder hacer peticiones al backend
4. **Verifica la fecha**: Asegúrate de que la fecha en el frontend coincida con la fecha enviada desde la app

### Si los datos NO llegan a la base de datos:

1. **Verifica los logs del backend** (terminal donde corre Django)
2. **Verifica la URL de la API** en la app móvil (`ProductList.js` línea 12)
3. **Verifica la conexión de red** entre la app y el backend

## 📊 Comandos Útiles

### Ver datos en la base de datos:
```bash
python3 -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()
from api.models import CargueID1
for r in CargueID1.objects.all():
    print(f'{r.dia} {r.fecha} - {r.producto}: {r.cantidad}')
"
```

### Limpiar tabla nuevamente:
```bash
echo "si" | python3 limpiar_tabla_cargueid1.py
```

### Probar endpoint directamente:
```bash
curl "http://localhost:8000/api/obtener-cargue/?vendedor_id=ID1&dia=LUNES&fecha=2025-11-24"
```

## ✅ Resultado Esperado

Después de seguir estos pasos:

1. ✅ Los datos se envían desde la app con la fecha correcta (24)
2. ✅ Los datos se guardan en la base de datos con la fecha correcta (24)
3. ✅ El frontend carga los datos desde el backend
4. ✅ Los productos aparecen con las cantidades correctas en el frontend

---

**Nota**: Si después de limpiar el localStorage y recargar la página los datos aún no aparecen, comparte los logs de la consola del navegador para diagnosticar el problema.
