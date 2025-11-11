# ✅ LISTA DE PRUEBAS - SISTEMA DE IMPRESIÓN

## 🔧 PRUEBAS BACKEND

### 1. Verificar Migración
```bash
python3 manage.py showmigrations api
```
**Resultado esperado:** Debe mostrar `[X] 0037_configuracionimpresion`

### 2. Probar API - Obtener Configuración Activa
```bash
curl http://localhost:8000/api/configuracion-impresion/activa/
```
**Resultado esperado:** JSON con configuración por defecto

### 3. Probar API - Crear Configuración
```bash
curl -X POST http://localhost:8000/api/configuracion-impresion/ \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_negocio": "FÁBRICA DE AREPAS",
    "nit_negocio": "123456789-0",
    "direccion_negocio": "Calle 123 #45-67",
    "telefono_negocio": "3001234567",
    "mensaje_agradecimiento": "¡Gracias por su compra!",
    "ancho_papel": "80mm",
    "mostrar_logo": true,
    "activo": true
  }'
```
**Resultado esperado:** JSON con la configuración creada

---

## 🎨 PRUEBAS FRONTEND

### 1. Verificar Ruta de Configuración
1. Iniciar servidor: `npm start`
2. Navegar a: `http://localhost:3000/configuracion/impresion`
3. **Resultado esperado:** Pantalla de configuración cargada

### 2. Crear Configuración
1. Ir a `/configuracion/impresion`
2. Llenar campos:
   - Nombre del Negocio: "FÁBRICA DE AREPAS"
   - NIT: "123456789-0"
   - Dirección: "Calle 123 #45-67"
   - Teléfono: "3001234567"
   - Mensaje: "¡Gracias por su compra!"
3. Click en "Guardar Configuración"
4. **Resultado esperado:** Mensaje "✅ Configuración guardada exitosamente"

### 3. Probar Impresión desde POS
1. Ir a `/pos`
2. Agregar productos al carrito
3. Click en "Procesar Pago"
4. Ingresar método de pago
5. Click en "Confirmar"
6. **Resultado esperado:** 
   - Mensaje de éxito
   - Botón "Imprimir Tirilla" visible
   - Botón "Cerrar" visible

7. Click en "Imprimir Tirilla"
8. **Resultado esperado:**
   - Modal de vista previa abierto
   - Ticket visible con todos los datos
   - Botones "Cerrar" e "Imprimir"

9. Click en "Imprimir"
10. **Resultado esperado:**
    - Diálogo de impresión del navegador
    - Vista previa del ticket

### 4. Probar Impresión desde Pedidos
1. Ir a `/pedidos`
2. Seleccionar día (ej: SABADO)
3. Seleccionar cliente
4. Click en "Crear Pedido"
5. Agregar productos
6. Click en "Procesar Pedido"
7. Llenar datos de entrega
8. Click en "Generar Pedido"
9. **Resultado esperado:**
   - Mensaje de éxito
   - Botón "Imprimir Tirilla" visible
   - Botón "Cerrar" visible

10. Click en "Imprimir Tirilla"
11. **Resultado esperado:**
    - Modal de vista previa abierto
    - Ticket visible con datos del pedido
    - Dirección y fecha de entrega visibles

---

## 🐛 PROBLEMAS COMUNES Y SOLUCIONES

### Problema 1: Error al cargar configuración
**Síntoma:** "Error al obtener configuración de impresión"
**Solución:** 
- Verificar que el backend esté corriendo
- Verificar que la migración se aplicó correctamente
- Revisar consola del navegador para más detalles

### Problema 2: Logo no se muestra
**Síntoma:** Logo no aparece en el ticket
**Solución:**
- Verificar que el archivo se subió correctamente
- Verificar que "Mostrar logo" está activado
- Verificar ruta del logo en la configuración
- Verificar que la carpeta `media/configuracion/` existe

### Problema 3: Botón "Imprimir Tirilla" no aparece
**Síntoma:** Después de crear venta/pedido no aparece el botón
**Solución:**
- Verificar que la venta/pedido se creó correctamente
- Revisar consola del navegador para errores
- Verificar que el componente TicketPreviewModal está importado

### Problema 4: Estilos de impresión incorrectos
**Síntoma:** El ticket se ve mal al imprimir
**Solución:**
- Verificar que TicketPrint.css está importado
- Verificar configuración de impresora (márgenes, tamaño de papel)
- Probar con diferentes navegadores

---

## 📝 CHECKLIST DE VERIFICACIÓN

### Backend
- [ ] Migración aplicada correctamente
- [ ] Modelo ConfiguracionImpresion creado
- [ ] Serializer funcionando
- [ ] ViewSet funcionando
- [ ] Endpoint `/api/configuracion-impresion/activa/` responde
- [ ] Endpoint `/api/configuracion-impresion/` permite POST

