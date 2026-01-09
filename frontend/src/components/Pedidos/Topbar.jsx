import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useCajeroPedidos } from "../../context/CajeroPedidosContext";
import SyncButton from "./SyncButton";
import LoginCajeroModal from "./LoginCajeroModal";
import "./Topbar.css";

export default function Topbar({ onOpenCategoryManager }) {
    const { getTopbarInfo, isAuthenticated, cajeroLogueado } = useCajeroPedidos();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const navigate = useNavigate();

    const topbarInfo = getTopbarInfo();

    const handleLoginClick = () => {
        setShowLoginModal(true);
    };

    const handleCloseModal = () => {
        setShowLoginModal(false);
    };

    return (
        <>
            <nav className="topbar-bg d-flex align-items-center justify-content-between px-3 py-2">
                {/* Espacio para el botón hamburguesa y logo */}
                <div style={{ width: '50px' }} className="d-none d-md-block"></div>

                {/* Botones de navegación - Centro/Izquierda - Ocultos en móvil */}
                <div className="d-none d-md-flex align-items-center gap-4">
                    {/* Botón Informes de Pedidos - Directo */}
                    <button
                        className="btn btn-light border"
                        style={{ borderRadius: '8px', color: '#163864', fontSize: '15px' }}
                        type="button"
                        onClick={() => window.open('/informes/pedidos', '_blank')}
                    >
                        <i className="bi bi-file-earmark-text me-2" style={{ fontSize: '16px' }}></i>
                        Informes de Pedidos
                    </button>

                    {/* Botón Historial */}
                    <button
                        className="btn btn-light border"
                        style={{ borderRadius: '8px', color: '#163864', fontSize: '15px' }}
                        type="button"
                        onClick={() => navigate('/pedidos/historial')}
                        title="Historial de Pedidos"
                    >
                        <i className="bi bi-clock-history me-2" style={{ fontSize: '16px' }}></i>
                        Historial
                    </button>

                    {/* Botón Gestionar */}
                    <button
                        className="btn btn-light border"
                        style={{ borderRadius: '8px', color: '#163864', fontSize: '15px' }}
                        type="button"
                        onClick={onOpenCategoryManager}
                        title="Gestionar Categorías"
                    >
                        <span className="material-icons me-2" style={{ fontSize: '16px' }}>settings</span>
                        Gestionar
                    </button>
                </div>

                {/* Controles del topbar - Derecha */}
                <div className="d-flex align-items-center gap-2 ms-auto">
                    <SyncButton />

                    {/* Wifi y notificaciones - Solo desktop */}
                    <span className="material-icons mx-2 d-none d-md-flex align-items-center text-success">
                        wifi
                    </span>

                    <span className="position-relative mx-2 d-none d-md-flex align-items-center">
                        <span className="material-icons">notifications</span>
                        <span className="badge bg-warning position-absolute top-0 start-100 translate-middle p-1 rounded-circle" style={{ fontSize: 10 }}>
                            0
                        </span>
                    </span>

                    {/* Botón de Login/Logout */}
                    <Button
                        variant={isAuthenticated ? "outline-danger" : "outline-primary"}
                        size="sm"
                        onClick={handleLoginClick}
                        className="d-flex align-items-center"
                        style={{ fontSize: 12 }}
                    >
                        <span className="material-icons me-1" style={{ fontSize: 16 }}>
                            {isAuthenticated ? 'logout' : 'login'}
                        </span>
                        <span className="d-none d-md-inline">{isAuthenticated ? 'Logout' : 'Login'}</span>
                    </Button>

                    {/* Información del cajero - Solo desktop */}
                    {isAuthenticated && cajeroLogueado ? (
                        <div className="mx-2 d-none d-md-flex align-items-center" style={{ fontSize: 15 }}>
                            <span className="material-icons me-2 text-success" style={{ fontSize: 24 }}>
                                account_circle
                            </span>
                            <span className="fw-bold">{cajeroLogueado.nombre}</span>
                        </div>
                    ) : (
                        <div className="mx-2 d-none d-md-flex align-items-center" style={{ fontSize: 15 }}>
                            <span className="material-icons me-2 text-muted" style={{ fontSize: 24 }}>
                                person_outline
                            </span>
                            <span className="text-muted">Sin cajero</span>
                        </div>
                    )}

                </div>
            </nav>

            {/* Modal de Login */}
            <LoginCajeroModal
                show={showLoginModal}
                onHide={handleCloseModal}
            />
        </>
    );
}