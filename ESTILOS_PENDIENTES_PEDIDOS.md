# ESTILOS PENDIENTES PARA PEDIDOS

Este documento contiene todos los estilos personalizados de POS que deben replicarse en el módulo de Pedidos.

---

## 1. CATEGORÍAS - Carrusel Horizontal

### Archivos de referencia:
- `frontend/src/components/Pos/ProductList.css` (líneas 1-160)
- `frontend/src/components/Pos/ProductList.jsx` (sección de categorías)

### Estilos a replicar:

#### Container de categorías:
```css
.category-buttons {
  display: flex !important;
  flex-wrap: nowrap !important;
  gap: 10px;
  margin-bottom: 8px;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  padding-bottom: 4px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

/* Ocultar scrollbar */
.category-buttons::-webkit-scrollbar {
  height: 0px;
  display: none;
}

.category-buttons::-webkit-scrollbar-track {
  background: transparent;
}

.category-buttons::-webkit-scrollbar-thumb {
  background: transparent;
}
```

#### Botones de categoría:
```css
.category-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 85px;
  min-width: 85px !important;
  height: 58px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  padding: 3px;
  text-align: center;
  flex-shrink: 0 !important;
}

.category-button:hover {
  border-color: #007bff;
  background-color: #f8f9fa;
}

.category-button.active {
  border-color: #007bff;
  background-color: #e8f4ff;
}

.category-button .material-icons {
  font-size: 28px;
  margin-bottom: 2px;
  color: #6c757d;
}

.category-button.active .material-icons {
  color: #007bff;
}

.category-button span.category-name {
  font-size: 11px;
  font-weight: 500;
  color: #495057;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.category-button.active span.category-name {
  color: #007bff;
}
```

#### Estilos inline del contenedor:
```javascript
style={{
  overflow: 'visible',
  backgroundColor: '#fff',
  marginTop: '-10px',
  marginBottom: '8px',
  padding: '8px 8px 0.2px 8px'
}}
```

#### Funcionalidad de drag scroll:
- Implementar drag scroll horizontal para las categorías
- Ver referencia en `ProductList.jsx` funciones: `handleMouseDown`, `handleMouseLeave`, `handleMouseUp`, `handleMouseMove`

---

## 2. CATÁLOGO DE PRODUCTOS

### Archivos de referencia:
- `frontend/src/components/Pos/ProductCard.css`
- `frontend/src/components/Pos/ProductCard.jsx`
- `frontend/src/components/Pos/ProductList.css`

### Estilos del contenedor de productos:

```css
/* Contenedor con scroll y drag */
.products-container {
  maxHeight: 'calc(100vh - 270px)';
  overflowY: 'auto';
  overflowX: 'hidden';
  cursor: 'grab'; /* o 'grabbing' cuando está arrastrando */
  userSelect: 'none';
}
```

### Estilos de las tarjetas de producto:

```css
/* Card principal */
.product-card-item {
  border: 1px solid #e5e9f2;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.1s;
  max-width: 150px;
  margin: 0 auto;
}

/* Card body */
.card-body {
  padding: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* Imagen del producto */
.product-image {
  max-height: 45px;
  max-width: 100%;
  object-fit: contain;
  margin-bottom: 3px;
}

/* Icono por defecto */
.product-icon {
  font-size: 22px;
  margin-bottom: 3px;
}

/* Precio */
.product-price {
  font-size: 14px;
  color: #495057;
  font-weight: 700;
  margin-bottom: 2px;
}

/* Nombre del producto */
.product-name {
  font-size: 10.5px;
  color: #495057;
  font-weight: 500;
  line-height: 1.2;
}
```

### Efecto de clic (escala):
```javascript
// Estado
const [isClicked, setIsClicked] = useState(false);

// Handler
const handleClick = () => {
  setIsClicked(true);
  onClick(product);
  setTimeout(() => setIsClicked(false), 300);
};

// Style inline
style={{
  transform: isClicked ? 'scale(1.05)' : 'scale(1)'
}}
```

### Grid de productos:
```css
/* 4 columnas en desktop */
.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
```

---

## 3. SECCIÓN DEL CARRITO (Consumer Form + Cart)

