// 🚨 DETENER LOOP INFINITO DE RESPONSABLE
// Ejecutar INMEDIATAMENTE en la consola del navegador

const detenerLoopResponsable = {
  
  // Detener el loop inmediatamente
  detenerLoop: () => {
    console.log('🚨 DETENIENDO LOOP INFINITO...');
    
    // 1. Recargar la página para detener todos los useEffect
    console.log('🔄 Recargando página en 2 segundos...');
    setTimeout(() => {
      location.reload();
    }, 2000);
  },
  
  // Forzar guardado de DAIMON antes de recargar
  forzarDaimonYRecargar: () => {
    console.log('🚀 FORZANDO DAIMON Y RECARGANDO...');
    
    // Guardar DAIMON en todas las ubicaciones
    localStorage.setItem('responsable_ID1', 'DAIMON');
    localStorage.setItem('cargue_responsable_ID1', 'DAIMON');
    
    // Actualizar responsables_cargue
    let responsablesCargue = {};
    try {
      const existing = localStorage.getItem('responsables_cargue');
      if (existing) {
        responsablesCargue = JSON.parse(existing);
      }
    } catch (error) {
      console.log('⚠️ Creando nuevo responsables_cargue');
    }
    
    responsablesCargue.ID1 = 'DAIMON';
    localStorage.setItem('responsables_cargue', JSON.stringify(responsablesCargue));
    
    console.log('✅ DAIMON guardado en localStorage');
    console.log('🔄 Recargando página en 1 segundo...');
    
    setTimeout(() => {
      location.reload();
    }, 1000);
  },
  
  // Verificar estado actual antes de recargar
  verificarYDetener: () => {
    console.log('🔍 VERIFICANDO ESTADO ANTES DE DETENER LOOP...');
    
    // Verificar si DAIMON está visible
    const elementoResponsable = document.querySelector('.responsable-title');
    if (elementoResponsable) {
      console.log(`👁️ Responsable visible: "${elementoResponsable.textContent}"`);
      
      if (elementoResponsable.textContent === 'DAIMON') {
        console.log('✅ DAIMON está visible, solo necesitamos detener el loop');
        detenerLoopResponsable.detenerLoop();
      } else {
        console.log('❌ DAIMON no está visible, forzando guardado y recargando');
        detenerLoopResponsable.forzarDaimonYRecargar();
      }
    } else {
      console.log('❌ No se encontró elemento responsable, forzando guardado');
      detenerLoopResponsable.forzarDaimonYRecargar();
    }
  }
};

// Hacer disponible globalmente
window.detenerLoopResponsable = detenerLoopResponsable;

console.log(`
🚨 ===== DETENER LOOP INFINITO =====

¡HAY UN LOOP INFINITO DE LLAMADAS A LA API!

EJECUTA INMEDIATAMENTE:
detenerLoopResponsable.verificarYDetener()

Esto va a:
1. Verificar si DAIMON está visible
2. Guardar DAIMON en localStorage si es necesario
3. Recargar la página para detener el loop

¡EJECUTA AHORA MISMO!
`);

// Auto-ejecutar después de 3 segundos si no se hace manualmente
setTimeout(() => {
  console.log('🚨 AUTO-EJECUTANDO DETENCIÓN DE LOOP...');
  detenerLoopResponsable.verificarYDetener();
}, 3000);