/**
 * Orden oficial de productos en el Cargue, por día e ID.
 * Este orden replica exactamente el que muestra la tabla del Cargue.
 * Los nombres deben coincidir con los devueltos por /obtener-cargue/.
 */

const ORDEN_LUNES_ID1 = [
  "AREPA TIPO OBLEA",
  "AREPA MEDIANA",
  "AREPA TIPO PINCHO",
  "AREPA QUESO 450 G",
  "AREPA QUESO ESP/GRANDE",
  "AREPA QUESO ESP/PEQUEÑA",
  "AREPA QUESO MINI X10",
  "AREPA CON QUESO CUADRADA X5 UND",
  "AREPA CHOCLO 300Gr",
  "AREPA CHOCLO QUESO GRANDE",
  "AREPA CHOCLO QUESO PEQUEÑA",
  "AREPA BOYACENSE UND",
  "AREPA SANTANDEREANA",
  "ALMOJABANA UND",
  "AREPA CON SEMILLAS DE QUINUA",
  "AREPA CON SEMILLAS DE CHIA",
  "AREPA CON SEMILLAS DE AJONJOLI",
  "AREPA CON SEMILLAS DE LINAZA",
  "AREPA CON SEMILLAS DE GIRASOL",
  "AREPA CHORICERA",
  "AREPA LONCHERIA X10 UND",
  "AREPA CON MARGARINA Y SAL",
  "YUCAREPA",
  "AREPA TIPO ASADERO X10 UND",
  "AREPA PARA RELLENAR #1",
  "AREPA PARA RELLENA #2",
  "AREPA PARA RELLENAR #3",
  "PORCIÓN DE AREPAS X2",
  "PORCIÓN DE AREPAS X3",
  "PORCIÓN DE AREPAS X4",
  "PORCIÓN DE AREPAS X5",
  "AREPA SUPER OBLEA",
  "LIBRA MASA",
  "MUTE BOYACENSE XLB",
  "ENVUELTOS DE MAIZ X 5 UND",
  "CANASTILLA",
];

/**
 * Dado un array de productos (con campo .producto) y el día e ID,
 * devuelve el array ordenado igual que la tabla del Cargue.
 * Los productos que no están en la plantilla van al final.
 */
export function ordenarComoEnCargue(cargueDatos, dia, idSheet) {
  // Por ahora usamos el orden de LUNES/ID1 como referencia base.
  // Se puede expandir para otros días/IDs cuando se tenga el orden.
  let ordenRef = ORDEN_LUNES_ID1;

  // Crear mapa de posición: nombre normalizado → índice
  const posMap = {};
  ordenRef.forEach((nombre, i) => {
    posMap[normalizarParaOrden(nombre)] = i;
  });

  return [...cargueDatos].sort((a, b) => {
    const posA = posMap[normalizarParaOrden(a.producto)] ?? 9999;
    const posB = posMap[normalizarParaOrden(b.producto)] ?? 9999;
    return posA - posB;
  });
}

function normalizarParaOrden(str) {
  return (str || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
