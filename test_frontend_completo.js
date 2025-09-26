// 🧪 TEST COMPLETO DEL FRONTEND - VERIFICAR GUARDADO EN TODOS LOS IDS Y PRODUCCIÓN
// Ejecutar en la consola del navegador cuando esté en la aplicación React

const testFrontendCompleto = {
  
  // ========================================
  // CONFIGURACIÓN DEL TEST
  // ========================================
  
  API_URL: 'http://localhost:8000/api',
  
  // Datos de prueba para cada ID
  datosPrueba: {
    'ID1': {
      dia_semana: 'LUNES',
      vendedor_id: 'ID1',
      fecha: '2025-09-24',
      responsable: 'TEST_ID1',
      productos: [
        {
          producto_nombre: 'AREPA TIPO OBLEA 500Gr',
          cantidad: 10,
          dctos: 1,
          adicional: 0,
          devoluciones: 2,
          vencidas: 1,
          valor: 1625,
          vendedor: true,
          despachador: true,
          lotes_vencidos: [{ lote: '12345', motivo: 'HONGO' }]
        }
      ],
      pagos: [
        {
          concepto: 'Gasolina',
          descuentos: 5000,
          nequi: 15000,
          daviplata: 10000
        }
      ],
      resumen: {
        base_caja: 50000,
        total_despacho: 162500,
        total_pedidos: 150000,
        total_dctos: 5000,
        venta: 145000,
        total_efectivo: 140000
      }
    },
    'ID2': {
      dia_semana: 'MARTES',
      vendedor_id: 'ID2',
      fecha: '2025-09-24',
      responsable: 'TEST_ID2',
      productos: [
        {
          producto_nombre: 'AREPA TIPO OBLEA 1000Gr',
          cantidad: 8,
          dctos: 0,
          adicional: 1,
          devoluciones: 1,
          vencidas: 0,
          valor: 3200,
          vendedor: true,
          despachador: false,
          lotes_vencidos: []
        }
      ],
      pagos: [
        {
          concepto: 'Combustible',
          descuentos: 3000,
          nequi: 20000,
          daviplata: 5000
        }
      ],
      resumen: {
        base_caja: 30000,
        total_despacho: 256000,
        total_pedidos: 250000,
        total_dctos: 3000,
        venta: 247000,
        total_efectivo: 244000
      }
    },
    'ID3': {
      dia_semana: 'MIERCOLES',
      vendedor_id: 'ID3',
      fecha: '2025-09-24',
      responsable: 'TEST_ID3',
      productos: [
        {
          producto_nombre: 'ALMOJABANA 500Gr',
          cantidad: 15,
          dctos: 2,
          adicional: 0,
          devoluciones: 0,
          vencidas: 1,
          valor: 2800,
          vendedor: false,
          despachador: true,
          lotes_vencidos: [{ lote: '67890', motivo: 'FVTO' }]
        }
      ],
      pagos: [],
      resumen: {
        base_caja: 25000,
        total_despacho: 336000,
        total_pedidos: 320000,
        total_dctos: 0,
        venta: 320000,
        total_efectivo: 295000
      }
    },
    'ID4': {
      dia_semana: 'JUEVES',
      vendedor_id: 'ID4',
      fecha: '2025-09-24',
      responsable: 'TEST_ID4',
      productos: [
        {
          producto_nombre: 'BUÑUELO 500Gr',
          cantidad: 12,
          dctos: 1,
          adicional: 2,
          devoluciones: 1,
          vencidas: 0,
          valor: 2500,
          vendedor: true,
          despachador: true,
          lotes_vencidos: []
        }
      ],
      pagos: [
        {
          concepto: 'Mantenimiento',
          descuentos: 8000,
          nequi: 12000,
          daviplata: 18000
        }
      ],
      resumen: {
        base_caja: 40000,
        total_despacho: 300000,
        total_pedidos: 280000,
        total_dctos: 8000,
        venta: 272000,
        total_efectivo: 232000
      }
    },
    'ID5': {
      dia_semana: 'VIERNES',
      vendedor_id: 'ID5',
      fecha: '2025-09-24',
      responsable: 'TEST_ID5',
      productos: [
        {
          producto_nombre: 'PANDEBONO 500Gr',
          cantidad: 20,
          dctos: 0,
          adicional: 0,
          devoluciones: 3,
          vencidas: 2,
          valor: 3500,
          vendedor: true,
          despachador: false,
          lotes_vencidos: [
            { lote: '11111', motivo: 'HONGO' },
            { lote: '22222', motivo: 'SELLADO' }
          ]
        }
      ],
      pagos: [
        {
          concepto: 'Varios',
          descuentos: 2000,
          nequi: 25000,
          daviplata: 15000
        }
      ],
      resumen: {
        base_caja: 60000,
        total_despacho: 525000,
        total_pedidos: 500000,
        total_dctos: 2000,
        venta: 498000,
        total_efectivo: 438000
      }
    },
    'ID6': {
      dia_semana: 'SABADO',
      vendedor_id: 'ID6',
      fecha: '2025-09-24',
      responsable: 'TEST_ID6',
      productos: [
        {
          producto_nombre: 'ROSCON 500Gr',
          cantidad: 6,
          dctos: 1,
          adicional: 1,
          devoluciones: 0,
          vencidas: 1,
          valor: 4000,
          vendedor: false,
          despachador: false,
          lotes_vencidos: [{ lote: '33333', motivo: 'FVTO' }]
        }
      ],
      pagos: [],
      resumen: {
        base_caja: 20000,
        total_despacho: 200000,
        total_pedidos: 180000,
        total_dctos: 0,
        venta: 180000,
        total_efectivo: 160000
      }
    }
  },

  // Datos de prueba para producción
  datosProduccion: [
    {
      fecha: '2025-09-24',
      producto: 'AREPA TIPO OBLEA 500Gr',
      cantidad: 100,
      lote: 'PROD001',
      congelado: false,
      usuario: 'TEST_PRODUCCION'
    },
    {
      fecha: '2025-09-24',
      producto: 'ALMOJABANA 500Gr',
      cantidad: 80,
      lote: 'PROD002',
      congelado: true,
      usuario: 'TEST_PRODUCCION'
    },
    {
      fecha: '2025-09-24',
      producto: 'BUÑUELO 500Gr',
      cantidad: 60,
      lote: 'PROD003',
      congelado: false,
      usuario: 'TEST_PRODUCCION'
    }
  ],

  // ========================================
  // FUNCIONES DE TEST
  // ========================================

  // Test individual para un ID específico
  testearID: async function(idVendedor) {
    console.log(`\n🧪 ===== TESTEANDO ${idVendedor} =====`);
    
    try {
      const datos = this.datosPrueba[idVendedor];
      if (!datos) {
        console.error(`❌ No hay datos de prueba para ${idVendedor}`);
        return false;
      }

      console.log(`📤 Enviando datos para ${idVendedor}:`, datos);

      // Usar el servicio de cargue (debe estar disponible globalmente o importado)
      let resultado;
      
      // Intentar usar el servicio global si está disponible
      if (typeof cargueService !== 'undefined' && cargueService.guardarCargueCompleto) {
        resultado = await cargueService.guardarCargueCompleto(datos);
      } else {
        // Hacer llamada directa a la API
        const endpoint = this.getEndpointForVendedor(idVendedor);
        const response = await fetch(`${this.API_URL}/${endpoint}/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.transformarDatos(datos)),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error ${response.status}: ${errorText}`);
        }

        resultado = await response.json();
      }

      console.log(`✅ ${idVendedor} guardado exitosamente:`, resultado);

      // Verificar que se guardó consultando la API
      await this.verificarGuardado(idVendedor, datos);

      return true;

    } catch (error) {
      console.error(`❌ Error testeando ${idVendedor}:`, error);
      return false;
    }
  },

  // Test para producción
  testearProduccion: async function() {
    console.log(`\n🏭 ===== TESTEANDO PRODUCCIÓN =====`);
    
    try {
      const resultados = [];

      for (const item of this.datosProduccion) {
        console.log(`📤 Enviando item de producción:`, item);

        const response = await fetch(`${this.API_URL}/produccion/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const resultado = await response.json();
        resultados.push(resultado);
        console.log(`✅ Item de producción guardado:`, resultado);

        // Si está marcado como congelado, probar la función de congelar
        if (item.congelado && resultado.id) {
          try {
            const congelarResponse = await fetch(`${this.API_URL}/produccion/${resultado.id}/congelar/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ usuario: 'TEST_CONGELADO' }),
            });

            if (congelarResponse.ok) {
              const congelarResultado = await congelarResponse.json();
              console.log(`🧊 Item congelado exitosamente:`, congelarResultado);
            }
          } catch (congelarError) {
            console.warn(`⚠️ Error congelando item:`, congelarError);
          }
        }
      }

      console.log(`🎉 Producción testeada exitosamente: ${resultados.length} items`);
      return true;

    } catch (error) {
      console.error(`❌ Error testeando producción:`, error);
      return false;
    }
  },

  // Verificar que los datos se guardaron correctamente
  verificarGuardado: async function(idVendedor, datosOriginales) {
    try {
      const endpoint = this.getEndpointForVendedor(idVendedor);
      const response = await fetch(`${this.API_URL}/${endpoint}/?dia=${datosOriginales.dia_semana}&fecha=${datosOriginales.fecha}`);
      
      if (response.ok) {
        const datos = await response.json();
        if (datos.length > 0) {
          console.log(`✅ Verificación ${idVendedor}: Datos encontrados en BD`, datos.length, 'registros');
          return true;
        } else {
          console.warn(`⚠️ Verificación ${idVendedor}: No se encontraron datos en BD`);
          return false;
        }
      } else {
        console.warn(`⚠️ Verificación ${idVendedor}: Error consultando BD`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error verificando ${idVendedor}:`, error);
      return false;
    }
  },

  // Obtener endpoint para vendedor
  getEndpointForVendedor: function(vendedorId) {
    const map = {
      'ID1': 'cargue-id1',
      'ID2': 'cargue-id2',
      'ID3': 'cargue-id3',
      'ID4': 'cargue-id4',
      'ID5': 'cargue-id5',
      'ID6': 'cargue-id6'
    };
    return map[vendedorId] || 'cargue-id1';
  },

  // Transformar datos al formato de tabla plana
  transformarDatos: function(datos) {
    const producto = datos.productos[0] || {};
    const pago = datos.pagos[0] || {};
    const resumen = datos.resumen || {};

    return {
      dia: datos.dia_semana,
      fecha: datos.fecha,
      usuario: datos.responsable,
      activo: true,
      
      // Producto
      producto: producto.producto_nombre || '',
      cantidad: producto.cantidad || 0,
      dctos: producto.dctos || 0,
      adicional: producto.adicional || 0,
      devoluciones: producto.devoluciones || 0,
      vencidas: producto.vencidas || 0,
      valor: producto.valor || 0,
      v: producto.vendedor || false,
      d: producto.despachador || false,
      lotes_vencidos: JSON.stringify(producto.lotes_vencidos || []),
      
      // Pagos
      concepto: pago.concepto || '',
      descuentos: pago.descuentos || 0,
      nequi: pago.nequi || 0,
      daviplata: pago.daviplata || 0,
      
      // Resumen
      base_caja: resumen.base_caja || 0,
      total_despacho: resumen.total_despacho || 0,
      total_pedidos: resumen.total_pedidos || 0,
      total_dctos: resumen.total_dctos || 0,
      venta: resumen.venta || 0,
      total_efectivo: resumen.total_efectivo || 0
    };
  },

  // ========================================
  // FUNCIÓN PRINCIPAL DE TEST
  // ========================================

  ejecutarTestCompleto: async function() {
    console.log('🚀 ===== INICIANDO TEST COMPLETO DEL FRONTEND =====');
    console.log('📋 Testeando guardado en todos los IDs y producción...\n');

    const resultados = {
      exitosos: [],
      fallidos: [],
      total: 0
    };

    // Testear todos los IDs
    for (const idVendedor of ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6']) {
      const exito = await this.testearID(idVendedor);
      if (exito) {
        resultados.exitosos.push(idVendedor);
      } else {
        resultados.fallidos.push(idVendedor);
      }
      resultados.total++;
      
      // Pausa entre tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Testear producción
    const exitoProduccion = await this.testearProduccion();
    if (exitoProduccion) {
      resultados.exitosos.push('PRODUCCION');
    } else {
      resultados.fallidos.push('PRODUCCION');
    }
    resultados.total++;

    // Mostrar resumen final
    console.log('\n🎯 ===== RESUMEN FINAL =====');
    console.log(`✅ Exitosos: ${resultados.exitosos.length}/${resultados.total}`);
    console.log(`❌ Fallidos: ${resultados.fallidos.length}/${resultados.total}`);
    
    if (resultados.exitosos.length > 0) {
      console.log(`🎉 Tests exitosos: ${resultados.exitosos.join(', ')}`);
    }
    
    if (resultados.fallidos.length > 0) {
      console.log(`💥 Tests fallidos: ${resultados.fallidos.join(', ')}`);
    }

    const porcentajeExito = Math.round((resultados.exitosos.length / resultados.total) * 100);
    console.log(`📊 Porcentaje de éxito: ${porcentajeExito}%`);

    if (porcentajeExito === 100) {
      console.log('🏆 ¡TODOS LOS TESTS PASARON! El frontend está funcionando correctamente.');
    } else if (porcentajeExito >= 80) {
      console.log('⚠️ La mayoría de tests pasaron, pero hay algunos problemas.');
    } else {
      console.log('❌ Hay problemas significativos que necesitan atención.');
    }

    return resultados;
  },

  // Test rápido de conectividad
  testConectividad: async function() {
    console.log('🔌 Testeando conectividad con todos los endpoints...');
    
    const endpoints = [
      'cargue-id1', 'cargue-id2', 'cargue-id3', 
      'cargue-id4', 'cargue-id5', 'cargue-id6', 
      'produccion'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${this.API_URL}/${endpoint}/`);
        if (response.ok) {
          console.log(`✅ ${endpoint}: Conectado`);
        } else {
          console.log(`❌ ${endpoint}: Error ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: Sin conexión`);
      }
    }
  }
};

// ========================================
// FUNCIONES DE ACCESO RÁPIDO
// ========================================

// Función para ejecutar test completo
window.testCompleto = () => testFrontendCompleto.ejecutarTestCompleto();

// Función para testear un ID específico
window.testID = (id) => testFrontendCompleto.testearID(id);

// Función para testear solo producción
window.testProduccion = () => testFrontendCompleto.testearProduccion();

// Función para testear conectividad
window.testConectividad = () => testFrontendCompleto.testConectividad();

// Mostrar instrucciones
console.log(`
🧪 ===== TEST FRONTEND COMPLETO CARGADO =====

Funciones disponibles:
• testCompleto()     - Ejecutar test completo de todos los IDs y producción
• testID('ID1')      - Testear un ID específico (ID1, ID2, ID3, ID4, ID5, ID6)
• testProduccion()   - Testear solo el módulo de producción
• testConectividad() - Verificar conectividad con todos los endpoints

Ejemplo de uso:
testCompleto()       // Ejecuta todo
testID('ID1')        // Solo ID1
testProduccion()     // Solo producción

¡Listo para testear! 🚀
`);

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testFrontendCompleto;
}