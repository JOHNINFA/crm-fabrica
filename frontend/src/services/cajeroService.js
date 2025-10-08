// Servicio para gestión de cajeros
const API_URL = 'http://localhost:8000/api';

// Función para manejar errores de la API
const handleApiError = (error) => {
    console.warn('API no disponible, usando almacenamiento local:', error);
    return { error: 'API_UNAVAILABLE', message: 'API no disponible, usando almacenamiento local' };
};

// Función para hashear contraseñas (simple para desarrollo)
const hashPassword = (password) => {
    // En producción usar bcrypt o similar
    return btoa(password); // Base64 simple para desarrollo
};

// Función para verificar contraseñas
const verifyPassword = (password, hashedPassword) => {
    return btoa(password) === hashedPassword;
};

// Datos de ejemplo para desarrollo (fallback)
const cajerosEjemplo = [
    {
        id: 1,
        nombre: 'jose',
        password: hashPassword('123456'),
        sucursal: 1,
        activo: true,
        fecha_creacion: new Date().toISOString()
    },
    {
        id: 2,
        nombre: 'maria',
        password: hashPassword('123456'),
        sucursal: 1,
        activo: true,
        fecha_creacion: new Date().toISOString()
    },
    {
        id: 3,
        nombre: 'carlos',
        password: hashPassword('123456'),
        sucursal: 2,
        activo: true,
        fecha_creacion: new Date().toISOString()
    }
];

