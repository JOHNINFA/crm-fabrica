// Script para limpiar localStorage y reiniciar la sincronización
// Ejecutar en la consola del navegador

// Guardar una copia de seguridad de los datos importantes
const backup = {
  products: localStorage.getItem('products'),
  categories: localStorage.getItem('categories')
};

console.log('Backup creado:', backup);

// Limpiar datos de sincronización
localStorage.removeItem('syncQueue');
localStorage.removeItem('movimientos');
localStorage.removeItem('movimientosSincronizados');

// Limpiar bandera de desactivación
localStorage.removeItem('disableSyncMovements');

console.log('Datos de sincronización limpiados');

// Restaurar datos importantes
if (backup.products) localStorage.setItem('products', backup.products);
if (backup.categories) localStorage.setItem('categories', backup.categories);

console.log('Datos importantes restaurados');
console.log('Recarga la página para reiniciar la sincronización');