### Frontend - Configuración
- [ ] Ruta `/configuracion/impresion` funciona
- [ ] Formulario carga correctamente
- [ ] Campos se pueden editar
- [ ] Upload de logo funciona
- [ ] Guardar configuración funciona
- [ ] Configuración se carga al recargar página

### Frontend - POS
- [ ] PaymentModal importa TicketPreviewModal
- [ ] Después de crear venta aparece mensaje de éxito
- [ ] Botón "Imprimir Tirilla" visible
- [ ] Click en botón abre modal de vista previa
- [ ] Ticket muestra todos los datos correctamente
- [ ] Botón "Imprimir" ejecuta window.print()
- [ ] Botón "Cerrar" cierra modal y limpia carrito

### Frontend - Pedidos
- [ ] PaymentModal importa TicketPreviewModal
- [ ] Después de crear pedido aparece mensaje de éxito
- [ ] Botón "Imprimir Tirilla" visible
- [ ] Click en botón abre modal de vista previa
- [ ] Ticket muestra datos del pedido correctamente
- [ ] Dirección y fecha de entrega visibles
- [ ] Botón "Imprimir" ejecuta window.print()
- [ ] Botón "Cerrar" cierra modal y resetea formulario

### Estilos
- [ ] Ticket se ve bien en pantalla
- [ ] Ticket se ve bien en vista previa de impresión
- [ ] Logo se muestra correctamente (si está configurado)
- [ ] Fuente monoespaciada funciona
- [ ] Alineación de columnas correcta
- [ ] Divisores visibles
- [ ] Totales destacados

---

## 🎯 PRUEBA COMPLETA END-TO-END

### Escenario: Venta en POS con Impresión

1. **Configurar Sistema**
   - Ir a `/configuracion/impresion`
   - Configurar nombre del negocio: "FÁBRICA DE AREPAS"
   - Configurar NIT: "123456789-0"
   - Configurar dirección: "Calle 123 #45-67"
   - Configurar teléfono: "3001234567"
   - Subir logo (opcional)
   - Guardar

2. **Crear Venta**
   - Ir a `/pos`
   - Agregar "AREPA TIPO OBLEA 500Gr" (cantidad: 2)
   - Agregar "AREPA MEDIANA 330Gr" (cantidad: 1)
   - Click en "Procesar Pago"

3. **Procesar Pago**
   - Método de pago: EFECTIVO
   - Dinero entregado: 10000
   - Click en "Confirmar"

4. **Verificar Mensaje de Éxito**
   - ✅ Mensaje: "¡Venta procesada exitosamente!"
   - ✅ Número de factura visible
   - ✅ Total visible
   - ✅ Botón "Imprimir Tirilla" visible
   - ✅ Botón "Cerrar" visible

5. **Imprimir Ticket**
   - Click en "Imprimir Tirilla"
   - Verificar vista previa:
     - ✅ Logo visible (si se configuró)
     - ✅ Nombre del negocio
     - ✅ NIT
     - ✅ Dirección
     - ✅ Teléfono
     - ✅ Número de factura
     - ✅ Fecha y hora
     - ✅ Cliente: CONSUMIDOR FINAL
     - ✅ Vendedor
     - ✅ Lista de productos con cantidades y precios
     - ✅ Subtotal
     - ✅ Total
     - ✅ Método de pago
     - ✅ Efectivo recibido
     - ✅ Cambio
     - ✅ Mensaje de agradecimiento

6. **Imprimir**
   - Click en "Imprimir"
   - Seleccionar impresora
   - Verificar impresión física

7. **Cerrar**
   - Click en "Cerrar" en modal de vista previa
   - Click en "Cerrar" en mensaje de éxito
   - ✅ Carrito limpio
   - ✅ Modal cerrado
   - ✅ Listo para nueva venta

---

## 📊 RESULTADOS ESPERADOS

### ✅ TODO FUNCIONA SI:
1. La configuración se guarda correctamente
2. El botón "Imprimir Tirilla" aparece después de crear venta/pedido
3. El modal de vista previa se abre correctamente
4. El ticket muestra todos los datos
5. El botón "Imprimir" abre el diálogo de impresión
6. El ticket se imprime correctamente en papel térmico

### ❌ HAY PROBLEMAS SI:
1. Error al guardar configuración
2. Botón "Imprimir Tirilla" no aparece
3. Modal no se abre
4. Datos faltantes en el ticket
5. Estilos incorrectos
6. Error al imprimir

---

¡Sistema listo para pruebas! 🚀