export const cajeroService = {
    // Obtener todos los cajeros
    getAll: async () => {
        try {
            console.log('Intentando obtener cajeros desde:', `${API_URL}/cajeros/`);
            const response = await fetch(`${API_URL}/cajeros/`);
            if (!response.ok) throw new Error(`Error al obtener cajeros: ${response.status}`);
            const data = await response.json();
            console.log('Cajeros obtenidos:', data.length);
            return data;
        } catch (error) {
            console.error('Error en getAll cajeros:', error);
            
            // Fallback: usar localStorage o datos de ejemplo
            const cajerosLocal = localStorage.getItem('cajeros');
            if (cajerosLocal) {
                return JSON.parse(cajerosLocal);
            }
            
            // Si no hay datos locales, usar ejemplos y guardarlos
            localStorage.setItem('cajeros', JSON.stringify(cajerosEjemplo));
            return cajerosEjemplo;
        }
    },

    // Obtener cajeros por sucursal
    getBySucursal: async (sucursalId) => {
        try {
            console.log('Intentando obtener cajeros por sucursal:', sucursalId);
            const response = await fetch(`${API_URL}/cajeros/?sucursal_id=${sucursalId}`);
            if (!response.ok) throw new Error(`Error al obtener cajeros: ${response.status}`);
            const data = await response.json();
            console.log('Cajeros por sucursal obtenidos:', data.length);
            return data;
        } catch (error) {
            console.error('Error en getBySucursal cajeros:', error);
            
            // Fallback: filtrar desde localStorage
            const cajeros = await cajeroService.getAll();
            return cajeros.filter(c => c.sucursal_id === parseInt(sucursalId));
        }
    },

    // Obtener cajero por ID
    getById: async (id) => {
        try {
            console.log('Intentando obtener cajero por ID:', id);
            const response = await fetch(`${API_URL}/cajeros/${id}/`);
            if (!response.ok) throw new Error(`Error al obtener cajero con ID ${id}: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error en getById cajero:', error);
            
            // Fallback: buscar en localStorage
            const cajeros = await cajeroService.getAll();
            return cajeros.find(c => c.id === parseInt(id));
        }
    },

    // Crear nuevo cajero
    create: async (cajeroData) => {
        try {
            console.log('Intentando crear cajero:', cajeroData);
            
            // Hashear contraseña antes de enviar
            const dataToSend = {
                ...cajeroData,
                password: hashPassword(cajeroData.password)
            };
            
            const response = await fetch(`${API_URL}/cajeros/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Error al crear cajero: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Cajero creado exitosamente:', result);
            return result;
        } catch (error) {
            console.error('Error en create cajero:', error);
            
            // Fallback: guardar en localStorage
            const cajeros = await cajeroService.getAll();
            
            const nuevoCajero = {
                id: Date.now(), // ID temporal
                ...cajeroData,
                password: hashPassword(cajeroData.password),
                fecha_creacion: new Date().toISOString()
            };
            
            cajeros.push(nuevoCajero);
            localStorage.setItem('cajeros', JSON.stringify(cajeros));
            
            console.log('✅ Cajero guardado en localStorage:', nuevoCajero);
            return nuevoCajero;
        }
    },

    // Actualizar cajero
    update: async (id, cajeroData) => {
        try {
            console.log('Intentando actualizar cajero:', id, cajeroData);
            
            // Hashear contraseña si se proporcionó
            const dataToSend = { ...cajeroData };
            if (cajeroData.password) {
                dataToSend.password = hashPassword(cajeroData.password);
            }
            
            const response = await fetch(`${API_URL}/cajeros/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Error al actualizar cajero: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Cajero actualizado exitosamente:', result);
            return result;
        } catch (error) {
            console.error('Error en update cajero:', error);
            
            // Fallback: actualizar en localStorage
            const cajeros = await cajeroService.getAll();
            const index = cajeros.findIndex(c => c.id === parseInt(id));
            
            if (index !== -1) {
                const dataToUpdate = { ...cajeroData };
                if (cajeroData.password) {
                    dataToUpdate.password = hashPassword(cajeroData.password);
                }
                
                cajeros[index] = {
                    ...cajeros[index],
                    ...dataToUpdate,
                    fecha_actualizacion: new Date().toISOString()
                };
                
                localStorage.setItem('cajeros', JSON.stringify(cajeros));
                console.log('✅ Cajero actualizado en localStorage:', cajeros[index]);
                return cajeros[index];
            }
            
            return handleApiError(error);
        }
    },

    // Eliminar cajero (soft delete)
    delete: async (id) => {
        try {
            console.log('Intentando eliminar cajero:', id);
            
            const response = await fetch(`${API_URL}/cajeros/${id}/`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`Error al eliminar cajero: ${response.status}`);
            }
            
            console.log('✅ Cajero eliminado exitosamente');
            return { success: true };
        } catch (error) {
            console.error('Error en delete cajero:', error);
            
            // Fallback: marcar como inactivo en localStorage
            const cajeros = await cajeroService.getAll();
            const index = cajeros.findIndex(c => c.id === parseInt(id));
            
            if (index !== -1) {
                cajeros[index].activo = false;
                localStorage.setItem('cajeros', JSON.stringify(cajeros));
                console.log('✅ Cajero desactivado en localStorage');
                return { success: true };
            }
            
            return handleApiError(error);
        }
    },

    // Obtener cajeros activos por sucursal
    getActivosBySucursal: async (sucursalId) => {
        try {
            const cajeros = await cajeroService.getBySucursal(sucursalId);
            return cajeros.filter(c => c.activo);
        } catch (error) {
            console.error('Error obteniendo cajeros activos:', error);
            return [];
        }
    },

    // Autenticar cajero
    authenticate: async (nombre, password, sucursalId = null) => {
        try {
            console.log('🔐 Intentando autenticar cajero:', nombre);
            
            // Intentar autenticación con API
            try {
                const response = await fetch(`${API_URL}/cajeros/authenticate/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        nombre: nombre,
                        password: password,
                        sucursal_id: sucursalId
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Autenticación exitosa con API:', data.cajero.nombre);
                    return data;
                }
            } catch (apiError) {
                console.warn('API no disponible para autenticación:', apiError);
            }
            
            // Fallback: autenticación local
            console.log('🔄 Usando autenticación local...');
            
            const cajeros = sucursalId 
                ? await cajeroService.getBySucursal(sucursalId)
                : await cajeroService.getAll();
            
            // Buscar cajero por nombre
            const cajero = cajeros.find(c => 
                c.nombre.toLowerCase() === nombre.toLowerCase() && c.activo
            );
            
            if (!cajero) {
                console.log('❌ Cajero no encontrado o inactivo');
                return { success: false, message: 'Cajero no encontrado o inactivo' };
            }
            
            // Verificar contraseña
            if (!verifyPassword(password, cajero.password)) {
                console.log('❌ Contraseña incorrecta');
                return { success: false, message: 'Contraseña incorrecta' };
            }
            
            console.log('✅ Autenticación local exitosa:', cajero.nombre);
            
            // Retornar datos del cajero sin la contraseña
            const { password: _, ...cajeroSinPassword } = cajero;
            return { 
                success: true, 
                cajero: cajeroSinPassword,
                message: 'Autenticación exitosa'
            };
            
        } catch (error) {
            console.error('Error en authenticate:', error);
            return { success: false, message: 'Error en la autenticación' };
        }
    },

    // Iniciar turno
    iniciarTurno: async (cajeroId, sucursalId, saldoInicial = 0) => {
        try {
            console.log('🚀 Iniciando turno para cajero:', cajeroId, 'con saldo inicial:', saldoInicial);
            
            // Intentar iniciar turno con API
            try {
                const response = await fetch(`${API_URL}/turnos/iniciar_turno/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        cajero_id: cajeroId,
                        sucursal_id: sucursalId,
                        base_inicial: saldoInicial,
                        notas_apertura: `Turno iniciado desde POS con saldo inicial: ${saldoInicial}`
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        console.log('✅ Turno iniciado con API:', data.turno);
                        return data.turno;
                    }
                }
            } catch (apiError) {
                console.warn('API no disponible para iniciar turno:', apiError);
            }
            
            // Fallback: guardar en localStorage
            console.log('🔄 Usando localStorage para turno...');
            const turnos = JSON.parse(localStorage.getItem('turnos') || '[]');
            const nuevoTurno = {
                id: Date.now(),
                cajero: cajeroId,
                sucursal: sucursalId,
                fecha_inicio: new Date().toISOString(),
                estado: 'ACTIVO',
                base_inicial: saldoInicial,
                total_ventas: 0,
                numero_transacciones: 0
            };
            
            turnos.push(nuevoTurno);
            localStorage.setItem('turnos', JSON.stringify(turnos));
            
            console.log('✅ Turno iniciado en localStorage:', nuevoTurno);
            return nuevoTurno;
            
        } catch (error) {
            console.error('Error iniciando turno:', error);
            return handleApiError(error);
        }
    },

    // Cerrar turno
    cerrarTurno: async (turnoId, arqueoFinal = 0) => {
        try {
            console.log('🚪 Cerrando turno:', turnoId);
            
            // Intentar cerrar turno con API
            try {
                const response = await fetch(`${API_URL}/turnos/${turnoId}/cerrar_turno/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        arqueo_final: arqueoFinal,
                        notas_cierre: 'Turno cerrado desde POS'
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        console.log('✅ Turno cerrado con API:', data.turno);
                        return data.turno;
                    }
                }
            } catch (apiError) {
                console.warn('API no disponible para cerrar turno:', apiError);
            }
            
            // Fallback: actualizar en localStorage
            console.log('🔄 Usando localStorage para cerrar turno...');
            const turnos = JSON.parse(localStorage.getItem('turnos') || '[]');
            const index = turnos.findIndex(t => t.id === parseInt(turnoId));
            
            if (index !== -1) {
                turnos[index] = {
                    ...turnos[index],
                    fecha_fin: new Date().toISOString(),
                    arqueo_final: arqueoFinal,
                    estado: 'CERRADO'
                };
                
                localStorage.setItem('turnos', JSON.stringify(turnos));
                console.log('✅ Turno cerrado en localStorage:', turnos[index]);
                return turnos[index];
            }
            
            return handleApiError(new Error('Turno no encontrado'));
            
        } catch (error) {
            console.error('Error cerrando turno:', error);
            return handleApiError(error);
        }
    }
};