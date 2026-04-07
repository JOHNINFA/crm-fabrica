import { Card } from "react-bootstrap";
import Swal from "sweetalert2";
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
    if (!fecha) return "-";
    const soloFecha = String(fecha).split("T")[0];
    const partes = soloFecha.split("-");
    if (partes.length === 3) {
      const [anio, mes, dia] = partes;
      return `${dia}/${mes}/${anio}`;
    }
    return soloFecha;
  };

  const formatearHora = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Detectar si los productos traen info de lote por fila (modo Maquila)
  const tieneDetallePorFila = datosGuardados.productos.some((p) => p.lote || p.lotesDetalle);

  return (
    <Card className="mt-3 shadow-lg border-0 confirmacion-card">
      <Card.Header className="bg-white border-bottom d-flex justify-content-center align-items-center py-3">
        <div className="d-flex align-items-center">
          <i className="bi bi-check-circle-fill text-success me-3 fs-4"></i>
          <h5 className="mb-0 fw-semibold text-dark">{tipo} Registrada</h5>
        </div>
      </Card.Header>

      <Card.Body className="card-body-compacto" style={{ paddingLeft: "0.25rem", paddingRight: "0.25rem" }}>

        {/* Encabezado clásico solo para Producción (sin detalle por fila) */}
        {!tieneDetallePorFila && (
          <div style={{ display: "flex", justifyContent: "center", gap: "32px", marginBottom: "12px", flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <small style={{ color: "#6b7280", fontSize: "0.85rem" }}>Lote:</small>
              <div style={{ fontWeight: 600 }}>{datosGuardados.lote}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <small style={{ color: "#6b7280", fontSize: "0.85rem" }}>Vencimiento:</small>
              <div style={{ fontWeight: 600 }}>{formatearFecha(datosGuardados.fechaVencimiento)}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <small style={{ color: "#6b7280", fontSize: "0.85rem" }}>Registrado:</small>
              <div style={{ fontWeight: 600 }}>{formatearHora(datosGuardados.fechaCreacion)}</div>
            </div>
          </div>
        )}

        {/* Tabla */}
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", minWidth: tieneDetallePorFila ? "520px" : "300px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "#475569" }}>PRODUCTO</th>
                <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>CANT.</th>
                {tieneDetallePorFila && (
                  <>
                    <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>LOTE</th>
                    <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>VENCE</th>
                    <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>HORA</th>
                  </>
                )}
                <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: 600, color: "#475569" }}>EST.</th>
              </tr>
            </thead>
            <tbody>
              {datosGuardados.productos.map((producto, index) => (
                <tr key={index} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: index % 2 === 0 ? "#fff" : "#f8fafc" }}>
                  <td style={{ padding: "6px 8px", color: "#1e293b", fontWeight: 500 }}>
                    {producto.nombre}
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "center", whiteSpace: "nowrap" }}>
                    <span style={{ backgroundColor: "#16a34a", color: "#fff", padding: "2px 8px", borderRadius: "12px", fontWeight: 600, fontSize: "0.78rem" }}>
                      {producto.cantidad} und
                    </span>
                  </td>
                  {tieneDetallePorFila && (
                    <>
                      <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: 500, whiteSpace: "nowrap" }}>
                        {Array.isArray(producto.lotesDetalle) && producto.lotesDetalle.length > 1
                          ? producto.lotesDetalle.map((l) => l.numero).join(", ")
                          : (producto.lote || "-")}
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "center", whiteSpace: "nowrap" }}>
                        {Array.isArray(producto.lotesDetalle) && producto.lotesDetalle.length > 1 ? (
                          <span>
                            {producto.lotesDetalle.map((l, i) => (
                              <span key={i} style={{ display: "block", whiteSpace: "nowrap" }}>
                                {l.numero}: {formatearFecha(l.fechaVencimiento)}
                              </span>
                            ))}
                          </span>
                        ) : (
                          formatearFecha(producto.fechaVencimiento)
                        )}
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "center", color: "#64748b", whiteSpace: "nowrap" }}>
                        {formatearHora(producto.fechaRegistro)}
                      </td>
                    </>
                  )}
                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                    {producto.editado ? (
                      <span
                        style={{ cursor: "pointer" }}
                        onClick={() => Swal.fire({
                          icon: 'warning',
                          title: 'Producto Editado',
                          html: `<b>${producto.nombre}</b><br/><br/>
                            <table style="margin:0 auto;text-align:left;font-size:0.95rem">
                              <tr><td style="padding:4px 8px;color:#64748b">Cantidad original:</td><td style="padding:4px 8px;font-weight:600">${producto.cantidadOriginal} und</td></tr>
                              <tr><td style="padding:4px 8px;color:#64748b">Cantidad nueva:</td><td style="padding:4px 8px;font-weight:600;color:#16a34a">${producto.cantidad} und</td></tr>
                              <tr><td style="padding:4px 8px;color:#64748b">Fecha:</td><td style="padding:4px 8px">${producto.fechaEdicion || '-'}</td></tr>
                              <tr><td style="padding:4px 8px;color:#64748b">Motivo:</td><td style="padding:4px 8px">${producto.motivoEdicion || '-'}</td></tr>
                            </table>`,
                          confirmButtonColor: '#16a34a',
                          confirmButtonText: 'Cerrar'
                        })}
                        title="Ver detalles de la edición"
                      >⚠️</span>
                    ) : (
                      <i className="bi bi-check-circle-fill text-success"></i>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default TablaConfirmacionProduccion;
