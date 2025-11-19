# Instrucciones para Ejecutar Migración de Stock

## ✅ FASE 1: Limpieza de Huérfanos (COMPLETADA)
```bash
python3 limpiar_huerfanos.py
```
**Resultado:** 7 productos huérfanos eliminados ✅

---

## 🚀 FASE 2: Crear Tabla api_stock

### Paso 1: Crear migraciones
```bash
python3 manage.py makemigrations
```

### Paso 2: Aplicar migraciones
```bash
python3 manage.py migrate
```

### Paso 3: Migrar datos existentes
```bash
python3 migrar_stock.py
```

---

## 📊 FASE 3: Verificar en Django Admin

1. Iniciar servidor:
```bash
python3 manage.py runserver
```

2. Ir a: http://localhost:8000/admin/

3. Verificar que existe la sección "Stocks" con todos los productos

---

## 🔧 FASE 4: Actualizar Frontend (Siguiente paso)

Una vez verificado que la tabla `api_stock` funciona correctamente, actualizar:

1. **Kardex** - Usar `/api/stock/` en lugar de `stock_total`
2. **Planeación** - Usar `/api/stock/` en lugar de `stock_total`
3. **POS** - Mostrar stock desde `/api/stock/`
4. **Pedidos** - Mostrar stock desde `/api/stock/`

---

## 📝 Archivos Modificados

### Backend:
- ✅ `api/models.py` - Agregado modelo Stock
- ✅ `api/serializers.py` - Agregado StockSerializer
- ✅ `api/views.py` - Agregado StockViewSet
- ✅ `api/urls.py` - Agregado endpoint /api/stock/
- ✅ `api/admin.py` - Agregado StockAdmin

### Scripts:
- ✅ `limpiar_huerfanos.py` - Limpieza de productos huérfanos
- ✅ `migrar_stock.py` - Migración de datos a api_stock

---

## 🧪 Testing

### Verificar endpoint:
```bash
curl http://localhost:8000/api/stock/
```

### Verificar stock de un producto específico:
```bash
curl http://localhost:8000/api/stock/?producto_id=1
```

### Verificar productos con stock_actual:
```bash
curl http://localhost:8000/api/productos/
```

---

## ⚠️ Notas Importantes

1. **Backup:** Hacer backup de la BD antes de ejecutar migraciones
2. **Orden:** Ejecutar los pasos en orden
3. **Verificación:** Verificar cada paso antes de continuar
4. **Frontend:** NO actualizar frontend hasta verificar que backend funciona

---

## 📞 Siguiente Paso

Una vez completadas las FASES 2 y 3, confirmar para continuar con actualización del frontend.
