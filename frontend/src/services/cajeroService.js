// Servicio para gestión de cajeros
import { API_URL } from './api';
// const API_URL = process.env.REACT_APP_API_URL || '/api';

// Función para manejar errores de la API
const handleApiError = (error) => {
    console.warn('API no disponible, usando almacenamiento local:', error);
    return { error: 'API_UNAVAILABLE', message: 'API no disponible, usando almacenamiento local' };
};

// Función para hashear contraseñas usando SHA256 (compatible con Django)
const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};

// Función para verificar contraseñas
const verifyPassword = async (password, hashedPassword) => {
    const hash = await hashPassword(password);
    return hash === hashedPassword;
};

// Datos de ejemplo para desarrollo (fallback)
// Hash pre-calculado de '123456' para evitar problemas con crypto.subtle
const HASH_123456 = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';

const cajerosEjemplo = [
    {
        id: 1,
        nombre: 'jose',
        password: HASH_123456,
        sucursal_id: 1,
        modulo_asignado: 'POS',
        rol: 'CAJERO',
        activo: true,
        puede_hacer_descuentos: false,
        limite_descuento: 0,
        puede_anular_ventas: false,
        fecha_creacion: new Date().toISOString()
    },
    {
        id: 2,
        nombre: 'prueba1',
        password: HASH_123456,
        sucursal_id: 1,
        modulo_asignado: 'POS',
        rol: 'CAJERO',
        activo: true,
        puede_hacer_descuentos: false,
        limite_descuento: 0,
        puede_anular_ventas: false,
        fecha_creacion: new Date().toISOString()
    },
    {
        id: 3,
        nombre: 'maria',
        password: HASH_123456,
        sucursal_id: 1,
        modulo_asignado: 'REMISIONES',
        rol: 'CAJERO',
        activo: true,
        puede_hacer_descuentos: false,
        limite_descuento: 0,
        puede_anular_ventas: false,
        fecha_creacion: new Date().toISOString()
    },
    {
        id: 4,
        nombre: 'carlos',
        password: HASH_123456,
        sucursal_id: 2,
        modulo_asignado: 'AMBOS',
        rol: 'SUPERVISOR',
        activo: true,
        puede_hacer_descuentos: true,
        limite_descuento: 20,
        puede_anular_ventas: true,
        fecha_creacion: new Date().toISOString()
    }
];

