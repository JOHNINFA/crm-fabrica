import React, { useState } from 'react';
import { Container, Row, Col, Card, Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import GestionBancos from '../components/Configuracion/GestionBancos';
import usePageTitle from '../hooks/usePageTitle';

const ConfiguracionScreen = () => {
    usePageTitle('Configuración');
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('bancos');

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            {/* Header */}
            <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #dee2e6', padding: '1rem 0' }}>
                <Container>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="mb-1">
                                <span className="material-icons me-2" style={{ verticalAlign: 'middle' }}>
                                    settings
                                </span>
                                Configuración
                            </h2>
                            <small className="text-muted">
                                Configuraciones generales del sistema
                            </small>
                        </div>
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => navigate('/otros')}
                        >
                            <i className="bi bi-arrow-left me-2"></i>
                            Volver
                        </button>
                    </div>
                </Container>
            </div>

            {/* Content */}
            <Container className="mt-4">
                <Row>
                    <Col md={3}>
                        <Card>
                            <Card.Body>
                                <Nav className="flex-column">
                                    <Nav.Link
                                        active={activeTab === 'bancos'}
                                        onClick={() => setActiveTab('bancos')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <i className="bi bi-bank me-2"></i>
                                        Bancos
                                    </Nav.Link>
                                    <Nav.Link
                                        active={activeTab === 'centros-costo'}
                                        onClick={() => setActiveTab('centros-costo')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <i className="bi bi-diagram-3 me-2"></i>
                                        Centros de Costo
                                    </Nav.Link>
                                    <Nav.Link
                                        active={activeTab === 'general'}
                                        onClick={() => setActiveTab('general')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <i className="bi bi-gear me-2"></i>
                                        General
                                    </Nav.Link>
                                </Nav>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={9}>
                        {activeTab === 'bancos' && <GestionBancos />}
                        {activeTab === 'centros-costo' && (
                            <Card>
                                <Card.Body>
                                    <h5>Centros de Costo</h5>
                                    <p className="text-muted">Próximamente...</p>
                                </Card.Body>
                            </Card>
                        )}
                        {activeTab === 'general' && (
                            <Card>
                                <Card.Body>
                                    <h5>Configuración General</h5>
                                    <p className="text-muted">Próximamente...</p>
                                </Card.Body>
                            </Card>
                        )}
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default ConfiguracionScreen;
