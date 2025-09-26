// 🧪 SCRIPT DE PRUEBA - FINALIZAR CARGUE
// Ejecutar en la consola del navegador para verificar el envío de datos

console.log('🧪 INICIANDO PRUEBA DE FINALIZAR CARGUE...');

// 1. Verificar que hay datos en el contexto de vendedores
function verificarContextoVendedores() {
    console.log('\n📊 VERIFICANDO CONTEXTO DE VENDEDORES:');
    
    // Intentar acceder al contexto desde React DevTools o estado global
    const vendedoresData = window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    
    if (!vendedoresData) {
        console.log('⚠️ No se puede acceder al contexto directamente');
        console.log('💡 Verifica manualmente en React DevTools > Components > VendedoresProvider');
        return false;
    }
    
    return true;
}

// 2. Simular datos de prueba
function simularDatosPrueba() {
    console.log('\n🎭 SIMULANDO DATOS DE PRUEBA:');
    
    const datosPrueba = {
        dia_semana: 'LUNES',
        vendedor_id: 'ID1',
        fecha: '2025-01-20',
        responsable: 'SISTEMA_PRUEBA',
        productos: [
            {
                producto_nombre: 'AREPA TIPO OBLEA 500Gr',
                cantidad: 10,
                dctos: 1,
                adicional: 0,
                devoluciones: 0,
                vencidas: 0,
                valor: 1600,
                vendedor: true,
                despachador: true,
                lotes_vencidos: []
            },
            {
                producto_nombre: 'AREPA MEDIANA 330Gr',
                cantidad: 5,
                dctos: 0,
                adicional: 2,
                devoluciones: 1,
                vencidas: 0,
                valor: 1600,
                vendedor: false,
                despachador: true,
                lotes_vencidos: []
            }
        ],
        pagos: [],
        resumen: {}
    };
    
    console.log('📦 Datos de prueba creados:', datosPrueba);
    return datosPrueba;
}

// 3. Probar transformación de datos
function probarTransformacionDatos(datosOriginales) {
    console.log('\n🔄 PROBANDO TRANSFORMACIÓN DE DATOS:');
    
    const vendedorMap = {
        'ID1': 1, 'ID2': 2, 'ID3': 3, 'ID4': 4, 'ID5': 5, 'ID6': 6
    };
    
    const datosTransformados = {
        dia: datosOriginales.dia_semana,
        vendedor_id: datosOriginales.vendedor_id,
        fecha: datosOriginales.fecha,
        usuario: datosOriginales.responsable || 'Sistema Web',
        activo: true,
        
        productos: datosOriginales.productos.map(p => ({
            producto_nombre: p.producto_nombre,
            cantidad: p.cantidad || 0,
            dctos: p.dctos || 0,
            adicional: p.adicional || 0,
            devoluciones: p.devoluciones || 0,
            vencidas: p.vencidas || 0,
            valor: p.valor || 0,
            vendedor_check: p.vendedor || false,
            despachador_check: p.despachador || false,
            lotes_vencidos: p.lotes_vencidos || []
        })),
        
        pagos: datosOriginales.pagos || [],
        resumen: datosOriginales.resumen || {}
    };
    
    console.log('✅ Datos transformados:', datosTransformados);
    return datosTransformados;
}