export const cajeroService = {
    // Obtener todos los cajeros
    getAll: async () => {
        try {

            const response = await fetch(`${API_URL}/cajeros/`);
            if (!response.ok) throw new Error(`Error al obtener cajeros: ${response.status}`);
            const data = await response.json();

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

            const response = await fetch(`${API_URL}/cajeros/?sucursal_id=${sucursalId}`);
            if (!response.ok) throw new Error(`Error al obtener cajeros: ${response.status}`);
            const data = await response.json();

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


            // Validar que tenga sucursal_id
            if (!cajeroData.sucursal_id && !cajeroData.sucursal) {
                throw new Error('La sucursal es requerida para crear un cajero');
            }

            // Normalizar el campo sucursal para la API
            const dataToSend = {
                ...cajeroData,
                sucursal: cajeroData.sucursal_id || cajeroData.sucursal, // API espera 'sucursal'
                password: cajeroData.password, // NO hashear aquí, el backend lo hace
                rol: cajeroData.rol || 'CAJERO',
                puede_hacer_descuentos: cajeroData.puede_hacer_descuentos || false,
                limite_descuento: cajeroData.limite_descuento || 0,
                puede_anular_ventas: cajeroData.puede_anular_ventas || false,
                activo: cajeroData.activo !== undefined ? cajeroData.activo : true
            };

            // Remover sucursal_id si existe para evitar conflictos
            delete dataToSend.sucursal_id;



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
                throw new Error(`Error al crear cajero: ${response.status} - ${errorText}`);
            }

            const result = await response.json();

            return result;
        } catch (error) {
            console.error('Error en create cajero:', error);

            // Fallback: guardar en localStorage
            const cajeros = await cajeroService.getAll();

            const nuevoCajero = {
                id: Date.now(), // ID temporal
                ...cajeroData,
                sucursal_id: cajeroData.sucursal_id || cajeroData.sucursal, // Mantener sucursal_id en localStorage
                password: await hashPassword(cajeroData.password),
                rol: cajeroData.rol || 'CAJERO',
                puede_hacer_descuentos: cajeroData.puede_hacer_descuentos || false,
                limite_descuento: cajeroData.limite_descuento || 0,
                puede_anular_ventas: cajeroData.puede_anular_ventas || false,
                activo: cajeroData.activo !== undefined ? cajeroData.activo : true,
                fecha_creacion: new Date().toISOString()
            };

            cajeros.push(nuevoCajero);
            localStorage.setItem('cajeros', JSON.stringify(cajeros));


            return nuevoCajero;
        }
    },

    // Actualizar cajero
    update: async (id, cajeroData) => {
        try {


            // Normalizar el campo sucursal para la API si existe
            const dataToSend = { ...cajeroData };

            if (cajeroData.sucursal_id) {
                dataToSend.sucursal = cajeroData.sucursal_id; // API espera 'sucursal'
                delete dataToSend.sucursal_id; // Remover sucursal_id para evitar conflictos
            }

            // NO hashear contraseña aquí, el backend lo hace en el serializer



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
                throw new Error(`Error al actualizar cajero: ${response.status} - ${errorText}`);
            }

            const result = await response.json();

            return result;
        } catch (error) {
            console.error('Error en update cajero:', error);

            // Fallback: actualizar en localStorage
            const cajeros = await cajeroService.getAll();
            const index = cajeros.findIndex(c => c.id === parseInt(id));

            if (index !== -1) {
                const dataToUpdate = { ...cajeroData };

                // Mantener sucursal_id en localStorage
                if (cajeroData.sucursal_id) {
                    dataToUpdate.sucursal_id = cajeroData.sucursal_id;
                }

                if (cajeroData.password) {
                    dataToUpdate.password = await hashPassword(cajeroData.password);
                }

                cajeros[index] = {
                    ...cajeros[index],
                    ...dataToUpdate,
                    fecha_actualizacion: new Date().toISOString()
                };

                localStorage.setItem('cajeros', JSON.stringify(cajeros));

                return cajeros[index];
            }

            return handleApiError(error);
        }
    },

    // Eliminar cajero (soft delete)
    delete: async (id) => {
        try {


            const response = await fetch(`${API_URL}/cajeros/${id}/`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Error al eliminar cajero: ${response.status}`);
            }


            return { success: true };
        } catch (error) {
            console.error('Error en delete cajero:', error);

            // Fallback: marcar como inactivo en localStorage
            const cajeros = await cajeroService.getAll();
            const index = cajeros.findIndex(c => c.id === parseInt(id));

            if (index !== -1) {
                cajeros[index].activo = false;
                localStorage.setItem('cajeros', JSON.stringify(cajeros));

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

    // Obtener cajeros por sucursal y módulo
    getCajerosByModulo: async (sucursalId, modulo) => {
        try {
            const cajeros = await cajeroService.getActivosBySucursal(sucursalId);
            return cajeros.filter(c =>
                c.modulo_asignado === modulo || c.modulo_asignado === 'AMBOS'
            );
        } catch (error) {
            console.error('Error obteniendo cajeros por módulo:', error);
            return [];
        }
    },

    // Autenticar cajero
    authenticate: async (nombre, password, sucursalId = null) => {
        try {


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

                    return data;
                } else {
                    console.warn(`API devolvió error ${response.status}, usando fallback local`);
                    throw new Error(`API Error: ${response.status}`);
                }
            } catch (apiError) {
                console.warn('API no disponible para autenticación, usando fallback local:', apiError);
            }

            // Fallback: autenticación local


            const cajeros = sucursalId
                ? await cajeroService.getBySucursal(sucursalId)
                : await cajeroService.getAll();

            // Buscar cajero por nombre
            const cajero = cajeros.find(c =>
                c.nombre && c.nombre.toLowerCase() === nombre.toLowerCase() && c.activo
            );

            if (!cajero) {
                console.log('❌ Cajero no encontrado o inactivo');

                return { success: false, message: 'Cajero no encontrado o inactivo' };
            }




            // Verificar contraseña
            if (!(await verifyPassword(password, cajero.password))) {
                console.log('❌ Contraseña incorrecta');


                return { success: false, message: 'Contraseña incorrecta' };
            }



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


            // Intentar iniciar turno con API
            try {
                const response = await fetch(`${API_URL}/turnos/iniciar_turno/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        // Corregido: backend espera xxx_id
                        cajero_id: cajeroId,
                        sucursal_id: sucursalId,
                        // Mantenemos los antiguos por compatibilidad si fuera necesario
                        cajero: cajeroId,
                        sucursal: sucursalId,
                        base_inicial: saldoInicial,
                        notas_apertura: `Turno iniciado desde POS con saldo inicial: ${saldoInicial}`
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {

                        return data.turno;
                    }
                }
            } catch (apiError) {
                console.warn('API no disponible para iniciar turno:', apiError);
            }

            // Fallback: guardar en localStorage

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


            return nuevoTurno;

        } catch (error) {
            console.error('Error iniciando turno:', error);
            return handleApiError(error);
        }
    },

    // Cerrar turno
    cerrarTurno: async (turnoId, arqueoFinal = 0) => {
        try {


            // Validar si es un ID real de base de datos o un timestamp local
            const esIdReal = turnoId && parseInt(turnoId) < 1000000000;

            if (esIdReal) {
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
                            console.log('✅ Turno cerrado en servidor:', data.turno);
                            return data.turno;
                        }
                    } else {
                        console.warn(`⚠️ Error al cerrar turno en servidor: ${response.status}`);
                    }
                } catch (apiError) {
                    console.warn('API no disponible para cerrar turno:', apiError);
                }
            } else {
                console.log('ℹ️ Turno local (timestamp), cerrando solo localmente');
            }

            // Fallback: actualizar en localStorage

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

                return turnos[index];
            }

            return handleApiError(new Error('Turno no encontrado'));

        } catch (error) {
            console.error('Error cerrando turno:', error);
            return handleApiError(error);
        }
    },

    // Obtener turno activo de un cajero
    getTurnoActivo: async (cajeroId) => {
        try {
            // Intentar obtener desde API
            try {
                const response = await fetch(`${API_URL}/turnos/?cajero=${cajeroId}&estado=ACTIVO`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        return data[0]; // Retornar el primer turno activo
                    } else {
                        return null; // ✅ API dice que no hay turno, retornar null y NO usar fallback
                    }
                }
            } catch (apiError) {
                console.warn('API no disponible para obtener turno activo, usando fallback:', apiError);
                // Solo si falla la API (catch), continuamos al fallback
            }

            // Fallback: buscar en localStorage (SOLO SI API FALLA)
            const turnos = JSON.parse(localStorage.getItem('turnos') || '[]');
            const turnoActivo = turnos.find(t =>
                t.cajero === cajeroId && t.estado === 'ACTIVO'
            );

            return turnoActivo || null;
        } catch (error) {
            console.error('Error obteniendo turno activo:', error);
            return null;
        }
    },

    // Función para autenticación solo local (sin API) - Para Remisiones
    authenticateLocal: async (nombre, password, sucursalId = null) => {
        try {


            // Obtener cajeros directamente de localStorage
            const cajeros = await cajeroService.getAll();


            // Buscar cajero por nombre
            const cajero = cajeros.find(c =>
                c.nombre && c.nombre.toLowerCase() === nombre.toLowerCase() && c.activo
            );

            if (!cajero) {
                console.log('❌ Cajero no encontrado o inactivo');
                return { success: false, message: 'Cajero no encontrado o inactivo' };
            }



            // Verificar contraseña
            if (!(await verifyPassword(password, cajero.password))) {
                console.log('❌ Contraseña incorrecta');



                return { success: false, message: 'Contraseña incorrecta' };
            }



            // Retornar datos del cajero sin la contraseña
            const { password: _, ...cajeroSinPassword } = cajero;
            return {
                success: true,
                cajero: cajeroSinPassword,
                message: 'Autenticación exitosa'
            };

        } catch (error) {
            console.error('Error en authenticateLocal:', error);
            return { success: false, message: 'Error en la autenticación local' };
        }
    },

    // Función para crear cajeros específicos por módulo
    crearCajeroModulo: async (modulo = 'REMISIONES') => {
        try {
            console.log(`🆕 Creando cajero para módulo: ${modulo}`);

            const cajeros = await cajeroService.getAll();

            // Verificar si ya existe
            const cajeroExistente = cajeros.find(c =>
                c.nombre && c.nombre.toLowerCase() === modulo.toLowerCase()
            );

            if (cajeroExistente) {


                // Asegurar que esté activo y con contraseña correcta
                cajeroExistente.activo = true;
                cajeroExistente.password = await hashPassword('123456');
                cajeroExistente.sucursal_id = cajeroExistente.sucursal_id || 1;

                // Actualizar en localStorage
                const cajerosActualizados = cajeros.map(c =>
                    c.id === cajeroExistente.id ? cajeroExistente : c
                );
                localStorage.setItem('cajeros', JSON.stringify(cajerosActualizados));

                return { success: true, cajero: cajeroExistente };
            }

            // Crear nuevo cajero
            const nuevoCajero = {
                id: Date.now(),
                nombre: modulo.toUpperCase(),
                password: await hashPassword('123456'),
                sucursal_id: 1,
                rol: 'CAJERO',
                activo: true,
                puede_hacer_descuentos: false,
                limite_descuento: 0,
                puede_anular_ventas: false,
                fecha_creacion: new Date().toISOString()
            };

            // Agregar a la lista
            const cajerosActualizados = [...cajeros, nuevoCajero];
            localStorage.setItem('cajeros', JSON.stringify(cajerosActualizados));


            return { success: true, cajero: nuevoCajero };

        } catch (error) {
            console.error('Error creando cajero:', error);
            return { success: false, message: error.message };
        }
    },

    // Función temporal para debug - REMOVER EN PRODUCCIÓN
    debugCajeroRemisiones: async () => {
        try {


            // Crear o verificar cajero REMISIONES
            const resultadoCreacion = await cajeroService.crearCajeroModulo('REMISIONES');

            if (!resultadoCreacion.success) {
                return {
                    success: false,
                    message: `❌ Error creando cajero: ${resultadoCreacion.message}`
                };
            }



            // Probar autenticación local

            const testLogin = await cajeroService.authenticateLocal('REMISIONES', '123456', 1);


            if (testLogin.success) {
                return {
                    success: true,
                    message: '✅ Cajero REMISIONES funcionando correctamente. Puedes hacer login ahora.',
                    cajero: testLogin.cajero
                };
            } else {
                return {
                    success: false,
                    message: `❌ Error en login: ${testLogin.message}`,
                    cajero: resultadoCreacion.cajero
                };
            }

        } catch (error) {
            console.error('❌ Error en debug:', error);
            return {
                success: false,
                message: `Error en debug: ${error.message}`
            };
        }
    }
};