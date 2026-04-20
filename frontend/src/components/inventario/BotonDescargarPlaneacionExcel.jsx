import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const BotonDescargarPlaneacionExcel = () => {
    const [descargando, setDescargando] = useState(false);
    const [mostrarSelector, setMostrarSelector] = useState(false);

    const getMesActual = () => {
        const hoy = new Date();
        return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    };

    const [mesSeleccionado, setMesSeleccionado] = useState(getMesActual());

    const descargar = async () => {
        setMostrarSelector(false);
        setDescargando(true);
        try {
            const url = `${API_URL}/reportes/planeacion-mensual-excel/?mes=${mesSeleccionado}`;
            const response = await fetch(url);
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || `Error ${response.status}`);
            }
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `planeacion_${mesSeleccionado}.xlsx`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (e) {
            alert(`No se pudo descargar: ${e.message}`);
        } finally {
            setDescargando(false);
        }
    };

    if (mostrarSelector) {
        return (
            <div className="d-flex align-items-center gap-1">
                <input
                    type="month"
                    className="form-control form-control-sm"
                    style={{ width: '150px' }}
                    value={mesSeleccionado}
                    onChange={e => setMesSeleccionado(e.target.value)}
                />
                <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={descargar}
                    disabled={!mesSeleccionado}
                    title="Descargar"
                >
                    ✓
                </button>
                <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setMostrarSelector(false)}
                    title="Cancelar"
                >
                    ✕
                </button>
            </div>
        );
    }

    return (
        <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            onClick={() => setMostrarSelector(true)}
            disabled={descargando}
            title="Descargar planeación mensual en Excel"
            style={{ color: '#1F4E79', fontWeight: '500' }}
        >
            {descargando ? (
                <>
                    <span className="spinner-border spinner-border-sm" />
                    <span>Descargando...</span>
                </>
            ) : (
                <>📅 Excel Mes</>
            )}
        </button>
    );
};

export default BotonDescargarPlaneacionExcel;
