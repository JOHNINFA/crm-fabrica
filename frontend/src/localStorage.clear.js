// Script para limpiar localStorage y reiniciar la aplicación
// Ejecutar en la consola del navegador si es necesario

// Guardar una copia de seguridad antes de limpiar
const backup = {
  productos: localStorage.getItem('productos'),
  movimientos: localStorage.getItem('movimientos'),
  productosRegistrados: localStorage.getItem('productosRegistrados'),
  lotesRegistrados: localStorage.getItem('lotesRegistrados')
};

console.log('Backup creado:', backup);

// Limpiar localStorage
localStorage.removeItem('productos');
localStorage.removeItem('movimientos');
localStorage.removeItem('productosRegistrados');
localStorage.removeItem('lotesRegistrados');

console.log('localStorage limpiado. Recarga la página para reiniciar la aplicación.');