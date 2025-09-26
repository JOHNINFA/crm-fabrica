// 🔍 DEBUG ESPECÍFICO PARA RESPONSABLE DAIMON
// Ejecutar en la consola del navegador para diagnosticar el problema

const debugResponsableDaimon = {
  
  // Verificar todas las fuentes de datos del responsable
  verificarTodasLasFuentes: () => {
    console.log('🔍 ===== DEBUG RESPONSABLE DAIMON =====');
    
    const ids = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];
    
    ids.forEach(id => {
      console.log(`\n📋 VERIFICANDO ${id}:`);
      
      // 1. responsableStorage (si está disponible)
      let responsableRS = null;
      try {
        if (typeof responsableStorage !== 'undefined') {
          responsableRS = responsableStorage.get(id);
        }
      } catch (error) {
        console.log(`   ❌ responsableStorage no disponible`);
      }
      
      // 2. localStorage directo
      const responsableLS = localStorage.getItem(`responsable_${id}`);
      
      // 3. localStorage alternativo
      const responsableAlt = localStorage.getItem(`cargue_responsable_${id}`);
      
      // 4. responsables_cargue
      let responsableFromCargue = null;
      const responsablesCargue = localStorage.getItem('responsables_cargue');
      if (responsablesCargue) {
        try {
          const parsed = JSON.parse(responsablesCargue);
          responsableFromCargue = parsed[id];
        } catch (error) {
          console.log(`   ❌ Error parsing responsables_cargue`);
        }
      }
      
      // Mostrar resultados
      console.log(`   1. responsableStorage.get("${id}"): "${responsableRS}"`);
      console.log(`   2. localStorage["responsable_${id}"]: "${responsableLS}"`);
      console.log(`   3. localStorage["cargue_responsable_${id}"]: "${responsableAlt}"`);
      console.log(`   4. responsables_cargue["${id}"]: "${responsableFromCargue}"`);
      
      // Determinar cuál debería usarse
      if (responsableRS && responsableRS !== 'RESPONSABLE') {
        console.log(`   ✅ MEJOR OPCIÓN: responsableStorage = "${responsableRS}"`);
      } else if (responsableLS && responsableLS !== 'RESPONSABLE') {
        console.log(`   ✅ MEJOR OPCIÓN: localStorage directo = "${responsableLS}"`);
      } else if (responsableAlt && responsableAlt !== 'RESPONSABLE') {
        console.log(`   ✅ MEJOR OPCIÓN: localStorage alternativo = "${responsableAlt}"`);
      } else if (responsableFromCargue && responsableFromCargue !== 'RESPONSABLE') {
        console.log(`   ✅ MEJOR OPCIÓN: responsables_cargue = "${responsableFromCargue}"`);
      } else {
        console.log(`   ❌ NO HAY RESPONSABLE VÁLIDO - usaría "RESPONSABLE"`);
      }
    });
  },
  
  // Verificar específicamente ID1 que debería tener DAIMON
  verificarID1: () => {
    console.log('\n🎯 ===== VERIFICACIÓN ESPECÍFICA ID1 =====');
    
    // Verificar qué se ve en la pantalla
    const elementoResponsable = document.querySelector('.responsable-title');
    if (elementoResponsable) {
      console.log(`👁️ Responsable visible en pantalla: "${elementoResponsable.textContent}"`);
    } else {
      console.log(`❌ No se encontró elemento .responsable-title en la pantalla`);
    }
    
    // Verificar todas las fuentes para ID1
    console.log('\n📋 FUENTES DE DATOS PARA ID1:');
    
    // responsableStorage
    let responsableRS = null;
    try {
      if (typeof responsableStorage !== 'undefined') {
        responsableRS = responsableStorage.get('ID1');
        console.log(`   responsableStorage.get("ID1"): "${responsableRS}"`);
      } else {
        console.log(`   responsableStorage: No disponible`);
      }
    } catch (error) {
      console.log(`   responsableStorage: Error - ${error.message}`);
    }
    
    // localStorage directo
    const responsableLS = localStorage.getItem('responsable_ID1');
    console.log(`   localStorage["responsable_ID1"]: "${responsableLS}"`);
    
    // localStorage alternativo
    const responsableAlt = localStorage.getItem('cargue_responsable_ID1');
    console.log(`   localStorage["cargue_responsable_ID1"]: "${responsableAlt}"`);
    
    // responsables_cargue
    const responsablesCargue = localStorage.getItem('responsables_cargue');
    if (responsablesCargue) {
      try {
        const parsed = JSON.parse(responsablesCargue);
        console.log(`   responsables_cargue["ID1"]: "${parsed.ID1}"`);
        console.log(`   responsables_cargue completo:`, parsed);
      } catch (error) {
        console.log(`   responsables_cargue: Error parsing - ${error.message}`);
      }
    } else {
      console.log(`   responsables_cargue: No existe en localStorage`);
    }
    
    // Verificar si DAIMON está en algún lado
    console.log('\n🔍 BUSCANDO "DAIMON" EN LOCALSTORAGE:');
    let encontradoDaimon = false;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      
      if (value && value.includes('DAIMON')) {
        console.log(`   ✅ Encontrado en "${key}": "${value}"`);
        encontradoDaimon = true;
      }
    }
    
    if (!encontradoDaimon) {
      console.log(`   ❌ "DAIMON" no encontrado en ninguna clave de localStorage`);
    }
  },
  
  // Forzar guardar DAIMON en todas las ubicaciones
  forzarGuardarDaimon: () => {
    console.log('\n🚀 ===== FORZANDO GUARDADO DE DAIMON =====');
    
    // Guardar en todas las ubicaciones posibles
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
      console.log('⚠️ Error parsing responsables_cargue existente, creando nuevo');
    }
    
    responsablesCargue.ID1 = 'DAIMON';
    localStorage.setItem('responsables_cargue', JSON.stringify(responsablesCargue));
    
    // Usar responsableStorage si está disponible
    try {
      if (typeof responsableStorage !== 'undefined') {
        responsableStorage.set('ID1', 'DAIMON');
        console.log('✅ Guardado con responsableStorage.set()');
      }
    } catch (error) {
      console.log('⚠️ No se pudo usar responsableStorage:', error.message);
    }
    
    console.log('✅ DAIMON guardado en todas las ubicaciones');
    console.log('🔄 Ahora ejecuta debugResponsableDaimon.verificarID1() para verificar');
  },
  
  // Ejecutar todo el diagnóstico
  ejecutarTodo: () => {
    debugResponsableDaimon.verificarTodasLasFuentes();
    debugResponsableDaimon.verificarID1();
    
    console.log('\n💡 ===== RECOMENDACIONES =====');
    console.log('1. Si no ves "DAIMON" en ninguna fuente, ejecuta: debugResponsableDaimon.forzarGuardarDaimon()');
    console.log('2. Después de forzar, verifica con: debugResponsableDaimon.verificarID1()');
    console.log('3. Luego intenta el proceso de FINALIZAR nuevamente');
  }
};

// Hacer disponible globalmente
window.debugResponsableDaimon = debugResponsableDaimon;

console.log(`
🔍 ===== DEBUG RESPONSABLE DAIMON CARGADO =====

Funciones disponibles:
• debugResponsableDaimon.ejecutarTodo()           - Diagnóstico completo
• debugResponsableDaimon.verificarID1()           - Verificar solo ID1
• debugResponsableDaimon.forzarGuardarDaimon()    - Forzar guardado de DAIMON
• debugResponsableDaimon.verificarTodasLasFuentes() - Ver todas las fuentes

Ejecuta primero:
debugResponsableDaimon.ejecutarTodo()
`);