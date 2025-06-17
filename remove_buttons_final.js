/**
 * Script para eliminar los botones restantes de la sección de producción
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

  // Eliminar los botones "Sincronizar con POS" y "Sincronizar con Servidor"
  let modifiedData = data.replace(
    /<Button\s+variant="outline-primary"\s+onClick={\(\)\s*=>\s*{\s*\/\/\s*Importar\s+dinámicamente[\s\S]*?<\/Button>/gm,
    ''
  );

  modifiedData = modifiedData.replace(
    /<Button\s+variant="outline-info"\s+onClick={async[\s\S]*?<\/Button>/gm,
    ''
  );

  // Guardar el archivo modificado
  fs.writeFile(filePath, modifiedData, 'utf8', (err) => {
    if (err) {
      console.error('Error al escribir el archivo:', err);
      return;
    }
    console.log('Botones eliminados correctamente');
  });
});