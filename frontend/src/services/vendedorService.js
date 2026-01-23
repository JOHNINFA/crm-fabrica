// 🚀 SERVICIO DE VENDEDORES - CONECTADO A API REAL
import { API_URL } from './api';

// Función para manejar errores de la API
const handleApiError = (error) => {
  console.warn('API no disponible:', error);
  return { error: 'API_UNAVAILABLE', message: 'API no disponible' };
};

// Servicios para Vendedores
export const vendedorService = {
  // Obtener todos los vendedores desde la API
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = queryParams ? `${API_URL}/vendedores/?${queryParams}` : `${API_URL}/vendedores/`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Vendedores obtenidos: ${data.length}`);
      return data;

    } catch (error) {
      console.error('Error en getAll vendedores:', error);
      return handleApiError(error);
    }
  },

  // Crear un nuevo vendedor (SIMULADO - mantiene compatibilidad)
  create: async (vendedorData) => {
    try {


      // En la nueva estructura, no hay tabla de vendedores
      // Simular creación exitosa
      const nuevoVendedor = {
        id: Math.floor(Math.random() * 1000),
        ...vendedorData,
        fecha_creacion: new Date().toISOString()
      };


      return nuevoVendedor;

    } catch (error) {
      console.error('Error en create vendedor:', error);
      return handleApiError(error);
    }
  },

  // Obtener un vendedor por ID (SIMULADO)
  getById: async (id) => {
    try {


      const vendedores = await vendedorService.getAll();
      const vendedor = vendedores.find(v => v.id === parseInt(id));

      if (!vendedor) {
        throw new Error(`Vendedor con ID ${id} no encontrado`);
      }

      return vendedor;

    } catch (error) {
      console.error('Error en getById vendedor:', error);
      return handleApiError(error);
    }
  },

  // Obtener vendedor por id_vendedor
  getByIdVendedor: async (idVendedor) => {
    try {
      const response = await fetch(`${API_URL}/vendedores/?id_vendedor=${idVendedor}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.length > 0) {
        return data[0];
      }

      console.warn(`⚠️ Vendedor ${idVendedor} no encontrado`);
      return null;

    } catch (error) {
      console.error('Error en getByIdVendedor:', error);
      return handleApiError(error);
    }
  },

  // Actualizar un vendedor (SIMULADO - mantiene compatibilidad)
  update: async (id, vendedorData) => {
    try {


      // En la nueva estructura, los datos se manejan via localStorage
      // Simular actualización exitosa
      const vendedorActualizado = {
        id: parseInt(id),
        ...vendedorData,
        fecha_actualizacion: new Date().toISOString()
      };


      return vendedorActualizado;

    } catch (error) {
      console.error('Error en update vendedor:', error);
      return handleApiError(error);
    }
  },

  // Actualizar responsable (NUEVO - FUNCIONALIDAD ESPECÍFICA)
  actualizarResponsable: async (idVendedor, nuevoResponsable) => {
    try {
      console.log(`📝 Actualizando responsable ${idVendedor}: ${nuevoResponsable}`);

      // En la nueva estructura, esto se maneja via localStorage
      // El responsableStorage.js ya maneja esta funcionalidad

      return {
        success: true,
        vendedor: {
          id_vendedor: idVendedor,
          responsable: nuevoResponsable
        },
        message: 'Responsable actualizado exitosamente'
      };

    } catch (error) {
      console.error('Error actualizando responsable:', error);
      return handleApiError(error);
    }
  },

  // Eliminar un vendedor (SIMULADO - mantiene compatibilidad)
  delete: async (id) => {
    try {


      // En la nueva estructura, no hay tabla de vendedores
      // Simular eliminación exitosa

      return true;

    } catch (error) {
      console.error('Error en delete vendedor:', error);
      return handleApiError(error);
    }
  },
};