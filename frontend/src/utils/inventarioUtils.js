// Obtener fecha actual en formato DD/MM/YYYY
export const getFechaHoy = () => {
  const hoy = new Date();
  return hoy.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const getFechaCorta = () => {
  const hoy = new Date();
  return hoy.toLocaleDateString('es-ES');
};

// Función para generar ID único para movimientos
export const generarIdMovimiento = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Obtener color para badge según existencias
export const getExistenciasBadge = (existencias) => {
  if (existencias > 100) return 'bg-success';
  if (existencias > 10) return 'bg-warning';
  return 'bg-danger';
};

// Crear nuevo día si no existe
export const crearNuevoDia = (fecha, historialInventario) => {
  // Obtener productos del día anterior si existe
  const ultimoDia = historialInventario[historialInventario.length - 1];
  const productosBase = ultimoDia ?
    ultimoDia.productos.map(p => ({ ...p, cantidad: 0 })) :
    [
      { id: 1, nombre: 'AREPA MEDIANA', existencias: 500, cantidad: 0 },
      { id: 2, nombre: 'AREPA TIPO OBLEAS 500GR', existencias: 16, cantidad: 0 },
      { id: 3, nombre: 'Bolsa', existencias: 6, cantidad: 0 },
    ];

  return {
    fecha,
    productos: productosBase,
    movimientos: []
  };
};

// Cargar historial desde localStorage o crear uno nuevo
export const getInitialHistorial = () => {
  const saved = localStorage.getItem('inventario-historial');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  }

  // Crear historial inicial con datos por defecto
  const fechaHoy = getFechaCorta();
  const fechaAyer = new Date();
  fechaAyer.setDate(fechaAyer.getDate() - 1);
  const fechaAyerStr = fechaAyer.toLocaleDateString('es-ES');

  return [
    {
      fecha: fechaAyerStr,
      productos: [
        { id: 1, nombre: 'AREPA MEDIANA', existencias: 480, cantidad: 0 },
        { id: 2, nombre: 'AREPA TIPO OBLEAS 500GR', existencias: 12, cantidad: 0 },
        { id: 3, nombre: 'Bolsa', existencias: 8, cantidad: 0 },
      ],
      movimientos: [
        {
          id: 'demo1',
          productoId: 1,
          productoNombre: 'AREPA MEDIANA',
          tipo: 'entrada',
          cantidadAnterior: 450,
          cantidadNueva: 480,
          diferencia: 30,
          fecha: fechaAyerStr,
          hora: '09:15:00',
          usuario: 'María González'
        },
        {
          id: 'demo2',
          productoId: 2,
          productoNombre: 'AREPA TIPO OBLEAS 500GR',
          tipo: 'ajuste',
          cantidadAnterior: 10,
          cantidadNueva: 12,
          diferencia: 2,
          fecha: fechaAyerStr,
          hora: '14:30:00',
          usuario: 'Carlos Pérez'
        }
      ]
    },
    {
      fecha: fechaHoy,
      productos: [
        { id: 1, nombre: 'AREPA MEDIANA', existencias: 500, cantidad: 0 },
        { id: 2, nombre: 'AREPA TIPO OBLEAS 500GR', existencias: 16, cantidad: 0 },
        { id: 3, nombre: 'Bolsa', existencias: 6, cantidad: 0 },
      ],
      movimientos: []
    }
  ];
};