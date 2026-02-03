import React, { useState, useRef, useEffect } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useCajero } from "../../context/CajeroContext";
import SyncButton from "./SyncButton";
import LoginCajeroModal from "./LoginCajeroModal";
import { API_URL } from "../../services/api"; // 🆕 Importar API_URL
import "./Topbar.css";

export default function Topbar({ onOpenCategoryManager }) {
  const { getTopbarInfo, isAuthenticated, cajeroLogueado, turnoActivo, sucursalActiva } = useCajero(); // 🆕 Traer sucursalActiva
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [otrosCajerosActivos, setOtrosCajerosActivos] = useState([]); // 🆕 Estado para cajeros activos
  const reportMenuRef = useRef(null);
  const navigate = useNavigate();

  // 🆕 Verificar si hay otros cajeros trabajando en la sucursal (o en toda la empresa si es Admin global)
  useEffect(() => {
    const verificarActividad = async () => {
      // Ejecutar si estoy logueado y NO tengo turno activo (soy supervisor)
      if (isAuthenticated && !turnoActivo) {
        try {
          // Construir query. Si tengo sucursal, filtro. Si no, traigo todo (modo Dios).
          const sucursalId = sucursalActiva ? (sucursalActiva.id || sucursalActiva) : null;
          const querySucursal = sucursalId ? `&sucursal_id=${sucursalId}` : '';

          console.log('🔍 Verificando cajas (ACTIVO/ABIERTO)...');

          // Helper para fetch seguro
          const fetchTurnos = async (estado) => {
            try {
              const res = await fetch(`${API_URL}/turnos/?estado=${estado}${querySucursal}`);
              const d = await res.json();
              return Array.isArray(d) ? d : [];
            } catch (e) { return []; }
          };

          // Consultar ambos estados para cubrir inconsistencias de datos (Legacy vs Nuevo)
          const [dataActivos, dataAbiertos] = await Promise.all([
            fetchTurnos('ACTIVO'),
            fetchTurnos('ABIERTO')
          ]);

          // Unir y eliminar duplicados
          const todos = [...dataActivos, ...dataAbiertos];
          const unicos = todos.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

          if (unicos.length > 0) {
            console.log('✅ Cajas encontradas:', unicos.length);
            setOtrosCajerosActivos(unicos);
          } else {
            setOtrosCajerosActivos([]);
          }
        } catch (error) {
          console.error("Error verificando cajeros activos:", error);
        }
      } else {
        setOtrosCajerosActivos([]);
      }
    };

    verificarActividad();
    // Polling cada 15 segundos para mayor reactividad
    const interval = setInterval(verificarActividad, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, turnoActivo, sucursalActiva]);

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
      <nav
        className="topbar-bg d-flex align-items-center justify-content-between px-3 py-2"
      >
        {/* Espacio para el botón hamburguesa y logo */}
        <div style={{ width: '50px' }}></div>

        {/* Botones de navegación - Centro/Izquierda */}
        <div className="d-flex align-items-center gap-4">
          {/* Botón Informes de Ventas con dropdown */}
          <div className="dropdown" ref={reportMenuRef}>
            <button
              className="btn btn-light border"
              style={{ borderRadius: '8px', color: '#163864', fontSize: '15px', padding: '8px 16px' }}
              type="button"
              onClick={() => setShowReportMenu(!showReportMenu)}
            >
              <i className="bi bi-file-earmark-text me-2" style={{ fontSize: '16px' }}></i>
              Informes de Ventas
            </button>
            {showReportMenu && (
              <ul className="dropdown-menu show" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px' }}>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setShowReportMenu(false);
                      navigate('/informes/general');
                    }}
                    style={{ fontSize: '13px' }}
                  >
                    Informe de Ventas General
                  </button>
                </li>
              </ul>
            )}
          </div>

          {/* Botón Caja */}
          <button
            className="btn btn-light border"
            style={{ borderRadius: '8px', color: '#163864', fontSize: '15px', padding: '8px 16px' }}
            type="button"
            onClick={() => navigate('/caja')}
            title="Arqueo de Caja"
          >
            <i className="bi bi-cash-stack me-2" style={{ fontSize: '16px' }}></i>
            Caja
          </button>

          {/* Botón Gestionar Categorías */}
          <button
            className="btn btn-light border"
            style={{ borderRadius: '8px', color: '#163864', fontSize: '15px', padding: '8px 16px' }}
            type="button"
            onClick={onOpenCategoryManager}
            title="Gestionar Categorías"
          >
            <span className="material-icons me-2" style={{ fontSize: '16px' }}>settings</span>
            Gestionar
          </button>
        </div>

        {/* Controles del topbar - Derecha */}
        <div className="d-flex align-items-center gap-2">
          <SyncButton />

          <span className="material-icons mx-2 d-flex align-items-center text-primary topbar-wifi-icon">
            wifi
          </span>

          <span className="position-relative mx-2 d-flex align-items-center topbar-notification-icon">
            <span className="material-icons">notifications</span>
            <span className="badge bg-warning position-absolute top-0 start-100 translate-middle p-1 rounded-circle" style={{ fontSize: 10 }}>
              0
            </span>
          </span>

          {/* 🆕 Indicador de Cajas Activas (Visible para Admin/Supervisor libre) */}
          {isAuthenticated && !turnoActivo && otrosCajerosActivos.length > 0 && (
            <div
              className="d-flex align-items-center me-3 animate__animated animate__fadeIn"
              title={`Cajas abiertas: ${otrosCajerosActivos.map(t => t.cajero_nombre || 'Cajero').join(', ')}`}
              style={{ cursor: 'help' }}
            >
              <span className="material-icons me-1 text-success blink-animation" style={{ fontSize: 14 }}>fiber_manual_record</span>
              <span style={{ fontSize: 13, fontWeight: '600', color: '#198754' }}>
                {otrosCajerosActivos.length} {otrosCajerosActivos.length === 1 ? 'Caja Abierta' : 'Cajas Abiertas'}
              </span>
            </div>
          )}

          {/* Botón de Login/Logout */}
          <Button
            variant={isAuthenticated ? "outline-danger" : "outline-primary"}
            size="sm"
            onClick={handleLoginClick}
            className="d-flex align-items-center"
            style={{
              fontSize: 12,
              color: isAuthenticated && turnoActivo ? '#28a745' : undefined,
              borderColor: isAuthenticated && turnoActivo ? '#28a745' : undefined
            }}
          >
            <span className="material-icons me-1" style={{ fontSize: 16 }}>
              {isAuthenticated ? 'logout' : 'login'}
            </span>
            {isAuthenticated ? 'Logout' : 'Login'}
          </Button>

          {/* Información del cajero */}
          {isAuthenticated && cajeroLogueado ? (
            <div className="mx-2 d-flex align-items-center" style={{ fontSize: 15 }}>
              <span className="material-icons me-2 text-primary" style={{ fontSize: 24 }}>
                account_circle
              </span>
              <span className="fw-bold">{cajeroLogueado.nombre}</span>
            </div>
          ) : (
            <div className="mx-2 d-flex align-items-center" style={{ fontSize: 15 }}>
              <span className="material-icons me-2 text-muted" style={{ fontSize: 24 }}>
                person_outline
              </span>
              <span className="text-muted">Sin usuario</span>
            </div>
          )}

        </div>
      </nav>

      {/* Modal de Login/Abrir Turno */}
      <LoginCajeroModal
        show={showLoginModal}
        onHide={handleCloseModal}
        modoAbrirTurno={isAuthenticated && cajeroLogueado && !turnoActivo}
      />
    </>
  );
}