const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const listaPrecioService = {
    // Obtener todas las listas de precios
    getAll: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        const url = queryParams ? `${API_BASE_URL}/lista-precios/?${queryParams}` : `${API_BASE_URL}/lista-precios/`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Error al obtener listas de precios');
        }
        return response.json();
    },

    // Crear nueva lista de precios
    create: async (data) => {
        const response = await fetch(`${API_BASE_URL}/lista-precios/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            throw new Error('Error al crear lista de precios');
        }
        return response.json();
    },

    // Actualizar lista de precios
    update: async (id, data) => {
        const response = await fetch(`${API_BASE_URL}/lista-precios/${id}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            throw new Error('Error al actualizar lista de precios');
        }
        return response.json();
    },

    // Eliminar lista de precios
    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/lista-precios/${id}/`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar lista de precios');
        }
    },

    // Obtener lista por ID
    getById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/lista-precios/${id}/`);
        if (!response.ok) {
            throw new Error('Error al obtener lista de precios');
        }
        return response.json();
    }
};

export const precioProductoService = {
    // Obtener precios de productos
    getAll: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        const url = queryParams ? `${API_BASE_URL}/precio-productos/?${queryParams}` : `${API_BASE_URL}/precio-productos/`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Error al obtener precios de productos');
        }
        return response.json();
    },

    // Crear/actualizar precio de producto
    createOrUpdate: async (data) => {
        const response = await fetch(`${API_BASE_URL}/precio-productos/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            throw new Error('Error al guardar precio de producto');
        }
        return response.json();
    },

    // Actualizar precio de producto
    update: async (id, data) => {
        const response = await fetch(`${API_BASE_URL}/precio-productos/${id}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            throw new Error('Error al actualizar precio de producto');
        }
        return response.json();
    }
};