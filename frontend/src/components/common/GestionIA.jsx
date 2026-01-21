import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Badge, Table } from 'react-bootstrap';

const GestionIA = () => {
    const [config, setConfig] = useState({
        active: true,
        continuousLearning: true,
        lastTraining: null
    });
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    // Cargar estado inicial
    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000); // Actualizar logs cada 5s
        return () => clearInterval(interval);
    }, []);

    const fetchLogs = async () => {
        // En producción esto vendría del backend
        // Simulamos logs por ahora ya que no hemos creado el endpoint de logs persistentes
        // Pero mostraremos los logs del proceso de entrenamiento real si implementamos el endpoint
        try {
            const res = await fetch('/api/ia/logs/');
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setConfig(prev => ({ ...prev, ...data.config }));
            }
        } catch (e) {
            console.error("Error fetching logs", e);
        }
    };

    const handleToggleActive = async () => {
        setConfig(prev => ({ ...prev, active: !prev.active }));
        // Llamar API para guardar
        await updateConfig({ active: !config.active });
    };

    const handleToggleLearning = async () => {
        setConfig(prev => ({ ...prev, continuousLearning: !prev.continuousLearning }));
        // Llamar API para guardar
        await updateConfig({ continuousLearning: !config.continuousLearning });
    };

    const updateConfig = async (newConfig) => {
        try {
            await fetch('/api/ia/config/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig)
            });
        } catch (e) {
            console.error("Error saving config", e);
        }
    };

    const handleRetrain = async () => {
        if (!window.confirm('¿Desea re-entrenar todos los modelos con el historial completo? Esto puede tomar unos minutos.')) return;

        setLoading(true);
        try {
            const res = await fetch('/api/ia/retrain/', { method: 'POST' });
            if (res.ok) {
                alert('Entrenamiento iniciado correctamente');
                fetchLogs(); // Actualizar logs inmediatamente
            } else {
                alert('Error al iniciar entrenamiento');
            }
        } catch (e) {
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-2">
            <h4 className="mb-4 d-flex align-items-center">
                <i className="bi bi-cpu-fill me-2 text-primary"></i>
                Gestión de Redes Neuronales (IA)
            </h4>

            <Row className="g-4 mb-4">
                {/* TARJETA DE CONTROL */}
                <Col md={5}>
                    <Card className="shadow-sm h-100 border-0">
                        <Card.Header className="bg-white py-3">
                            <h6 className="mb-0 fw-bold">⚙️ Configuración del Cerebro</h6>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-light rounded">
                                <div>
                                    <div className="fw-bold">Red Neuronal Maesta</div>
                                    <small className="text-muted">Activar predicciones neuronales</small>
                                </div>
                                <Form.Check
                                    type="switch"
                                    id="ia-switch"
                                    className="fs-4"
                                    checked={config.active}
                                    onChange={handleToggleActive}
                                />
                            </div>

                            <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-light rounded">
                                <div>
                                    <div className="fw-bold">Aprendizaje Continuo</div>
                                    <small className="text-muted">Aprender de cada reporte guardado</small>
                                </div>
                                <Form.Check
                                    type="switch"
                                    id="learning-switch"
                                    className="fs-4"
                                    checked={config.continuousLearning}
                                    onChange={handleToggleLearning}
                                />
                            </div>

                            <div className="d-grid gap-2 mt-4">
                                <Button
                                    variant="outline-primary"
                                    size="lg"
                                    onClick={handleRetrain}
                                    disabled={loading}
                                >
                                    {loading ? 'Entrenando...' : '🔄 Re-entrenar Modelos Ahora'}
                                </Button>
                                <small className="text-center text-muted">
                                    Último entrenamiento: {config.lastTraining || 'Nunca'}
                                </small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* TARJETA DE LOGS */}
                <Col md={7}>
                    <Card className="shadow-sm h-100 border-0 bg-dark text-light">
                        <Card.Header className="bg-transparent border-secondary py-3 d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-bold text-light">
                                <i className="bi bi-terminal me-2"></i>
                                Logs de Entrenamiento
                            </h6>
                            <Badge bg="success" className="pulse-animation">En vivo</Badge>
                        </Card.Header>
                        <Card.Body className="p-0 position-relative">
                            <div
                                className="p-3"
                                style={{
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    fontFamily: 'monospace',
                                    fontSize: '0.85rem'
                                }}
                            >
                                {logs.length === 0 ? (
                                    <div className="text-muted text-center py-5">
                                        Esperando actividad neuronal...
                                    </div>
                                ) : (
                                    logs.map((log, idx) => (
                                        <div key={idx} className="mb-2 border-bottom border-secondary border-opacity-25 pb-1">
                                            <span className="text-secondary fw-bold me-2">[{log.time}]</span>
                                            <span className={log.type === 'ERROR' ? 'text-danger' : log.type === 'SUCCESS' ? 'text-success' : 'text-info'}>
                                                {log.message}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Alert variant="info" className="d-flex align-items-center shadow-sm">
                <i className="bi bi-info-circle-fill fs-4 me-3"></i>
                <div>
                    <strong>¿Cómo funciona?</strong>
                    <p className="mb-0 small">
                        La IA aprende cada vez que guardas un reporte en Planeación.
                        Si desactivas el "Aprendizaje Continuo", la red dejará de actualizarse con nuevos datos pero seguirá prediciendo con lo que ya sabe.
                    </p>
                </div>
            </Alert>
        </div>
    );
};

export default GestionIA;
