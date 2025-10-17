// cajaService.js - Servicio para gestión de caja

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Configuración de headers para las peticiones
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  // Agregar token de autenticación si es necesario
  // 'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const cajaService = {
  /**
   * Obtener resumen de ventas del día por método de pago
   */
  getResumenVentasDelDia: async (fecha = null) => {
    try {
      const fechaConsulta = fecha || new Date().toISOString().split('T')[0];
      
      const response = await fetch(`${API_URL}/ventas/?fecha_inicio=${fechaConsulta}&fecha_fin=${fechaConsulta}`);
      
      if (!response.ok) {
        throw new Error(`Error al obtener ventas: ${response.status}`);
      }
      
      const ventas = await response.json();
      
      // Agrupar por método de pago
      const resumenPorMetodo = {
        efectivo: 0,
        tarjetas: 0,
        transferencia: 0,
        consignacion: 0,
        qr: 0,
        rappipay: 0,
        bonos: 0,
        otros: 0
      };
      
      ventas.forEach(venta => {
        const metodo = venta.metodo_pago.toLowerCase();
        const total = parseFloat(venta.total) || 0;
        
        switch (metodo) {
          case 'efectivo':
            resumenPorMetodo.efectivo += total;
            break;
          case 'tarjeta':
          case 't_credito':
            resumenPorMetodo.tarjetas += total;
            break;
          case 'transf':
            resumenPorMetodo.transferencia += total;
            break;
          case 'qr':
            resumenPorMetodo.qr += total;
            break;
          case 'rappipay':
            resumenPorMetodo.rappipay += total;
            break;
          case 'bonos':
            resumenPorMetodo.bonos += total;
            break;
          default:
            resumenPorMetodo.otros += total;
        }
      });
      
      return {
        fecha: fechaConsulta,
        totalVentas: ventas.length,
        resumenPorMetodo,
        totalGeneral: Object.values(resumenPorMetodo).reduce((sum, val) => sum + val, 0)
      };
      
    } catch (error) {
      console.error('Error en getResumenVentasDelDia:', error);
      throw error;
    }
  },

  /**
   * Obtener ventas por vendedor del día
   */
  getVentasPorVendedor: async (fecha = null) => {
    try {
      const fechaConsulta = fecha || new Date().toISOString().split('T')[0];
      
      const response = await fetch(`${API_URL}/ventas/?fecha_inicio=${fechaConsulta}&fecha_fin=${fechaConsulta}`);
      
      if (!response.ok) {
        throw new Error(`Error al obtener ventas: ${response.status}`);
      }
      
      const ventas = await response.json();
      
      // Agrupar por vendedor
      const ventasPorVendedor = {};
      
      ventas.forEach(venta => {
        const vendedor = venta.vendedor || 'Sin asignar';
        if (!ventasPorVendedor[vendedor]) {
          ventasPorVendedor[vendedor] = {
            totalVentas: 0,
            cantidadVentas: 0,
            metodosUsados: {}
          };
        }
        
        ventasPorVendedor[vendedor].totalVentas += parseFloat(venta.total) || 0;
        ventasPorVendedor[vendedor].cantidadVentas += 1;
        
        const metodo = venta.metodo_pago;
        if (!ventasPorVendedor[vendedor].metodosUsados[metodo]) {
          ventasPorVendedor[vendedor].metodosUsados[metodo] = 0;
        }
        ventasPorVendedor[vendedor].metodosUsados[metodo] += parseFloat(venta.total) || 0;
      });
      
      return ventasPorVendedor;
      
    } catch (error) {
      console.error('Error en getVentasPorVendedor:', error);
      throw error;
    }
  },

  /**
   * Guardar arqueo de caja
   */
  guardarArqueoCaja: async (datosArqueo) => {
    try {
      const response = await fetch(`${API_URL}/arqueo-caja/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          fecha: datosArqueo.fecha,
          cajero: datosArqueo.cajero,
          banco: datosArqueo.banco,
          valores_sistema: datosArqueo.valoresSistema,
          valores_caja: datosArqueo.valoresCaja,
          diferencias: datosArqueo.diferencias,
          total_sistema: datosArqueo.totalSistema,
          total_caja: datosArqueo.totalCaja,
          total_diferencia: datosArqueo.totalDiferencia,
          observaciones: datosArqueo.observaciones || '',
          estado: 'COMPLETADO',
          fecha_creacion: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error al guardar arqueo: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Error en guardarArqueoCaja:', error);
      throw error;
    }
  },

  /**
   * Obtener arqueos por rango de fechas
   */
  getArqueosPorRango: async (fechaInicio, fechaFin, cajero = null) => {
    try {
      let url = `${API_URL}/arqueo-caja/?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&ordering=-fecha`;
      if (cajero) {
        url += `&cajero=${cajero}`;
      }
      
      const response = await fetch(url, { headers: getHeaders() });
      
      if (!response.ok) {
        throw new Error(`Error al obtener arqueos: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Error en getArqueosPorRango:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de caja
   */
  getEstadisticasCaja: async (fechaInicio, fechaFin) => {
    try {
      const response = await fetch(`${API_URL}/caja/estadisticas/?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`, {
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener estadísticas: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Error en getEstadisticasCaja:', error);
      throw error;
    }
  },

  /**
   * Validar arqueo antes de guardar
   */
  validarArqueo: async (datosArqueo) => {
    try {
      const response = await fetch(`${API_URL}/arqueo-caja/validar/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(datosArqueo)
      });
      
      if (!response.ok) {
        throw new Error(`Error al validar arqueo: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Error en validarArqueo:', error);
      throw error;
    }
  },

  /**
   * Obtener último arqueo de caja
   */
  getUltimoArqueo: async (cajero = null) => {
    try {
      let url = `${API_URL}/arqueo-caja/?ordering=-fecha`;
      if (cajero) {
        url += `&cajero=${cajero}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error al obtener arqueo: ${response.status}`);
      }
      
      const arqueos = await response.json();
      return arqueos.length > 0 ? arqueos[0] : null;
      
    } catch (error) {
      console.error('Error en getUltimoArqueo:', error);
      return null;
    }
  },

  /**
   * Generar reporte de caja
   */
  generarReporteCaja: async (fecha, cajero) => {
    try {
      const [resumenVentas, ventasPorVendedor] = await Promise.all([
        this.getResumenVentasDelDia(fecha),
        this.getVentasPorVendedor(fecha)
      ]);
      
      return {
        fecha,
        cajero,
        resumenVentas,
        ventasPorVendedor,
        generadoEn: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error en generarReporteCaja:', error);
      throw error;
    }
  },

  /**
   * Obtener movimientos bancarios (placeholder)
   */
  getMovimientosBancarios: async (fecha = null, banco = 'Todos') => {
    try {
      // Placeholder - aquí conectarías con tu API de movimientos bancarios
      console.log('Obteniendo movimientos bancarios para:', { fecha, banco });
      
      return {
        fecha: fecha || new Date().toISOString().split('T')[0],
        banco,
        movimientos: [
          {
            id: 1,
            tipo: 'Ingreso',
            concepto: 'Ventas del día',
            monto: 1500000,
            hora: '14:30:00'
          },
          {
            id: 2,
            tipo: 'Egreso',
            concepto: 'Gastos operativos',
            monto: -50000,
            hora: '16:45:00'
          }
        ]
      };
      
    } catch (error) {
      console.error('Error en getMovimientosBancarios:', error);
      throw error;
    }
  }
};

export default cajaService;