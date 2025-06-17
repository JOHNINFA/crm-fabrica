// Servicio para manejar las llamadas a la API
const API_URL = 'http://localhost:8000/api';

// Función para manejar errores de la API
const handleApiError = (error) => {
  console.warn('API no disponible, usando almacenamiento local:', error);
  return { error: 'API_UNAVAILABLE', message: 'API no disponible, usando almacenamiento local' };
};

// Servicios para Productos
export const productoService = {
  // Obtener todos los productos
  getAll: async () => {
    try {
      console.log('Intentando obtener productos desde:', `${API_URL}/productos/`);
      const response = await fetch(`${API_URL}/productos/`);
      if (!response.ok) throw new Error(`Error al obtener productos: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en getAll:', error);
      return handleApiError(error);
    }
  },

  // Obtener un producto por ID
  getById: async (id) => {
    try {
      console.log('Intentando obtener producto por ID:', id);
      const response = await fetch(`${API_URL}/productos/${id}/`);
      if (!response.ok) throw new Error(`Error al obtener producto con ID ${id}: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en getById:', error);
      return handleApiError(error);
    }
  },

  // Crear un nuevo producto
  create: async (productoData) => {
    try {
      console.log('Intentando crear producto:', productoData);
      // Usar FormData para enviar archivos
      const formData = new FormData();
      
      // Agregar todos los campos del producto al FormData
      Object.keys(productoData).forEach(key => {
        if (key === 'imagen' && productoData[key] instanceof File) {
          formData.append(key, productoData[key]);
        } else if (productoData[key] !== null && productoData[key] !== undefined) {
          formData.append(key, productoData[key]);
        }
      });

      const response = await fetch(`${API_URL}/productos/`, {
        method: 'POST',
        body: formData, // No establecer Content-Type, fetch lo hará automáticamente
      });

      if (!response.ok) throw new Error(`Error al crear producto: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en create:', error);
      return handleApiError(error);
    }
  },

  // Actualizar un producto existente
  update: async (id, productoData) => {
    try {
      console.log('Intentando actualizar producto:', id, productoData);
      // Usar FormData para enviar archivos
      const formData = new FormData();
      
      // Agregar todos los campos del producto al FormData
      Object.keys(productoData).forEach(key => {
        if (key === 'imagen' && productoData[key] instanceof File) {
          formData.append(key, productoData[key]);
        } else if (productoData[key] !== null && productoData[key] !== undefined) {
          formData.append(key, productoData[key]);
        }
      });

      const response = await fetch(`${API_URL}/productos/${id}/`, {
        method: 'PATCH', // Usar PATCH para actualización parcial
        body: formData,
      });

      if (!response.ok) throw new Error(`Error al actualizar producto con ID ${id}: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en update:', error);
      return handleApiError(error);
    }
  },

  // Actualizar el stock de un producto
  updateStock: async (id, cantidad, usuario, nota) => {
    try {
      console.log('Intentando actualizar stock:', id, cantidad);
      const response = await fetch(`${API_URL}/productos/${id}/actualizar_stock/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cantidad, usuario, nota }),
      });

      if (!response.ok) throw new Error(`Error al actualizar stock del producto con ID ${id}: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en updateStock:', error);
      return handleApiError(error);
    }
  },
};

// Servicios para Categorías
export const categoriaService = {
  // Obtener todas las categorías
  getAll: async () => {
    try {
      console.log('Intentando obtener categorías');
      const response = await fetch(`${API_URL}/categorias/`);
      if (!response.ok) throw new Error(`Error al obtener categorías: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en getAll categorías:', error);
      return handleApiError(error);
    }
  },

  // Crear una nueva categoría
  create: async (nombre) => {
    try {
      console.log('Intentando crear categoría:', nombre);
      const response = await fetch(`${API_URL}/categorias/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre }),
      });

      if (!response.ok) throw new Error(`Error al crear categoría: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en create categoría:', error);
      return handleApiError(error);
    }
  },
};

// Servicios para Lotes
export const loteService = {
  // Obtener todos los lotes
  getAll: async (productoId = null) => {
    try {
      let url = `${API_URL}/lotes/`;
      if (productoId) url += `?producto=${productoId}`;
      
      console.log('Intentando obtener lotes:', url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error al obtener lotes: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en getAll lotes:', error);
      return handleApiError(error);
    }
  },

  // Crear un nuevo lote
  create: async (loteData) => {
    try {
      console.log('Intentando crear lote:', loteData);
      const response = await fetch(`${API_URL}/lotes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loteData),
      });

      if (!response.ok) throw new Error(`Error al crear lote: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en create lote:', error);
      return handleApiError(error);
    }
  },
};

// Servicios para Movimientos de Inventario
export const movimientoService = {
  // Obtener todos los movimientos
  getAll: async (params = {}) => {
    try {
      // Construir URL con parámetros de consulta
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key]) queryParams.append(key, params[key]);
      });
      
      const url = `${API_URL}/movimientos/?${queryParams.toString()}`;
      console.log('Intentando obtener movimientos:', url);
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`Error al obtener movimientos: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en getAll movimientos:', error);
      return handleApiError(error);
    }
  },

  // Crear un nuevo movimiento
  create: async (movimientoData) => {
    try {
      console.log('Intentando crear movimiento:', movimientoData);
      const response = await fetch(`${API_URL}/movimientos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movimientoData),
      });

      if (!response.ok) throw new Error(`Error al crear movimiento: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en create movimiento:', error);
      return handleApiError(error);
    }
  },
};