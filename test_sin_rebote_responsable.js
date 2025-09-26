/**
 * 🧪 SCRIPT DE PRUEBA - VERIFICAR QUE NO HAY REBOTE
 * 
 * Este script verifica que el responsable se muestre correctamente
 * desde el primer momento sin rebote visual.
 * 
 * INSTRUCCIONES:
 * 1. Abrir la aplicación en el navegador (localhost:3000/cargue/LUNES)
 * 2. Abrir DevTools (F12) → Console
 * 3. Pegar este código completo
 * 4. Ejecutar: testSinRebote.verificarSinRebote()
 */

const testSinRebote = {
  
  config: {
    vendedores: ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'],
    tiempoObservacion: 3000 // 3 segundos
  },

  // 1. Preparar datos en localStorage para evitar rebote
  async prepararLocalStorage() {
    console.log('\n🔧 PREPARANDO LOCALSTORAGE PARA EVITAR REBOTE');
    console.log('=' .repeat(50));
    
    const API_URL = 'http://localhost:8000/api';
    
    for (const idVendedor of this.config.vendedores) {
      try {
        // Obtener responsable actual de la BD
        const response = await fetch(`${API_URL}/vendedores/obtener_responsable/?id_vendedor=${idVendedor}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.responsable && data.responsable !== 'RESPONSABLE') {
            // Guardar en localStorage usando responsableStorage si está disponible
            if (typeof responsableStorage !== 'undefined') {
              responsableStorage.set(idVendedor, data.responsable);
              console.log(`💾 ${idVendedor}: "${data.responsable}" guardado en responsableStorage`);
            } else {
              localStorage.setItem(`responsable_${idVendedor}`, data.responsable);
              console.log(`💾 ${idVendedor}: "${data.responsable}" guardado en localStorage directo`);
            }
          } else {
            console.log(`⚠️ ${idVendedor}: Sin responsable válido en BD`);
          }
        }
        
        // Pequeña pausa entre requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error preparando ${idVendedor}:`, error);
      }
    }
    
    console.log('✅ LocalStorage preparado');
  },

  // 2. Observar cambios en el DOM para detectar rebotes
  observarRebotes() {
    console.log('\n👀 INICIANDO OBSERVACIÓN DE REBOTES');
    console.log('=' .repeat(50));
    
    const cambiosObservados = [];
    let observador = null;
    
    // Buscar elementos que contengan texto de responsables
    const elementosAObservar = [];
    
    // Buscar por texto "RESPONSABLE"
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          return node.textContent.includes('RESPONSABLE') ? 
            NodeFilter.FILTER_ACCEPT : 
            NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    let node;
    while (node = walker.nextNode()) {
      if (node.parentElement) {
        elementosAObservar.push(node.parentElement);
      }
    }
    
    console.log(`📍 Observando ${elementosAObservar.length} elementos que contienen "RESPONSABLE"`);
    
    // Configurar MutationObserver
    if (elementosAObservar.length > 0) {
      observador = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            const timestamp = Date.now();
            const elemento = mutation.target;
            const textoActual = elemento.textContent || elemento.innerText || '';
            
            if (textoActual.includes('RESPONSABLE') || 
                textoActual.match(/[A-Z]{2,}(?:\s+[A-Z]{2,})?/)) {
              cambiosObservados.push({
                timestamp,
                elemento: elemento.tagName + '.' + elemento.className,
                texto: textoActual.trim(),
                tipo: mutation.type
              });
              
              console.log(`🔄 CAMBIO DETECTADO: "${textoActual.trim()}" en ${elemento.tagName}`);
            }
          }
        });
      });
      
      // Observar cada elemento
      elementosAObservar.forEach(elemento => {
        observador.observe(elemento, {
          childList: true,
          subtree: true,
          characterData: true
        });
      });
    }
    
    return { observador, cambiosObservados };
  },

  // 3. Simular recarga de página y verificar rebote
  async verificarSinRebote() {
    console.log('\n🚀 INICIANDO VERIFICACIÓN SIN REBOTE');
    console.log('=' .repeat(60));
    
    try {
      // 1. Preparar localStorage
      await this.prepararLocalStorage();
      
      // 2. Iniciar observación
      const { observador, cambiosObservados } = this.observarRebotes();
      
      // 3. Simular recarga (recargar la página)
      console.log('\n🔄 RECARGANDO PÁGINA PARA PROBAR...');
      console.log('ℹ️ La página se recargará en 2 segundos...');
      
      setTimeout(() => {
        location.reload();
      }, 2000);
      
      // 4. Programar análisis post-recarga
      setTimeout(() => {
        this.analizarResultados(cambiosObservados);
        if (observador) observador.disconnect();
      }, this.config.tiempoObservacion);
      
    } catch (error) {
      console.error('❌ Error en verificación:', error);
    }
  },

  // 4. Analizar resultados después de la observación
  analizarResultados(cambiosObservados) {
    console.log('\n📊 ANÁLISIS DE RESULTADOS');
    console.log('=' .repeat(50));
    
    if (cambiosObservados.length === 0) {
      console.log('✅ ¡PERFECTO! No se detectaron cambios/rebotes');
      console.log('✅ Los responsables se mostraron correctamente desde el inicio');
      return;
    }
    
    console.log(`📝 Se detectaron ${cambiosObservados.length} cambios:`);
    
    // Agrupar cambios por elemento
    const cambiosPorElemento = {};
    cambiosObservados.forEach(cambio => {
      if (!cambiosPorElemento[cambio.elemento]) {
        cambiosPorElemento[cambio.elemento] = [];
      }
      cambiosPorElemento[cambio.elemento].push(cambio);
    });
    
    // Analizar cada elemento
    Object.entries(cambiosPorElemento).forEach(([elemento, cambios]) => {
      console.log(`\n🔍 Elemento: ${elemento}`);
      
      if (cambios.length === 1) {
        console.log('✅ Solo 1 cambio - Sin rebote');
      } else {
        console.log(`⚠️ ${cambios.length} cambios - Posible rebote:`);
        cambios.forEach((cambio, i) => {
          console.log(`   ${i + 1}. "${cambio.texto}" (${cambio.tipo})`);
        });
        
        // Verificar si hay patrón de rebote (RESPONSABLE → Nombre)
        const textos = cambios.map(c => c.texto);
        const hayRebote = textos.some(t => t.includes('RESPONSABLE')) && 
                         textos.some(t => !t.includes('RESPONSABLE') && t.length > 5);
        
        if (hayRebote) {
          console.log('❌ REBOTE DETECTADO: RESPONSABLE → Nombre real');
        } else {
          console.log('✅ Cambios normales, sin rebote');
        }
      }
    });
  },

  // 5. Verificar estado actual sin recargar
  verificarEstadoActual() {
    console.log('\n🔍 VERIFICANDO ESTADO ACTUAL (SIN RECARGAR)');
    console.log('=' .repeat(50));
    
    // Verificar localStorage
    console.log('💾 Estado en localStorage:');
    this.config.vendedores.forEach(id => {
      let valor;
      if (typeof responsableStorage !== 'undefined') {
        valor = responsableStorage.get(id);
      } else {
        valor = localStorage.getItem(`responsable_${id}`);
      }
      console.log(`   ${id}: "${valor || 'No definido'}"`);
    });
    
    // Verificar DOM
    console.log('\n🎨 Estado en DOM:');
    const textoCompleto = document.body.innerText;
    const aparicionesResponsable = (textoCompleto.match(/RESPONSABLE/g) || []).length;
    console.log(`   Apariciones de "RESPONSABLE": ${aparicionesResponsable}`);
    
    // Buscar nombres reales
    const posiblesNombres = textoCompleto.match(/[A-Z]{2,}(?:\s+[A-Z]{2,})?/g) || [];
    const nombresReales = [...new Set(posiblesNombres)].filter(n => 
      n !== 'RESPONSABLE' && 
      n.length > 2 && 
      !n.includes('AREPA') && 
      !n.includes('QUESO') &&
      !n.includes('LUNES') &&
      !n.includes('MARTES') &&
      !n.includes('PRODUCTOS')
    );
    
    if (nombresReales.length > 0) {
      console.log('   Nombres reales encontrados:', nombresReales);
    }
    
    // Evaluación
    if (aparicionesResponsable === 0 && nombresReales.length > 0) {
      console.log('✅ PERFECTO: Solo nombres reales, sin "RESPONSABLE"');
    } else if (aparicionesResponsable > 0 && nombresReales.length > 0) {
      console.log('⚠️ MIXTO: Hay nombres reales pero también "RESPONSABLE"');
    } else if (aparicionesResponsable > 0) {
      console.log('❌ PROBLEMA: Solo se ve "RESPONSABLE"');
    }
  }
};

// Mensaje de ayuda
console.log('🧪 SCRIPT DE VERIFICACIÓN SIN REBOTE CARGADO');
console.log('📋 Comandos disponibles:');
console.log('   testSinRebote.verificarSinRebote() - Verificar sin rebote (recarga página)');
console.log('   testSinRebote.verificarEstadoActual() - Ver estado actual');
console.log('   testSinRebote.prepararLocalStorage() - Preparar localStorage');
console.log('   testSinRebote.observarRebotes() - Solo observar cambios');