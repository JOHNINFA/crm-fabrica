/**
 * 🚀 SCRIPT PARA PRE-CARGAR RESPONSABLES
 * 
 * Este script carga todos los responsables desde la BD y los guarda
 * en localStorage ANTES de que se rendericen los componentes.
 * 
 * INSTRUCCIONES:
 * 1. Abrir la aplicación en el navegador
 * 2. Abrir DevTools (F12) → Console
 * 3. Pegar este código completo
 * 4. Ejecutar: precargarResponsables.ejecutar()
 * 5. Recargar la página
 */

const precargarResponsables = {
  
  config: {
    API_URL: 'http://localhost:8000/api',
    vendedores: ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6']
  },

  // 1. Cargar todos los responsables desde BD
  async cargarTodosDesdeDB() {
    console.log('\n🔄 CARGANDO TODOS LOS RESPONSABLES DESDE BD');
    console.log('=' .repeat(50));
    
    const responsables = {};
    
    for (const idVendedor of this.config.vendedores) {
      try {
        const url = `${this.config.API_URL}/vendedores/obtener_responsable/?id_vendedor=${idVendedor}`;
        console.log(`📡 Consultando ${idVendedor}...`);
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.responsable && data.responsable !== 'RESPONSABLE') {
            responsables[idVendedor] = data.responsable;
            console.log(`✅ ${idVendedor}: "${data.responsable}"`);
          } else {
            console.log(`⚠️ ${idVendedor}: Sin responsable válido`);
          }
        } else {
          console.error(`❌ ${idVendedor}: Error HTTP ${response.status}`);
        }
        
        // Pequeña pausa entre requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error cargando ${idVendedor}:`, error);
      }
    }
    
    return responsables;
  },

  // 2. Guardar en localStorage con múltiples claves
  guardarEnLocalStorage(responsables) {
    console.log('\n💾 GUARDANDO EN LOCALSTORAGE');
    console.log('=' .repeat(50));
    
    Object.entries(responsables).forEach(([idVendedor, responsable]) => {
      try {
        // Guardar en múltiples ubicaciones para máxima compatibilidad
        const claves = [
          `responsable_${idVendedor}`,
          `cargue_responsable_${idVendedor}`,
          `${idVendedor}_responsable`
        ];
        
        claves.forEach(clave => {
          localStorage.setItem(clave, responsable);
        });
        
        // También intentar con responsableStorage si está disponible
        if (typeof responsableStorage !== 'undefined') {
          responsableStorage.set(idVendedor, responsable);
          console.log(`💾 ${idVendedor}: "${responsable}" guardado en responsableStorage + localStorage`);
        } else {
          console.log(`💾 ${idVendedor}: "${responsable}" guardado en localStorage`);
        }
        
      } catch (error) {
        console.error(`❌ Error guardando ${idVendedor}:`, error);
      }
    });
  },

  // 3. Verificar que se guardó correctamente
  verificarGuardado() {
    console.log('\n🔍 VERIFICANDO DATOS GUARDADOS');
    console.log('=' .repeat(50));
    
    this.config.vendedores.forEach(idVendedor => {
      const claves = [
        `responsable_${idVendedor}`,
        `cargue_responsable_${idVendedor}`,
        `${idVendedor}_responsable`
      ];
      
      console.log(`\n📋 ${idVendedor}:`);
      
      claves.forEach(clave => {
        const valor = localStorage.getItem(clave);
        console.log(`   ${clave}: "${valor || 'No definido'}"`);
      });
      
      // También verificar responsableStorage
      if (typeof responsableStorage !== 'undefined') {
        const valorRS = responsableStorage.get(idVendedor);
        console.log(`   responsableStorage: "${valorRS || 'No definido'}"`);
      }
    });
  },

  // 4. Limpiar localStorage (para testing)
  limpiarTodo() {
    console.log('\n🧹 LIMPIANDO LOCALSTORAGE');
    console.log('=' .repeat(50));
    
    this.config.vendedores.forEach(idVendedor => {
      const claves = [
        `responsable_${idVendedor}`,
        `cargue_responsable_${idVendedor}`,
        `${idVendedor}_responsable`
      ];
      
      claves.forEach(clave => {
        localStorage.removeItem(clave);
      });
      
      if (typeof responsableStorage !== 'undefined') {
        responsableStorage.clear(idVendedor);
      }
      
      console.log(`🗑️ ${idVendedor}: Limpiado`);
    });
  },

  // 5. Ejecutar proceso completo
  async ejecutar() {
    console.log('\n🚀 INICIANDO PRE-CARGA DE RESPONSABLES');
    console.log('=' .repeat(60));
    
    try {
      // 1. Cargar desde BD
      const responsables = await this.cargarTodosDesdeDB();
      
      // 2. Guardar en localStorage
      this.guardarEnLocalStorage(responsables);
      
      // 3. Verificar
      this.verificarGuardado();
      
      // 4. Mostrar resumen
      const totalCargados = Object.keys(responsables).length;
      console.log(`\n📊 RESUMEN:`);
      console.log(`✅ ${totalCargados} responsables cargados y guardados`);
      console.log(`📦 Datos disponibles en localStorage para próxima carga`);
      
      if (totalCargados > 0) {
        console.log('\n🎯 PRÓXIMO PASO:');
        console.log('1. Recargar la página (F5)');
        console.log('2. Los responsables deberían aparecer inmediatamente sin rebote');
      }
      
      return responsables;
      
    } catch (error) {
      console.error('❌ Error en proceso completo:', error);
    }
  },

  // 6. Ejecutar y recargar automáticamente
  async ejecutarYRecargar() {
    console.log('🔄 EJECUTANDO Y RECARGANDO AUTOMÁTICAMENTE...');
    
    await this.ejecutar();
    
    console.log('\n⏳ Recargando página en 2 segundos...');
    setTimeout(() => {
      location.reload();
    }, 2000);
  }
};

// Mensaje de ayuda
console.log('🚀 SCRIPT DE PRE-CARGA DE RESPONSABLES CARGADO');
console.log('📋 Comandos disponibles:');
console.log('   precargarResponsables.ejecutar() - Cargar y guardar responsables');
console.log('   precargarResponsables.ejecutarYRecargar() - Cargar, guardar y recargar página');
console.log('   precargarResponsables.verificarGuardado() - Ver estado actual');
console.log('   precargarResponsables.limpiarTodo() - Limpiar localStorage (para testing)');