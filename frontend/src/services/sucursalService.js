// Servicio para gestión de sucursales
const API_URL = process.env.REACT_APP_API_URL || '/api';

// Función para manejar errores de la API
const handleApiError = (error) => {
    console.warn('API no disponible, usando almacenamiento local:', error);
    return { error: 'API_UNAVAILABLE', message: 'API no disponible, usando almacenamiento local' };
};

// Datos de ejemplo para desarrollo (fallback)
const sucursalesEjemplo = [
    {
        id: 1,
        nombre: 'Centro Norte',
        direccion: 'Calle 123 #45-67, Centro Norte',
        telefono: '(601) 123-4567',
        activo: true,
        es_principal: true,
        fecha_creacion: new Date().toISOString()
    },
    {
        id: 2,
        nombre: 'Sur',
        direccion: 'Carrera 89 #12-34, Sur',
        telefono: '(601) 987-6543',
        activo: true,
        es_principal: false,
        fecha_creacion: new Date().toISOString()
    }
];

export const sucursalService = {
    // Obtener todas las sucursales
    getAll: async () => {
        try {

            const response = await fetch(`${API_URL}/sucursales/`);
            if (!response.ok) throw new Error(`Error al obtener sucursales: ${response.status}`);
            const data = await response.json();

            return data;
        } catch (error) {
            console.error('Error en getAll sucursales:', error);

            // Fallback: usar localStorage o datos de ejemplo
            const sucursalesLocal = localStorage.getItem('sucursales');
            if (sucursalesLocal) {
                return JSON.parse(sucursalesLocal);
            }

            // Si no hay datos locales, usar ejemplos y guardarlos
            localStorage.setItem('sucursales', JSON.stringify(sucursalesEjemplo));
            return sucursalesEjemplo;
        }
    },

    // Obtener sucursal por ID
    getById: async (id) => {
        if (!id || id === 'undefined' || id === 'null') {
            console.warn('⚠️ sucursalService.getById llamado con ID inválido:', id);
            return null;
        }
        try {

            const response = await fetch(`${API_URL}/sucursales/${id}/`);
            if (!response.ok) throw new Error(`Error al obtener sucursal con ID ${id}: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error en getById sucursal:', error);

            // Fallback: buscar en localStorage
            const sucursalesLocal = localStorage.getItem('sucursales');
            if (sucursalesLocal) {
                const sucursales = JSON.parse(sucursalesLocal);
                return sucursales.find(s => s.id === parseInt(id));
            }

            return handleApiError(error);
        }
    },

    // Crear nueva sucursal
    create: async (sucursalData) => {
        try {


            const response = await fetch(`${API_URL}/sucursales/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sucursalData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Error al crear sucursal: ${response.status}`);
            }

            const result = await response.json();

            return result;
        } catch (error) {
            console.error('Error en create sucursal:', error);

            // Fallback: guardar en localStorage
            const sucursalesLocal = localStorage.getItem('sucursales');
            const sucursales = sucursalesLocal ? JSON.parse(sucursalesLocal) : [];

            const nuevaSucursal = {
                id: Date.now(), // ID temporal
                ...sucursalData,
                fecha_creacion: new Date().toISOString()
            };

            sucursales.push(nuevaSucursal);
            localStorage.setItem('sucursales', JSON.stringify(sucursales));


            return nuevaSucursal;
        }
    },

    // Actualizar sucursal
    update: async (id, sucursalData) => {
        try {


            const response = await fetch(`${API_URL}/sucursales/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sucursalData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Error al actualizar sucursal: ${response.status}`);
            }

            const result = await response.json();

            return result;
        } catch (error) {
            console.error('Error en update sucursal:', error);

            // Fallback: actualizar en localStorage
            const sucursalesLocal = localStorage.getItem('sucursales');
            if (sucursalesLocal) {
                const sucursales = JSON.parse(sucursalesLocal);
                const index = sucursales.findIndex(s => s.id === parseInt(id));

                if (index !== -1) {
                    sucursales[index] = {
                        ...sucursales[index],
                        ...sucursalData,
                        fecha_actualizacion: new Date().toISOString()
                    };

                    localStorage.setItem('sucursales', JSON.stringify(sucursales));

                    return sucursales[index];
                }
            }

            return handleApiError(error);
        }
    },

    // Eliminar sucursal (soft delete)
    delete: async (id) => {
        try {


            const response = await fetch(`${API_URL}/sucursales/${id}/`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Error al eliminar sucursal: ${response.status}`);
            }


            return { success: true };
        } catch (error) {
            console.error('Error en delete sucursal:', error);

            // Fallback: marcar como inactiva en localStorage
            const sucursalesLocal = localStorage.getItem('sucursales');
            if (sucursalesLocal) {
                const sucursales = JSON.parse(sucursalesLocal);
                const index = sucursales.findIndex(s => s.id === parseInt(id));

                if (index !== -1) {
                    sucursales[index].activo = false;
                    localStorage.setItem('sucursales', JSON.stringify(sucursales));

                    return { success: true };
                }
            }

            return handleApiError(error);
        }
    },

    // Obtener sucursales activas
    getActivas: async () => {
        try {
            const sucursales = await sucursalService.getAll();
            return sucursales.filter(s => s.activo);
        } catch (error) {
            console.error('Error obteniendo sucursales activas:', error);
            return [];
        }
    },

    // Obtener sucursal por defecto (principal o primera activa)
    getDefault: async () => {
        try {
            // Intentar obtener sucursal principal desde API
            try {
                const response = await fetch(`${API_URL}/sucursales/principal/`);
                if (response.ok) {
                    const sucursal = await response.json();

                    return sucursal;
                }
            } catch (apiError) {
                console.warn('API no disponible para sucursal principal:', apiError);
            }

            // Fallback: usar sucursales locales
            const sucursalesActivas = await sucursalService.getActivas();
            const principal = sucursalesActivas.find(s => s.es_principal);
            const sucursalDefault = principal || (sucursalesActivas.length > 0 ? sucursalesActivas[0] : null);

            if (sucursalDefault) {

            }

            return sucursalDefault;
        } catch (error) {
            console.error('Error obteniendo sucursal por defecto:', error);
            return null;
        }
    }
};