import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { useCajero } from "../../context/CajeroContext";
import SyncButton from "./SyncButton";
import LoginCajeroModal from "./LoginCajeroModal";

export default function Topbar() {
  const { getTopbarInfo, isAuthenticated, cajeroLogueado } = useCajero();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const topbarInfo = getTopbarInfo();

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
  };

  return (
    <>
      <nav className="topbar-bg d-flex align-items-center justify-content-between px-3 py-2 position-sticky">
        {/* Espacio vacío */}
        <div></div>

        {/* Controles del topbar */}
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