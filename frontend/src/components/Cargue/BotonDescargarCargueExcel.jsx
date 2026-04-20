import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const BotonDescargarCargueExcel = ({ fecha, dia }) => {
    const [descargando, setDescargando] = useState(false);

    const descargar = async () => {
        if (!fecha || !dia) {
            alert('Selecciona una fecha y día antes de descargar.');
            return;
        }
        setDescargando(true);
        try {
            const url = `${API_URL}/cargue/exportar-excel/?fecha=${fecha}&dia=${dia.toUpperCase()}`;
            const response = await fetch(url);
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || `Error ${response.status}`);
            }
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `cargue_${dia}_${fecha}.xlsx`;
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
            title="Descargar cargue completo en Excel"
            style={{ color: '#217346', fontWeight: '500' }}
        >
            {descargando ? (
                <>
                    <span className="spinner-border spinner-border-sm" />
                    <span>Descargando...</span>
                </>
            ) : (
                <>📥 Excel</>
            )}
        </button>
    );
};

export default BotonDescargarCargueExcel;
