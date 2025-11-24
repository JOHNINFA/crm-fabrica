import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Form, Spinner } from 'react-bootstrap';
import { cargueApiConfig } from '../../services/cargueApiService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const Herramientas = () => {
    const [apiEnabled, setApiEnabled] = useState(cargueApiConfig.USAR_API);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    const toggleApi = () => {
        if (apiEnabled) {
            cargueApiConfig.USAR_API = false;
            setApiEnabled(false);
            setMessage({ type: 'warning', text: 'Sincronización automática DESACTIVADA' });
        } else {
            cargueApiConfig.USAR_API = true;
            setApiEnabled(true);
            setMessage({ type: 'success', text: 'Sincronización automática ACTIVADA' });
        }
    };

    const limpiarLocalStorage = () => {
        if (window.confirm('¿Estás seguro de limpiar todo el almacenamiento local? Esto borrará datos no guardados.')) {
            localStorage.clear();
            sessionStorage.clear();
            setMessage({ type: 'info', text: 'Almacenamiento local limpiado correctamente. Recargando...' });
            setTimeout(() => window.location.reload(), 1500);
        }
    };

    const limpiarTodo = async () => {
        if (!window.confirm('⚠️ ADVERTENCIA: Esto limpiará TODA la información de Cargue (Base de Datos + LocalStorage). ¿Estás seguro?')) {
            return;
        }

        setLoading(true);

        try {
            // PASO 1: Desactivar sincronización automática
            setMessage({ type: 'info', text: '1/4: Desactivando sincronización automática...' });
            cargueApiConfig.USAR_API = false;
            setApiEnabled(false);

            // Esperar 2 segundos para que todas las pestañas dejen de guardar
            await new Promise(resolve => setTimeout(resolve, 2000));

            // PASO 2: Limpiar base de datos
            setMessage({ type: 'info', text: '2/4: Limpiando base de datos...' });
            const tablasALimpiar = ['cargue-id1', 'cargue-id2', 'cargue-id3', 'cargue-id4', 'cargue-id5', 'cargue-id6'];

            for (const tabla of tablasALimpiar) {
                try {
                    const getResponse = await fetch(`${API_URL}/${tabla}/`);
                    if (getResponse.ok) {
                        const registros = await getResponse.json();

                        for (const registro of registros) {
                            await fetch(`${API_URL}/${tabla}/${registro.id}/`, {
                                method: 'DELETE'
                            });
                        }
                        console.log(`✅ Tabla ${tabla} limpiada`);
                    }
                } catch (err) {
                    console.warn(`⚠️ Error limpiando ${tabla}:`, err);
                }
            }

            // PASO 3: Limpiar localStorage
            setMessage({ type: 'info', text: '3/4: Limpiando localStorage...' });
            localStorage.clear();
            sessionStorage.clear();

            // PASO 4: Reactivar sincronización automática
            setMessage({ type: 'info', text: '4/4: Reactivando sincronización automática...' });
            cargueApiConfig.USAR_API = true;
            setApiEnabled(true);

            setMessage({ type: 'success', text: '✅ Limpieza completa exitosa. Sincronización reactivada. Recargando...' });
            setTimeout(() => window.location.reload(), 2000);

        } catch (error) {
            console.error('❌ Error en limpieza completa:', error);
            setMessage({ type: 'danger', text: `Error: ${error.message}` });

            // En caso de error, asegurarnos de reactivar la sincronización
            cargueApiConfig.USAR_API = true;
            setApiEnabled(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-sm">
            <Card.Header className="bg-white">
                <h5 className="mb-0">
                    <span className="material-icons me-2" style={{ verticalAlign: 'middle' }}>
                        build
                    </span>
                    Herramientas de Sistema
                </h5>
            </Card.Header>
            <Card.Body>
                {message && (
                    <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>
                        {message.text}
                    </Alert>
                )}

                <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">Sincronización Automática</h6>
                        <span className={`badge bg-${apiEnabled ? 'success' : 'danger'}`}>
                            {apiEnabled ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                    </div>
                    <p className="text-muted small">
                        Controla si el sistema guarda automáticamente los cambios en el servidor.
                        Desactívalo para realizar mantenimiento o pruebas.
                    </p>
                    <Form.Check
                        type="switch"
                        id="api-switch"
                        label={apiEnabled ? "Sincronización Activada" : "Sincronización Desactivada"}
                        checked={apiEnabled}
                        onChange={toggleApi}
                        className="mb-2"
                        style={{ fontSize: '1.1rem' }}
                    />
                </div>

                <hr />

                <div className="mb-3">
                    <h6>Limpieza de Datos</h6>
                    <p className="text-muted small">
                        Elimina todos los datos almacenados localmente en el navegador.
                    </p>
                    <Button
                        variant="warning"
                        onClick={limpiarLocalStorage}
                        className="d-flex align-items-center w-100 justify-content-center mb-2"
                        disabled={loading}
                    >
                        <span className="material-icons me-2">delete_sweep</span>
                        Limpiar Solo LocalStorage
                    </Button>
                </div>

                <div className="mb-2">
                    <h6 className="text-danger">⚠️ Limpieza Completa</h6>
                    <p className="text-muted small">
                        Limpia TODA la información de Cargue: Base de Datos + LocalStorage.
                        Útil para empezar pruebas desde cero.
                    </p>
                    <Button
                        variant="danger"
                        onClick={limpiarTodo}
                        className="d-flex align-items-center w-100 justify-content-center"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Limpiando...
                            </>
                        ) : (
                            <>
                                <span className="material-icons me-2">delete_forever</span>
                                Limpiar TODO (BD + LocalStorage)
                            </>
                        )}
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default Herramientas;
