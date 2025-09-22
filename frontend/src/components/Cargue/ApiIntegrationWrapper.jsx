// Wrapper para integración con API en PlantillaOperativa
// NOTA: Este componente está preparado pero NO ACTIVO todavía

import React, { useState, useEffect } from 'react';
import { cargueApiService, cargueHybridService, cargueApiConfig } from '../../services/cargueApiService';

const ApiIntegrationWrapper = ({
    children,
    dia,
    idSheet,
    fechaSeleccionada,
    onDatosRecibidos,
    onErrorApi
}) => {
    const [estadoApi, setEstadoApi] = useState({
        cargando: false,
        conectado: false,
        ultimaVerificacion: null,
        error: null
    });

    // 🚀 VERIFICAR CONEXIÓN AL MONTAR
    useEffect(() => {
        if (cargueApiConfig.USAR_API) {
            verificarConexionServidor();
        }
    }, []);

    // 🚀 CARGAR DATOS DESDE API CUANDO CAMBIE DIA/ID/FECHA
    useEffect(() => {
        if (cargueApiConfig.USAR_API && dia && idSheet && fechaSeleccionada) {
            cargarDatosDesdeApi();
        }
    }, [dia, idSheet, fechaSeleccionada]);

    // 🚀 VERIFICAR CONEXIÓN CON SERVIDOR
    const verificarConexionServidor = async () => {
        try {
            setEstadoApi(prev => ({ ...prev, cargando: true }));

            const resultado = await cargueApiService.verificarConexion();

            setEstadoApi(prev => ({
                ...prev,
                conectado: resultado.success,
                ultimaVerificacion: new Date(),
                error: resultado.success ? null : resultado.message,
                cargando: false
            }));

            if (cargueApiConfig.DEBUG_LOGS) {
                console.log(`🔍 API CONNECTION: ${resultado.success ? '✅ Conectado' : '❌ Desconectado'} - ${resultado.message}`);
            }

        } catch (error) {
            setEstadoApi(prev => ({
                ...prev,
                conectado: false,
                error: error.message,
                cargando: false
            }));

            if (cargueApiConfig.DEBUG_LOGS) {
                console.error('❌ API CONNECTION: Error verificando conexión:', error);
            }
        }
    };

    // 🚀 CARGAR DATOS DESDE API
    const cargarDatosDesdeApi = async () => {
        try {
            setEstadoApi(prev => ({ ...prev, cargando: true }));

            if (cargueApiConfig.DEBUG_LOGS) {
                console.log(`🔍 API LOAD: Cargando datos - ${dia} ${idSheet} ${fechaSeleccionada}`);
            }

            // Usar servicio híbrido (localStorage + API)
            const resultado = await cargueHybridService.cargarDatos(dia, idSheet, fechaSeleccionada);

            if (resultado.success) {
                // Notificar al componente padre que se recibieron datos
                if (onDatosRecibidos) {
                    onDatosRecibidos(resultado.data, resultado.source);
                }

                if (cargueApiConfig.DEBUG_LOGS) {
                    console.log(`✅ API LOAD: Datos cargados desde ${resultado.source}`);
                }
            } else {
                if (onErrorApi) {
                    onErrorApi(resultado.message);
                }

                if (cargueApiConfig.DEBUG_LOGS) {
                    console.log(`⚠️ API LOAD: ${resultado.message}`);
                }
            }

        } catch (error) {
            if (onErrorApi) {
                onErrorApi(error.message);
            }

            if (cargueApiConfig.DEBUG_LOGS) {
                console.error('❌ API LOAD: Error cargando datos:', error);
            }
        } finally {
            setEstadoApi(prev => ({ ...prev, cargando: false }));
        }
    };

    // 🚀 GUARDAR DATOS EN API
    const guardarDatosEnApi = async (productos) => {
        if (!cargueApiConfig.USAR_API) return;

        try {
            if (cargueApiConfig.DEBUG_LOGS) {
                console.log(`📤 API SAVE: Guardando datos - ${dia} ${idSheet} ${fechaSeleccionada}`);
            }

            // Usar servicio híbrido (localStorage inmediato + API con debounce)
            const resultado = await cargueHybridService.guardarDatos(dia, idSheet, fechaSeleccionada, productos);

            if (cargueApiConfig.DEBUG_LOGS) {
                console.log(`✅ API SAVE: ${resultado.message}`);
            }

        } catch (error) {
            if (cargueApiConfig.DEBUG_LOGS) {
                console.error('❌ API SAVE: Error guardando datos:', error);
            }
        }
    };

    // 🚀 EXPONER FUNCIONES AL COMPONENTE HIJO
    const apiMethods = {
        cargarDatos: cargarDatosDesdeApi,
        guardarDatos: guardarDatosEnApi,
        verificarConexion: verificarConexionServidor,
        estadoApi
    };

    // 🚀 RENDERIZAR COMPONENTE HIJO CON MÉTODOS DE API
    return React.cloneElement(children, {
        ...children.props,
        apiMethods: cargueApiConfig.USAR_API ? apiMethods : null
    });
};

export default ApiIntegrationWrapper;