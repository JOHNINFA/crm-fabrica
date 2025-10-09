import React, { useState } from 'react';
import { useProducts } from '../../context/ProductContext';

const SyncButton = () => {
    const { syncWithBackend, isSyncing } = useProducts();
    const [lastSync, setLastSync] = useState(null);

    const handleSync = async () => {
        const success = await syncWithBackend();
        if (success) {
            setLastSync(new Date().toLocaleTimeString());
        }
    };

    return (
        <button
            className="btn btn-outline-primary btn-sm d-flex align-items-center"
            onClick={handleSync}
            disabled={isSyncing}
            title={lastSync ? `Última sincronización: ${lastSync}` : 'Sincronizar con base de datos'}
        >
            <span className={`material-icons me-1 ${isSyncing ? 'spin' : ''}`} style={{ fontSize: 16 }}>
                {isSyncing ? 'sync' : 'sync'}
            </span>
            {isSyncing ? 'Sincronizando...' : 'Sync'}
        </button>
    );
};

export default SyncButton;