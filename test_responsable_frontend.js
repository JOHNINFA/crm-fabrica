/**
 * 🧪 SCRIPT DE PRUEBA - CAMPO RESPONSABLE EN FRONTEND
 * 
 * Este script prueba que el campo responsable se envía correctamente
 * desde el frontend hacia el backend y se guarda en la base de datos.
 * 
 * INSTRUCCIONES:
 * 1. Abrir DevTools en el navegador (F12)
 * 2. Ir a la pestaña Console
 * 3. Pegar este código completo
 * 4. Ejecutar: testResponsableFrontend.ejecutarPruebaCompleta()
 */

const testResponsableFrontend = {
  
  // Configuración de la prueba
  config: {
    API_URL: 'http://localhost:8000/api',
    vendedorId: 'ID1',
    responsablePrueba: 'MARIA GONZALEZ - PRUEBA'
  },

  // 1. Probar envío de datos con responsable
  async probarEnvioConResponsable() {
    console.log('\n🧪 PROBANDO ENVÍO CON CAMPO RESPONSABLE');
    console.log('=' .repeat(50));
    
    const datosParaGuardar = {
      dia_semana: 'LUNES',
      vendedor_id: this.config.vendedorId,
      fecha: new Date().toISOString().split('T')[0],
      responsable: this.config.responsablePrueba,
      productos: [
        {
          producto_nombre: 'AREPA TIPO OBLEA 500Gr',
          cantidad: 5,
          dctos: 1,
          adicional: 0,
          devoluciones: 0,
          vencidas: 0,
          valor: 1600,
          vendedor: true,
          despachador: false,
          lotes_vencidos: []
        }
      ],
      pagos: [],
      resumen: {}
    };

    console.log('📤 Datos a enviar:', datosParaGuardar);

    try {
      // Usar el servicio de cargue si está disponible
      if (typeof cargueService !== 'undefined' && cargueService.guardarCargueCompleto) {
        console.log('✅ Usando cargueService.guardarCargueCompleto()');
        const resultado = await cargueService.guardarCargueCompleto(datosParaGuardar);
        
        if (resultado.error) {
          console.error('❌ Error en cargueService:', resultado.message);
          return false;
        }
        
        console.log('✅ Datos enviados exitosamente via cargueService');
        console.log('📥 Resultado:', resultado);
        return true;
        
      } else {
        // Envío directo si no hay servicio disponible
        console.log('⚠️ cargueService no disponible, enviando directamente');
        return await this.enviarDirectamente(datosParaGuardar);
      }
      
    } catch (error) {
      console.error('❌ Error en envío:', error);
      return false;
    }
  },

  // 2. Envío directo al endpoint
  async enviarDirectamente(datosParaGuardar) {
    const endpoint = `${this.config.API_URL}/cargue-id1/`;
    
    // Transformar datos al formato esperado por el backend
    const datosTransformados = {
      dia: datosParaGuardar.dia_semana,
      fecha: datosParaGuardar.fecha,
      usuario: datosParaGuardar.responsable || 'Sistema',
      responsable: datosParaGuardar.responsable || 'RESPONSABLE',  // ✅ Campo responsable
      activo: true,
      
      // Datos del primer producto (para prueba)
      producto: datosParaGuardar.productos[0].producto_nombre || '',
      cantidad: datosParaGuardar.productos[0].cantidad || 0,
      dctos: datosParaGuardar.productos[0].dctos || 0,
      adicional: datosParaGuardar.productos[0].adicional || 0,
      devoluciones: datosParaGuardar.productos[0].devoluciones || 0,
      vencidas: datosParaGuardar.productos[0].vencidas || 0,
      valor: datosParaGuardar.productos[0].valor || 0,
      v: datosParaGuardar.productos[0].vendedor || false,
      d: datosParaGuardar.productos[0].despachador || false,
      lotes_vencidos: JSON.stringify(datosParaGuardar.productos[0].lotes_vencidos || [])
    };

    console.log('📤 Enviando a:', endpoint);
    console.log('📦 Datos transformados:', datosTransformados);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosTransformados),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error HTTP:', response.status, errorText);
        return false;
      }

      const resultado = await response.json();
      console.log('✅ Respuesta exitosa:', resultado);
      
      // Verificar que el responsable se guardó correctamente
      if (resultado.responsable === this.config.responsablePrueba) {
        console.log('✅ Campo responsable guardado correctamente:', resultado.responsable);
        return resultado;
      } else {
        console.warn('⚠️ Campo responsable no coincide:', {
          enviado: this.config.responsablePrueba,
          recibido: resultado.responsable
        });
        return resultado;
      }

    } catch (error) {
      console.error('❌ Error de red:', error);
      return false;
    }
  },

  // 3. Verificar datos en la base de datos
  async verificarEnBaseDatos() {
    console.log('\n🔍 VERIFICANDO DATOS EN BASE DE DATOS');
    console.log('=' .repeat(50));

    try {
      const endpoint = `${this.config.API_URL}/cargue-id1/?responsable=${encodeURIComponent(this.config.responsablePrueba)}`;
      console.log('📡 Consultando:', endpoint);

      const response = await fetch(endpoint);
      
      if (!response.ok) {
        console.error('❌ Error consultando BD:', response.status);
        return false;
      }

      const datos = await response.json();
      console.log('📥 Datos encontrados:', datos);

      if (datos.results && datos.results.length > 0) {
        const registro = datos.results[0];
        console.log('✅ Registro encontrado:');
        console.log(`   - ID: ${registro.id}`);
        console.log(`   - Responsable: ${registro.responsable}`);
        console.log(`   - Producto: ${registro.producto}`);
        console.log(`   - Fecha: ${registro.fecha}`);
        return registro;
      } else {
        console.warn('⚠️ No se encontraron registros con ese responsable');
        return null;
      }

    } catch (error) {
      console.error('❌ Error verificando BD:', error);
      return false;
    }
  },

  // 4. Limpiar datos de prueba
  async limpiarDatosPrueba() {
    console.log('\n🧹 LIMPIANDO DATOS DE PRUEBA');
    console.log('=' .repeat(50));

    try {
      // Buscar registros de prueba
      const endpoint = `${this.config.API_URL}/cargue-id1/?responsable=${encodeURIComponent(this.config.responsablePrueba)}`;
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const datos = await response.json();
        
        if (datos.results && datos.results.length > 0) {
          for (const registro of datos.results) {
            try {
              const deleteResponse = await fetch(`${this.config.API_URL}/cargue-id1/${registro.id}/`, {
                method: 'DELETE'
              });
              
              if (deleteResponse.ok) {
                console.log(`✅ Registro ${registro.id} eliminado`);
              } else {
                console.warn(`⚠️ No se pudo eliminar registro ${registro.id}`);
              }
            } catch (error) {
              console.error(`❌ Error eliminando registro ${registro.id}:`, error);
            }
          }
        } else {
          console.log('ℹ️ No hay registros de prueba para limpiar');
        }
      }

    } catch (error) {
      console.error('❌ Error en limpieza:', error);
    }
  },

  // 5. Probar localStorage con responsable
  probarLocalStorage() {
    console.log('\n💾 PROBANDO LOCALSTORAGE CON RESPONSABLE');
    console.log('=' .repeat(50));

    const idSheet = this.config.vendedorId;
    const fechaHoy = new Date().toISOString().split('T')[0];
    const key = `cargue_LUNES_${idSheet}_${fechaHoy}`;

    const datosConResponsable = {
      dia: 'LUNES',
      idSheet: idSheet,
      fecha: fechaHoy,
      responsable: this.config.responsablePrueba,  // ✅ Campo responsable incluido
      productos: [
        {
          producto: 'AREPA TIPO OBLEA 500Gr',
          cantidad: 5,
          responsable: this.config.responsablePrueba
        }
      ],
      timestamp: Date.now(),
      sincronizado: false
    };

    try {
      // Guardar en localStorage
      localStorage.setItem(key, JSON.stringify(datosConResponsable));
      console.log('✅ Datos guardados en localStorage:', key);

      // Recuperar y verificar
      const datosRecuperados = JSON.parse(localStorage.getItem(key));
      
      if (datosRecuperados && datosRecuperados.responsable === this.config.responsablePrueba) {
        console.log('✅ Campo responsable recuperado correctamente:', datosRecuperados.responsable);
        console.log('📦 Datos completos:', datosRecuperados);
        return true;
      } else {
        console.error('❌ Campo responsable no se recuperó correctamente');
        return false;
      }

    } catch (error) {
      console.error('❌ Error con localStorage:', error);
      return false;
    }
  },

  // 6. Ejecutar prueba completa
  async ejecutarPruebaCompleta() {
    console.log('\n🚀 INICIANDO PRUEBA COMPLETA DEL CAMPO RESPONSABLE');
    console.log('=' .repeat(60));
    console.log(`📋 Responsable de prueba: "${this.config.responsablePrueba}"`);
    console.log(`📋 Vendedor: ${this.config.vendedorId}`);
    console.log('=' .repeat(60));

    const resultados = {
      localStorage: false,
      envio: false,
      verificacion: false,
      limpieza: false
    };

    try {
      // 1. Probar localStorage
      resultados.localStorage = this.probarLocalStorage();

      // 2. Probar envío
      resultados.envio = await this.probarEnvioConResponsable();

      // 3. Verificar en BD (solo si el envío fue exitoso)
      if (resultados.envio) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
        resultados.verificacion = await this.verificarEnBaseDatos();
      }

      // 4. Limpiar datos de prueba
      resultados.limpieza = await this.limpiarDatosPrueba();

    } catch (error) {
      console.error('❌ Error en prueba completa:', error);
    }

    // Mostrar resumen
    console.log('\n📊 RESUMEN DE RESULTADOS');
    console.log('=' .repeat(50));
    console.log(`💾 LocalStorage: ${resultados.localStorage ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📤 Envío: ${resultados.envio ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔍 Verificación BD: ${resultados.verificacion ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🧹 Limpieza: ${resultados.limpieza ? '✅ PASS' : '❌ FAIL'}`);

    const todoExitoso = Object.values(resultados).every(r => r);
    
    if (todoExitoso) {
      console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!');
      console.log('✅ El campo responsable funciona correctamente');
    } else {
      console.log('\n⚠️ ALGUNAS PRUEBAS FALLARON');
      console.log('❌ Revisar los errores arriba');
    }

    return resultados;
  }
};

// Mensaje de ayuda
console.log('🧪 SCRIPT DE PRUEBA DEL CAMPO RESPONSABLE CARGADO');
console.log('📋 Ejecutar: testResponsableFrontend.ejecutarPruebaCompleta()');
console.log('📋 O ejecutar pruebas individuales:');
console.log('   - testResponsableFrontend.probarLocalStorage()');
console.log('   - testResponsableFrontend.probarEnvioConResponsable()');
console.log('   - testResponsableFrontend.verificarEnBaseDatos()');