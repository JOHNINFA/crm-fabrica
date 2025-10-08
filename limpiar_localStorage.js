// Script para limpiar localStorage relacionado con ventas
// Ejecutar en la consola del navegador

console.log('🧹 Limpiando localStorage...');

// Limpiar datos de ventas
localStorage.removeItem('ventas_pos');
localStorage.removeItem('ventas_anuladas');

// Limpiar otros datos relacionados si existen
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('venta') || key.includes('pos') || key.includes('caja'))) {
        keysToRemove.push(key);
    }
}

keysToRemove.forEach(key => {
    console.log('🗑️ Eliminando:', key);
    localStorage.removeItem(key);
});

console.log('✅ localStorage limpiado');
console.log('🔄 Recarga la página para empezar limpio');