// Script para probar la independencia de datos entre días, fechas e IDs
// Ejecutar en la consola del navegador

console.log('🧪 PRUEBA DE INDEPENDENCIA DE DATOS');
console.log('='.repeat(50));

// Función para crear datos de prueba
const crearDatosPrueba = (dia, id, fecha, cantidad) => {
  const key = `cargue_${dia}_${id}_${fecha}`;
  const datos = {
    dia: dia,
    idSheet: id,
    fecha: fecha,
    productos: [
      {
        id: 1,
        producto: "AREPA TIPO OBLEA 500Gr",
        cantidad: cantidad,
        dctos: 0,
        adicional: 0,
        devoluciones: 0,
        vencidas: 0,
        total: cantidad,
        valor: 1625,
        neto: cantidad * 1625,
        vendedor: false,
        despachador: false
      }
    ],
    timestamp: Date.now(),
    sincronizado: false
  };
  
  localStorage.setItem(key, JSON.stringify(datos));
  console.log(`✅ Creado: ${key} - Cantidad: ${cantidad}`);
  return key;
};

// Crear datos de prueba para diferentes combinaciones
console.log('\n📝 CREANDO DATOS DE PRUEBA:');
console.log('-'.repeat(30));

const clavesPrueba = [
  // Mismo día, diferentes IDs, misma fecha
  crearDatosPrueba('LUNES', 'ID1', '2025-01-20', 10),
  crearDatosPrueba('LUNES', 'ID2', '2025-01-20', 20),
  crearDatosPrueba('LUNES', 'ID3', '2025-01-20', 30),
  
  // Mismo ID, diferentes días, misma fecha
  crearDatosPrueba('LUNES', 'ID1', '2025-01-20', 10),
  crearDatosPrueba('MARTES', 'ID1', '2025-01-20', 40),
  crearDatosPrueba('MIERCOLES', 'ID1', '2025-01-20', 50),
  
  // Mismo día, mismo ID, diferentes fechas
  crearDatosPrueba('LUNES', 'ID1', '2025-01-20', 10),
  crearDatosPrueba('LUNES', 'ID1', '2025-01-21', 60),
  crearDatosPrueba('LUNES', 'ID1', '2025-01-22', 70),
];

// Verificar independencia
console.log('\n🔍 VERIFICANDO INDEPENDENCIA:');
console.log('-'.repeat(30));

// Test 1: Diferentes IDs, mismo día y fecha
console.log('\n📊 Test 1: Diferentes IDs, mismo día y fecha');
const testKeys1 = [
  'cargue_LUNES_ID1_2025-01-20',
  'cargue_LUNES_ID2_2025-01-20', 
  'cargue_LUNES_ID3_2025-01-20'
];

testKeys1.forEach(key => {
  const datos = JSON.parse(localStorage.getItem(key));
  const cantidad = datos.productos[0].cantidad;
  console.log(`  ${key}: Cantidad = ${cantidad}`);
});

// Test 2: Mismo ID, diferentes días
console.log('\n📊 Test 2: Mismo ID, diferentes días, misma fecha');
const testKeys2 = [
  'cargue_LUNES_ID1_2025-01-20',
  'cargue_MARTES_ID1_2025-01-20',
  'cargue_MIERCOLES_ID1_2025-01-20'
];

testKeys2.forEach(key => {
  const datos = JSON.parse(localStorage.getItem(key));
  const cantidad = datos.productos[0].cantidad;
  console.log(`  ${key}: Cantidad = ${cantidad}`);
});

// Test 3: Mismo día e ID, diferentes fechas
console.log('\n📊 Test 3: Mismo día e ID, diferentes fechas');
const testKeys3 = [
  'cargue_LUNES_ID1_2025-01-20',
  'cargue_LUNES_ID1_2025-01-21',
  'cargue_LUNES_ID1_2025-01-22'
];

testKeys3.forEach(key => {
  const datos = JSON.parse(localStorage.getItem(key));
  const cantidad = datos.productos[0].cantidad;
  console.log(`  ${key}: Cantidad = ${cantidad}`);
});

// Verificar que no hay contaminación cruzada
console.log('\n✅ VERIFICACIÓN DE NO CONTAMINACIÓN:');
console.log('-'.repeat(40));

let contaminacionDetectada = false;

// Verificar que cada clave tiene su valor esperado
const valoresEsperados = {
  'cargue_LUNES_ID1_2025-01-20': 10,
  'cargue_LUNES_ID2_2025-01-20': 20,
  'cargue_LUNES_ID3_2025-01-20': 30,
  'cargue_MARTES_ID1_2025-01-20': 40,
  'cargue_MIERCOLES_ID1_2025-01-20': 50,
  'cargue_LUNES_ID1_2025-01-21': 60,
  'cargue_LUNES_ID1_2025-01-22': 70
};

Object.keys(valoresEsperados).forEach(key => {
  const datos = JSON.parse(localStorage.getItem(key));
  const cantidadActual = datos.productos[0].cantidad;
  const cantidadEsperada = valoresEsperados[key];
  
  if (cantidadActual === cantidadEsperada) {
    console.log(`✅ ${key}: OK (${cantidadActual})`);
  } else {
    console.log(`❌ ${key}: ERROR - Esperado: ${cantidadEsperada}, Actual: ${cantidadActual}`);
    contaminacionDetectada = true;
  }
});

// Resultado final
console.log('\n🎯 RESULTADO FINAL:');
console.log('='.repeat(30));

if (contaminacionDetectada) {
  console.log('❌ FALLA: Se detectó contaminación entre datos');
  console.log('   Los datos NO son independientes');
} else {
  console.log('✅ ÉXITO: Todos los datos son independientes');
  console.log('   Cada combinación DIA_ID_FECHA mantiene sus datos separados');
}

// Limpiar datos de prueba
console.log('\n🧹 LIMPIANDO DATOS DE PRUEBA...');
Object.keys(valoresEsperados).forEach(key => {
  localStorage.removeItem(key);
  console.log(`🗑️ Eliminado: ${key}`);
});

console.log('\n✅ Prueba completada');