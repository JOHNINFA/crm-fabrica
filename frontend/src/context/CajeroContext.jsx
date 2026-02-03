import React, { createContext, useState, useContext, useEffect } from 'react';
import { cajeroService } from '../services/cajeroService';
import { sucursalService } from '../services/sucursalService';
import { useAuth } from './AuthContext';

const CajeroContext = createContext();

export const useCajero = () => {
    const context = useContext(CajeroContext);
    if (!context) {
        throw new Error('useCajero debe ser usado dentro de un CajeroProvider');
    }
    return context;
};

export const CajeroProvider = ({ children }) => {
    // 🆕 Obtener usuario del sistema general
    const { usuario: usuarioSistema, isAuthenticated: isAuthenticatedSistema } = useAuth();

    // Estados principales
    const [cajeroLogueado, setCajeroLogueado] = useState(null);
    const [sucursalActiva, setSucursalActiva] = useState(null);
    const [turnoActivo, setTurnoActivo] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);

    // 🆕 Sincronizar con el usuario del sistema general
    useEffect(() => {
        const sincronizarConSistema = async () => {
            // Si hay usuario del sistema autenticado
            if (isAuthenticatedSistema && usuarioSistema) {
                try {
                    // Verificar si el usuario del sistema es un cajero
                    const cajeroData = {
                        id: usuarioSistema.id,
                        nombre: usuarioSistema.nombre,
                        codigo: usuarioSistema.codigo,
                        rol: usuarioSistema.rol,
                        sucursal_id: usuarioSistema.sucursal_id || 1
                    };

                    setCajeroLogueado(cajeroData);
                    setIsAuthenticated(true);

                    // Cargar sucursal
                    const sucursal = await sucursalService.getById(cajeroData.sucursal_id);
                    if (sucursal) {
                        setSucursalActiva(sucursal);
                    }

                    // Verificar si hay turno activo para este cajero
                    const turnoActivo = await cajeroService.getTurnoActivo(cajeroData.id);
                    if (turnoActivo && !turnoActivo.error) {
                        // ✅ VALIDACIÓN ADICIONAL: Verificar que el turno sea realmente de este cajero
                        const turnoEsDelCajero =
                            turnoActivo.cajero === cajeroData.id ||
                            turnoActivo.cajero_id === cajeroData.id;

                        if (turnoEsDelCajero) {
                            setTurnoActivo(turnoActivo);
                            localStorage.setItem('turno_activo', JSON.stringify(turnoActivo));
                        } else {
                            console.warn('⚠️ Turno encontrado no pertenece al cajero actual. Descartando.');
                            setTurnoActivo(null);
                            localStorage.removeItem('turno_activo');
                        }
                    } else {
                        // 🧹 Fix: Si no hay turno activo en API, limpiar estado local explícitamente
                        setTurnoActivo(null);
                        localStorage.removeItem('turno_activo');
                    }
                } catch (error) {
                    console.error('Error sincronizando con sistema:', error);
                }
            } else {
                // Si no hay usuario del sistema, limpiar estados
                setCajeroLogueado(null);
                setIsAuthenticated(false);
                setTurnoActivo(null);
                localStorage.removeItem('turno_activo');
            }
        };

        sincronizarConSistema();
    }, [isAuthenticatedSistema, usuarioSistema]);

    // 🆕 Función para abrir turno (sin login)
    const abrirTurno = async (saldoInicial = 0) => {
        if (!cajeroLogueado) {
            return { success: false, message: 'No hay cajero logueado' };
        }

        setLoading(true);
        try {
            const turno = await cajeroService.iniciarTurno(
                cajeroLogueado.id,
                cajeroLogueado.sucursal_id,
                saldoInicial
            );

            if (turno && !turno.error) {
                setTurnoActivo(turno);
                localStorage.setItem('turno_activo', JSON.stringify(turno));
                localStorage.setItem('saldo_inicial_turno', saldoInicial.toString());
                localStorage.setItem('ultimo_login', new Date().toISOString());

                return { success: true, message: 'Turno iniciado exitosamente' };
            } else {
                return { success: false, message: 'Error al iniciar turno' };
            }
        } catch (error) {
            console.error('Error abriendo turno:', error);
            return { success: false, message: 'Error al iniciar turno' };
        } finally {
            setLoading(false);
        }
    };

    // Función de login
    const login = async (nombre, password, saldoInicial = 0) => {
        setLoading(true);
        try {


            // Autenticar con la sucursal activa
            const resultado = await cajeroService.authenticate(
                nombre,
                password,
                sucursalActiva?.id
            );

            if (resultado.success) {
                const cajero = resultado.cajero;

                // Guardar cajero logueado
                setCajeroLogueado(cajero);
                setIsAuthenticated(true);
                localStorage.setItem('cajero_logueado', JSON.stringify(cajero));

                // Cargar/actualizar sucursal
                const sucursal = await sucursalService.getById(cajero.sucursal_id);
                if (sucursal) {
                    setSucursalActiva(sucursal);
                    localStorage.setItem('sucursal_activa', JSON.stringify(sucursal));
                }

                // Iniciar turno con saldo inicial
                const turno = await cajeroService.iniciarTurno(cajero.id, cajero.sucursal_id, saldoInicial);
                if (turno && !turno.error) {
                    setTurnoActivo(turno);
                    localStorage.setItem('turno_activo', JSON.stringify(turno));

                    // Guardar saldo inicial para usar en el arqueo
                    localStorage.setItem('saldo_inicial_turno', saldoInicial.toString());

                    // Marcar timestamp del login para detectar nuevos logins
                    localStorage.setItem('ultimo_login', new Date().toISOString());

                }


                return { success: true, message: 'Login exitoso' };
            } else {
                console.log('❌ Login fallido:', resultado.message);
                return { success: false, message: resultado.message };
            }
        } catch (error) {
            console.error('❌ Error en login:', error);
            return { success: false, message: 'Error en el sistema de autenticación' };
        } finally {
            setLoading(false);
        }
    };

    // Función de logout
    const logout = async () => {
        setLoading(true);
        try {


            // 🔒 BLOQUEO ESTRICTO: Si hay turno activo, NO permitir logout
            // El usuario DEBE cerrar el turno mediante el proceso de Arqueo de Caja
            if (turnoActivo && turnoActivo.estado === 'ACTIVO') {
                return {
                    success: false,
                    message: '⛔ CAJA ABIERTA: No puedes cerrar sesión con un turno activo.\n\nPor favor, ve al módulo de Caja y realiza el "Cierre de Turno" (Arqueo) para cuadrar las ventas.'
                };
            }

            // ❌ ELIMINADO: No cerrar turno automáticamente al salir.
            // if (turnoActivo && turnoActivo.estado === 'ACTIVO') {
            //    await cajeroService.cerrarTurno(turnoActivo.id);
            // }

            // Marcar que se hizo logout para que el próximo login sepa que debe limpiar
            localStorage.setItem('ultimo_logout', new Date().toISOString());


            // Limpiar estados de corte de caja del localStorage
            // Buscar y eliminar todas las claves que empiecen con 'corteRealizado_'
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('corteRealizado_')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);

            });

            // Limpiar estados
            setCajeroLogueado(null);
            setTurnoActivo(null);
            setIsAuthenticated(false);

            // Limpiar localStorage
            localStorage.removeItem('cajero_logueado');
            localStorage.removeItem('turno_activo');
            localStorage.removeItem('saldo_inicial_turno');

            // Mantener sucursal activa para próximo login

            return { success: true, message: 'Sesión cerrada exitosamente' };
        } catch (error) {
            console.error('❌ Error en logout:', error);
            return { success: false, message: 'Error cerrando sesión' };
        } finally {
            setLoading(false);
        }
    };

    // Cambiar sucursal activa
    const cambiarSucursal = async (sucursalId) => {
        try {
            const sucursal = await sucursalService.getById(sucursalId);
            if (sucursal) {
                setSucursalActiva(sucursal);
                localStorage.setItem('sucursal_activa', JSON.stringify(sucursal));

                return { success: true };
            }
            return { success: false, message: 'Sucursal no encontrada' };
        } catch (error) {
            console.error('Error cambiando sucursal:', error);
            return { success: false, message: 'Error cambiando sucursal' };
        }
    };

    // Obtener cajeros disponibles para login
    const getCajerosDisponibles = async () => {
        try {
            if (!sucursalActiva) return [];

            const cajeros = await cajeroService.getActivosBySucursal(sucursalActiva.id);
            return cajeros;
        } catch (error) {
            console.error('Error obteniendo cajeros disponibles:', error);
            return [];
        }
    };

    // Verificar si hay turno activo
    const hayTurnoActivo = () => {
        return turnoActivo && turnoActivo.estado === 'ACTIVO';
    };

    // Obtener información del topbar
    const getTopbarInfo = () => {
        if (isAuthenticated && cajeroLogueado && sucursalActiva) {
            return {
                mostrar: true,
                texto: `${cajeroLogueado.nombre} | ${sucursalActiva.nombre}`,
                cajero: cajeroLogueado.nombre,
                sucursal: sucursalActiva.nombre
            };
        }

        if (sucursalActiva) {
            return {
                mostrar: true,
                texto: `POS | ${sucursalActiva.nombre}`,
                cajero: null,
                sucursal: sucursalActiva.nombre
            };
        }

        return {
            mostrar: true,
            texto: 'POS - Id: 1',
            cajero: null,
            sucursal: null
        };
    };

    // Obtener saldo inicial del turno actual
    const getSaldoInicialTurno = () => {
        const saldoGuardado = localStorage.getItem('saldo_inicial_turno');
        return saldoGuardado ? parseFloat(saldoGuardado) : 0;
    };

    // Valor del contexto
    const contextValue = {
        // Estados
        cajeroLogueado,
        sucursalActiva,
        turnoActivo,
        isAuthenticated,
        loading,

        // Funciones
        login,
        logout,
        abrirTurno,
        cambiarSucursal,
        getCajerosDisponibles,
        hayTurnoActivo,
        getTopbarInfo,
        getSaldoInicialTurno,

        // Setters (para casos especiales)
        setCajeroLogueado,
        setSucursalActiva,
        setTurnoActivo
    };

    return (
        <CajeroContext.Provider value={contextValue}>
            {children}
        </CajeroContext.Provider>
    );
};