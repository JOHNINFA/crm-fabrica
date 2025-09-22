/**
 * Servicio para gestión de lotes en base de datos
 */

const API_URL = 'http://localhost:8000/api';

const handleApiError = (error) => {
  console.warn('API no disponible:', error);
  return { error: 'API_UNAVAILABLE', message: 'API no disponible' };
};

export const loteService = {
  // Crear nuevo lote simplificado
  create: async (loteData) => {
    try {
      const payload = {
        lote: loteData.lote,
        fecha_vencimiento: loteData.fechaVencimiento || null,
        fecha_produccion: loteData.fechaProduccion,
        usuario: loteData.usuario,
        activo: true
      };
      
      console.log('🚀 Enviando lote a API:', payload);
      console.log('🎯 URL:', `${API_URL}/lotes/`);
      
      const response = await fetch(`${API_URL}/lotes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      console.log('📊 Respuesta del servidor:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error del servidor:', errorText);
        throw new Error(`Error al crear lote: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Lote creado exitosamente:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en create lote:', error);
      return handleApiError(error);
    }
  },

  // Obtener lotes por fecha de producción
  getByFecha: async (fecha) => {
    try {
      const response = await fetch(`${API_URL}/lotes/?fecha_produccion=${fecha}`);
      if (!response.ok) throw new Error(`Error al obtener lotes: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en getByFecha:', error);
      return handleApiError(error);
    }
  },

  // Obtener lotes por producto
  getByProducto: async (productoId) => {
    try {
      const response = await fetch(`${API_URL}/lotes/?producto=${productoId}`);
      if (!response.ok) throw new Error(`Error al obtener lotes: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en getByProducto:', error);
      return handleApiError(error);
    }
  },

  // Actualizar lote
  update: async (id, loteData) => {
    try {
      const response = await fetch(`${API_URL}/lotes/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loteData)
      });
      
      if (!response.ok) throw new Error(`Error al actualizar lote: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en update lote:', error);
      return handleApiError(error);
    }
  },

  // Eliminar lote (marcar como inactivo)
  delete: async (id) => {
    try {
      const response = await fetch(`${API_URL}/lotes/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activo: false })
      });
      
      if (!response.ok) throw new Error(`Error al eliminar lote: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en delete lote:', error);
      return handleApiError(error);
    }
  }
};