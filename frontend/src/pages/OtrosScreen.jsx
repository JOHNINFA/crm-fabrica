import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import GestionSucursales from '../components/common/GestionSucursales';
import GestionUsuarios from '../components/common/GestionUsuarios';
import Herramientas from '../components/common/Herramientas';
import GestionRutas from '../components/rutas/GestionRutas';
import ReporteVentasRuta from '../components/rutas/ReporteVentasRuta';
import ChatIA from '../components/ChatIA/ChatIA';
import GestionIA from '../components/common/GestionIA';
import usePageTitle from '../hooks/usePageTitle';

const OtrosScreen = () => {
    usePageTitle('Otros');
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeModule, setActiveModule] = useState(searchParams.get('module') || '');

    // Actualizar URL cuando cambia el módulo
    const handleModuleChange = (moduleId) => {
        setActiveModule(moduleId);
        if (moduleId) {
            setSearchParams({ module: moduleId });
        } else {
            setSearchParams({});
        }
    };

    const modules = [
        {
            id: 'sucursales',
            title: 'Gestión de Sucursales',
            description: 'Administrar sucursales del sistema',
            icon: 'business',
            color: 'primary',
            action: () => handleModuleChange('sucursales')
        },
        {
            id: 'usuarios',
            title: 'Gestión de Usuarios',
            description: 'Administrar usuarios para POS y Pedidos',
            icon: 'people',
            color: 'success',
            action: () => handleModuleChange('usuarios')
        },
        {
            id: 'ia_manager',
            title: 'Gestión de IA',
            description: 'Controlar Redes Neuronales y Entrenamiento',
            icon: 'psychology',
            color: 'dark',
            action: () => handleModuleChange('ia_manager')
        },
        {
            id: 'impresion',
            title: 'Configuración de Impresión',
            description: 'Configurar tickets, logo y datos del negocio',
            icon: 'print',
            color: 'warning',
            route: '/configuracion/impresion'
        },
        {
            id: 'configuracion',
            title: 'Configuración',
            description: 'Configuraciones generales del sistema',
            icon: 'settings',
            color: 'secondary',
            route: '/configuracion'
        },
        {
            id: 'reportes',
            title: 'Reportes Avanzados',
            description: 'Reportes detallados por cajero y sucursal',
            icon: 'analytics',
            color: 'info',
            route: '/reportes-avanzados'
        },
        {
            id: 'herramientas',
            title: 'Herramientas de Sistema',
            description: 'Control de sincronización y limpieza de datos',
            icon: 'build',
            color: 'danger',
            action: () => handleModuleChange('herramientas')
        },
        {
            id: 'rutas',
            title: 'Gestión de Rutas',
            description: 'Administrar rutas y clientes',
            icon: 'map',
            color: 'primary',
            action: () => handleModuleChange('rutas')
        },
        {
            id: 'ventas_ruta',
            title: 'Reporte Ventas Ruta',
            description: 'Ver reporte consolidado de ventas en ruta',
            icon: 'analytics',
            color: 'success',
            action: () => handleModuleChange('ventas_ruta')
        },
        {
            id: 'precios_cargue',
            title: 'Precios Cargue y App',
            description: 'Precios independientes para Cargue y App móvil',
            icon: 'attach_money',
            color: 'warning',
            route: '/precios-cargue'
        },
        {
            id: 'ia',
            title: 'Agente IA (Beta)',
            description: 'Chat inteligente con datos de ventas y comandos',
            icon: 'smart_toy',
            color: 'dark',
            action: () => handleModuleChange('ia')
        }
    ];

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            {/* Header */}
            <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #dee2e6', padding: '1rem 0' }}>
                <Container fluid style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
                    <Row className="align-items-center">
                        <Col>
                            <div>
                                <h2 className="mb-1">
                                    <span className="material-icons me-2" style={{ verticalAlign: 'middle' }}>
                                        {activeModule === 'ventas_ruta' ? 'point_of_sale' : activeModule === 'rutas' ? 'map' : 'settings'}
                                    </span>
                                    {activeModule === 'ventas_ruta' ? 'Ventas de Ruta' : activeModule === 'rutas' ? 'Gestión de Rutas' : 'Otros - Configuraciones'}
                                </h2>
                                <small className="text-muted">
                                    {activeModule === 'ventas_ruta'
                                        ? 'Gestión de ventas realizadas por vendedores en ruta'
                                        : activeModule === 'rutas'
                                            ? 'Administrar rutas y clientes de vendedores'
                                            : 'Administración y configuraciones del sistema'}
                                </small>
                            </div>
                        </Col>
                        <Col xs="auto">
                            <div className="d-flex align-items-center gap-2">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => navigate('/')}
                                >
                                    <span className="material-icons me-1" style={{ fontSize: 16 }}>
                                        arrow_back
                                    </span>
                                    Regresar al Inicio
                                </Button>
                                {activeModule && (
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => handleModuleChange('')}
                                    >
                                        <span className="material-icons me-1" style={{ fontSize: 16 }}>
                                            arrow_back
                                        </span>
                                        Volver al Menú de Otros
                                    </Button>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Contenido principal */}
            {activeModule === 'rutas' ? (
                <Container fluid style={{ padding: 0 }}>
                    <GestionRutas />
                </Container>
            ) : (
                <Container className="py-4">
                    {/* Mostrar módulo activo o menú principal */}
                    {activeModule === 'sucursales' ? (
                        <div>
                            <Button
                                variant="outline-secondary"
                                className="mb-3"
                                onClick={() => handleModuleChange('')}
                            >
                                <i className="bi bi-arrow-left me-2"></i>
                                Volver al Menú de Otros
                            </Button>
                            <GestionSucursales />
                        </div>
                    ) : activeModule === 'usuarios' ? (
                        <div>
                            <Button
                                variant="outline-secondary"
                                className="mb-3"
                                onClick={() => handleModuleChange('')}
                            >
                                <i className="bi bi-arrow-left me-2"></i>
                                Volver al Menú de Otros
                            </Button>
                            <GestionUsuarios />
                        </div>
                    ) : activeModule === 'herramientas' ? (
                        <div>
                            <Button
                                variant="outline-secondary"
                                className="mb-3"
                                onClick={() => handleModuleChange('')}
                            >
                                <i className="bi bi-arrow-left me-2"></i>
                                Volver al Menú de Otros
                            </Button>
                            <Herramientas />
                        </div>
                    ) : activeModule === 'ventas_ruta' ? (
                        <div>
                            <Button
                                variant="outline-secondary"
                                className="mb-3"
                                onClick={() => handleModuleChange('')}
                            >
                                <i className="bi bi-arrow-left me-2"></i>
                                Volver al Menú de Otros
                            </Button>
                            <ReporteVentasRuta />
                        </div>
                    ) : activeModule === 'ia_manager' ? (
                        <div>
                            <Button
                                variant="outline-secondary"
                                className="mb-3"
                                onClick={() => handleModuleChange('')}
                            >
                                <i className="bi bi-arrow-left me-2"></i>
                                Volver al Menú de Otros
                            </Button>
                            <GestionIA />
                        </div>
                    ) : activeModule === 'ia' ? (
                        <ChatIA onBack={() => handleModuleChange('')} />
                    ) : (
                        <>
                            <Row>
                                {modules.map(module => (
                                    <Col md={6} lg={4} key={module.id} className="mb-4">
                                        <Card
                                            className="h-100 shadow-sm"
                                            style={{
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s, box-shadow 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-5px)';
                                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                            }}
                                            onClick={() => module.action ? module.action() : navigate(module.route)}
                                        >
                                            <Card.Body className="text-center p-4">
                                                <div className="mb-3">
                                                    <span
                                                        className={`material-icons text-${module.color}`}
                                                        style={{ fontSize: 48 }}
                                                    >
                                                        {module.icon}
                                                    </span>
                                                </div>
                                                <Card.Title className="h5 mb-3">
                                                    {module.title}
                                                </Card.Title>
                                                <Card.Text className="text-muted">
                                                    {module.description}
                                                </Card.Text>
                                                <Button
                                                    variant={`outline-${module.color}`}
                                                    size="sm"
                                                >
                                                    Acceder
                                                    <span className="material-icons ms-2" style={{ fontSize: 16 }}>
                                                        arrow_forward
                                                    </span>
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                            {/* Información del sistema */}
                            <Row className="mt-5">
                                <Col>
                                    <Card>
                                        <Card.Header>
                                            <h6 className="mb-0">
                                                <span className="material-icons me-2" style={{ fontSize: 18, verticalAlign: 'middle' }}>
                                                    info
                                                </span>
                                                Sistema de Gestión Integrado
                                            </h6>
                                        </Card.Header>
                                        <Card.Body>
                                            <Row>
                                                <Col md={6}>
                                                    <h6>Gestión de Sucursales</h6>
                                                    <ul className="list-unstyled">
                                                        <li>✅ Crear y administrar múltiples sucursales</li>
                                                        <li>✅ Configurar información de contacto</li>
                                                        <li>✅ Activar/desactivar sucursales</li>
                                                        <li>✅ Asignar sucursal principal</li>
                                                    </ul>
                                                </Col>
                                                <Col md={6}>
                                                    <h6>👥 Gestión de Usuarios</h6>
                                                    <ul className="list-unstyled">
                                                        <li>✅ Usuarios por sucursal y módulo</li>
                                                        <li>✅ <strong>POS:</strong> Se comportan como vendedores</li>
                                                        <li>✅ <strong>Pedidos:</strong> Solo usuarios (sin venta)</li>
                                                        <li>✅ Roles y permisos configurables</li>
                                                    </ul>
                                                </Col>
                                            </Row>

                                            <div className="alert alert-info mt-3">
                                                <div className="d-flex align-items-center">
                                                    <span className="material-icons me-2">
                                                        lightbulb
                                                    </span>
                                                    <div>
                                                        <strong>Diferencia clave:</strong>
                                                        Los usuarios de POS funcionan como vendedores con capacidad de facturación,
                                                        mientras que los de Pedidos solo gestionan pedidos sin función de venta.
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="alert alert-success mt-2">
                                                <div className="d-flex align-items-center">
                                                    <span className="material-icons me-2">
                                                        check_circle
                                                    </span>
                                                    <div>
                                                        <strong>Flujo recomendado:</strong>
                                                        1. Crear sucursales → 2. Crear usuarios → 3. Asignar módulos (POS/Pedidos/Ambos)
                                                    </div>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    )}
                </Container>
            )}
        </div>
    );
};

export default OtrosScreen;