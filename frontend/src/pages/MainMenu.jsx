import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/MainMenu.css';
import icono from '../assets/images/icono.png';
import bannermenu from '../assets/images/bannermenu.png';
import usePageTitle from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';

export default function MainMenu() {
  const navigate = useNavigate();
  const { usuario, logout, esAdmin, tienePermiso } = useAuth();
  usePageTitle('Menú Principal');

  // 🆕 Estado para mostrar/ocultar la barra superior
  const [barraVisible, setBarraVisible] = useState(true);

  // 🆕 Estado para modal de acceso denegado
  const [modalInfo, setModalInfo] = useState({ visible: false, mensaje: '', tipo: '' });

  // 🆕 Auto-hide después de 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setBarraVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // 🆕 Detectar si está en modo ejecutable
  const isPosOnlyMode = window.POS_ONLY_MODE || false;

  // 🆕 Función para verificar acceso a módulo
  const tieneAcceso = (permiso) => {
    // Admin tiene acceso a todo
    if (esAdmin()) return true;
    // Verificar permiso específico
    return tienePermiso(permiso);
  };

  // 🆕 Función para manejar click en tarjetas
  const handleCardClick = (route, permiso = null) => {
    // Si es modo POS only y no es ruta POS u Otros
    if (isPosOnlyMode && route !== '/pos' && route !== '/otros') {
      setModalInfo({
        visible: true,
        mensaje: 'Este módulo no está disponible en el modo POS.',
        tipo: 'warning'
      });
      return;
    }

    // Si se requiere permiso y no lo tiene
    if (permiso && !tieneAcceso(permiso)) {
      setModalInfo({
        visible: true,
        mensaje: 'No tienes permiso para acceder a este módulo.',
        tipo: 'denied'
      });
      return;
    }

    navigate(route);
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    if (window.confirm('¿Desea cerrar sesión?')) {
      logout();
      navigate('/login');
    }
  };

  // 🆕 Componente de tarjeta
  const MenuCard = ({ route, permiso, icon, title, description }) => {
    return (
      <button
        onClick={() => handleCardClick(route, permiso)}
        className="menu-card"
      >
        <i className={`bi ${icon}`}></i>
        <h3>{title}</h3>
        <p>{description}</p>
      </button>
    );
  };

  return (
    <div className="main-menu" style={{ backgroundImage: `url(${bannermenu})` }}>
      {/* 🆕 Barra superior con usuario - Auto-hide */}
      <div
        onMouseEnter={() => setBarraVisible(true)}
        onMouseLeave={() => setBarraVisible(false)}
        style={{
          position: 'fixed',
          top: barraVisible ? 0 : -60,
          left: 0,
          right: 0,
          background: '#06386d',
          backdropFilter: 'blur(10px)',
          padding: '10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1000,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          transition: 'top 0.3s ease-in-out'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
            <i className="bi bi-person-circle me-2" style={{ fontSize: '1.2rem' }}></i>
            <strong style={{ color: '#fff' }}>{usuario?.nombre || 'Usuario'}</strong>
            <span className="ms-2 badge" style={{
              background: esAdmin() ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #4facfe, #00f2fe)',
              fontSize: '0.7rem',
              padding: '4px 8px'
            }}>
              {usuario?.rol || 'USUARIO'}
            </span>
            {usuario?.sucursal && (
              <span className="ms-2 text-muted" style={{ fontSize: '0.8rem' }}>
                <i className="bi bi-building me-1"></i>
                {usuario.sucursal}
              </span>
            )}
          </span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            color: '#fff',
            padding: '6px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <i className="bi bi-box-arrow-right"></i>
          Cerrar Sesión
        </button>
      </div>

      {/* Zona de activación para mostrar la barra (parte superior de la pantalla) */}
      <div
        onMouseEnter={() => setBarraVisible(true)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '10px',
          zIndex: 999,
          background: 'transparent'
        }}
      />

      {/* Espaciador para la barra fija */}
      <div style={{ height: '20px' }}></div>

      <div className="logo-container">
        <img src={icono} alt="Logo Arepas Guerrero" className="logo-img" />
      </div>

      <div className="menu-grid">
        <MenuCard
          route="/pos"
          permiso="acceso_pos"
          icon="bi-cart3"
          title="Punto de Venta"
          description="Facturación rápida y control de caja."
        />

        <MenuCard
          route="/inventario"
          permiso="acceso_inventario"
          icon="bi-box-seam"
          title="Inventario"
          description="Stock, producción y materia prima."
        />

        <MenuCard
          route="/cargue"
          permiso="acceso_cargue"
          icon="bi-people"
          title="Cargue"
          description="Salidas a vendedores y devoluciones."
        />

        <MenuCard
          route="/remisiones"
          permiso="acceso_pedidos"
          icon="bi-file-earmark-text"
          title="Pedidos"
          description="Gestión de pedidos de clientes."
        />

        <MenuCard
          route="/trazabilidad"
          permiso="acceso_reportes"
          icon="bi-diagram-3"
          title="Trazabilidad"
          description="Historial y lotes de productos."
        />

        <MenuCard
          route="/otros"
          permiso="acceso_configuracion"
          icon="bi-gear"
          title="Otros"
          description="Configuración y utilidades."
        />
      </div>

      {/* 🆕 Modal de acceso denegado */}
      {modalInfo.visible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => setModalInfo({ visible: false, mensaje: '', tipo: '' })}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '32px 40px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              textAlign: 'center',
              animation: 'slideUp 0.3s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icono */}
            <div
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: modalInfo.tipo === 'denied'
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: modalInfo.tipo === 'denied'
                  ? '0 8px 20px rgba(239, 68, 68, 0.3)'
                  : '0 8px 20px rgba(245, 158, 11, 0.3)'
              }}
            >
              <i
                className={modalInfo.tipo === 'denied' ? 'bi bi-lock-fill' : 'bi bi-exclamation-triangle-fill'}
                style={{ fontSize: '32px', color: '#fff' }}
              ></i>
            </div>

            {/* Título */}
            <h3 style={{
              color: '#1f2937',
              fontSize: '1.4rem',
              fontWeight: '700',
              marginBottom: '12px'
            }}>
              {modalInfo.tipo === 'denied' ? 'Acceso Denegado' : 'Módulo No Disponible'}
            </h3>

            {/* Mensaje */}
            <p style={{
              color: '#4b5563',
              fontSize: '1rem',
              lineHeight: '1.6',
              marginBottom: '8px'
            }}>
              {modalInfo.mensaje}
            </p>

            {modalInfo.tipo === 'denied' && (
              <p style={{
                color: '#6b7280',
                fontSize: '0.85rem',
                marginBottom: '24px'
              }}>
                Contacta al administrador para solicitar acceso.
              </p>
            )}

            {/* Botón */}
            <button
              onClick={() => setModalInfo({ visible: false, mensaje: '', tipo: '' })}
              style={{
                background: 'linear-gradient(135deg, #06386d 0%, #0a4f8d 100%)',
                color: '#fff',
                border: 'none',
                padding: '12px 40px',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(6, 56, 109, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(6, 56, 109, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(6, 56, 109, 0.3)';
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Estilos de animación */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}