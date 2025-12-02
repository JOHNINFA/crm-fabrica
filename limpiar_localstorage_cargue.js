// Script para limpiar localStorage relacionado con Cargue
// Ejecutar en la consola del navegador (F12 → Console)

console.log('🧹 Limpiando localStorage de Cargue...');

// Obtener todas las claves
const keys = Object.keys(localStorage);
let count = 0;

// Filtrar y eliminar claves relacionadas con cargue
keys.forEach(key => {
    if (
        key.includes('cargue_') ||
        key.includes('estado_boton_') ||
        key.includes('estado_despacho_') ||
        key.includes('conceptos_pagos_') ||
        key.includes('base_caja_') ||
        key.includes('cumplimiento_') ||
        key.includes('lotes_') ||
        key.includes('responsable_') ||
        key.includes('produccion_')
    ) {
        localStorage.removeItem(key);
        console.log(`🗑️ Eliminado: ${key}`);
        count++;
    }
});

console.log(`✅ Limpieza completada: ${count} claves eliminadas`);
console.log('🔄 Recarga la página (F5) para ver los cambios');
