import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const BotonDescargarPlaneacionExcel = () => {
    const [descargando, setDescargando] = useState(false);

    const getMesActual = () => {
        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        return `${anio}-${mes}`;
    };

    const descargar = async () => {
        setDescargando(true);
        try {
            const mes = getMesActual();
            const url = `${API_URL}/reportes/planeacion-mensual-excel/?mes=${mes}`;
            const response = await fetch(url);
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || `Error ${response.status}`);
            }
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `planeacion_${mes}.xlsx`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (e) {
            alert(`No se pudo descargar: ${e.message}`);
        } finally {
            setDescargando(false);
        }
    };

    return (
        <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            onClick={descargar}
            disabled={descargando}
            title="Descargar planeación del mes en Excel"
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
