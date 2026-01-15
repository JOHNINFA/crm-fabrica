import { configuracionImpresionService } from './api';
import { hardwareBridgeService } from './hardwareBridgeService';

export const cajonService = {
    /**
     * Abre el cajón monedero enviando comando ESC/POS a la impresora
     * Primero intenta usar el ejecutable Electron, luego IPC directo
     */
    abrirCajon: async () => {
        try {
            console.log('🔓 Intentando abrir cajón monedero...');

            // 1. Obtener impresora configurada
            let configuracion = JSON.parse(
                localStorage.getItem('configuracion_impresion') || '{}'
            );

            let nombreImpresora = configuracion.impresora_predeterminada || configuracion.impresora_pos;

            // 2. Si no está en localStorage, buscar en servidor
            if (!nombreImpresora) {
                try {
                    console.log('🔄 Buscando impresora en el servidor...');
                    const configServer = await configuracionImpresionService.getActiva();

                    if (configServer && configServer.impresora_predeterminada) {
                        nombreImpresora = configServer.impresora_predeterminada;
                        localStorage.setItem('configuracion_impresion', JSON.stringify(configServer));
                        console.log('✅ Impresora encontrada y guardada:', nombreImpresora);
                    }
                } catch (e) {
                    console.error('Error obteniendo config del servidor:', e);
                }
            }

            if (!nombreImpresora) {
                console.warn('⚠️ No hay impresora configurada. Cajón no se puede abrir.');
                return {
                    success: false,
                    message: 'No hay impresora configurada'
                };
            }

            // 🆕 3. Intentar usar puente de hardware (navegador → ejecutable)
            const bridgeAvailable = await hardwareBridgeService.checkAvailability();

            if (bridgeAvailable) {
                console.log('🌉 Usando puente de hardware (ejecutable)');
                return await hardwareBridgeService.openDrawer(nombreImpresora);
            }

            // 4. Si no hay puente, intentar IPC directo (solo si está en Electron)
            if (window.electron?.ipcRenderer) {
                const comandoCajon = '\x1B\x70\x00\x19\xFA';

                const resultado = await window.electron.ipcRenderer.invoke('imprimir-raw', {
                    printer: nombreImpresora,
                    data: comandoCajon
                });

                if (resultado.success) {
                    console.log('✅ Cajón abierto correctamente (IPC directo)');
                    return {
                        success: true,
                        message: 'Cajón abierto'
                    };
                } else {
                    console.error('❌ Error abriendo cajón:', resultado.error);
                    return {
                        success: false,
                        message: resultado.error
                    };
                }
            }

            // 5. No hay forma de abrir el cajón
            console.warn('⚠️ Ejecutando en navegador sin puente. No se puede abrir el cajón.');
            return {
                success: false,
                message: 'Requiere ejecutable Electron ejecutándose'
            };
        } catch (error) {
            console.error('❌ Error en abrirCajon:', error);
            return {
                success: false,
                message: error.message
            };
        }
    },

    estaDisponible: () => {
        const configuracion = JSON.parse(
            localStorage.getItem('configuracion_impresion') || '{}'
        );
        return !!(configuracion.impresora_predeterminada || configuracion.impresora_pos);
    }
};
