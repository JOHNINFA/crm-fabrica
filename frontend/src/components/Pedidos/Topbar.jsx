import React, { useState, useRef, useEffect } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useCajeroPedidos } from "../../context/CajeroPedidosContext";
import SyncButton from "./SyncButton";
import LoginCajeroModal from "./LoginCajeroModal";

export default function Topbar() {
    const { getTopbarInfo, isAuthenticated, cajeroLogueado } = useCajeroPedidos();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showReportMenu, setShowReportMenu] = useState(false);
    const reportMenuRef = useRef(null);
    const navigate = useNavigate();

    const topbarInfo = getTopbarInfo();

    const handleLoginClick = () => {
        setShowLoginModal(true);
    };

    const handleCloseModal = () => {
        setShowLoginModal(false);
    };

    // Cerrar el menú al hacer clic fuera de él
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (reportMenuRef.current && !reportMenuRef.current.contains(event.target)) {
                setShowReportMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <>
            <nav className="topbar-bg d-flex align-items-center justify-content-between px-3 py-2">
                {/* Espacio para el botón hamburguesa y logo */}
                <div style={{ width: '50px' }}></div>

                {/* Botones de navegación - Centro/Izquierda */}
                <div className="d-flex align-items-center gap-4">
                    {/* Botón Informes de Pedidos con dropdown */}
                    <div className="dropdown" ref={reportMenuRef}>
                        <button
                            className="btn btn-light border"
                            style={{ borderRadius: '8px', color: '#163864', fontSize: '15px', padding: '8px 16px' }}
                            type="button"
                            onClick={() => setShowReportMenu(!showReportMenu)}
                        >
                            <i className="bi bi-file-earmark-text me-2" style={{ fontSize: '16px' }}></i>
                            Informes de Pedidos
                        </button>
                        {showReportMenu && (
                            <ul className="dropdown-menu show" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px' }}>
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setShowReportMenu(false);
                                            navigate('/informes/pedidos');
                                        }}
                                        style={{ fontSize: '13px' }}
                                    >
                                        Informe General
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setShowReportMenu(false);
                                            console.log('Informe por destinatario');
                                        }}
                                        style={{ fontSize: '13px' }}
                                    >
                                        Por Destinatario
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setShowReportMenu(false);
                                            console.log('Informe por transportadora');
                                        }}
                                        style={{ fontSize: '13px' }}
                                    >
                                        Por Transportadora
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setShowReportMenu(false);
                                            console.log('Informe por vendedor');
                                        }}
                                        style={{ fontSize: '13px' }}
                                    >
                                        Por Vendedor
                                    </button>
                                </li>
                            </ul>
                        )}
                    </div>

                    {/* Botón Historial */}
                    <button
                        className="btn btn-light border"
                        style={{ borderRadius: '8px', color: '#163864', fontSize: '15px', padding: '8px 16px' }}
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
                        style={{ borderRadius: '8px', color: '#163864', fontSize: '15px', padding: '8px 16px' }}
                        type="button"
                        onClick={() => navigate('/pedidos')}
                        title="Gestión de Pedidos"
                    >
                        <span className="material-icons me-2" style={{ fontSize: '16px' }}>settings</span>
                        Gestionar
                    </button>
                </div>

                {/* Controles del topbar - Derecha */}
                <div className="d-flex align-items-center gap-2">
                    <SyncButton />

                    <span className="material-icons mx-2 d-flex align-items-center text-success">
                        wifi
                    </span>

                    <span className="position-relative mx-2 d-flex align-items-center">
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
                        {isAuthenticated ? 'Logout' : 'Login'}
                    </Button>

                    {/* Información del cajero */}
                    {isAuthenticated && cajeroLogueado ? (
                        <div className="mx-2 d-flex align-items-center" style={{ fontSize: 15 }}>
                            <span className="material-icons me-2 text-success" style={{ fontSize: 24 }}>
                                account_circle
                            </span>
                            <span className="fw-bold">{cajeroLogueado.nombre}</span>
                        </div>
                    ) : (
                        <div className="mx-2 d-flex align-items-center" style={{ fontSize: 15 }}>
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