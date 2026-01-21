// Servicio para manejar las llamadas a la API de clientes
const API_URL = process.env.REACT_APP_API_URL || '/api';

// Función para manejar errores de la API
const handleApiError = (error) => {
  console.warn('API no disponible:', error);
  return { error: 'API_UNAVAILABLE', message: 'API no disponible' };
};

// Servicios para Clientes
export const clienteService = {
  // Obtener todos los clientes
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key]) queryParams.append(key, params[key]);
      });
      
      const url = `${API_URL}/clientes/?${queryParams.toString()}`;

      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`Error al obtener clientes: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en getAll clientes:', error);
      return handleApiError(error);
    }
  },

  // Crear un nuevo cliente
  create: async (clienteData) => {
    try {

      const response = await fetch(`${API_URL}/clientes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clienteData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error al crear cliente: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en create cliente:', error);
      return handleApiError(error);
    }
  },

  // Obtener un cliente por ID
  getById: async (id) => {
    try {

      const response = await fetch(`${API_URL}/clientes/${id}/`);
      if (!response.ok) throw new Error(`Error al obtener cliente: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en getById cliente:', error);
      return handleApiError(error);
    }
  },

  // Actualizar un cliente
  update: async (id, clienteData) => {
    try {

      const response = await fetch(`${API_URL}/clientes/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clienteData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error al actualizar cliente: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en update cliente:', error);
      return handleApiError(error);
    }
  },

  // Eliminar un cliente
  delete: async (id) => {
    try {

      const response = await fetch(`${API_URL}/clientes/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error(`Error al eliminar cliente: ${response.status}`);
      return true;
    } catch (error) {
      console.error('Error en delete cliente:', error);
      return handleApiError(error);
    }
  },
};