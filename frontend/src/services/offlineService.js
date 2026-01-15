/**
 * offlineService.js
 * 
 * Servicio para manejo de ventas offline usando IndexedDB.
 * Permite guardar ventas localmente cuando no hay conexión
 * y sincronizarlas automáticamente cuando vuelva el servidor.
 */

const DB_NAME = 'CRM_POS_Offline';
const DB_VERSION = 1;
const STORE_NAME = 'ventas_pendientes';

class OfflineService {
    constructor() {
        this.db = null;
        this.init();
    }

    /**
     * Inicializar la base de datos IndexedDB
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Error al abrir IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB inicializada correctamente');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Crear object store si no existe
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const objectStore = db.createObjectStore(STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true
                    });

                    // Crear índices
                    objectStore.createIndex('uuid', 'uuid', { unique: true });
                    objectStore.createIndex('fecha_creacion', 'fecha_creacion', { unique: false });
                    objectStore.createIndex('sincronizado', 'sincronizado', { unique: false });

                    console.log('✅ Object Store creado:', STORE_NAME);
                }
            };
        });
    }

    /**
     * Generar UUID único para cada venta
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Guardar una venta offline
     */
    async guardarVentaOffline(ventaData) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);

            const ventaOffline = {
                uuid: this.generateUUID(),
                fecha_creacion: new Date().toISOString(),
                sincronizado: false,
                intentos_sincronizacion: 0,
                data: ventaData
            };

            const request = objectStore.add(ventaOffline);

            request.onsuccess = () => {
                console.log('✅ Venta guardada offline:', ventaOffline.uuid);
                resolve({
                    success: true,
                    uuid: ventaOffline.uuid,
                    numero_factura: `OFFLINE-${ventaOffline.uuid.substring(0, 8).toUpperCase()}`
                });
            };

            request.onerror = () => {
                console.error('❌ Error al guardar venta offline:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Obtener todas las ventas pendientes de sincronización
     */
    async getVentasPendientes() {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);
            const index = objectStore.index('sincronizado');

            const request = index.getAll(false); // false = no sincronizadas

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                console.error('❌ Error al obtener ventas pendientes:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Marcar una venta como sincronizada
     */
    async marcarComoSincronizado(uuid, numeroFacturaServidor) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const index = objectStore.index('uuid');

            const request = index.get(uuid);

            request.onsuccess = () => {
                const venta = request.result;
                if (venta) {
                    venta.sincronizado = true;
                    venta.fecha_sincronizacion = new Date().toISOString();
                    venta.numero_factura_servidor = numeroFacturaServidor;

                    const updateRequest = objectStore.put(venta);

                    updateRequest.onsuccess = () => {
                        console.log('✅ Venta marcada como sincronizada:', uuid);
                        resolve(true);
                    };

                    updateRequest.onerror = () => {
                        console.error('❌ Error al actualizar venta:', updateRequest.error);
                        reject(updateRequest.error);
                    };
                } else {
                    console.warn('⚠️ Venta no encontrada:', uuid);
                    resolve(false);
                }
            };

            request.onerror = () => {
                console.error('❌ Error al buscar venta:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Incrementar contador de intentos de sincronización
     */
    async incrementarIntentos(uuid) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const index = objectStore.index('uuid');

            const request = index.get(uuid);

            request.onsuccess = () => {
                const venta = request.result;
                if (venta) {
                    venta.intentos_sincronizacion = (venta.intentos_sincronizacion || 0) + 1;
                    venta.ultimo_intento = new Date().toISOString();

                    const updateRequest = objectStore.put(venta);

                    updateRequest.onsuccess = () => {
                        resolve(venta.intentos_sincronizacion);
                    };

                    updateRequest.onerror = () => {
                        reject(updateRequest.error);
                    };
                } else {
                    resolve(0);
                }
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Eliminar ventas sincronizadas antiguas (más de 30 días)
     */
    async limpiarVentasSincronizadas() {
        if (!this.db) {
            await this.init();
        }

        const hace30Dias = new Date();
        hace30Dias.setDate(hace30Dias.getDate() - 30);

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const index = objectStore.index('sincronizado');

            const request = index.openCursor(true); // true = sincronizadas

            let eliminadas = 0;

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const venta = cursor.value;
                    const fechaSinc = new Date(venta.fecha_sincronizacion);

                    if (fechaSinc < hace30Dias) {
                        cursor.delete();
                        eliminadas++;
                    }

                    cursor.continue();
                } else {
                    console.log(`🧹 Limpieza completada: ${eliminadas} ventas eliminadas`);
                    resolve(eliminadas);
                }
            };

            request.onerror = () => {
                console.error('❌ Error al limpiar ventas:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Obtener estadísticas de ventas offline
     */
    async getEstadisticas() {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);

            const request = objectStore.getAll();

            request.onsuccess = () => {
                const ventas = request.result || [];
                const pendientes = ventas.filter(v => !v.sincronizado).length;
                const sincronizadas = ventas.filter(v => v.sincronizado).length;

                resolve({
                    total: ventas.length,
                    pendientes,
                    sincronizadas
                });
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }
}

// Exportar instancia única (singleton)
export const offlineService = new OfflineService();
