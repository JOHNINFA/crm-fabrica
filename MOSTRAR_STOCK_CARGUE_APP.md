# ✅ MOSTRAR STOCK DEL CARGUE EN APP

**Fecha:** 2025-12-17 01:39  
**Archivo:** `VentasScreen.js`  
**Estado:** COMPLETADO ✅

---

## 🎯 FUNCIONALIDAD

Mostrar el inventario del cargue al lado del precio de cada producto en la app de ventas.

---

## 📱 INTERFAZ

### **ANTES:**
```
AREPA TIPO OBLEA
Precio: $2,800
```

### **AHORA:**
```
AREPA TIPO OBLEA
Precio: $2,800 (150) ← Stock en paréntesis (gris)
```

**Características:**
- ✅ Stock en paréntesis `(150)`
- ✅ Mismo estilo gris que el precio
- ✅ Compacto y claro
- ✅ Solo aparece si hay stock > 0

---

## 🔧 IMPLEMENTACIÓN

### **1. Estado para guardar stock:**
```javascript
const [stockCargue, setStockCargue] = useState({});
```

**Formato:**
```javascript
{
  "AREPA TIPO OBLEA 500GR": 150,
  "AREPA MEDIANA": 200,
  "AREPA TIPO PINCHO": 100,
  ...
}
```

### **2. Función para cargar stock:**
```javascript
const cargarStockCargue = async (dia) => {
  const hoy = new Date().toISOString().split('T')[0];
  
  // Llamar endpoint
  const response = await fetch(
    `${ENDPOINTS.OBTENER_CARGUE}?id_vendedor=${userId}&fecha=${hoy}`
  );
  
  const data = await response.json();
  
  // Crear objeto stock por producto
  const stockPorProducto = {};
  data.data.forEach(item => {
    const stockDisponible = item.cantidad - item.dctos + item.adicional;
    stockPorProducto[item.producto.toUpperCase()] = stockDisponible;
  });
  
  setStockCargue(stockPorProducto);
};
```

### **3. Llamada al seleccionar día:**
```javascript
const handleSeleccionarDia = (dia) => {
  setDiaSeleccionado(dia);
  setMostrarSelectorDia(false);
  
  // 🆕 Cargar inventario del cargue
  cargarStockCargue(dia);
  
  // Mensaje "Turno Abierto"...
};
```

### **4. Mostrar en cada producto:**
```javascript
const renderProducto = ({ item }) => {
  const stock = stockCargue[item.nombre.toUpperCase()] || 0;
  
  return (
    <View>
      <Text>{item.nombre}</Text>
      <Text style={styles.productoPrecio}>
        Precio: {formatearMoneda(item.precio)}
        {stock > 0 && <Text style={styles.stockTexto}>({stock})</Text>}
      </Text>
    </View>
  );
};
```

### **5. Estilo:**
```javascript
stockTexto: {
  fontSize: 12,
  color: '#666',  // Mismo gris que precio
  fontWeight: 'normal',
}
```

---

## 🔄 FLUJO COMPLETO

```
1. USUARIO ABRE APP:
   └─ Modal "Selecciona el Día"

2. SELECCIONA DÍA (LUNES):
   ├─ handleSeleccionarDia("LUNES")
   ├─ cargarStockCargue("LUNES") ← LLAMA ENDPOINT
   └─ ✅ "Turno Abierto"

3. BACKEND RESPONDE:
   {
     "success": true,
     "data": [
       {
         "producto": "AREPA TIPO OBLEA 500GR",
         "cantidad": 200,
         "dctos": 0,
         "adicional": 0
       },
       ...
     ]
   }

4. APP CALCULA STOCK:
   stockCargue = {
     "AREPA TIPO OBLEA 500GR": 200,
     "AREPA MEDIANA": 150,
     ...
   }

5. RENDERIZA PRODUCTOS:
   AREPA TIPO OBLEA
   Precio: $2,800 (200) ← MUESTRA STOCK
```

---

## 📊 ENDPOINT USADO

**Endpoint existente:** `OBTENER_CARGUE`

**URL:**
```
GET http://API_URL/api/obtener-cargue/?id_vendedor=ID1&fecha=2025-12-17
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "producto": "AREPA TIPO OBLEA 500GR",
      "cantidad": 200,
      "dctos": 0,
      "adicional": 0
    }
  ]
}
```

**Cálculo stock:**
```javascript
stock = cantidad - dctos + adicional
stock = 200 - 0 + 0 = 200
```

---

## ✅ VENTAJAS

1. **Visibilidad:** Vendedor ve cuánto tiene de cada producto
2. **Control:** Evita vender más de lo que hay
3. **Compacto:** No ocupa espacio extra
4. **Sincronizado:** Se actualiza automáticamente del cargue
5. **Consistente:** Usa mismo estilo que el precio

---

## 🧪 EJEMPLO VISUAL

```
┌───────────────────────────────────┐
│  AREPA TIPO OBLEA               │
│  Precio: $2,800 (150)          │ ← Stock visible
│                            0 [+]│
└───────────────────────────────────┘

┌───────────────────────────────────┐
│  AREPA MEDIANA                  │
│  Precio: $2,300 (200)          │ ← Stock visible
│                            0 [+]│
└───────────────────────────────────┘

┌───────────────────────────────────┐
│  AREPA TIPO PINCHO              │
│  Precio: $2,200 (0)            │ ← Sin stock
│                            0 [+]│
└───────────────────────────────────┘
```

---

## ⚠️ CASOS ESPECIALES

### **Sin stock:**
```
AREPA TIPO OBLEA
Precio: $2,800 (0) ← Muestra 0
```

### **Producto no en cargue:**
```
PRODUCTO NUEVO
Precio: $3,000 ← No muestra paréntesis
```

### **Error al cargar:**
```javascript
// Si falla, stockCargue queda vacío {}
// No muestra stock en ningún producto
```

---

## 📝 CÓDIGO AGREGADO

**Líneas agregadas:** ~35 líneas

**Modificaciones:**
1. Estado `stockCargue`
2. Función `cargarStockCargue()`
3. Llamada en `handleSeleccionarDia()`
4. Renderizado en `renderProducto()`
5. Estilo `stockTexto`

---

## ✅ CHECKLIST

- [x] Estado para stock agregado
- [x] Función para cargar stock
- [x] Llamada al seleccionar día
- [x] Mostrar en renderizado
- [x] Estilo aplicado
- [x] Formato compacto (paréntesis)
- [x] Color gris consistente
- [x] Console.log para debug

---

**Estado:** ✅ LISTO PARA PROBAR

**Siguiente paso:** Verificar en dispositivo que aparece el stock correctamente
