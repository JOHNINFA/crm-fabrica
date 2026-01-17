import { Row, Col, Card } from "react-bootstrap";
import "../../styles/TablaConfirmacionProduccion.css";

const TablaConfirmacionProduccion = ({ datosGuardados, tipo = "Producción" }) => {
  if (
    !datosGuardados ||
    !datosGuardados.productos ||
    datosGuardados.productos.length === 0
  ) {
    return null;
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString("es-ES");
  };

  const formatearHora = (fecha) => {
    if (!fecha) return "";
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="mt-3 shadow-lg border-0 confirmacion-card">
      {/* Header con icono verde */}
      <Card.Header className="bg-white border-bottom d-flex justify-content-center align-items-center py-3">
        <div className="d-flex align-items-center">
          <i className="bi bi-check-circle-fill text-success me-3 fs-4"></i>
          <h5 className="mb-0 fw-semibold text-dark">{tipo} Registrada</h5>
        </div>
      </Card.Header>

      <Card.Body className="card-body-compacto" style={{ paddingLeft: "0.25rem", paddingRight: "0.25rem" }}>
        {/* Grid de información del lote */}
        <Row className="mb-1 justify-content-center">
          <Col xs={12} md={8}>
            <Row>
              <Col xs={12} sm={4} className="mb-1 mb-sm-0 text-center text-sm-start">
                <small className="text-muted fw-medium d-block" style={{ fontSize: "0.85rem" }}>Lote:</small>
                <div className="fw-semibold text-dark" style={{ fontSize: "1rem" }}>
                  {datosGuardados.lote}
                </div>
              </Col>
              <Col xs={12} sm={4} className="mb-1 mb-sm-0 text-center">
                <small className="text-muted fw-medium d-block" style={{ fontSize: "0.85rem" }}>Vencimiento:</small>
                <div className="fw-semibold text-dark" style={{ fontSize: "1rem" }}>
                  {formatearFecha(datosGuardados.fechaVencimiento)}
                </div>
              </Col>
              <Col xs={12} sm={4} className="text-center text-sm-end">
                <small className="text-muted fw-medium d-block" style={{ fontSize: "0.85rem" }}>Registrado:</small>
                <div className="fw-semibold text-dark" style={{ fontSize: "1rem" }}>
                  {formatearHora(datosGuardados.fechaCreacion)}
                </div>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Tabla personalizada con CSS puro */}
        <div style={{ width: "100%", margin: "0 auto" }}>
          <div className="tabla-confirmacion-wrapper">
            {/* Header de la tabla */}
            <div className="tabla-header">
              <div className="header-col-productos">Productos</div>
              <div className="header-col-estado">Estado</div>
              <div className="header-col-cantidad">Cantidad Ingresada</div>
            </div>

            {/* Filas de productos */}
            <div className="tabla-body">
              {datosGuardados.productos
                .sort((a, b) => {
                  // Ordenar productos según el orden específico
                  const orden = {
                    "AREPA TIPO OBLEA 500GR": 1,
                    "AREPA MEDIANA 330GR": 2,
                    "AREPA TIPO PINCHO 330GR": 3,
                  };
                  const ordenA = orden[a.nombre?.toUpperCase()] || 999;
                  const ordenB = orden[b.nombre?.toUpperCase()] || 999;
                  return ordenA - ordenB;
                })
                .map((producto, index) => (
                  <div key={index} className="tabla-row">
                    <div className="col-productos">
                      {producto.nombre}
                    </div>
                    <div className="col-estado">
                      {producto.editado ? (
                        <span
                          className="icono-editado"
                          onClick={() => {
                            const mensaje = `Editado: ${producto.cantidadOriginal} → ${producto.cantidad} und\n` +
                              `Fecha: ${producto.fechaEdicion}\n` +
                              `Motivo: ${producto.motivoEdicion}`;
                            alert(mensaje);
                          }}
                          title="Ver detalles de la edición - Click para más info"
                        >
                          ⚠️
                        </span>
                      ) : (
                        <span className="icono-ok" title="Sin ediciones">
                          <i className="bi bi-check"></i>
                        </span>
                      )}
                    </div>
                    <div className="col-cantidad">
                      <span className="badge-custom">
                        {producto.cantidad} und
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default TablaConfirmacionProduccion;