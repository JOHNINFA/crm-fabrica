import React, { createContext, useState, useContext, useEffect } from 'react';
import { cajeroService } from '../services/cajeroService';
import { sucursalService } from '../services/sucursalService';

const CajeroRemisionesContext = createContext();

export const useCajeroRemisiones = () => {
    const context = useContext(CajeroRemisionesContext);
    if (!context) {
        console.error('useCajeroRemisiones debe ser usado dentro de un CajeroRemisionesProvider');
        // Retornar valores por defecto en lugar de lanzar error
        return {
            cajeroLogueado: null,
            sucursalActiva: null,
            turnoActivo: null,
            isAuthenticated: false,
            loading: false,
            login: async () => ({ success: false, message: 'Contexto no disponible' }),
            logout: async () => ({ success: false, message: 'Contexto no disponible' }),
            cambiarSucursal: async () => ({ success: false, message: 'Contexto no disponible' }),
            getCajerosDisponibles: async () => [],
            hayTurnoActivo: () => false,
            getTopbarInfo: () => ({ mostrar: false, texto: 'Error', cajero: null, sucursal: null }),
            getSaldoInicialTurno: () => 0,
            setCajeroLogueado: () => { },
            setSucursalActiva: () => { },
            setTurnoActivo: () => { }
        };
    }
    return context;
};

export const CajeroRemisionesProvider = ({ children }) => {
    // Estados principales
    const [cajeroLogueado, setCajeroLogueado] = useState(null);
    const [sucursalActiva, setSucursalActiva] = useState(null);
    const [turnoActivo, setTurnoActivo] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);

    // Claves específicas para Remisiones
    const STORAGE_KEYS = {
        cajero: 'cajero_remisiones_logueado',
        turno: 'turno_remisiones_activo',
        sucursal: 'sucursal_remisiones_activa',
        saldoInicial: 'saldo_inicial_remisiones_turno'
    };

    // Cargar datos persistidos al iniciar
    useEffect(() => {
        const cargarDatosPersistidos = async () => {
            try {
                // Cargar cajero logueado de Remisiones
                const cajeroGuardado = localStorage.getItem(STORAGE_KEYS.cajero);
                if (cajeroGuardado) {
                    const cajero = JSON.parse(cajeroGuardado);
                    setCajeroLogueado(cajero);
                    setIsAuthenticated(true);

                    // Cargar sucursal del cajero
                    const sucursal = await sucursalService.getById(cajero.sucursal_id);
                    if (sucursal) {
                        setSucursalActiva(sucursal);
                    }
                }

                // Cargar turno activo de Remisiones
                const turnoGuardado = localStorage.getItem(STORAGE_KEYS.turno);
                if (turnoGuardado) {
                    const turno = JSON.parse(turnoGuardado);
                    setTurnoActivo(turno);
                }

                // Si no hay cajero, cargar sucursal por defecto
                if (!cajeroGuardado) {
                    const sucursalDefault = await sucursalService.getDefault();
                    if (sucursalDefault) {
                        setSucursalActiva(sucursalDefault);
                    }
                }
            } catch (error) {
                console.error('Error cargando datos persistidos de Remisiones:', error);
            }
        };

        cargarDatosPersistidos();
    }, []);

    // Función de login para Remisiones
    const login = async (nombre, password, saldoInicial = 0) => {
        setLoading(true);
        try {




            // Si no hay sucursal activa, cargar la primera disponible
            let sucursalParaLogin = sucursalActiva;
            if (!sucursalParaLogin) {
                console.log('⚠️ [REMISIONES] No hay sucursal activa, cargando sucursal por defecto...');
                const sucursalDefault = await sucursalService.getDefault();
                if (sucursalDefault) {
                    sucursalParaLogin = sucursalDefault;
                    setSucursalActiva(sucursalDefault);

                } else {
                    // Si no hay sucursal por defecto, usar ID 1
                    sucursalParaLogin = { id: 1, nombre: 'Principal' };
                    setSucursalActiva(sucursalParaLogin);
                }
            }

            // Usar autenticación normal (intenta API primero, luego localStorage)
            const resultado = await cajeroService.authenticate(
                nombre,
                password,
                sucursalParaLogin?.id
            );



            if (resultado.success) {
                const cajero = resultado.cajero;

                // Guardar cajero logueado en Remisiones
                setCajeroLogueado(cajero);
                setIsAuthenticated(true);
                localStorage.setItem(STORAGE_KEYS.cajero, JSON.stringify(cajero));

                // Cargar/actualizar sucursal
                const sucursal = await sucursalService.getById(cajero.sucursal_id);
                if (sucursal) {
                    setSucursalActiva(sucursal);
                    localStorage.setItem(STORAGE_KEYS.sucursal, JSON.stringify(sucursal));
                }

                // Iniciar turno con saldo inicial
                const turno = await cajeroService.iniciarTurno(cajero.id, cajero.sucursal_id, saldoInicial);
                if (turno && !turno.error) {
                    setTurnoActivo(turno);
                    localStorage.setItem(STORAGE_KEYS.turno, JSON.stringify(turno));

                    // Guardar saldo inicial para usar en el arqueo
                    localStorage.setItem(STORAGE_KEYS.saldoInicial, saldoInicial.toString());
                }


                return { success: true, message: 'Login exitoso' };
            } else {
                console.log('❌ [REMISIONES] Login fallido:', resultado.message);
                return { success: false, message: resultado.message };
            }
        } catch (error) {
            console.error('❌ [REMISIONES] Error en login:', error);
            return { success: false, message: 'Error en el sistema de autenticación' };
        } finally {
            setLoading(false);
        }
    };

    // Función de logout para Remisiones
    const logout = async () => {
        setLoading(true);
        try {


            // Cerrar turno si está activo
            if (turnoActivo && turnoActivo.estado === 'ACTIVO') {
                await cajeroService.cerrarTurno(turnoActivo.id);

            }

            // Limpiar estados
            setCajeroLogueado(null);
            setTurnoActivo(null);
            setIsAuthenticated(false);

            // Limpiar localStorage de Remisiones
            localStorage.removeItem(STORAGE_KEYS.cajero);
            localStorage.removeItem(STORAGE_KEYS.turno);
            localStorage.removeItem(STORAGE_KEYS.saldoInicial);

            // Mantener sucursal activa para próximo login

            return { success: true, message: 'Sesión cerrada exitosamente' };
        } catch (error) {
            console.error('❌ [REMISIONES] Error en logout:', error);
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
                localStorage.setItem(STORAGE_KEYS.sucursal, JSON.stringify(sucursal));

                return { success: true };
            }
            return { success: false, message: 'Sucursal no encontrada' };
        } catch (error) {
            console.error('[REMISIONES] Error cambiando sucursal:', error);
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
            console.error('[REMISIONES] Error obteniendo cajeros disponibles:', error);
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
                texto: `REMISIONES | ${sucursalActiva.nombre}`,
                cajero: null,
                sucursal: sucursalActiva.nombre
            };
        }

        return {
            mostrar: true,
            texto: 'PEDIDOS - Id: 1',
            cajero: null,
            sucursal: null
        };
    };

    // Obtener saldo inicial del turno actual
    const getSaldoInicialTurno = () => {
        const saldoGuardado = localStorage.getItem(STORAGE_KEYS.saldoInicial);
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
        <CajeroRemisionesContext.Provider value={contextValue}>
            {children}
        </CajeroRemisionesContext.Provider>
    );
};