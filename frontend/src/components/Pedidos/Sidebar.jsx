// src/components/Pedidos/Sidebar.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from '../../assets/images/icono.png';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

export default function Sidebar({ onWidthChange }) {
    const navigate = useNavigate();
    const { usuario, esAdmin } = useAuth(); // 🆕 Obtener estado de admin y usuario
    const isAdmin = esAdmin();
    // Normalizar rol para evitar errores
    const rolNormalizado = usuario?.rol ? usuario.rol.trim().toUpperCase() : '';
    const isCajeroPos = rolNormalizado === 'CAJERO POS' || rolNormalizado === 'POS';
    const [isExpanded, setIsExpanded] = useState(false);
    const [showPreciosSubmenu, setShowPreciosSubmenu] = useState(false);
    const [showInformesSubmenu, setShowInformesSubmenu] = useState(false);

    // Sidebar siempre colapsado por defecto, se expande solo al hacer clic en logo
    const sidebarWidth = isExpanded ? 210 : 0;

    // Estilo para los elementos del menú
    const getMenuItemStyle = () => ({
        whiteSpace: 'nowrap',
        paddingLeft: '12px',
        paddingRight: '12px'
    });

    React.useEffect(() => {
        if (onWidthChange) {
            onWidthChange(sidebarWidth);
        }
    }, [sidebarWidth, onWidthChange]);

    // Función para toggle del sidebar
    const toggleSidebar = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <>
            {/* Logo flotante que abre/cierra el menú */}
            <div
                style={{
                    position: 'fixed',
                    top: '5px',
                    left: isExpanded ? '220px' : '10px',
                    zIndex: 1001,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'left 0.3s ease'
                }}
            >
                {/* Logo que abre el menú al hacer clic */}
                <img
                    src={logo}
                    alt="Logo"
                    className="hamburger-logo"
                    onClick={toggleSidebar}
                    title={isExpanded ? 'Cerrar menú' : 'Abrir menú'}
                    style={{
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
            </div>

            {/* Overlay oscuro cuando el sidebar está abierto */}
            {isExpanded && (
                <div
                    onClick={toggleSidebar}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 999,
                        transition: 'opacity 0.3s ease'
                    }}
                />
            )}

            {/* Sidebar */}
            <nav
                className="sidebar-bg pedidos-sidebar d-flex flex-column align-items-start p-0"
                style={{
                    width: '210px',
                    position: "fixed",
                    zIndex: 1000,
                    left: isExpanded ? 0 : '-210px',
                    top: 0,
                    bottom: 0,
                    height: '100vh',
                    transition: 'left 0.3s ease',
                    boxShadow: isExpanded ? '2px 0 10px rgba(0,0,0,0.1)' : 'none'
                }}
            >
                <div className="w-100 flex-grow-1" style={{ overflowY: 'auto', overflowX: 'hidden', paddingTop: '10px' }}>
                    <ul className="nav flex-column w-100">
                        {/* Inicio */}
                        <li
                            className="nav-item sidebar-item py-2"
                            onClick={() => {
                                navigate('/');
                                setIsExpanded(false);
                            }}
                            style={{ cursor: 'pointer', ...getMenuItemStyle() }}
                        >
                            <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>home</span>
                            <span style={{ fontSize: '14px' }}>Inicio</span>
                        </li>

                        {/* Pedidos - ACTIVO */}
                        <li className="nav-item sidebar-item py-2 active" style={getMenuItemStyle()}>
                            <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>file_copy</span>
                            <span style={{ fontSize: '14px' }}>Pedidos</span>
                        </li>

                        {/* Productos - Solo Admin */}
                        {isAdmin && (
                            <li
                                className="nav-item sidebar-item py-2"
                                onClick={() => {
                                    sessionStorage.setItem('origenModulo', 'pedidos');
                                    navigate('/productos');
                                    setIsExpanded(false);
                                }}
                                style={{ cursor: 'pointer', ...getMenuItemStyle() }}
                            >
                                <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>apps</span>
                                <span style={{ fontSize: '14px' }}>Productos</span>
                            </li>
                        )}

                        {/* Precios e Inventarios - Solo Admin */}
                        {isAdmin && (
                            <>
                                {/* Lista de precios con submenu */}
                                <li
                                    className="nav-item sidebar-item py-2"
                                    onClick={() => setShowPreciosSubmenu(!showPreciosSubmenu)}
                                    style={{ cursor: 'pointer', ...getMenuItemStyle() }}
                                >
                                    <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>attach_money</span>
                                    <span style={{ fontSize: '14px' }}>Precios</span>
                                    <span className="material-icons ms-auto" style={{ fontSize: '16px' }}>
                                        {showPreciosSubmenu ? 'expand_less' : 'expand_more'}
                                    </span>
                                </li>

                                {/* Submenu de Lista de precios */}
                                {showPreciosSubmenu && (
                                    <>
                                        <li
                                            className="nav-item sidebar-item py-1"
                                            onClick={() => {
                                                sessionStorage.setItem('origenModulo', 'pedidos');
                                                navigate('/lista-precios');
                                                setIsExpanded(false);
                                            }}
                                            style={{ cursor: 'pointer', paddingLeft: '40px', fontSize: '13px', display: 'flex', alignItems: 'center' }}
                                        >
                                            <span className="material-icons me-2" style={{ fontSize: '16px' }}>radio_button_unchecked</span>
                                            <span>Lista de precios</span>
                                        </li>
                                        <li
                                            className="nav-item sidebar-item py-1"
                                            onClick={() => {
                                                sessionStorage.setItem('origenModulo', 'pedidos');
                                                navigate('/informe-lista-precios');
                                                setIsExpanded(false);
                                            }}
                                            style={{ cursor: 'pointer', paddingLeft: '40px', fontSize: '13px', display: 'flex', alignItems: 'center' }}
                                        >
                                            <span className="material-icons me-2" style={{ fontSize: '16px' }}>radio_button_unchecked</span>
                                            <span>Informe de lista de precios</span>
                                        </li>
                                    </>
                                )}

                                <li className="nav-item sidebar-item py-2" style={getMenuItemStyle()}>
                                    <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>keyboard_double_arrow_down</span>
                                    <span style={{ fontSize: '14px' }}>Ingresos</span>
                                </li>
                                <li className="nav-item sidebar-item py-2" style={getMenuItemStyle()}>
                                    <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>upload</span>
                                    <span style={{ fontSize: '14px' }}>Gastos</span>
                                </li>
                                <li className="nav-item sidebar-item py-2" style={getMenuItemStyle()}>
                                    <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>balance</span>
                                    <span style={{ fontSize: '14px' }}>Inventarios</span>
                                </li>
                            </>
                        )}
                        {/* Informes - Solo Admin */}
                        {isAdmin && (
                            <>
                                <li
                                    className="nav-item sidebar-item py-2"
                                    onClick={() => setShowInformesSubmenu(!showInformesSubmenu)}
                                    style={{ cursor: 'pointer', ...getMenuItemStyle() }}
                                >
                                    <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>assessment</span>
                                    <span style={{ fontSize: '14px' }}>Informes</span>
                                    <span className="material-icons ms-auto" style={{ fontSize: '16px' }}>
                                        {showInformesSubmenu ? 'expand_less' : 'expand_more'}
                                    </span>
                                </li>

                                {/* Submenu de Informes */}
                                {showInformesSubmenu && (
                                    <>
                                        <li
                                            className="nav-item sidebar-item py-1"
                                            onClick={() => {
                                                navigate('/informes/pedidos');
                                                setIsExpanded(false);
                                            }}
                                            style={{ cursor: 'pointer', paddingLeft: '40px', fontSize: '13px', display: 'flex', alignItems: 'center' }}
                                        >
                                            <span className="material-icons me-2" style={{ fontSize: '16px' }}>radio_button_unchecked</span>
                                            <span>Pedidos por ruta</span>
                                        </li>
                                        <li
                                            className="nav-item sidebar-item py-1"
                                            onClick={() => {
                                                navigate('/informes/transportadoras');
                                                setIsExpanded(false);
                                            }}
                                            style={{ cursor: 'pointer', paddingLeft: '40px', fontSize: '13px', display: 'flex', alignItems: 'center' }}
                                        >
                                            <span className="material-icons me-2" style={{ fontSize: '16px' }}>radio_button_unchecked</span>
                                            <span>Pedidos por transportadora</span>
                                        </li>
                                        <li
                                            className="nav-item sidebar-item py-1"
                                            onClick={() => {
                                                navigate('/informes/entregas');
                                                setIsExpanded(false);
                                            }}
                                            style={{ cursor: 'pointer', paddingLeft: '40px', fontSize: '13px', display: 'flex', alignItems: 'center' }}
                                        >
                                            <span className="material-icons me-2" style={{ fontSize: '16px' }}>radio_button_unchecked</span>
                                            <span>Estado de entregas</span>
                                        </li>
                                        <li
                                            className="nav-item sidebar-item py-1"
                                            onClick={() => {
                                                navigate('/informes/devoluciones-pedido');
                                                setIsExpanded(false);
                                            }}
                                            style={{ cursor: 'pointer', paddingLeft: '40px', fontSize: '13px', display: 'flex', alignItems: 'center' }}
                                        >
                                            <span className="material-icons me-2" style={{ fontSize: '16px' }}>radio_button_unchecked</span>
                                            <span>Devoluciones de pedido</span>
                                        </li>
                                    </>
                                )}
                            </>
                        )}

                        {/* Gestión de Pedidos - Oculto para Cajero POS */}
                        {!isCajeroPos && (
                            <li
                                className="nav-item sidebar-item py-2"
                                onClick={() => {
                                    navigate('/pedidos');
                                    setIsExpanded(false);
                                }}
                                style={{ cursor: 'pointer', ...getMenuItemStyle() }}
                            >
                                <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>shopping_cart</span>
                                <span style={{ fontSize: '14px' }}>Gestión de Pedidos</span>
                            </li>
                        )}
                        <li
                            className="nav-item sidebar-item py-2"
                            onClick={() => {
                                navigate('/clientes');
                                setIsExpanded(false);
                            }}
                            style={{ cursor: 'pointer', ...getMenuItemStyle() }}
                        >
                            <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>groups</span>
                            <span style={{ fontSize: '14px' }}>Clientes</span>
                        </li>
                        {/* Vendedores, Proveedores, Bancos - Solo Admin */}
                        {isAdmin && (
                            <>
                                <li
                                    className="nav-item sidebar-item py-2"
                                    onClick={() => {
                                        navigate('/vendedores');
                                        setIsExpanded(false);
                                    }}
                                    style={{ cursor: 'pointer', ...getMenuItemStyle() }}
                                >
                                    <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>badge</span>
                                    <span style={{ fontSize: '14px' }}>Vendedores</span>
                                </li>

                                <li className="nav-item sidebar-item py-2" style={getMenuItemStyle()}>
                                    <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>person_search</span>
                                    <span style={{ fontSize: '14px' }}>Proveedores</span>
                                </li>
                                <li className="nav-item sidebar-item py-2" style={getMenuItemStyle()}>
                                    <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>account_balance</span>
                                    <span style={{ fontSize: '14px' }}>Bancos</span>
                                </li>
                            </>
                        )}
                    </ul>
                </div>

                <div className="flex-grow-1"></div>
            </nav>
        </>
    );
}
