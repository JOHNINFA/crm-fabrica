// src/components/Pedidos/Sidebar.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from '../../assets/images/icono.png';
import { consultarTablaProducto } from '../../utils/consultaProductos';
import './Sidebar.css';

export default function Sidebar({ onWidthChange }) {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const [showPreciosSubmenu, setShowPreciosSubmenu] = useState(false);
    const [showInformesSubmenu, setShowInformesSubmenu] = useState(false);

    // Sidebar siempre visible, se expande con hover
    const sidebarWidth = isHovered ? 210 : 60;

    // Estilo para los elementos del menú
    const getMenuItemStyle = () => ({
        whiteSpace: 'nowrap',
        paddingLeft: isHovered ? '12px' : '18px',
        paddingRight: isHovered ? '12px' : '8px'
    });

    React.useEffect(() => {
        if (onWidthChange) {
            onWidthChange(sidebarWidth);
        }
    }, [sidebarWidth, onWidthChange]);

    return (
        <>
            {/* Sidebar */}
            <nav
                className="sidebar-bg pedidos-sidebar d-flex flex-column align-items-start p-0"
                style={{
                    width: sidebarWidth,
                    minWidth: sidebarWidth,
                    position: "fixed",
                    zIndex: 1000,
                    left: 0,
                    top: 0,
                    bottom: 0,
                    height: '100vh',
                    transition: 'width 0.3s ease'
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Logo en la parte superior */}
                <div className="w-100 d-flex align-items-center justify-content-center" style={{ height: '60px', paddingTop: '2px', paddingBottom: '2px', backgroundColor: '#ffffff' }}>
                    <img
                        src={logo}
                        alt="Logo"
                        style={{
                            height: '55px',
                            width: 'auto',
                            transition: 'height 0.3s ease'
                        }}
                    />
                </div>

                <div className="w-100 flex-grow-1" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
                    <ul className="nav flex-column w-100 mt-3" >
                        {/* Inicio */}
                        <li
                            className="nav-item sidebar-item py-2"
                            onClick={() => navigate('/')}
                            style={{ cursor: 'pointer', ...getMenuItemStyle() }}
                        >
                            <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>home</span>
                            {isHovered && <span style={{ fontSize: '14px' }}>Inicio</span>}
                        </li>

                        {/* Pedidos - ACTIVO */}
                        <li className="nav-item sidebar-item py-2 active" style={getMenuItemStyle()}>
                            <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>file_copy</span>
                            {isHovered && <span style={{ fontSize: '14px' }}>Pedidos</span>}
                        </li>



                        {/* Productos - Navegar a página completa */}
                        <li
                            className="nav-item sidebar-item py-2"
                            onClick={() => {
                                sessionStorage.setItem('origenModulo', 'pedidos');
                                navigate('/productos');
                            }}
                            style={{ cursor: 'pointer', ...getMenuItemStyle() }}
                        >
                            <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>apps</span>
                            {isHovered && <span style={{ fontSize: '14px' }}>Productos</span>}
                        </li>

                        {/* Lista de precios con submenu */}
                        <li
                            className="nav-item sidebar-item py-2"
                            onClick={() => setShowPreciosSubmenu(!showPreciosSubmenu)}
                            style={{ cursor: 'pointer', ...getMenuItemStyle() }}
                        >
                            <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>attach_money</span>
                            {isHovered && <span style={{ fontSize: '14px' }}>Precios</span>}
                            {isHovered && (
                                <span className="material-icons ms-auto" style={{ fontSize: '16px' }}>
                                    {showPreciosSubmenu ? 'expand_less' : 'expand_more'}
                                </span>
                            )}
                        </li>

                        {/* Submenu de Lista de precios */}
                        {showPreciosSubmenu && isHovered && (
                            <>
                                <li
                                    className="nav-item sidebar-item py-1"
                                    onClick={() => {
                                        sessionStorage.setItem('origenModulo', 'pedidos');
                                        navigate('/lista-precios');
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
                            {isHovered && <span style={{ fontSize: '14px' }}>Ingresos</span>}
                        </li>
                        <li className="nav-item sidebar-item py-2" style={getMenuItemStyle()}>
                            <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>upload</span>
                            {isHovered && <span style={{ fontSize: '14px' }}>Gastos</span>}
                        </li>
                        <li className="nav-item sidebar-item py-2" style={getMenuItemStyle()}>
                            <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>balance</span>
                            {isHovered && <span style={{ fontSize: '14px' }}>Inventarios</span>}
                        </li>
                        <li
                            className="nav-item sidebar-item py-2"
                            onClick={() => setShowInformesSubmenu(!showInformesSubmenu)}
                            style={{ cursor: 'pointer', ...getMenuItemStyle() }}
                        >
                            <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>assessment</span>
                            {isHovered && <span style={{ fontSize: '14px' }}>Informes</span>}
                            {isHovered && (
                                <span className="material-icons ms-auto" style={{ fontSize: '16px' }}>
                                    {showInformesSubmenu ? 'expand_less' : 'expand_more'}
                                </span>
                            )}
                        </li>

                        {/* Submenu de Informes */}
                        {showInformesSubmenu && isHovered && (
                            <>
                                <li
                                    className="nav-item sidebar-item py-1"
                                    onClick={() => navigate('/informes/pedidos')}
                                    style={{ cursor: 'pointer', paddingLeft: '40px', fontSize: '13px', display: 'flex', alignItems: 'center' }}
                                >
                                    <span className="material-icons me-2" style={{ fontSize: '16px' }}>radio_button_unchecked</span>
                                    <span>Pedidos por ruta</span>
                                </li>
                                <li
                                    className="nav-item sidebar-item py-1"
                                    onClick={() => navigate('/informes/transportadoras')}
                                    style={{ cursor: 'pointer', paddingLeft: '40px', fontSize: '13px', display: 'flex', alignItems: 'center' }}
                                >
                                    <span className="material-icons me-2" style={{ fontSize: '16px' }}>radio_button_unchecked</span>
                                    <span>Pedidos por transportadora</span>
                                </li>
                                <li
                                    className="nav-item sidebar-item py-1"
                                    onClick={() => navigate('/informes/entregas')}
                                    style={{ cursor: 'pointer', paddingLeft: '40px', fontSize: '13px', display: 'flex', alignItems: 'center' }}
                                >
                                    <span className="material-icons me-2" style={{ fontSize: '16px' }}>radio_button_unchecked</span>
                                    <span>Estado de entregas</span>
                                </li>
                                <li
                                    className="nav-item sidebar-item py-1"
                                    onClick={() => navigate('/informes/devoluciones-pedido')}
                                    style={{ cursor: 'pointer', paddingLeft: '40px', fontSize: '13px', display: 'flex', alignItems: 'center' }}
                                >
                                    <span className="material-icons me-2" style={{ fontSize: '16px' }}>radio_button_unchecked</span>
                                    <span>Devoluciones de pedido</span>
                                </li>
                            </>
                        )}

                        <li
                            className="nav-item sidebar-item py-2"
                            onClick={() => navigate('/pedidos')}
                            style={{ cursor: 'pointer', ...getMenuItemStyle() }}
                        >
                            <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>shopping_cart</span>
                            {isHovered && <span style={{ fontSize: '14px' }}>Gestión de Pedidos</span>}
                        </li>
                        <li
                            className="nav-item sidebar-item py-2"
                            onClick={() => navigate('/clientes')}
                            style={{ cursor: 'pointer', ...getMenuItemStyle() }}
                        >
                            <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>groups</span>
                            {isHovered && <span style={{ fontSize: '14px' }}>Clientes</span>}
                        </li>
                        <li
                            className="nav-item sidebar-item py-2"
                            onClick={() => navigate('/vendedores')}
                            style={{ cursor: 'pointer', ...getMenuItemStyle() }}
                        >
                            <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>badge</span>
                            {isHovered && <span style={{ fontSize: '14px' }}>Vendedores</span>}
                        </li>
                        <li className="nav-item sidebar-item py-2" style={getMenuItemStyle()}>
                            <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>person_search</span>
                            {isHovered && <span style={{ fontSize: '14px' }}>Proveedores</span>}
                        </li>
                        <li className="nav-item sidebar-item py-2" style={getMenuItemStyle()}>
                            <span className="material-icons me-2 align-middle" style={{ fontSize: '20px' }}>account_balance</span>
                            {isHovered && <span style={{ fontSize: '14px' }}>Bancos</span>}
                        </li>
                    </ul>
                </div>

                <div className="flex-grow-1"></div>
            </nav>
        </>
    );
}