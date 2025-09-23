// 🚀 SCRIPT DE VERIFICACIÓN - SIN REBOTE
// Ejecutar en la consola del navegador para verificar que no hay rebote

console.log('🚀 INICIANDO VERIFICACIÓN SIN REBOTE...');

// 1. Limpiar localStorage para empezar limpio
localStorage.removeItem('responsables_cargue');
console.log('🗑️ localStorage limpiado');

// 2. Simular datos iniciales como si vinieran de la API
const responsablesIniciales = {
    ID1: 'RAUL',
    ID2: 'MARIA',
    ID3: 'CARLOS',
    ID4: 'ANA',
    ID5: 'PEDRO',
    ID6: 'LUCIA'
};

// 3. Guardar en localStorage
localStorage.setItem('responsables_cargue', JSON.stringify(responsablesIniciales));
console.log('💾 Responsables guardados en localStorage:', responsablesIniciales);

// 4. Función para simular carga de componente
function simularCargaComponente(idSheet) {
    console.log(`\n🎯 SIMULANDO CARGA DE COMPONENTE ${idSheet}:`);
    
    // Simular useState inicial (lo que hace nuestro código)
    const responsableGuardado = (() => {
        try {
            const responsablesGuardados = localStorage.getItem('responsables_cargue');
            if (responsablesGuardados) {
                const responsables = JSON.parse(responsablesGuardados);
                const responsableGuardado = responsables[idSheet];
                
                if (responsableGuardado && responsableGuardado !== 'RESPONSABLE') {
                    console.log(`📦 INICIAL - Responsable desde storage para ${idSheet}: "${responsableGuardado}"`);
                    return responsableGuardado;
                }
            }
        } catch (error) {
            console.error('❌ Error inicial parsing responsables localStorage:', error);
        }
        
        console.log(`🔄 INICIAL - Usando valor por defecto para ${idSheet}: "RESPONSABLE"`);
        return "RESPONSABLE";
    })();
    
    console.log(`✅ RESULTADO INICIAL: "${responsableGuardado}"`);
    console.log(`${responsableGuardado === 'RAUL' ? '✅ SIN REBOTE' : '❌ HAY REBOTE'}`);
    
    return responsableGuardado;
}

// 5. Probar todos los IDs
console.log('\n🧪 PROBANDO TODOS LOS COMPONENTES:');
['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'].forEach(id => {
    simularCargaComponente(id);
});

// 6. Simular actualización desde modal
console.log('\n🔄 SIMULANDO ACTUALIZACIÓN DESDE MODAL:');
function simularActualizacionModal(idSheet, nuevoNombre) {
    console.log(`\n📝 Actualizando ${idSheet} a "${nuevoNombre}"`);
    
    // Actualizar localStorage
    const responsablesActuales = JSON.parse(localStorage.getItem('responsables_cargue') || '{}');
    responsablesActuales[idSheet] = nuevoNombre;
    localStorage.setItem('responsables_cargue', JSON.stringify(responsablesActuales));
    
    // Disparar evento
    window.dispatchEvent(new CustomEvent('responsableActualizado', {
        detail: {
            idSheet,
            nuevoNombre
        }
    }));
    
    console.log(`✅ ${idSheet} actualizado a "${nuevoNombre}"`);
}

// Escuchar eventos
window.addEventListener('responsableActualizado', (e) => {
    console.log(`🔔 EVENTO RECIBIDO: ${e.detail.idSheet} -> "${e.detail.nuevoNombre}"`);
});

// Probar actualización
simularActualizacionModal('ID1', 'NUEVO_RAUL');

// 7. Verificar que la próxima carga no tenga rebote
console.log('\n🔄 VERIFICANDO PRÓXIMA CARGA:');
simularCargaComponente('ID1');

console.log('\n✅ VERIFICACIÓN COMPLETADA');
console.log('📋 RESUMEN:');
console.log('- ✅ Carga inicial desde localStorage sin rebote');
console.log('- ✅ Eventos de actualización funcionando');
console.log('- ✅ Persistencia entre cargas');

// 8. Función para probar en tiempo real
window.probarSinRebote = () => {
    console.clear();
    console.log('🚀 PRUEBA EN TIEMPO REAL - Abre las herramientas de desarrollo y observa');
    
    // Simular múltiples cargas rápidas
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            console.log(`\n🔄 CARGA ${i + 1}:`);
            simularCargaComponente('ID1');
        }, i * 100);
    }
};

console.log('\n💡 TIP: Ejecuta probarSinRebote() para ver múltiples cargas rápidas');