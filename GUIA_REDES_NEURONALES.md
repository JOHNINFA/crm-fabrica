# 🧠 REDES NEURONALES - GUÍA RÁPIDA

## ✅ IMPLEMENTACIÓN COMPLETADA

### **Cambios realizados:**

1. ✅ **Código simplificado** - Solo redes neuronales, sin algoritmo simple
2. ✅ **Endpoint creado** - `/api/planeacion/prediccion_ia/`
3. ✅ **Frontend actualizado** - Llama correctamente al endpoint
4. ✅ **TensorFlow instalado** - Listo para usar

---

## 🚀 CÓMO USAR

### **1. Entrenar modelos (una vez):**
```bash
cd /home/john/Escritorio/crm-fabrica
python3 manage.py entrenar_ia
```

### **2. Ver predicciones en Planeación:**
- Abrí Planeación
- Recargá la página (F5)
- Click en "🧠 Aplicar IA" o "🔄 Sincronizar"
- Abrí consola (F12) para ver logs

### **3. Qué verás:**
```
🧠 Consultando predicciones de IA (Redes Neuronales)...
✅ IA: 1 productos con predicciones de Red Neuronal
🧠 1 productos usando Red Neuronal:
   - AREPA TIPO OBLEA 500Gr: 12100 (IA (Red Neuronal))
```

---

## 📊 ESTADO ACTUAL

### **Modelos entrenados:**
- ✅ AREPA TIPO OBLEA 500Gr (MAE: 874.43)

### **Productos sin modelo:**
- ⚠️ 17 productos (necesitan 10+ registros históricos)
- Estos NO aparecerán en la tabla hasta que tengan datos

---

## 🔄 RE-ENTRENAR (cuando tengas más datos)

```bash
# Borrar modelos viejos
rm -rf api/ml_models/*

# Re-entrenar con datos nuevos
python3 manage.py entrenar_ia
```

---

## 🎯 VENTAJAS

- ✅ Código más limpio
- ✅ Sin confusiones entre algoritmos
- ✅ Solo productos con modelo entrenado
- ✅ Predicciones más precisas

---

## ⚠️ IMPORTANTE

**Solo verás predicciones para productos con modelo entrenado.**

Si un producto no aparece en la columna "IA":
1. No tiene 10+ registros históricos
2. Necesita más datos para entrenar
3. Aparecerá cuando re-entrenes con más datos

---

## 📝 PRÓXIMOS PASOS

1. Recargá Planeación (F5)
2. Click "Sincronizar"
3. Verifica consola (F12)
4. Deberías ver predicción para AREPA TIPO OBLEA 500Gr
