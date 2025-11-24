// Script para limpiar localStorage del navegador
// Ejecutar en la consola del navegador (F12)

console.log('🧹 Limpiando localStorage del módulo Cargue...');

let count = 0;
Object.keys(localStorage).forEach(key => {
    if (key.startsWith('cargue_') || key.startsWith('estado_boton_')) {
        localStorage.removeItem(key);
        count++;
        console.log(`  ✅ Eliminado: ${key}`);
    }
});

console.log(`✅ Se eliminaron ${count} registros de localStorage`);
console.log('🔄 Recarga la página (F5) para empezar de nuevo');
