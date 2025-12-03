// Script para limpiar localStorage del módulo Cargue en Chrome
// Ejecutar en la consola del navegador (F12 → Console)

console.log('🧹 Limpiando localStorage del módulo Cargue...');

// Obtener todas las claves
const keys = Object.keys(localStorage);
console.log(`📊 Total de claves en localStorage: ${keys.length}`);

// Filtrar claves relacionadas con cargue
const cargueKeys = keys.filter(key => 
  key.startsWith('cargue_') || 
  key.startsWith('estado_boton_') ||
  key.startsWith('produccion_congelada_') ||
  key.startsWith('responsables_') ||
  key.startsWith('sync_')
);

console.log(`🎯 Claves de cargue encontradas: ${cargueKeys.length}`);
cargueKeys.forEach(key => console.log(`  - ${key}`));

// Eliminar claves de cargue
cargueKeys.forEach(key => localStorage.removeItem(key));

console.log('✅ localStorage limpiado');
console.log('🔄 Recargando página...');

// Recargar página
setTimeout(() => location.reload(), 1000);
