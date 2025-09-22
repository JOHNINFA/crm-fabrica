// Script para revisar datos del localStorage del módulo Cargue
// Ejecutar en la consola del navegador (F12)

console.log('🔍 REVISANDO DATOS DEL MÓDULO CARGUE - 22/09/2025');
console.log('='.repeat(60));

const fecha = '2025-09-22';
const dias = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
const ids = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];

let totalDatosEncontrados = 0;
let resumenCompleto = {};

dias.forEach(dia => {
  resumenCompleto[dia] = {};
  
  ids.forEach(id => {
    const key = `cargue_${dia}_${id}_${fecha}`;
    const datos = localStorage.getItem(key);
    
    if (datos) {
      try {
        const parsed = JSON.parse(datos);
        const productosConDatos = parsed.productos.filter(p => 
          p.cantidad > 0 || p.dctos > 0 || p.adicional > 0 || 
          p.devoluciones > 0 || p.vencidas > 0 || p.vendedor || p.despachador
        );
        
        if (productosConDatos.length > 0) {
          console.log(`📊 ${dia} - ${id}:`);
          console.log(`   Timestamp: ${new Date(parsed.timestamp).toLocaleString()}`);
          console.log(`   Sincronizado: ${parsed.sincronizado ? '✅' : '❌'}`);
          console.log(`   Productos con datos: ${productosConDatos.length}`);
          
          productosConDatos.forEach(p => {
            console.log(`   - ${p.producto}:`);
            console.log(`     Cantidad: ${p.cantidad}, Dctos: ${p.dctos}, Adicional: ${p.adicional}`);
            console.log(`     Devoluciones: ${p.devoluciones}, Vencidas: ${p.vencidas}`);
            console.log(`     Total: ${p.total}, Neto: $${p.neto?.toLocaleString()}`);
            console.log(`     V: ${p.vendedor ? '✅' : '❌'}, D: ${p.despachador ? '✅' : '❌'}`);
            if (p.lotesVencidos && p.lotesVencidos.length > 0) {
              console.log(`     Lotes vencidos: ${p.lotesVencidos.length}`);
            }
          });
          
          resumenCompleto[dia][id] = {
            productos: productosConDatos.length,
            totalNeto: productosConDatos.reduce((sum, p) => sum + (p.neto || 0), 0),
            sincronizado: parsed.sincronizado
          };
          
          totalDatosEncontrados++;
          console.log('   ' + '-'.repeat(40));
        }
      } catch (error) {
        console.error(`❌ Error parsing ${key}:`, error);
      }
    }
  });
});

// Revisar también datos de cumplimiento
console.log('\n🎯 DATOS DE CUMPLIMIENTO:');
console.log('='.repeat(40));

dias.forEach(dia => {
  ids.forEach(id => {
    const keyCumplimiento = `cumplimiento_${dia}_${id}_${fecha}`;
    const datosCumplimiento = localStorage.getItem(keyCumplimiento);
    
    if (datosCumplimiento) {
      try {
        const parsed = JSON.parse(datosCumplimiento);
        const itemsCompletos = Object.keys(parsed).filter(key => parsed[key]);
        
        if (itemsCompletos.length > 0) {
          console.log(`📋 ${dia} - ${id}: ${itemsCompletos.length} items completados`);
          itemsCompletos.forEach(item => {
            console.log(`   ${item}: ${parsed[item]}`);
          });
        }
      } catch (error) {
        console.error(`❌ Error parsing cumplimiento ${keyCumplimiento}:`, error);
      }
    }
  });
});

// Revisar estados de botones
console.log('\n🔘 ESTADOS DE BOTONES:');
console.log('='.repeat(40));

dias.forEach(dia => {
  const estadoBoton = localStorage.getItem(`estado_boton_${dia}_${fecha}`);
  const estadoDespacho = localStorage.getItem(`estado_despacho_${dia}_${fecha}`);
  
  if (estadoBoton || estadoDespacho) {
    console.log(`🔘 ${dia}:`);
    if (estadoBoton) console.log(`   Estado botón: ${estadoBoton}`);
    if (estadoDespacho) console.log(`   Estado despacho: ${estadoDespacho}`);
  }
});

// Resumen final
console.log('\n📈 RESUMEN FINAL:');
console.log('='.repeat(40));
console.log(`Total de registros encontrados: ${totalDatosEncontrados}`);

let totalGeneral = 0;
Object.keys(resumenCompleto).forEach(dia => {
  const datosDia = resumenCompleto[dia];
  if (Object.keys(datosDia).length > 0) {
    console.log(`\n${dia}:`);
    Object.keys(datosDia).forEach(id => {
      const datos = datosDia[id];
      console.log(`  ${id}: ${datos.productos} productos, $${datos.totalNeto.toLocaleString()} ${datos.sincronizado ? '✅' : '❌'}`);
      totalGeneral += datos.totalNeto;
    });
  }
});

console.log(`\n💰 TOTAL GENERAL: $${totalGeneral.toLocaleString()}`);
console.log('\n✅ Revisión completada');