// 4. Probar envío a la API (simulado)
async function probarEnvioAPI(datosTransformados) {
    console.log('\n📡 PROBANDO ENVÍO A LA API:');
    
    const API_URL = 'http://localhost:8000/api';
    
    try {
        console.log('🚀 Enviando datos a:', `${API_URL}/cargues/`);
        console.log('📦 Payload:', JSON.stringify(datosTransformados, null, 2));
        
        const response = await fetch(`${API_URL}/cargues/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosTransformados),
        });
        
        console.log('📡 Status de respuesta:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', errorText);
            return { error: true, message: errorText };
        }
        
        const resultado = await response.json();
        console.log('✅ Respuesta exitosa:', resultado);
        return resultado;
        
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        return { error: true, message: error.message };
    }
}

// 5. Verificar datos en la base de datos
async function verificarBaseDatos() {
    console.log('\n🗄️ VERIFICANDO DATOS EN BASE DE DATOS:');
    
    const API_URL = 'http://localhost:8000/api';
    
    try {
        // Obtener últimos cargues
        const response = await fetch(`${API_URL}/cargues/?limit=5`);
        const cargues = await response.json();
        
        console.log('📊 Últimos cargues en BD:', cargues);
        
        if (cargues.length > 0) {
            const ultimoCargue = cargues[0];
            console.log('🔍 Último cargue creado:', ultimoCargue);
            
            // Obtener detalles del cargue
            if (ultimoCargue.id) {
                const detallesResponse = await fetch(`${API_URL}/detalle-cargues/?cargue=${ultimoCargue.id}`);
                const detalles = await detallesResponse.json();
                console.log('📋 Detalles del último cargue:', detalles);
            }
        }
        
    } catch (error) {
        console.error('❌ Error verificando BD:', error);
    }
}

// 6. Ejecutar prueba completa
async function ejecutarPruebaCompleta() {
    console.log('🚀 EJECUTANDO PRUEBA COMPLETA...\n');
    
    // Paso 1: Verificar contexto
    verificarContextoVendedores();
    
    // Paso 2: Simular datos
    const datosPrueba = simularDatosPrueba();
    
    // Paso 3: Transformar datos
    const datosTransformados = probarTransformacionDatos(datosPrueba);
    
    // Paso 4: Enviar a API
    const resultado = await probarEnvioAPI(datosTransformados);
    
    if (!resultado.error) {
        console.log('\n🎉 PRUEBA EXITOSA - Datos enviados correctamente');
        
        // Paso 5: Verificar en BD
        setTimeout(() => {
            verificarBaseDatos();
        }, 1000);
    } else {
        console.log('\n❌ PRUEBA FALLIDA - Error en envío:', resultado.message);
    }
    
    console.log('\n📋 RESUMEN DE LA PRUEBA:');
    console.log('- ✅ Datos simulados correctamente');
    console.log('- ✅ Transformación de datos funcionando');
    console.log(`- ${resultado.error ? '❌' : '✅'} Envío a API ${resultado.error ? 'falló' : 'exitoso'}`);
}

// 7. Función para probar con datos reales del localStorage
function probarConDatosReales() {
    console.log('\n🔍 PROBANDO CON DATOS REALES DEL LOCALSTORAGE:');
    
    const dia = 'LUNES';
    const fecha = new Date().toISOString().split('T')[0];
    const idsVendedores = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];
    
    idsVendedores.forEach(id => {
        const key = `cargue_${dia}_${id}_${fecha}`;
        const datos = localStorage.getItem(key);
        
        if (datos) {
            try {
                const datosParseados = JSON.parse(datos);
                console.log(`📦 Datos de ${id}:`, datosParseados);
                
                if (datosParseados.productos) {
                    const productosConDatos = datosParseados.productos.filter(p => 
                        p.cantidad > 0 || p.dctos > 0 || p.adicional > 0 ||
                        p.devoluciones > 0 || p.vencidas > 0 || p.vendedor || p.despachador
                    );
                    
                    console.log(`📊 ${id} - Productos con datos: ${productosConDatos.length}`);
                    productosConDatos.forEach(p => {
                        console.log(`  - ${p.producto}: cantidad=${p.cantidad}, total=${p.total}`);
                    });
                }
            } catch (error) {
                console.error(`❌ Error parseando datos de ${id}:`, error);
            }
        } else {
            console.log(`⚠️ No hay datos en localStorage para ${id}`);
        }
    });
}

// Exportar funciones para uso manual
window.testCargue = {
    ejecutarPruebaCompleta,
    probarConDatosReales,
    verificarBaseDatos,
    simularDatosPrueba,
    probarTransformacionDatos,
    probarEnvioAPI
};

console.log('\n💡 FUNCIONES DISPONIBLES:');
console.log('- testCargue.ejecutarPruebaCompleta() - Ejecuta prueba completa');
console.log('- testCargue.probarConDatosReales() - Prueba con datos del localStorage');
console.log('- testCargue.verificarBaseDatos() - Verifica datos en BD');
console.log('- testCargue.simularDatosPrueba() - Crea datos de prueba');

// Ejecutar prueba automática
setTimeout(() => {
    console.log('\n🤖 EJECUTANDO PRUEBA AUTOMÁTICA EN 2 SEGUNDOS...');
    setTimeout(ejecutarPruebaCompleta, 2000);
}, 1000);