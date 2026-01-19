# 🔧 SOLUCIÓN DE ERRORES - REPORTES

## ❌ PROBLEMAS IDENTIFICADOS

### **1. Dashboard Ejecutivo - "Error al cargar datos"**
**Causa:** No hay datos de VentaRuta en ese período O fechas mal formateadas

**Solución:**
1. Asegúrate de tener datos en `VentaRuta` 
2. Usa fechas del formato: `YYYY-MM-DD` (ej: `2026-01-18`)
3. Prueba con un rango amplio (última semana)

**SQL Para verificar datos:**
```sql
SELECT COUNT(*) FROM api_ventaruta WHERE DATE(fecha) >= '2026-01-10';
```

**Si no hay datos:** Crea ventas desde `Otros > Venta Ruta` en el frontend

---

### **2. Pedidos por Ruta - "Error al consultar los datos"**
**Causa:** Modelo `Pedido` no existe en `api/models.py`

**Opciones:**
- **A) Usar VentaRuta** (RECOMENDADO para piloto)
- **B) Crear modelo Pedido** (para producción)

**Opción A - RÁPIDA (usar VentaRuta):**
Modifica `api/views.py` línea ~5462:

```python
@api_view(['GET'])
def reportes_pedidos_ruta(request):
    try:
        fecha_inicio = request.GET.get('fecha_inicio')
        fecha_fin = request.GET.get('fecha_fin')
        vendedor_id = request.GET.get('vendedor')
        estado_filtro = request.GET.get('estado')
        
        # Usar VentaRuta en lugar de Pedido
        pedidos = VentaRuta.objects.filter(
            fecha__date__gte=fecha_inicio,
            fecha__date__lte=fecha_fin
        ).select_related('vendedor', 'cliente')
        
        if vendedor_id:
            pedidos = pedidos.filter(vendedor__id_vendedor__icontains=vendedor_id)
        
        resultado = []
        for p in pedidos:
            resultado.append({
                'id': p.id,
                'vendedor_nombre': p.vendedor.nombre if p.vendedor else 'Sin vendedor',
                'ruta': 'Ruta Principal',  #  Ajusta según tu lógica
                'cliente_nombre': p.cliente.nombre if p.cliente else 'Sin cliente',
                'fecha': p.fecha.isoformat(),
                'total': float(p.total) if hasattr(p, 'total') else 0,
                'estado': 'completada'  # VentaRuta no tiene estado
            })
        
        return Response({
            'pedidos': resultado,
            'total': len(resultado),
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin
        })
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)
```

---

### **3. Análisis de Productos - "Error al consultar datos"**
**Causa:** Similar a Dashboard - No hay datos o endpoint no responde

**Solución:**
1. Verifica que existe endpoint: `http://localhost:8000/api/reportes/analisis-productos/`
2. Prueba directo en navegador:
   ```
   http://localhost:8000/api/reportes/analisis-productos/?tipo=vendidos&fecha_inicio=2026-01-01&fecha_fin=2026-01-31
   ```
3. Si hay error 500, revisa consola backend

**Datos de prueba necesarios:**
- VentaRuta con `detalle_productos` (para ventas)
- VentaRuta con `productos_devueltos` (para devoluciones)
- VentaRuta con `productos_vencidos` (para vencidas)

---

## ✅ PROBANDO LOS REPORTES

### **Test 1: Dashboard Ejecutivo**
1. Ve a: `Otros > Reportes Avanzados`
2. Clic en: `📊 Dashboard Ejecutivo`
3. Selecciona:
   - Periodo: `Día`
   - Desde: `2026-01-01`
   - Hasta: Fecha de hoy
4. Clic `Consultar`

**Si funciona:** Verás 4 cards con métricas + 4 gráficos + tabla

**Si falla:**
- Abre consola del navegador (F12)
- Ve a pestaña "Network"
- Busca la petición a `/dashboard-ejecutivo/`
- Ve la respuesta (Preview/Response)
- Copia el error y revisa

---

### **Test 2: Pedidos por Ruta**
1. Clic en: `Pedidos por Ruta`
2. Selecciona fechas amplias
3. Deja vendedor vacío
4. Estado: `Todos`
5. Clic `Consultar`

**Si funciona:** Tabla con pedidos

**Si falla:** Aplica solución arriba (usar VentaRuta)

---

### **Test 3: Análisis de Productos**
1. Clic en: `Análisis de Productos`
2. Tab: `Más Vendidos`
3. Periodo: `Mes`
4. Fechas: Mes actual completo
5. Top: `10`
6. Orden: `Mayor a Menor`
7. Clic `Consultar`

**Si funciona:** Tabla con top 10 productos

**Si falla:** 
- Verifica que hay datos en VentaRuta con `detalle_productos`
- Revisa endpoint en navegador (URL arriba)

---

## 🔥 SOLUCIÓN RÁPIDA PARA PILOTO MAÑANA

Si no tienes tiempo de arreglar todo, **DESACTIVA** los reportes con error:

En `ReportesAvanzadosScreen.jsx`, comenta los cards problemáticos:

```javascript
{/* TEMPORALMENTE DESACTIVADO
<Col md={6} lg={4}>
    <div className="reporte-card" onClick={() => alert('En desarrollo')}>
        ...Pedidos por Ruta...
    </div>
</Col>
*/}
```

**Deja activos solo:**
1. ✅ Planeación (funciona)
2. ✅ Desempeño Vendedores (funciona)
3. ✅ Efectividad Vendedores (funciona)
4. ✅ Mis Ventas POS (funciona - depende de modelo Venta)

---

## 📊 CREAR DATOS DE PRUEBA

Para que funcionen los reportes, crea ventas desde el frontendend:

1. **Ir a:** `Otros > Venta Ruta`
2. **Crear una venta** con:
   - Vendedor
   - Cliente
   - Productos vendidos
   - Productos devueltos (opcional)
   - Productos vencidos (opcional)
3. **Guardar**
4. **Repetir 5-10 veces** con diferentes vendedores/productos
5. **Probar Dashboard** → Deberías ver datos

---

## 🚀 PARA PRODUCCIÓN (DESPUÉS DEL PILOTO)

1. Crear modelo `Pedido` adecuado
2. Migrar datos de VentaRuta a Pedido
3. Implementar estado de pedidos (pendiente, entregado, cancelado)
4. Agregar campo `ruta` a vendedores
5. Completar reportes restantes

---

**Archivo:** `.agent/SOLUCION_ERRORES_REPORTES.md`
**Fecha:** 18 Ene 2026
