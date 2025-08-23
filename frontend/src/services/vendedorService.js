// Servicio para manejar las llamadas a la API de vendedores
const API_URL = 'http://localhost:8000/api';

// Función para manejar errores de la API
const handleApiError = (error) => {
  console.warn('API no disponible:', error);
  return { error: 'API_UNAVAILABLE', message: 'API no disponible' };
};

// Servicios para Vendedores
export const vendedorService = {
  // Obtener todos los vendedores
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key]) queryParams.append(key, params[key]);
      });
      
      const url = `${API_URL}/vendedores/?${queryParams.toString()}`;
      console.log('Intentando obtener vendedores:', url);
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`Error al obtener vendedores: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en getAll vendedores:', error);
      return handleApiError(error);
    }
  },

  // Crear un nuevo vendedor
  create: async (vendedorData) => {
    try {
      console.log('Intentando crear vendedor:', vendedorData);
      const response = await fetch(`${API_URL}/vendedores/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vendedorData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error al crear vendedor: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en create vendedor:', error);
      return handleApiError(error);
    }
  },

  // Obtener un vendedor por ID
  getById: async (id) => {
    try {
      console.log('Intentando obtener vendedor por ID:', id);
      const response = await fetch(`${API_URL}/vendedores/${id}/`);
      if (!response.ok) throw new Error(`Error al obtener vendedor: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en getById vendedor:', error);
      return handleApiError(error);
    }
  },

  // Actualizar un vendedor
  update: async (id, vendedorData) => {
    try {
      console.log('Intentando actualizar vendedor:', id, vendedorData);
      const response = await fetch(`${API_URL}/vendedores/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vendedorData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error al actualizar vendedor: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en update vendedor:', error);
      return handleApiError(error);
    }
  },

  // Eliminar un vendedor
  delete: async (id) => {
    try {
      console.log('Intentando eliminar vendedor:', id);
      const response = await fetch(`${API_URL}/vendedores/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error(`Error al eliminar vendedor: ${response.status}`);
      return true;
    } catch (error) {
      console.error('Error en delete vendedor:', error);
      return handleApiError(error);
    }
  },
};