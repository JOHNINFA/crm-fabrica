// Script para detener la sincronización y limpiar la cola
// Ejecutar en la consola del navegador

// Limpiar la cola de sincronización
localStorage.removeItem('syncQueue');
localStorage.removeItem('movimientos');
localStorage.removeItem('movimientosSincronizados');

// Crear una bandera para evitar futuras sincronizaciones
localStorage.setItem('disableSyncMovements', 'true');

console.log('Sincronización de movimientos detenida y cola limpiada');
console.log('Recarga la página para aplicar los cambios');