import React, { useState } from 'react';
import { Button, Spinner, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { useProducts } from '../../hooks/useUnifiedProducts';

/**
 * Botón para sincronizar manualmente los productos con el backend
 */
const SyncButton = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const { products, updateProducts } = useProducts();

    const handleSync = async () => {
        if (isSyncing) return;

        setIsSyncing(true);
        try {

            await updateProducts(products);


            // Mostrar notificación
            const notification = document.createElement('div');
            notification.className = 'sync-notification';
            notification.textContent = 'Sincronización completada';
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background-color: #28a745;
                color: white;
                padding: 10px 20px;
                border-radius: 4px;
                z-index: 9999;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            `;

            document.body.appendChild(notification);

            // Eliminar notificación después de 3 segundos
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 3000);
        } catch (error) {
            console.error("Error en sincronización manual:", error);

            // Mostrar notificación de error
            const notification = document.createElement('div');
            notification.className = 'sync-notification';
            notification.textContent = 'Error en sincronización';
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background-color: #dc3545;
                color: white;
                padding: 10px 20px;
                border-radius: 4px;
                z-index: 9999;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            `;

            document.body.appendChild(notification);

            // Eliminar notificación después de 3 segundos
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 3000);
        } finally {
            setIsSyncing(false);
        }
    };

    const tooltip = (
        <Tooltip id="sync-tooltip">
            Sincronizar productos con la base de datos
        </Tooltip>
    );

    return (
        <OverlayTrigger placement="bottom" overlay={tooltip}>
            <Button
                variant="outline-success"
                onClick={handleSync}
                disabled={isSyncing}
                style={{ minWidth: 32, minHeight: 32 }}
            >
                {isSyncing ? (
                    <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                    />
                ) : (
                    <span className="material-icons" style={{ fontSize: '18px' }}>sync</span>
                )}
            </Button>
        </OverlayTrigger>
    );
};

export default SyncButton;
