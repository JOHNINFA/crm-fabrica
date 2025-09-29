// 🧪 TEST - Verificar que ResumenVentas carga datos específicos por ID
// Ejecutar en consola del navegador en /cargue/MARTES

const testResumenPorID = {
  // Simular datos diferentes para cada ID
  simularDatosDiferentes: () => {
    console.log('🧪 SIMULANDO datos diferentes para cada ID...');
    
    const fecha = '2025-09-23';
    const dia = 'MARTES';
    
    // Datos para ID1
    const datosID1 = {
      conceptos: [
        { concepto: 'VENTA DIRECTA ID1', descuentos: 5000, nequi: 10000, daviplata: 2000 },
        { concepto: 'PROMOCION ID1', descuentos: 1000, nequi: 0, daviplata: 3000 },
        { concepto: '', descuentos: 0, nequi: 0, daviplata: 0 },
        { concepto: '', descuentos: 0, nequi: 0, daviplata: 0 },
        { concepto: '', descuentos: 0, nequi: 0, daviplata: 0 },
        { concepto: '', descuentos: 0, nequi: 0, daviplata: 0 },
        { concepto: '', descuentos: 0, nequi: 0, daviplata: 0 },
        { concepto: '', descuentos: 0, nequi: 0, daviplata: 0 },
        { concepto: '', descuentos: 0, nequi: 0, daviplata: 0 },
        { concepto: '', descuentos: 0, nequi: 0, daviplata: 0 }
      ],
      baseCaja: 50000
    };
    
    // Datos para ID2
    const datosID2 = {
      conceptos: [
        { concepto: 'VENTA MAYORISTA ID2', descuentos: 8000, nequi: 15000, daviplata: 5000 },
        { concepto: 'DESCUENTO ESPECIAL ID2', descuentos: 2000, nequi: 0, daviplata: 1000 },
        { concepto: 'BONIFICACION ID2', descuentos: 0, nequi: 5000, daviplata: 0 },
        { concepto: '', descuentos: 0, nequi: 0, daviplata: 0 },
        { concepto: '', descuentos: 0, nequi: 0, daviplata: 0 },
        { concepto: '', descuentos: 0, nequi: 0, daviplata: 0 },
        { concepto: '', descuentos: 0, nequi: 0, daviplata: 0 },
        { concepto: '', descuentos: 0, nequi: 0, daviplata: 0 },
        { concepto: '', descuentos: 0, nequi: 0, daviplata: 0 },
        { concepto: '', descuentos: 0, nequi: 0, daviplata: 0 }
      ],
      baseCaja: 75000
    };
    
    // Guardar en localStorage con las nuevas claves específicas por ID
    localStorage.setItem(`conceptos_pagos_${dia}_ID1_${fecha}`, JSON.stringify(datosID1.conceptos));
    localStorage.setItem(`base_caja_${dia}_ID1_${fecha}`, datosID1.baseCaja.toString());
    
    localStorage.setItem(`conceptos_pagos_${dia}_ID2_${fecha}`, JSON.stringify(datosID2.conceptos));
    localStorage.setItem(`base_caja_${dia}_ID2_${fecha}`, datosID2.baseCaja.toString());
    
    console.log('✅ Datos simulados guardados:');
    console.log('📋 ID1 - Conceptos:', datosID1.conceptos.filter(c => c.concepto));
    console.log('💰 ID1 - Base caja:', datosID1.baseCaja);
    console.log('📋 ID2 - Conceptos:', datosID2.conceptos.filter(c => c.concepto));
    console.log('💰 ID2 - Base caja:', datosID2.baseCaja);
    
    return { datosID1, datosID2 };
  },
  
  // Verificar carga específica por ID
  verificarCargaPorID: () => {
    console.log('\n🔍 VERIFICANDO carga específica por ID...');
    
    const fecha = '2025-09-23';
    const dia = 'MARTES';
    
    // Verificar datos guardados
    const conceptosID1 = localStorage.getItem(`conceptos_pagos_${dia}_ID1_${fecha}`);
    const baseCajaID1 = localStorage.getItem(`base_caja_${dia}_ID1_${fecha}`);
    
    const conceptosID2 = localStorage.getItem(`conceptos_pagos_${dia}_ID2_${fecha}`);
    const baseCajaID2 = localStorage.getItem(`base_caja_${dia}_ID2_${fecha}`);
    
    console.log('📂 Datos en localStorage:');
    console.log(`   ID1 conceptos: ${conceptosID1 ? 'SÍ' : 'NO'}`);
    console.log(`   ID1 base caja: ${baseCajaID1 || 'NO'}`);
    console.log(`   ID2 conceptos: ${conceptosID2 ? 'SÍ' : 'NO'}`);
    console.log(`   ID2 base caja: ${baseCajaID2 || 'NO'}`);
    
    if (conceptosID1) {
      const parsedID1 = JSON.parse(conceptosID1);
      console.log('📋 ID1 conceptos detalle:', parsedID1.filter(c => c.concepto));
    }
    
    if (conceptosID2) {
      const parsedID2 = JSON.parse(conceptosID2);
      console.log('📋 ID2 conceptos detalle:', parsedID2.filter(c => c.concepto));
    }
    
    return {
      id1: { conceptos: conceptosID1, baseCaja: baseCajaID1 },
      id2: { conceptos: conceptosID2, baseCaja: baseCajaID2 }
    };
  },
  
  // Limpiar datos de prueba
  limpiarDatosPrueba: () => {
    console.log('🧹 LIMPIANDO datos de prueba...');
    
    const fecha = '2025-09-23';
    const dia = 'MARTES';
    
    localStorage.removeItem(`conceptos_pagos_${dia}_ID1_${fecha}`);
    localStorage.removeItem(`base_caja_${dia}_ID1_${fecha}`);
    localStorage.removeItem(`conceptos_pagos_${dia}_ID2_${fecha}`);
    localStorage.removeItem(`base_caja_${dia}_ID2_${fecha}`);
    
    console.log('✅ Datos de prueba eliminados');
  },
  
  // Test completo
  ejecutarTestCompleto: () => {
    console.log('🚀 INICIANDO test completo de ResumenVentas por ID...\n');
    
    // 1. Simular datos
    const datos = testResumenPorID.simularDatosDiferentes();
    
    // 2. Verificar guardado
    const verificacion = testResumenPorID.verificarCargaPorID();
    
    // 3. Instrucciones para el usuario
    console.log('\n📋 INSTRUCCIONES:');
    console.log('1. Ve a ID1 y revisa la tabla de conceptos');
    console.log('2. Ve a ID2 y revisa la tabla de conceptos');
    console.log('3. Verifica que los datos sean DIFERENTES');
    console.log('4. Revisa la consola para ver los logs de carga');
    
    console.log('\n🔍 LOGS ESPERADOS:');
    console.log('- 📂 RESUMEN - ID1 Buscando conceptos en: conceptos_pagos_MARTES_ID1_2025-09-23');
    console.log('- 📂 RESUMEN - ID2 Buscando conceptos en: conceptos_pagos_MARTES_ID2_2025-09-23');
    console.log('- 📂 RESUMEN - ID1 Conceptos cargados: [array con datos de ID1]');
    console.log('- 📂 RESUMEN - ID2 Conceptos cargados: [array con datos de ID2]');
    
    console.log('\n✅ Test configurado. Cambia entre ID1 e ID2 para verificar.');
    
    return { datos, verificacion };
  }
};

// Ejecutar automáticamente si se carga el script
if (typeof window !== 'undefined') {
  console.log('🧪 Script de test ResumenVentas cargado');
  console.log('📋 Ejecuta: testResumenPorID.ejecutarTestCompleto()');
}