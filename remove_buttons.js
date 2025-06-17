/**
 * Script para eliminar los botones de la sección de producción
 */
const fs = require('fs');
const path = require('path');

// Ruta al archivo
const filePath = path.join(__dirname, 'frontend', 'src', 'components', 'inventario', 'InventarioProduccion.jsx');

// Leer el archivo
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error al leer el archivo:', err);
    return;
  }

  // Buscar y reemplazar los botones
  let modifiedData = data;

  // Reemplazar el botón "Agregar Producto"
  modifiedData = modifiedData.replace(
    /<Button\s+variant="primary"\s+onClick={\(\)\s*=>\s*setShowModalAgregar\(true\)}\s+className="mb-2\s+mb-md-0\s+me-md-2"\s*>\s*<i\s+className="bi\s+bi-plus-lg"><\/i>\s*Agregar\s+Producto\s*<\/Button>/g,
    '');

  // Reemplazar el botón "Sincronizar con POS"
  modifiedData = modifiedData.replace(
    /<Button\s+variant="outline-primary"\s+onClick={\(\)\s*=>\s*{\s*\/\/\s*Importar\s+dinámicamente[^}]*}\s*}\s+className="me-2"\s*>\s*<i\s+className="bi\s+bi-sync"><\/i>\s*Sincronizar\s+con\s+POS\s*<\/Button>/gs,
    '');

  // Reemplazar el botón "Sincronizar con Servidor"
  modifiedData = modifiedData.replace(
    /<Button\s+variant="outline-info"\s+onClick={async\s*\(\)\s*=>\s*{[^}]*}\s*}\s+disabled={isSyncing}\s*>\s*<i\s+className="bi\s+bi-cloud-arrow-up-down"><\/i>\s*{isSyncing\s*\?\s*'Sincronizando\.\.\.'\s*:\s*'Sincronizar\s+con\s+Servidor'}\s*<\/Button>/gs,
    '');

  // Guardar el archivo modificado
  fs.writeFile(filePath, modifiedData, 'utf8', (err) => {
    if (err) {
      console.error('Error al escribir el archivo:', err);
      return;
    }
    console.log('Botones eliminados correctamente');
  });
});