### Archivos de referencia:
- `frontend/src/components/Pos/ConsumerForm.css`
- `frontend/src/components/Pos/ConsumerForm.jsx`
- `frontend/src/components/Pos/Cart.css`
- `frontend/src/components/Pos/Cart.jsx`

### A. CONSUMER FORM

#### Estilos del formulario:
```css
.consumer-form {
  background-color: #fff;
  padding: 15px;
  border-bottom: 1px solid #e9ecef;
  position: sticky;
  top: 0;
  z-index: 20;
}

.consumer-form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

/* Input de búsqueda de cliente */
.consumer-form-title-input {
  font-size: 12px;
  font-weight: bold;
  width: 370px;
  background-color: #ffffff;
  color: #6c757d;
  height: 28px;
  padding: 2px 8px;
}

.consumer-form-title-input:focus {
  box-shadow: none !important;
  border-color: #007bff !important;
  outline: 0 !important;
}

/* Botones de acción */
.consumer-form-actions button {
  background: none;
  border: 1px solid #ced4da;
  border-radius: 4px;
  color: #6c757d;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.consumer-form-actions button:hover {
  background-color: #f8f9fa;
}

/* Fila de campos */
.consumer-form-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.consumer-form-group {
  flex: 1;
}

.consumer-form-label {
  display: block;
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 4px;
}

/* Inputs y selects */
.consumer-form-control,
.consumer-form-select {
  width: 100%;
  padding: 6px 8px;
  font-size: 13px;
  border: 1px solid #ced4da;
  border-radius: 4px;
}
```

#### Sugerencias de clientes:
```css
.cliente-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  width: 370px;
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #ced4da;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.cliente-suggestion-item {
  padding: 3px 4px;
  cursor: pointer;
  background-color: #337AB7;
  border-bottom: 1px solid #3b77db;
  display: flex;
  flex-direction: column;
  color: white;
}

.cliente-name {
  font-weight: bold;
  font-size: 13px;
}

.cliente-id {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.85);
}
```

### B. CART (CARRITO)

#### Contenedor principal:
```css
.cart-container {
  display: grid;
  grid-template-rows: 1fr auto;
  height: 100%;
  min-height: 500px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
```

#### Body del carrito:
```css
.cart-body {
  padding: 10px 15px;
  min-height: 80px;
  max-height: 250px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.cart-body:has(.cart-item) {
  overflow-y: auto;
}

.cart-body:has(.empty-cart) {
  overflow-y: hidden;
}
```

#### Items del carrito:
```css
.cart-item {
  margin-bottom: 2px !important;
  padding-bottom: 2px !important;
  border-bottom: 1px solid #f0f0f0;
}

.cart-item:last-child {
  margin-bottom: 0 !important;
  border-bottom: none;
}

.cart-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1px !important;
}

.cart-item-name {
  display: flex;
  align-items: center;
  font-weight: 500;
  font-size: 12px;
}

.product-badge {
  background-color: #dc3545;
  color: white;
  font-size: 10px;
  font-weight: 500;
  padding: 3px 6px;
  border-radius: 3px;
}
```

#### Control de cantidad:
```css
.quantity-control {
  display: flex;
  align-items: center;
}

.qty-btn {
  background-color: #6c757d;
  border: 1px solid #6c757d;
  color: white;
  width: 32px !important;
  height: 25px !important;
  min-width: 32px !important;
  min-height: 25px !important;
  max-width: 32px !important;
  max-height: 25px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 11px !important;
  padding: 0 !important;
}

.qty-btn:first-child {
  border-radius: 4px 0 0 4px;
}

.qty-btn:last-child {
  border-radius: 0 4px 4px 0;
}

.qty-input {
  background-color: white;
  border: 1px solid #6c757d;
  border-left: none;
  border-right: none;
  font-size: 13px !important;
  font-weight: 600;
  width: 60px !important;
  height: 25px !important;
  min-height: 25px !important;
  max-height: 25px !important;
  text-align: center;
  padding: 0 4px !important;
}
```

#### Cálculo del item:
```css
.cart-item-calculation {
  font-size: 11px !important;
  color: #6c757d;
  font-weight: 500 !important;
  text-align: right;
  padding-right: 8px;
  margin-top: 1px !important;
  line-height: 1 !important;
}
```

