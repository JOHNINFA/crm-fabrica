/**
 * 🧪 SCRIPT DE PRUEBA - RESPONSABLE EN NAVEGADOR
 * 
 * Este script se ejecuta directamente en la consola del navegador
 * para probar la funcionalidad de actualizar responsables.
 * 
 * INSTRUCCIONES:
 * 1. Abrir la aplicación en el navegador (localhost:3000)
 * 2. Abrir DevTools (F12) → Console
 * 3. Pegar este código completo
 * 4. Ejecutar: testResponsableNavegador.probarActualizacion()
 */

const testResponsableNavegador = {
  
  config: {
    API_URL: 'http://localhost:8000/api',
    idVendedor: 'ID1',
    responsablePrueba: 'JUAN CARLOS - NAVEGADOR'
  },

  // 1. Probar actualización directa al endpoint
  async probarActualizacionDirecta() {
    console.log('\n🧪 PROBANDO ACTUALIZACIÓN DIRECTA AL ENDPOINT');
    console.log('=' .repeat(50));
    
    const url = `${this.config.API_URL}/vendedores/actualizar_responsable/`;
    const datos = {
      id_vendedor: this.config.idVendedor,
      responsable: this.config.responsablePrueba
    };

    try {
      console.log('📤 Enviando a:', url);
      console.log('📦 Datos:', datos);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datos)
      });

      console.log('📥 Status:', response.status);
      
      if (response.ok) {
        const resultado = await response.json();
        console.log('✅ Respuesta exitosa:', resultado);
        return true;
      } else {
        const error = await response.text();
        console.error('❌ Error en respuesta:', error);
        return false;
      }

    } catch (error) {
      console.error('❌ Error de red:', error);
      return false;
    }
  },

  // 2. Probar usando el contexto de vendedores (si está disponible)
  async probarConContexto() {
    console.log('\n🔄 PROBANDO CON CONTEXTO DE VENDEDORES');
    console.log('=' .repeat(50));

    // Verificar si el contexto está disponible
    if (typeof useVendedores === 'undefined') {
      console.warn('⚠️ useVendedores no está disponible en el scope global');
      console.log('ℹ️ Esto es normal, el contexto solo está disponible dentro de componentes React');
      return false;
    }

    try {
      const { actualizarResponsable } = useVendedores();
      const resultado = await actualizarResponsable(this.config.idVendedor, this.config.responsablePrueba);
      
      if (resultado.success) {
        console.log('✅ Actualización via contexto exitosa:', resultado);
        return true;
      } else {
        console.error('❌ Error en contexto:', resultado);
        return false;
      }

    } catch (error) {
      console.error('❌ Error usando contexto:', error);
      return false;
    }
  },

  // 3. Probar localStorage (responsableStorage)
  probarResponsableStorage() {
    console.log('\n💾 PROBANDO RESPONSABLE STORAGE');
    console.log('=' .repeat(50));

    try {
      // Verificar si responsableStorage está disponible
      if (typeof responsableStorage !== 'undefined') {
        console.log('✅ responsableStorage disponible');
        
        // Guardar
        responsableStorage.set(this.config.idVendedor, this.config.responsablePrueba);
        console.log(`💾 Guardado: ${this.config.idVendedor} = ${this.config.responsablePrueba}`);
        
        // Recuperar
        const recuperado = responsableStorage.get(this.config.idVendedor);
        console.log(`📥 Recuperado: ${recuperado}`);
        
        if (recuperado === this.config.responsablePrueba) {
          console.log('✅ localStorage funciona correctamente');
          return true;
        } else {
          console.error('❌ Datos no coinciden en localStorage');
          return false;
        }
        
      } else {
        console.warn('⚠️ responsableStorage no está disponible');
        console.log('ℹ️ Probando con localStorage directo...');
        
        // Probar localStorage directo
        const key = `responsable_${this.config.idVendedor}`;
        localStorage.setItem(key, this.config.responsablePrueba);
        const recuperado = localStorage.getItem(key);
        
        if (recuperado === this.config.responsablePrueba) {
          console.log('✅ localStorage directo funciona');
          return true;
        } else {
          console.error('❌ localStorage directo falló');
          return false;
        }
      }

    } catch (error) {
      console.error('❌ Error con localStorage:', error);
      return false;
    }
  },

  // 4. Simular el flujo completo de edición
  async simularEdicionCompleta() {
    console.log('\n🎭 SIMULANDO FLUJO COMPLETO DE EDICIÓN');
    console.log('=' .repeat(50));

    try {
      // 1. Actualizar en BD
      console.log('1️⃣ Actualizando en base de datos...');
      const actualizacionBD = await this.probarActualizacionDirecta();
      
      if (!actualizacionBD) {
        console.error('❌ Falló actualización en BD');
        return false;
      }

      // 2. Actualizar localStorage
      console.log('2️⃣ Actualizando localStorage...');
      const actualizacionLS = this.probarResponsableStorage();
      
      if (!actualizacionLS) {
        console.error('❌ Falló actualización en localStorage');
        return false;
      }

      // 3. Disparar evento personalizado (como lo hace el sistema real)
      console.log('3️⃣ Disparando evento personalizado...');
      const evento = new CustomEvent('responsableActualizado', {
        detail: {
          idSheet: this.config.idVendedor,
          nuevoNombre: this.config.responsablePrueba
        }
      });
      
      window.dispatchEvent(evento);
      console.log('✅ Evento disparado');

      console.log('\n🎉 FLUJO COMPLETO EXITOSO');
      return true;

    } catch (error) {
      console.error('❌ Error en flujo completo:', error);
      return false;
    }
  },

  // 5. Verificar estado actual
  async verificarEstadoActual() {
    console.log('\n🔍 VERIFICANDO ESTADO ACTUAL');
    console.log('=' .repeat(50));

    try {
      // Verificar en BD
      const url = `${this.config.API_URL}/vendedores/obtener_responsable/?id_vendedor=${this.config.idVendedor}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Estado en BD:', data.responsable);
      } else {
        console.error('❌ Error consultando BD');
      }

      // Verificar en localStorage
      const key = `responsable_${this.config.idVendedor}`;
      const enLS = localStorage.getItem(key);
      console.log('💾 Estado en localStorage:', enLS);

      // Verificar en DOM (si hay elementos visibles)
      const elementosResponsable = document.querySelectorAll('[data-testid*="responsable"], .responsable, [class*="responsable"]');
      if (elementosResponsable.length > 0) {
        console.log('🎨 Elementos en DOM encontrados:', elementosResponsable.length);
        elementosResponsable.forEach((el, i) => {
          console.log(`   ${i + 1}. ${el.tagName}: "${el.textContent.trim()}"`);
        });
      } else {
        console.log('🎨 No se encontraron elementos de responsable en DOM');
      }

    } catch (error) {
      console.error('❌ Error verificando estado:', error);
    }
  },

  // 6. Ejecutar todas las pruebas
  async probarTodo() {
    console.log('\n🚀 INICIANDO PRUEBAS COMPLETAS DE RESPONSABLE');
    console.log('=' .repeat(60));
    console.log(`📋 Vendedor: ${this.config.idVendedor}`);
    console.log(`📋 Responsable de prueba: "${this.config.responsablePrueba}"`);
    console.log('=' .repeat(60));

    const resultados = {
      directa: false,
      contexto: false,
      localStorage: false,
      flujoCompleto: false
    };

    // Ejecutar pruebas
    resultados.directa = await this.probarActualizacionDirecta();
    resultados.contexto = await this.probarConContexto();
    resultados.localStorage = this.probarResponsableStorage();
    resultados.flujoCompleto = await this.simularEdicionCompleta();

    // Verificar estado final
    await this.verificarEstadoActual();

    // Resumen
    console.log('\n📊 RESUMEN DE RESULTADOS');
    console.log('=' .repeat(50));
    console.log(`🌐 Actualización directa: ${resultados.directa ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔄 Contexto React: ${resultados.contexto ? '✅ PASS' : '⚠️ N/A'}`);
    console.log(`💾 LocalStorage: ${resultados.localStorage ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🎭 Flujo completo: ${resultados.flujoCompleto ? '✅ PASS' : '❌ FAIL'}`);

    const exitosos = Object.values(resultados).filter(r => r === true).length;
    const total = Object.values(resultados).length;

    if (exitosos >= 3) {
      console.log('\n🎉 ¡PRUEBAS MAYORMENTE EXITOSAS!');
      console.log('✅ La funcionalidad de responsables debería funcionar');
    } else {
      console.log('\n⚠️ ALGUNAS PRUEBAS FALLARON');
      console.log('❌ Revisar la configuración');
    }

    return resultados;
  }
};

// Mensaje de ayuda
console.log('🧪 SCRIPT DE PRUEBA DE RESPONSABLES CARGADO');
console.log('📋 Comandos disponibles:');
console.log('   testResponsableNavegador.probarTodo() - Ejecutar todas las pruebas');
console.log('   testResponsableNavegador.probarActualizacionDirecta() - Solo endpoint');
console.log('   testResponsableNavegador.verificarEstadoActual() - Ver estado actual');
console.log('   testResponsableNavegador.simularEdicionCompleta() - Simular edición completa');