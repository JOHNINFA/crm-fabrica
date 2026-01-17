/**
 * offlineSyncService.js
 * 
 * Servicio para sincronización automática de ventas offline.
 * Intenta sincronizar ventas pendientes cada 30 segundos cuando hay conexión.
 */

import { offlineService } from './offlineService';

import { API_URL } from './api';
// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const SYNC_INTERVAL = 30000; // 30 segundos
const MAX_RETRY_ATTEMPTS = 5;

class OfflineSyncService {
    constructor() {
        this.isSyncing = false;
        this.syncIntervalId = null;
        this.isOnline = navigator.onLine;

        // Escuchar cambios en la conexión
        window.addEventListener('online', () => {
            console.log('🌐 Conexión restaurada');
            this.isOnline = true;
            this.syncPendingVentas();
        });

        window.addEventListener('offline', () => {
            console.log('📡 Conexión perdida');
            this.isOnline = false;
        });
    }

    /**
     * Iniciar sincronización automática
     */
    startAutoSync() {
        if (this.syncIntervalId) {
            console.log('⚠️ Sync ya está activo');
            return;
        }

        console.log('✅ Iniciando sincronización automática cada 30 segundos');

        // Sincronizar inmediatamente
        this.syncPendingVentas();

        // Luego cada 30 segundos
        this.syncIntervalId = setInterval(() => {
            if (this.isOnline) {
                this.syncPendingVentas();
            }
        }, SYNC_INTERVAL);
    }

    /**
     * Detener sincronización automática
     */
    stopAutoSync() {
        if (this.syncIntervalId) {
            clearInterval(this.syncIntervalId);
            this.syncIntervalId = null;
            console.log('⏹️ Sincronización automática detenida');
        }
    }

    /**
     * Sincronizar ventas pendientes
     */
    async syncPendingVentas() {
        if (this.isSyncing) {
            console.log('⏳ Sincronización ya en progreso...');
            return;
        }

        if (!this.isOnline) {
            console.log('📡 Sin conexión - saltando sincronización');
            return;
        }

        try {
            this.isSyncing = true;

            const pendientes = await offlineService.getVentasPendientes();

            if (pendientes.length === 0) {
                // console.log('✅ No hay ventas pendientes de sincronizar');
                return;
            }

            console.log(`🔄 Sincronizando ${pendientes.length} ventas pendientes...`);

            let sincronizadas = 0;
            let fallidas = 0;

            for (const venta of pendientes) {
                try {
                    // Saltar si ya intentó muchas veces
                    if (venta.intentos_sincronizacion >= MAX_RETRY_ATTEMPTS) {
                        console.warn(`⚠️ Venta ${venta.uuid} excedió intentos máximos (${MAX_RETRY_ATTEMPTS})`);
                        fallidas++;
                        continue;
                    }

                    // Intentar enviar al servidor
                    const resultado = await this.enviarVentaAlServidor(venta.data);

                    if (resultado.success) {
                        // Marcar como sincronizada
                        await offlineService.marcarComoSincronizado(venta.uuid, resultado.numero_factura);
                        sincronizadas++;
                        console.log(`✅ Venta ${venta.uuid} sincronizada → ${resultado.numero_factura}`);
                    } else {
                        // Incrementar intentos
                        await offlineService.incrementarIntentos(venta.uuid);
                        fallidas++;
                        console.warn(`❌ Error al sincronizar ${venta.uuid}:`, resultado.error);
                    }

                } catch (error) {
                    // Incrementar intentos
                    await offlineService.incrementarIntentos(venta.uuid);
                    fallidas++;
                    console.error(`❌ Error al sincronizar venta ${venta.uuid}:`, error.message);
                }
            }

            console.log(`📊 Sincronización completada: ${sincronizadas} exitosas, ${fallidas} fallidas`);

            // Limpiar ventas antiguas sincronizadas (más de 30 días)
            if (sincronizadas > 0) {
                try {
                    await offlineService.limpiarVentasSincronizadas();
                } catch (error) {
                    console.warn('Error al limpiar ventas antiguas:', error);
                }
            }

        } catch (error) {
            console.error('❌ Error en sincronización:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Enviar una venta al servidor
     */
    async enviarVentaAlServidor(ventaData) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${API_URL}/ventas/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ventaData),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            return {
                success: true,
                numero_factura: data.numero_factura,
                data
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtener estadísticas de sincronización
     */
    async getStats() {
        return await offlineService.getEstadisticas();
    }

    /**
     * Forzar sincronización manual
     */
    async forceSyncNow() {
        console.log('🔄 Sincronización manual forzada');
        await this.syncPendingVentas();
    }
}

// Exportar instancia única (singleton)
export const offlineSyncService = new OfflineSyncService();