#### Carrito vacío:
```css
.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 15px 0;
  color: #adb5bd;
  min-height: 80px;
}

.empty-cart i {
  font-size: 28px;
  margin-bottom: 6px;
}

.empty-cart p {
  margin: 0;
  font-size: 11px;
}
```

#### Footer del carrito:
```css
.cart-footer {
  padding: 15px;
  border-top: 1px solid #dee2e6;
  background-color: #fff;
  position: sticky;
  bottom: 0;
  z-index: 10;
}
```

#### Resumen (Imp, Desc, Subtotal):
```css
.cart-summary {
  margin-bottom: 15px;
}

.summary-row-horizontal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 2px;
  padding: 0px 8px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
}

.summary-label {
  color: #6c757d;
  font-weight: 500;
}

.summary-value-inline {
  font-weight: 600;
  color: #212529;
  font-size: 13px;
}
```

#### Campo de nota:
```css
.cart-note {
  margin-bottom: 15px;
}

.cart-note input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}
```

#### Botón de checkout:
```css
.checkout-button {
  width: 100%;
  padding: 12px;
  background-color: #ffc600 !important;
  color: #002149 !important;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.checkout-button:hover {
  background-color: #002149 !important;
  color: white !important;
}
```

---

## 4. ESTILOS GLOBALES DE INPUTS (POS)

### Focus y hover de inputs:
```css
/* Sobrescribir estilos de Bootstrap para inputs en POS */
.pos-screen input:focus,
.pos-screen select:focus,
.pos-screen textarea:focus,
.pos-screen .form-control:focus,
.pos-screen input.form-control:focus {
  border-color: #007bff !important;
  border-width: 0.5px !important;
  box-shadow: none !important;
}

.pos-screen input:hover,
.pos-screen select:hover,
.pos-screen .form-control:hover {
  border-color: #007bff !important;
  border-width: 0.5px !important;
}
```

---

## 5. FUNCIONALIDADES ADICIONALES

### Drag scroll en carrito:
- Implementar drag scroll vertical en el cart-body
- Ver referencia en `Cart.jsx`: funciones `handleMouseDown`, `handleMouseLeave`, `handleMouseUp`, `handleMouseMove`
- Agregar `cursor: 'grab'` cuando hay items

### Loading inicial:
- Mostrar spinner mientras cargan los productos
- Ver referencia en `ProductList.jsx`: estado `isInitialLoading`

---

## 6. CONTENEDOR STICKY DEL CARRITO

### En PosScreen.jsx:
```javascript
<div
  className="card-bg mb-3 p-0"
  style={{
    position: 'sticky',
    top: '70px',
    alignSelf: 'flex-start',
    overflow: 'visible'
  }}
>
  <ConsumerForm {...props} />
  <Cart {...props} />
</div>
```

---

## NOTAS IMPORTANTES:

1. **Colores del tema POS**: 
   - Primario: #007bff (azul)
   - Amarillo: #ffc600
   - Azul oscuro: #002149
   - Rojo badge: #dc3545

2. **Responsive**: Todos los estilos deben ser responsive con breakpoint en 768px

3. **Transiciones**: Usar `transition: all 0.2s` para efectos suaves

4. **User select**: Desactivar selección de texto en elementos con drag (`user-select: none`)

5. **Z-index**: 
   - Consumer form sticky: 20
   - Cart footer sticky: 10
   - Modales: 10000+

6. **Scroll behavior**: `scroll-behavior: smooth` para scroll suave

---

## ARCHIVOS A MODIFICAR EN PEDIDOS:

1. `frontend/src/components/Pedidos/ProductList.jsx`
2. `frontend/src/components/Pedidos/ProductList.css`
3. `frontend/src/components/Pedidos/ProductCard.jsx`
4. `frontend/src/components/Pedidos/ProductCard.css`
5. `frontend/src/components/Pedidos/ConsumerForm.jsx`
6. `frontend/src/components/Pedidos/ConsumerForm.css`
7. `frontend/src/components/Pedidos/Cart.jsx`
8. `frontend/src/components/Pedidos/Cart.css`
9. `frontend/src/pages/PedidosScreen.jsx`

---

**Fecha de creación**: 2025-11-08
**Módulo origen**: POS
**Módulo destino**: PEDIDOS
**Estado**: PENDIENTE DE IMPLEMENTACIÓN
