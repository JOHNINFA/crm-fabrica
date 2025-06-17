/**
 * Script para optimizar el código eliminando funciones innecesarias
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

  // Eliminar la función handleAgregarProducto
  let modifiedData = data.replace(
    /const handleAgregarProducto = async \(nuevoProducto\) => \{[\s\S]*?setTimeout\(\(\) => setMensaje\(\{ texto: '', tipo: '' \}\), 3000\);\s*\}\s*\};/g,
    '// Función handleAgregarProducto eliminada para optimizar el código'
  );

  // Eliminar importación de ModalAgregarProducto
  modifiedData = modifiedData.replace(
    /import ModalAgregarProducto from '.\/ModalAgregarProducto';/g,
    '// import ModalAgregarProducto from \'./ModalAgregarProducto\'; // Eliminado para optimizar'
  );

  // Eliminar el componente ModalAgregarProducto del render
  modifiedData = modifiedData.replace(
    /<ModalAgregarProducto\s+show={showModalAgregar}\s+onHide={\(\) => setShowModalAgregar\(false\)}\s+onAgregar={handleAgregarProducto}\s+\/>/g,
    '// Modal para agregar producto eliminado'
  );

  // Eliminar la referencia a sincronizarConBackend y isSyncing del contexto
  modifiedData = modifiedData.replace(
    /const \{ actualizarExistencias, agregarMovimientos, sincronizarConBackend, isSyncing \} = useProductos\(\);/g,
    'const { actualizarExistencias, agregarMovimientos } = useProductos();'
  );

  // Eliminar el estado showModalAgregar
  modifiedData = modifiedData.replace(
    /const \[showModalAgregar, setShowModalAgregar\] = useState\(false\); \/\/ Modal para agregar producto/g,
    '// Estado para modal de agregar producto eliminado'
  );

  // Guardar el archivo modificado
  fs.writeFile(filePath, modifiedData, 'utf8', (err) => {
    if (err) {
      console.error('Error al escribir el archivo:', err);
      return;
    }
    console.log('Código optimizado correctamente');
  });
});