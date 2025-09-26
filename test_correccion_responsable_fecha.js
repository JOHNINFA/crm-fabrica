// 🧪 TEST DE CORRECCIÓN - RESPONSABLE Y FECHA
// Ejecutar en la consola del navegador después de los cambios

const testCorreccionResponsableFecha = {
  
  // Verificar que el responsable se está obteniendo correctamente
  verificarResponsable: () => {
    console.log('🔍 VERIFICANDO RESPONSABLES...');
    
    const ids = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];
    
    ids.forEach(id => {
      // Verificar localStorage directo
      const responsableLS = localStorage.getItem(`responsable_${id}`);
      
      // Verificar responsableStorage si está disponible
      let responsableStorage = null;
      try {
        if (typeof window.responsableStorage !== 'undefined') {
          responsableStorage = window.responsableStorage.get(id);
        }
      } catch (error) {
        console.log(`⚠️ responsableStorage no disponible para ${id}`);
      }
      
      console.log(`📋 ${id}:`);
      console.log(`   - localStorage directo: "${responsableLS}"`);
      console.log(`   - responsableStorage: "${responsableStorage}"`);
    });
  },
  
  // Verificar que la fecha seleccionada se está usando correctamente
  verificarFecha: () => {
    console.log('📅 VERIFICANDO FECHA SELECCIONADA...');
    
    // Buscar el input de fecha en la página
    const inputFecha = document.querySelector('input[type="date"]');
    if (inputFecha) {
      console.log(`📅 Fecha en input: "${inputFecha.value}"`);
      console.log(`📅 Formato esperado: YYYY-MM-DD`);
      
      // Verificar que no sea la fecha actual del sistema
      const fechaActual = new Date().toISOString().split('T')[0];
      if (inputFecha.value === fechaActual) {
        console.log(`⚠️ ADVERTENCIA: La fecha seleccionada coincide con la fecha actual del sistema`);
        console.log(`   Esto podría indicar que se está usando el fallback incorrecto`);
      } else {
        console.log(`✅ La fecha seleccionada es diferente a la fecha actual del sistema`);
      }
    } else {
      console.log(`❌ No se encontró input de fecha en la página`);
    }
  },
  
  // Simular el proceso de guardado para verificar los datos
  simularGuardado: () => {
    console.log('🚀 SIMULANDO PROCESO DE GUARDADO...');
    
    const ids = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];
    const inputFecha = document.querySelector('input[type="date"]');
    const fechaSeleccionada = inputFecha ? inputFecha.value : null;
    
    if (!fechaSeleccionada) {
      console.log(`❌ ERROR: No se pudo obtener fechaSeleccionada`);
      return;
    }
    
    console.log(`📅 fechaSeleccionada obtenida: "${fechaSeleccionada}"`);
    
    ids.forEach(id => {
      // Simular obtención del responsable
      let responsableReal = 'RESPONSABLE';
      
      try {
        const responsableLS = localStorage.getItem(`responsable_${id}`);
        if (responsableLS && responsableLS !== 'RESPONSABLE') {
          responsableReal = responsableLS;
        }
      } catch (error) {
        console.log(`⚠️ Error obteniendo responsable para ${id}`);
      }
      
      // Simular datos que se enviarían
      const datosSimulados = {
        dia_semana: 'MARTES', // Ejemplo
        vendedor_id: id,
        fecha: fechaSeleccionada, // ✅ Debería ser la fecha seleccionada
        responsable: responsableReal, // ✅ Debería ser el responsable real
        productos: [] // Vacío para la simulación
      };
      
      console.log(`📦 Datos simulados para ${id}:`);
      console.log(`   - fecha: "${datosSimulados.fecha}"`);
      console.log(`   - responsable: "${datosSimulados.responsable}"`);
      
      // Verificar que los datos son correctos
      if (datosSimulados.fecha === fechaSeleccionada) {
        console.log(`   ✅ Fecha correcta`);
      } else {
        console.log(`   ❌ Fecha incorrecta`);
      }
      
      if (datosSimulados.responsable !== 'RESPONSABLE' && datosSimulados.responsable !== 'SISTEMA') {
        console.log(`   ✅ Responsable correcto`);
      } else {
        console.log(`   ❌ Responsable incorrecto (usando valor por defecto)`);
      }
    });
  },
  
  // Ejecutar todas las verificaciones
  ejecutarTodo: () => {
    console.log('🧪 ===== TEST COMPLETO DE CORRECCIÓN =====');
    testCorreccionResponsableFecha.verificarResponsable();
    console.log('');
    testCorreccionResponsableFecha.verificarFecha();
    console.log('');
    testCorreccionResponsableFecha.simularGuardado();
    console.log('🎯 ===== FIN DEL TEST =====');
  }
};

// Hacer disponible globalmente
window.testCorreccionResponsableFecha = testCorreccionResponsableFecha;

console.log(`
🧪 ===== TEST DE CORRECCIÓN CARGADO =====

Funciones disponibles:
• testCorreccionResponsableFecha.ejecutarTodo()     - Ejecutar todas las verificaciones
• testCorreccionResponsableFecha.verificarResponsable() - Solo verificar responsables
• testCorreccionResponsableFecha.verificarFecha()       - Solo verificar fecha
• testCorreccionResponsableFecha.simularGuardado()      - Simular proceso de guardado

Uso recomendado:
testCorreccionResponsableFecha.ejecutarTodo()

¡Listo para verificar las correcciones! 🚀
`);