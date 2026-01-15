// Servicio para comunicarse con el ejecutable Electron (puente de hardware)
const HARDWARE_BRIDGE_URL = 'http://127.0.0.1:3001';

class HardwareBridgeService {
    constructor() {
        this.isAvailable = false;
        this.checking = false;
    }

    // Verificar si el ejecutable está corriendo
    async checkAvailability() {
        if (this.checking) return this.isAvailable;

        this.checking = true;

        try {
            const response = await fetch(`${HARDWARE_BRIDGE_URL}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(1000) // Timeout de 1 segundo
            });

            if (response.ok) {
                const data = await response.json();
                this.isAvailable = data.status === 'ok';
                console.log('✅ Ejecutable Electron detectado');
            } else {
                this.isAvailable = false;
            }
        } catch (error) {
            this.isAvailable = false;
            console.log('ℹ️ Ejecutable no disponible - usando navegador');
        } finally {
            this.checking = false;
        }

        return this.isAvailable;
    }

    // Imprimir ticket vía ejecutable
    async printTicket(html, printerName) {
        try {
            const response = await fetch(`${HARDWARE_BRIDGE_URL}/print-ticket`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ html, printerName })
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Ticket impreso por ejecutable');
                return { success: true };
            } else {
                console.error('❌ Error imprimiendo:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('❌ Error comunicándose con ejecutable:', error);
            return { success: false, error: error.message };
        }
    }

    // Abrir cajón vía ejecutable
    async openDrawer(printerName) {
        try {
            const response = await fetch(`${HARDWARE_BRIDGE_URL}/open-drawer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ printerName })
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Cajón abierto por ejecutable');
                return { success: true };
            } else {
                console.error('❌ Error abriendo cajón:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('❌ Error comunicándose con ejecutable:', error);
            return { success: false, error: error.message };
        }
    }
}

export const hardwareBridgeService = new HardwareBridgeService();
