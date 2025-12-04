import React from 'react';
import './ModalDetallePedido.css';

export default function ModalDetallePedido({ show, onClose, pedido }) {
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

          <div className="totales-section">
            <div className="total-row">
              <span>Total:</span>
              <span>{formatCurrency(pedido.total)}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer-pedido">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
