// Indicador visual del estado de la API para el módulo Cargue
// NOTA: Este componente está preparado pero NO ACTIVO todavía

import React from 'react';
import { useCargueApiStatus } from '../../hooks/useCargueApi';
import { cargueApiConfig } from '../../services/cargueApiService';

const ApiStatusIndicator = ({ position = 'top-right', showDetails = false }) => {
    const { conectado, ultimaVerificacion, error, verificar, apiActiva } = useCargueApiStatus();

    // No mostrar nada si la API no está activa
    if (!apiActiva) {
        return null;
    }

    const getStatusColor = () => {
        if (conectado) return '#28a745'; // Verde
        if (error) return '#dc3545'; // Rojo
        return '#ffc107'; // Amarillo
    };

    const getStatusText = () => {
        if (conectado) return 'API Conectada';
        if (error) return 'API Desconectada';
        return 'Verificando...';
    };

    const getStatusIcon = () => {
        if (conectado) return '🟢';
        if (error) return '🔴';
        return '🟡';
    };

    const positionStyles = {
        'top-right': {
            position: 'fixed',
            top: '10px',
            right: '10px',
            zIndex: 1050
        },
        'top-left': {
            position: 'fixed',
            top: '10px',
            left: '10px',
            zIndex: 1050
        },
        'bottom-right': {
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            zIndex: 1050
        },
        'inline': {
            display: 'inline-block'
        }
    };

    return (
        <div
            style={{
                ...positionStyles[position],
                backgroundColor: 'white',
                border: `2px solid ${getStatusColor()}`,
                borderRadius: '8px',
                padding: showDetails ? '8px 12px' : '4px 8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                fontSize: '12px',
                fontFamily: 'monospace',
                cursor: 'pointer'
            }}
            onClick={verificar}
            title={`Click para verificar conexión\nÚltima verificación: ${ultimaVerificacion ? ultimaVerificacion.toLocaleTimeString() : 'Nunca'}`}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px' }}>{getStatusIcon()}</span>
                <span style={{ color: getStatusColor(), fontWeight: 'bold' }}>
                    {showDetails ? getStatusText() : 'API'}
                </span>
            </div>

            {showDetails && (
                <div style={{ marginTop: '4px', fontSize: '10px', color: '#666' }}>
                    {ultimaVerificacion && (
                        <div>Última: {ultimaVerificacion.toLocaleTimeString()}</div>
                    )}
                    {error && (
                        <div style={{ color: '#dc3545', marginTop: '2px' }}>
                            {error.length > 30 ? error.substring(0, 30) + '...' : error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// 🚀 COMPONENTE PARA MOSTRAR EN LA BARRA DE MENÚ
export const ApiStatusBadge = ({ className = '' }) => {
    const { conectado, apiActiva } = useCargueApiStatus();

    if (!apiActiva) {
        return (
            <span className={`badge bg-secondary ${className}`} title="API desactivada">
                API OFF
            </span>
        );
    }

    return (
        <span
            className={`badge ${conectado ? 'bg-success' : 'bg-danger'} ${className}`}
            title={conectado ? 'API conectada' : 'API desconectada'}
        >
            API {conectado ? 'ON' : 'OFF'}
        </span>
    );
};

// 🚀 COMPONENTE PARA PANEL DE CONTROL DE API
export const ApiControlPanel = () => {
    const { conectado, ultimaVerificacion, error, verificar, apiActiva } = useCargueApiStatus();

    const activarApi = () => {
        cargueApiConfig.activarIntegracion();
        window.location.reload(); // Recargar para aplicar cambios
    };

    const desactivarApi = () => {
        cargueApiConfig.desactivarIntegracion();
        window.location.reload(); // Recargar para aplicar cambios
    };

    return (
        <div className="card" style={{ maxWidth: '400px' }}>
            <div className="card-header">
                <h6 className="card-title mb-0">🚀 Control de API - Módulo Cargue</h6>
            </div>
            <div className="card-body">
                <div className="mb-3">
                    <strong>Estado:</strong>
                    <span className={`badge ms-2 ${apiActiva ? (conectado ? 'bg-success' : 'bg-danger') : 'bg-secondary'}`}>
                        {apiActiva ? (conectado ? 'Conectada' : 'Desconectada') : 'Desactivada'}
                    </span>
                </div>

                {apiActiva && (
                    <>
                        <div className="mb-3">
                            <strong>Última verificación:</strong>
                            <div className="text-muted small">
                                {ultimaVerificacion ? ultimaVerificacion.toLocaleString() : 'Nunca'}
                            </div>
                        </div>

                        {error && (
                            <div className="mb-3">
                                <strong>Error:</strong>
                                <div className="text-danger small">{error}</div>
                            </div>
                        )}

                        <button
                            className="btn btn-outline-primary btn-sm me-2"
                            onClick={verificar}
                        >
                            🔄 Verificar Conexión
                        </button>
                    </>
                )}

                <div className="mt-3 pt-3 border-top">
                    <strong>Control:</strong>
                    <div className="mt-2">
                        {apiActiva ? (
                            <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={desactivarApi}
                            >
                                ⏹️ Desactivar API
                            </button>
                        ) : (
                            <button
                                className="btn btn-outline-success btn-sm"
                                onClick={activarApi}
                            >
                                ▶️ Activar API
                            </button>
                        )}
                    </div>
                    <div className="text-muted small mt-2">
                        {apiActiva
                            ? 'Los datos se cargan desde el servidor y se sincronizan automáticamente'
                            : 'Los datos se manejan solo con localStorage (modo actual)'
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiStatusIndicator;