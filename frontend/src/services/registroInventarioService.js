/**
 * Servicio para gestión de registros de inventario (cantidades por fecha)
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const handleApiError = (error) => {
  console.warn('API no disponible:', error);
  return { error: 'API_UNAVAILABLE', message: 'API no disponible' };
};

export const registroInventarioService = {
  // Crear nuevo registro de inventario
  create: async (registroData) => {
    try {
      const payload = {
        producto_id: registroData.productoId,
        producto_nombre: registroData.productoNombre,
        cantidad: registroData.cantidad,
        entradas: registroData.entradas || 0,
        salidas: registroData.salidas || 0,
        saldo: registroData.saldo || 0,
        tipo_movimiento: registroData.tipoMovimiento || 'ENTRADA',
        fecha_produccion: registroData.fechaProduccion,
        usuario: registroData.usuario,
        activo: true
      };
      

      
      const response = await fetch(`${API_URL}/registro-inventario/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      

      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error del servidor:', errorText);
        throw new Error(`Error al crear registro: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();

      return result;
    } catch (error) {
      console.error('❌ Error en create registro:', error);
      return handleApiError(error);
    }
  },

  // Obtener registros por fecha de producción
  getByFecha: async (fecha) => {
    try {
      const response = await fetch(`${API_URL}/registro-inventario/?fecha_produccion=${fecha}`);
      if (!response.ok) throw new Error(`Error al obtener registros: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en getByFecha:', error);
      return handleApiError(error);
    }
  },

  // Actualizar registro
  update: async (id, registroData) => {
    try {
      const response = await fetch(`${API_URL}/registro-inventario/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registroData)
      });
      
      if (!response.ok) throw new Error(`Error al actualizar registro: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en update registro:', error);
      return handleApiError(error);
    }
  },

  // Eliminar registro (marcar como inactivo)
  delete: async (id) => {
    try {
      const response = await fetch(`${API_URL}/registro-inventario/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activo: false })
      });
      
      if (!response.ok) throw new Error(`Error al eliminar registro: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en delete registro:', error);
      return handleApiError(error);
    }
  }
};