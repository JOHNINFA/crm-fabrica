// cajaService.js - Servicio para gestión de caja

import { API_URL } from './api';
// const API_URL = process.env.REACT_APP_API_URL || '/api';

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
      // SIEMPRE crear un nuevo arqueo (no sobrescribir)
      // Cada turno debe tener su propio arqueo


      const arqueoData = {
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
        turno: datosArqueo.turno_id || null,
        cajero_logueado: datosArqueo.cajero_id || null,
        sucursal: datosArqueo.sucursal_id || null
      };



      const response = await fetch(`${API_URL}/arqueo-caja/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(arqueoData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error del servidor:', errorData);
        throw new Error(errorData.error || errorData.message || `Error al guardar arqueo: ${response.status}`);
      }

      const result = await response.json();

      return result;

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
  },

  /**
   * Guardar movimiento de caja
   */
  guardarMovimientoCaja: async (movimiento) => {
    try {
      const response = await fetch(`${API_URL}/movimientos-caja/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(movimiento)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error al guardar movimiento: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Error en guardarMovimientoCaja:', error);
      throw error;
    }
  },

  /**
   * Obtener movimientos de caja por fecha y cajero
   */
  getMovimientosCaja: async (fecha, cajero = null, turnoId = null) => {
    try {
      let url = `${API_URL}/movimientos-caja/?fecha=${fecha}`;
      if (cajero) {
        url += `&cajero=${cajero}`;
      }
      if (turnoId) {
        url += `&turno=${turnoId}`;
      }

      const response = await fetch(url, { headers: getHeaders() });

      if (!response.ok) {
        if (response.status === 404) {
          return []; // No hay movimientos
        }
        throw new Error(`Error al obtener movimientos: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Error en getMovimientosCaja:', error);
      return [];
    }
  },

  /**
   * Eliminar movimiento de caja
   */
  eliminarMovimientoCaja: async (movimientoId) => {
    try {
      const response = await fetch(`${API_URL}/movimientos-caja/${movimientoId}/`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error al eliminar movimiento: ${response.status}`);
      }

      return true;

    } catch (error) {
      console.error('Error en eliminarMovimientoCaja:', error);
      throw error;
    }
  }
};

export default cajaService;