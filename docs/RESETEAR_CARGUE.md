# 🔄 Cómo Resetear el Estado del Botón de Cargue para Pruebas

## Problema
El estado del botón de Cargue (SUGERIDO → DESPACHO → COMPLETADO) se guarda en **DOS lugares**:
1. **localStorage** del navegador
2. **Base de datos** (tabla `CargueResumen`)

Si solo limpias uno, el otro lo restaura al recargar la página.

---

## ✅ Solución: Limpiar AMBOS antes de recargar

### Paso 1: Limpiar localStorage (en el navegador)

Abre la consola del navegador (F12 > Console) en `localhost:3000` y ejecuta:

```javascript
localStorage.clear();
// NO RECARGUES TODAVÍA
```

### Paso 2: Limpiar la Base de Datos

Ejecuta en la terminal (desde `/home/john/Escritorio/crm-fabrica`):

```bash
# Reemplaza FECHA por la fecha que quieras limpiar (formato: YYYY-MM-DD)
echo "from api.models import CargueResumen, CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6, Pedido
fecha = '2025-06-28'  # ⬅️ CAMBIA ESTA FECHA
CargueResumen.objects.filter(fecha=fecha).delete()
CargueID1.objects.filter(fecha=fecha).delete()
CargueID2.objects.filter(fecha=fecha).delete()
CargueID3.objects.filter(fecha=fecha).delete()
CargueID4.objects.filter(fecha=fecha).delete()
CargueID5.objects.filter(fecha=fecha).delete()
CargueID6.objects.filter(fecha=fecha).delete()
Pedido.objects.filter(fecha_entrega=fecha).delete()
print('✅ Datos eliminados para:', fecha)" | python3 manage.py shell
```

### Paso 3: Recargar la página

Ahora sí recarga con **Ctrl+Shift+R** (forzar recarga sin cache).

El botón debería estar en estado **SUGERIDO**.

---

## 🚀 Script Rápido (Todo en uno)

### Comando para limpiar una fecha específica:

```bash
# Desde /home/john/Escritorio/crm-fabrica
python3 manage.py shell -c "
from api.models import CargueResumen, CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6, Pedido

fecha = '2025-06-28'  # ⬅️ CAMBIA ESTA FECHA

print(f'🧹 Limpiando datos del {fecha}...')

# Eliminar estado del botón
CargueResumen.objects.filter(fecha=fecha).delete()
print('✅ CargueResumen limpio')

# Eliminar datos de cargue
for modelo in [CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6]:
    modelo.objects.filter(fecha=fecha).delete()
print('✅ CargueID1-6 limpios')

# Eliminar pedidos
Pedido.objects.filter(fecha_entrega=fecha).delete()
print('✅ Pedidos limpios')

print(f'🎉 Listo! Ahora limpia localStorage en el navegador y recarga')
"
```

### En el navegador (después del comando anterior):
```javascript
localStorage.clear();
location.reload();
```

---

## 📋 Tablas Involucradas

| Tabla | Propósito |
|-------|-----------|
| `CargueResumen` | Guarda el estado del botón (SUGERIDO, DESPACHO, COMPLETADO) |
| `CargueID1-6` | Datos de productos cargados por cada vendedor |
| `Pedido` | Pedidos del día |

---

## ⚠️ Notas Importantes

1. **Siempre limpiar localStorage ANTES de la BD** para evitar que se re-sincronice.
2. El estado se sincroniza automáticamente del frontend a la BD cuando cambia.
3. Para pruebas de inventario, también verifica el stock inicial del producto antes de la prueba.

---

## 🔍 Verificar que está limpio

```bash
python3 manage.py shell -c "
from api.models import CargueResumen, CargueID1

fecha = '2025-06-28'  # ⬅️ CAMBIA ESTA FECHA

resumen = CargueResumen.objects.filter(fecha=fecha).count()
cargue = CargueID1.objects.filter(fecha=fecha).count()

print(f'CargueResumen: {resumen} registros')
print(f'CargueID1: {cargue} registros')

if resumen == 0 and cargue == 0:
    print('✅ Todo limpio!')
else:
    print('⚠️ Todavía hay registros')
"
```
