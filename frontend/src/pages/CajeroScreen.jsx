import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

const CajeroScreen = () => {
    const navigate = useNavigate();

    return (
        <div className="cajero-screen" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            {/* Header */}
            <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #dee2e6', padding: '1rem 0' }}>
                <Container>
                    <Row className="align-items-center">
                        <Col>
                            <div className="d-flex align-items-center">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => navigate('/pos')}
                                    className="me-3"
                                >
                                    <i className="bi bi-arrow-left me-1"></i>
                                    Volver al POS
                                </Button>
                                <div>
                                    <h2 className="mb-1">
                                        <i className="bi bi-person-circle me-2"></i>
                                        Gestión de Cajeros
                                    </h2>
                                    <small className="text-muted">
                                        Administra sucursales y cajeros del sistema
                                    </small>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Contenido principal */}
            <Container className="py-4">
                <Row className="g-4">
                    {/* Card Sucursales */}
                    <Col md={6}>
                        <Card className="h-100 shadow-sm">
                            <Card.Body className="text-center p-4">
                                <div className="mb-3">
                                    <i className="bi bi-building" style={{ fontSize: '3rem', color: '#0d6efd' }}></i>
                                </div>
                                <h4 className="mb-3">Gestionar Sucursales</h4>
                                <p className="text-muted mb-4">
                                    Crea y administra las sucursales de tu negocio.
                                    Configura nombres, direcciones y datos de contacto.
                                </p>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={() => navigate('/sucursales')}
                                    className="w-100"
                                >
                                    <i className="bi bi-building me-2"></i>
                                    Administrar Sucursales
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Card Cajeros */}
                    <Col md={6}>
                        <Card className="h-100 shadow-sm">
                            <Card.Body className="text-center p-4">
                                <div className="mb-3">
                                    <i className="bi bi-people" style={{ fontSize: '3rem', color: '#198754' }}></i>
                                </div>
                                <h4 className="mb-3">Gestionar Cajeros</h4>
                                <p className="text-muted mb-4">
                                    Administra los cajeros por sucursal.
                                    Crea usuarios, asigna contraseñas y permisos.
                                </p>
                                <Button
                                    variant="success"
                                    size="lg"
                                    onClick={() => navigate('/cajeros')}
                                    className="w-100"
                                >
                                    <i className="bi bi-people me-2"></i>
                                    Administrar Cajeros
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Información adicional */}
                <Row className="mt-4">
                    <Col>
                        <Card className="bg-light">
                            <Card.Body>
                                <h5 className="mb-3">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Información del Sistema
                                </h5>
                                <Row>
                                    <Col md={4}>
                                        <div className="text-center p-3">
                                            <i className="bi bi-shield-check text-primary" style={{ fontSize: '2rem' }}></i>
                                            <h6 className="mt-2">Seguridad</h6>
                                            <small className="text-muted">
                                                Sistema de login seguro con contraseñas encriptadas
                                            </small>
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="text-center p-3">
                                            <i className="bi bi-graph-up text-success" style={{ fontSize: '2rem' }}></i>
                                            <h6 className="mt-2">Trazabilidad</h6>
                                            <small className="text-muted">
                                                Registro completo de ventas y arqueos por cajero
                                            </small>
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="text-center p-3">
                                            <i className="bi bi-geo-alt text-warning" style={{ fontSize: '2rem' }}></i>
                                            <h6 className="mt-2">Multi-sucursal</h6>
                                            <small className="text-muted">
                                                Control independiente por ubicación geográfica
                                            </small>
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default CajeroScreen;