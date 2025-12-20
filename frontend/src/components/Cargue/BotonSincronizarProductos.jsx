import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useUnifiedProducts } from '../../context/UnifiedProductContext';

const BotonSincronizarProductos = () => {
    const [sincronizando, setSincronizando] = useState(false);
    const { loadFromBackend } = useUnifiedProducts();

    const handleSincronizar = async () => {
        if (window.confirm('¿Deseas sincronizar productos y pedidos? Esto actualizará todos los datos.')) {
            setSincronizando(true);

            try {
                // Limpiar caché local
                localStorage.removeItem('products');
                localStorage.removeItem('productos');
                localStorage.removeItem('precios_cargue_cache');

                // Forzar carga desde backend
                await loadFromBackend();

                // 🆕 Disparar evento para recargar pedidos sin refrescar la página
                window.dispatchEvent(new CustomEvent('recargarPedidos'));

                // 🆕 Pequeño delay y luego recargar para aplicar cambios
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } catch (error) {
                console.error('❌ Error sincronizando productos:', error);
                alert('Error al sincronizar productos. Revisa la consola.');
            } finally {
                setSincronizando(false);
            }
        }
    };

    return (
        <Button
            variant="info"
            onClick={handleSincronizar}
            disabled={sincronizando}
            style={{ marginLeft: '10px' }}
        >
            {sincronizando ? '🔄 Sincronizando...' : '🔄 Sincronizar Productos'}
        </Button>
    );
};

export default BotonSincronizarProductos;
