/**
 * 🧪 SCRIPT DE PRUEBA - CARGAR RESPONSABLE DESDE BD
 * 
 * Este script prueba que el frontend puede cargar correctamente
 * el responsable desde la base de datos.
 * 
 * INSTRUCCIONES:
 * 1. Abrir la aplicación en el navegador (localhost:3000/cargue/LUNES)
 * 2. Abrir DevTools (F12) → Console
 * 3. Pegar este código completo
 * 4. Ejecutar: testCargarResponsable.probarCarga()
 */

const testCargarResponsable = {
  
  config: {
    API_URL: 'http://localhost:8000/api',
    vendedores: ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6']
  },

  // 1. Probar carga directa desde endpoint
  async probarEndpointDirecto(idVendedor) {
    console.log(`\n🔍 PROBANDO ENDPOINT DIRECTO PARA ${idVendedor}`);
    console.log('=' .repeat(40));
    
    const url = `${this.config.API_URL}/vendedores/obtener_responsable/?id_vendedor=${idVendedor}`;
    
    try {
      console.log(`📤 Consultando: ${url}`);
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📥 Respuesta:`, data);
        
        if (data.success && data.responsable) {
          console.log(`✅ ${idVendedor}: "${data.responsable}"`);
          return data.responsable;
        } else {
          console.log(`⚠️ ${idVendedor}: Sin responsable en BD`);
          return 'RESPONSABLE';
        }
      } else {
        console.error(`❌ ${idVendedor}: Error HTTP ${response.status}`);
        return null;
      }
      
    } catch (error) {
      console.error(`❌ ${idVendedor}: Error de red:`, error);
      return null;
    }
  },

  // 2. Probar todos los vendedores
  async probarTodosLosVendedores() {
    console.log('\n🔍 PROBANDO TODOS LOS VENDEDORES');
    console.log('=' .repeat(50));
    
    const resultados = {};
    
    for (const idVendedor of this.config.vendedores) {
      const responsable = await this.probarEndpointDirecto(idVendedor);
      resultados[idVendedor] = responsable;
      
      // Esperar un poco entre requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n📊 RESUMEN DE RESPONSABLES EN BD:');
    console.log('=' .repeat(40));
    Object.entries(resultados).forEach(([id, responsable]) => {
      const status = responsable && responsable !== 'RESPONSABLE' ? '✅' : '⚠️';
      console.log(`${status} ${id}: "${responsable || 'Sin datos'}"`);
    });
    
    return resultados;
  },

  // 3. Simular la función cargarResponsable del contexto
  async simularContextoCargarResponsable(idVendedor) {
    console.log(`\n🔄 SIMULANDO CONTEXTO cargarResponsable PARA ${idVendedor}`);
    console.log('=' .repeat(50));
    
    try {
      console.log(`🔍 Cargando responsable para ${idVendedor} desde BD...`);
      const response = await fetch(`${this.config.API_URL}/vendedores/obtener_responsable/?id_vendedor=${idVendedor}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.responsable) {
          const responsable = data.responsable;
          console.log(`📥 Responsable cargado para ${idVendedor}: ${responsable}`);
          
          // Simular actualización de localStorage
          if (typeof responsableStorage !== 'undefined') {
            responsableStorage.set(idVendedor, responsable);
            console.log(`💾 Guardado en localStorage: ${idVendedor} = ${responsable}`);
          } else {
            localStorage.setItem(`responsable_${idVendedor}`, responsable);
            console.log(`💾 Guardado en localStorage directo: responsable_${idVendedor} = ${responsable}`);
          }
          
          return responsable;
        } else {
          console.log(`⚠️ No se encontró responsable para ${idVendedor} en BD`);
        }
      } else {
        console.error(`❌ Error HTTP ${response.status} cargando responsable para ${idVendedor}`);
      }

      return 'RESPONSABLE';
    } catch (error) {
      console.error(`❌ Error cargando responsable para ${idVendedor}:`, error);
      return 'RESPONSABLE';
    }
  },

  // 4. Verificar estado actual en DOM
  verificarEstadoDOM() {
    console.log('\n🎨 VERIFICANDO ESTADO ACTUAL EN DOM');
    console.log('=' .repeat(40));
    
    // Buscar elementos que muestren responsables
    const elementosResponsable = document.querySelectorAll('[class*="responsable"], [data-testid*="responsable"]');
    
    if (elementosResponsable.length > 0) {
      console.log(`📍 Encontrados ${elementosResponsable.length} elementos de responsable:`);
      elementosResponsable.forEach((el, i) => {
        console.log(`   ${i + 1}. ${el.tagName}.${el.className}: "${el.textContent.trim()}"`);
      });
    } else {
      console.log('📍 No se encontraron elementos específicos de responsable');
    }
    
    // Buscar texto "RESPONSABLE" en la página
    const todosLosTextos = document.body.innerText;
    const coincidenciasResponsable = (todosLosTextos.match(/RESPONSABLE/g) || []).length;
    console.log(`📝 Apariciones de "RESPONSABLE" en la página: ${coincidenciasResponsable}`);
    
    // Buscar otros nombres que no sean "RESPONSABLE"
    const posiblesNombres = todosLosTextos.match(/[A-Z]{2,}(?:\s+[A-Z]{2,})?/g) || [];
    const nombresUnicos = [...new Set(posiblesNombres)].filter(n => 
      n !== 'RESPONSABLE' && 
      n.length > 2 && 
      !n.includes('AREPA') && 
      !n.includes('QUESO') &&
      !n.includes('LUNES') &&
      !n.includes('MARTES')
    );
    
    if (nombresUnicos.length > 0) {
      console.log('📝 Posibles nombres de responsables encontrados:', nombresUnicos);
    }
  },

  // 5. Forzar actualización de responsables
  async forzarActualizacion() {
    console.log('\n🔄 FORZANDO ACTUALIZACIÓN DE RESPONSABLES');
    console.log('=' .repeat(50));
    
    const responsables = await this.probarTodosLosVendedores();
    
    // Disparar eventos para cada vendedor con responsable válido
    Object.entries(responsables).forEach(([idVendedor, responsable]) => {
      if (responsable && responsable !== 'RESPONSABLE') {
        console.log(`🎯 Disparando evento para ${idVendedor}: "${responsable}"`);
        
        const evento = new CustomEvent('responsableActualizado', {
          detail: {
            idSheet: idVendedor,
            nuevoNombre: responsable
          }
        });
        
        window.dispatchEvent(evento);
      }
    });
    
    console.log('✅ Eventos disparados. Los componentes deberían actualizarse.');
  },

  // 6. Ejecutar prueba completa
  async probarCarga() {
    console.log('\n🚀 INICIANDO PRUEBA COMPLETA DE CARGA DE RESPONSABLES');
    console.log('=' .repeat(60));
    
    try {
      // 1. Verificar estado actual
      this.verificarEstadoDOM();
      
      // 2. Probar endpoints
      const responsables = await this.probarTodosLosVendedores();
      
      // 3. Simular carga del contexto para ID1 (que sabemos que tiene datos)
      if (responsables.ID1 && responsables.ID1 !== 'RESPONSABLE') {
        await this.simularContextoCargarResponsable('ID1');
      }
      
      // 4. Forzar actualización
      await this.forzarActualizacion();
      
      // 5. Verificar estado final
      console.log('\n🔍 ESTADO FINAL:');
      this.verificarEstadoDOM();
      
      console.log('\n🎉 PRUEBA COMPLETADA');
      console.log('ℹ️ Si los responsables no se actualizaron en la UI, puede ser necesario recargar la página');
      
      return responsables;
      
    } catch (error) {
      console.error('❌ Error en prueba completa:', error);
    }
  }
};

// Mensaje de ayuda
console.log('🧪 SCRIPT DE PRUEBA DE CARGA DE RESPONSABLES CARGADO');
console.log('📋 Comandos disponibles:');
console.log('   testCargarResponsable.probarCarga() - Ejecutar prueba completa');
console.log('   testCargarResponsable.probarTodosLosVendedores() - Solo endpoints');
console.log('   testCargarResponsable.verificarEstadoDOM() - Ver estado actual');
console.log('   testCargarResponsable.forzarActualizacion() - Forzar actualización');