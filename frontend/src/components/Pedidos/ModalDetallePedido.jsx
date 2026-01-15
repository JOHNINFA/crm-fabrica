import React, { useState } from 'react';
import './ModalDetallePedido.css';

export default function ModalDetallePedido({ show, onClose, pedido }) {
  const [mostrarNovedades, setMostrarNovedades] = useState(false);

  if (!show || !pedido) return null;




  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="modal-overlay-pedido" onClick={onClose}>
      <div className="modal-content-pedido" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-pedido">
          <h4>Pedido Realizado</h4>
          <button className="btn-close-pedido" onClick={onClose}>×</button>
        </div>

        <div className="modal-body-pedido">
          <div className="info-section">
            <div className="info-row">
              <span className="info-label">Número:</span>
              <span className="info-value">{pedido.numero_pedido}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Destinatario:</span>
              <span className="info-value">{pedido.destinatario}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Dirección:</span>
              <span className="info-value">{pedido.direccion_entrega}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Fecha Entrega:</span>
              <span className="info-value">{pedido.fecha_entrega}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Vendedor:</span>
              <span className="info-value">{pedido.vendedor}</span>
            </div>
          </div>

          <div className="productos-section">
            <h5>Productos</h5>
            <table className="tabla-productos">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pedido.detalles && pedido.detalles.map((detalle, index) => (
                  <tr key={index}>
                    <td>{detalle.producto_nombre || `Producto #${detalle.producto}`}</td>
                    <td>{detalle.cantidad}</td>
                    <td>{formatCurrency(detalle.precio_unitario)}</td>
                    <td>{formatCurrency(detalle.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sección de Novedades (Condicional) */}
          {mostrarNovedades && pedido.novedades && (
            <div className="novedades-section mt-3 p-3" style={{ backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeeba' }}>
              <h5 className="mb-3" style={{ color: '#856404' }}>
                <i className="bi bi-arrow-return-left me-2"></i>
                Devolución de Producto
              </h5>
              <div className="novedades-list">
                {pedido.novedades.map((nov, i) => (
                  <div key={i} className="card mb-2" style={{ border: '1px solid #f5c6cb', backgroundColor: '#f8d7da' }}>
                    <div className="card-body p-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <strong style={{ color: '#721c24' }}>{nov.producto_nombre || 'Producto Desconocido'}</strong>
                        <span className="badge bg-danger rounded-pill">Devuelto: {nov.cantidad}</span>
                      </div>
                      <small className="text-secondary d-block mt-1">
                        {nov.descripcion || nov.motivo || 'Diferencia en entrega'}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="totales-section">
            <div className="total-row">
              <span>Total:</span>
              <span>{formatCurrency(pedido.total)}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer-pedido">
          {pedido.novedades && pedido.novedades.length > 0 && (
            <button
              className="btn btn-warning me-2"
              onClick={() => setMostrarNovedades(!mostrarNovedades)}
              style={{ color: '#856404', fontWeight: 'bold' }}
            >
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {mostrarNovedades ? 'Ocultar Novedades' : 'Novedades Pedido'}
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

