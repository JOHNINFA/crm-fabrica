/**
 * Servicio para manejar estados COMPLETADOS y carga de datos
 */

const API_URL = 'http://localhost:8000/api';

export const estadoCompletadoService = {
  
  // Verificar si una fecha/día está COMPLETADO
  verificarEstadoCompletado: async (dia, fecha) => {
    try {
      console.log(`🔍 Verificando estado COMPLETADO para ${dia} - ${fecha}`);
      
      // Verificar localStorage primero (más rápido)
      const estadoLocal = localStorage.getItem(`estado_boton_${dia}_${fecha}`);
      
      if (estadoLocal === 'COMPLETADO') {
        console.log(`✅ Estado COMPLETADO encontrado en localStorage`);
        return { completado: true, fuente: 'localStorage' };
      }
      
      // Si no está en localStorage, verificar en BD
      const endpoints = ['cargue-id1', 'cargue-id2', 'cargue-id3', 'cargue-id4', 'cargue-id5', 'cargue-id6'];
      
      for (const endpoint of endpoints) {
        try {
          const url = `${API_URL}/${endpoint}/?dia=${dia.toUpperCase()}&fecha=${fecha}&activo=true`;
          console.log(`🌐 Consultando: ${url}`);
          
          const response = await fetch(url);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`📊 Respuesta de ${endpoint}:`, data.results?.length || 0, 'registros');
            
            if (data.results && data.results.length > 0) {
              // Si hay datos en BD, consideramos que está COMPLETADO
              console.log(`✅ Datos encontrados en BD para ${endpoint} - Estado: COMPLETADO`);
              console.log(`📦 Ejemplo de datos:`, data.results[0]);
              
              // Guardar estado en localStorage para próximas cargas
              localStorage.setItem(`estado_boton_${dia}_${fecha}`, 'COMPLETADO');
              
              return { completado: true, fuente: 'baseDatos', datos: data.results };
            }
          } else {
            console.warn(`⚠️ Error HTTP ${response.status} en ${endpoint}`);
          }
        } catch (error) {
          console.warn(`⚠️ Error verificando ${endpoint}:`, error);
        }
      }
      
      console.log(`📝 No se encontraron datos - Estado: NUEVO`);
      return { completado: false, fuente: 'nuevo' };
      
    } catch (error) {
      console.error('❌ Error verificando estado COMPLETADO:', error);
      return { completado: false, fuente: 'error' };
    }
  },

  // Cargar todos los datos de una jornada COMPLETADA
  cargarDatosCompletados: async (dia, fecha) => {
    try {
      console.log(`📥 Cargando datos COMPLETADOS para ${dia} - ${fecha}`);
      
      const endpoints = [
        { id: 'ID1', endpoint: 'cargue-id1' },
        { id: 'ID2', endpoint: 'cargue-id2' },
        { id: 'ID3', endpoint: 'cargue-id3' },
        { id: 'ID4', endpoint: 'cargue-id4' },
        { id: 'ID5', endpoint: 'cargue-id5' },
        { id: 'ID6', endpoint: 'cargue-id6' }
      ];
      
      const datosCompletos = {
        productos: {},
        pagos: {},
        resumen: {},
        cumplimiento: {},
        responsables: {}
      };
      
      // Cargar datos de cada vendedor
      for (const { id, endpoint } of endpoints) {
        try {
          const response = await fetch(`${API_URL}/${endpoint}/?dia=${dia.toUpperCase()}&fecha=${fecha}&activo=true`);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
              console.log(`📦 Datos cargados para ${id}: ${data.results.length} registros`);
              
              // Procesar productos - CORREGIDO: Usar el ID del producto desde la BD
              datosCompletos.productos[id] = data.results.map(item => {
                console.log(`📦 Procesando producto de BD: ${item.producto} - Cantidad: ${item.cantidad}`);
                
                return {
                  // ✅ IMPORTANTE: Usar un ID temporal ya que no tenemos el ID real del producto
                  id: `temp_${item.id}`, 
                  producto: item.producto,
                  cantidad: item.cantidad || 0,
                  dctos: item.dctos || 0,
                  adicional: item.adicional || 0,
                  devoluciones: item.devoluciones || 0,
                  vencidas: item.vencidas || 0,
                  total: item.total || 0,
                  valor: item.valor || 0,
                  neto: item.neto || 0,
                  vendedor: item.v || false,
                  despachador: item.d || false,
                  lotesVencidos: item.lotes_vencidos ? JSON.parse(item.lotes_vencidos) : []
                };
              });
              
              // Tomar datos de pagos del primer registro (son iguales para todos los productos del mismo vendedor)
              const primerRegistro = data.results[0];
              if (primerRegistro.concepto || primerRegistro.descuentos || primerRegistro.nequi || primerRegistro.daviplata) {
                datosCompletos.pagos[id] = {
                  concepto: primerRegistro.concepto || '',
                  descuentos: primerRegistro.descuentos || 0,
                  nequi: primerRegistro.nequi || 0,
                  daviplata: primerRegistro.daviplata || 0
                };
              }
              
              // Tomar datos de resumen del primer registro
              if (primerRegistro.base_caja || primerRegistro.total_despacho || primerRegistro.venta) {
                datosCompletos.resumen[id] = {
                  base_caja: primerRegistro.base_caja || 0,
                  total_despacho: primerRegistro.total_despacho || 0,
                  total_pedidos: primerRegistro.total_pedidos || 0,
                  total_dctos: primerRegistro.total_dctos || 0,
                  venta: primerRegistro.venta || 0,
                  total_efectivo: primerRegistro.total_efectivo || 0
                };
              }
              
              // Tomar datos de cumplimiento del primer registro
              const cumplimiento = {};
              const camposCumplimiento = [
                'licencia_transporte', 'soat', 'uniforme', 'no_locion', 
                'no_accesorios', 'capacitacion_carnet', 'higiene', 'estibas', 'desinfeccion'
              ];
              
              camposCumplimiento.forEach(campo => {
                if (primerRegistro[campo]) {
                  cumplimiento[campo] = primerRegistro[campo];
                }
              });
              
              if (Object.keys(cumplimiento).length > 0) {
                datosCompletos.cumplimiento[id] = cumplimiento;
              }
              
              // Responsable
              if (primerRegistro.responsable && primerRegistro.responsable !== 'RESPONSABLE') {
                datosCompletos.responsables[id] = primerRegistro.responsable;
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️ Error cargando datos de ${id}:`, error);
        }
      }
      
      console.log(`✅ Datos COMPLETADOS cargados:`, datosCompletos);
      return datosCompletos;
      
    } catch (error) {
      console.error('❌ Error cargando datos COMPLETADOS:', error);
      return null;
    }
  },

  // Restaurar datos en localStorage para visualización
  restaurarEnLocalStorage: (dia, fecha, datosCompletos) => {
    try {
      console.log(`💾 Restaurando datos en localStorage para visualización...`);
      
      // Restaurar productos para cada ID
      Object.keys(datosCompletos.productos).forEach(id => {
        const productosDB = datosCompletos.productos[id];
        
        if (productosDB && productosDB.length > 0) {
          console.log(`🔄 Restaurando productos para ${id}:`, productosDB);
          
          const datosParaLS = {
            productos: productosDB,
            responsable: datosCompletos.responsables[id] || 'RESPONSABLE',
            timestamp: Date.now(),
            sincronizado: true,
            completado: true // ✅ Marcar como completado
          };
          
          const key = `cargue_${dia}_${id}_${fecha}`;
          localStorage.setItem(key, JSON.stringify(datosParaLS));
          console.log(`📦 Restaurado ${key} con ${productosDB.length} productos`);
          
          // Debug: Verificar que se guardó correctamente
          const verificacion = localStorage.getItem(key);
          if (verificacion) {
            const parsed = JSON.parse(verificacion);
            console.log(`✅ Verificación ${key}:`, parsed.productos.slice(0, 2));
          }
        }
      });
      
      // Restaurar pagos
      Object.keys(datosCompletos.pagos).forEach(id => {
        const pagos = datosCompletos.pagos[id];
        const conceptos = [{
          concepto: pagos.concepto || '',
          descuentos: pagos.descuentos || 0,
          nequi: pagos.nequi || 0,
          daviplata: pagos.daviplata || 0
        }];
        
        localStorage.setItem(`conceptos_pagos_${dia}_${fecha}`, JSON.stringify(conceptos));
      });
      
      // Restaurar base caja (tomar del primer vendedor que tenga datos)
      const primerResumen = Object.values(datosCompletos.resumen)[0];
      if (primerResumen && primerResumen.base_caja) {
        localStorage.setItem(`base_caja_${dia}_${fecha}`, primerResumen.base_caja.toString());
      }
      
      // Restaurar cumplimiento para cada ID
      Object.keys(datosCompletos.cumplimiento).forEach(id => {
        const cumplimiento = datosCompletos.cumplimiento[id];
        const key = `cumplimiento_${dia}_${id}_${fecha}`;
        localStorage.setItem(key, JSON.stringify(cumplimiento));
        console.log(`✅ Restaurado cumplimiento para ${id}`);
      });
      
      // Restaurar responsables
      Object.keys(datosCompletos.responsables).forEach(id => {
        const responsable = datosCompletos.responsables[id];
        localStorage.setItem(`responsable_${id}`, responsable);
      });
      
      // Marcar estado como COMPLETADO
      localStorage.setItem(`estado_boton_${dia}_${fecha}`, 'COMPLETADO');
      
      console.log(`✅ Todos los datos restaurados en localStorage`);
      return true;
      
    } catch (error) {
      console.error('❌ Error restaurando datos en localStorage:', error);
      return false;
    }
  }
};