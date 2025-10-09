import React, { useState, useEffect } from 'react';
import { ventaService } from '../../services/api';
import './PaymentModal.css';

const PaymentModal = ({
  show, onClose, cart, total, subtotal = 0, impuestos = 0, descuentos = 0,
  seller = 'Sistema', client = 'CONSUMIDOR FINAL', clearCart = () => { }
}) => {
  const safeTotal = typeof total === 'number' ? total : 0;
  const [entregado, setEntregado] = useState(safeTotal);
  const [nota, setNota] = useState("");
  const [banco, setBanco] = useState("Caja General");
  const [centroCosto, setCentroCosto] = useState("");
  const [impresion, setImpresion] = useState("Ninguna");
  const [bodega, setBodega] = useState("Principal");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [processing, setProcessing] = useState(false);
  const [showNotaModal, setShowNotaModal] = useState(false);

  // Actualizar dinero entregado cuando cambia el total
  useEffect(() => {
    setEntregado(safeTotal);
  }, [safeTotal]);

  const devuelta = Math.max(0, entregado - safeTotal);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    setProcessing(true);

    try {
      // Función para obtener fecha local
      const getFechaLocal = () => {
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');
        const hour = String(hoy.getHours()).padStart(2, '0');
        const minute = String(hoy.getMinutes()).padStart(2, '0');
        const second = String(hoy.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
      };

      // Preparar datos de la venta
      const ventaData = {
        fecha: getFechaLocal(), // Enviar fecha local explícitamente
        vendedor: seller,
        cliente: client,
        metodo_pago: metodoPago.toUpperCase(),
        subtotal: subtotal,
        impuestos: impuestos,
        descuentos: descuentos,
        total: safeTotal,
        dinero_entregado: entregado,
        devuelta: devuelta,
        estado: 'PAGADO',
        nota: nota,
        banco: banco,
        centro_costo: centroCosto,
        bodega: bodega,
        detalles: cart.map(item => ({
          producto: item.id,
          cantidad: item.qty,
          precio_unitario: item.price
        }))
      };

      console.log('Procesando venta:', ventaData);

      // Crear la venta
      const result = await ventaService.create(ventaData);

      if (result && !result.error) {
        console.log('✅ Venta creada exitosamente:', result);
        alert(`¡Venta procesada exitosamente!\nFactura: ${result.numero_factura}\nTotal: $${safeTotal.toLocaleString()}`);

        // Limpiar carrito y cerrar modal
        clearCart();
        onClose();
      } else {
        console.error('❌ Error al crear venta:', result);
        alert('Error al procesar la venta. Intente nuevamente.');
      }
    } catch (error) {
      console.error('❌ Error al procesar venta:', error);
      alert('Error al procesar la venta. Intente nuevamente.');
    } finally {
      setProcessing(false);
    }
  };

  // Definición de las pestañas de métodos de pago con sus iconos
  const tabs = [
    { id: 'Efectivo', label: 'Efectivo', icon: 'currency-dollar' },
    { id: 'Tarjeta', label: 'Tarjeta', icon: 'credit-card' },
    { id: 'T. Crédito', label: 'T. Crédito', icon: 'credit-card-2-front' },
    { id: 'Qr', label: 'Qr', icon: 'qr-code' },
    { id: 'Transf', label: 'Transf', icon: 'arrow-left-right' },
    { id: 'RAPPIPAY', label: 'RAPPIPAY', icon: 'wallet2' },
    { id: 'Bonos', label: 'Bonos', icon: 'ticket-perforated' },
    { id: 'Otros', label: 'Otros', icon: 'three-dots' }
  ];

  // Función para actualizar el dinero entregado al valor del total
  const setDineroExacto = () => {
    setEntregado(safeTotal);
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        {/* Header */}
        <div className="payment-modal-header">
          <h4>
            Cliente: <strong>{client}</strong> | Fecha: <strong>{(() => {
              const hoy = new Date();
              const year = hoy.getFullYear();
              const month = String(hoy.getMonth() + 1).padStart(2, '0');
              const day = String(hoy.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            })()}</strong> | Vendedor: <strong>{seller}</strong>
          </h4>
          <button className="close-button" onClick={onClose} title="Eliminar">
            <i className="bi bi-trash"></i>
          </button>
        </div>

        <div className="payment-modal-body">
          {/* Totales */}
          <div className="payment-summary">
            <div className="payment-summary-box total">
              <div>TOTAL A PAGAR</div>
              <strong>💵 ${safeTotal.toLocaleString()}</strong>
            </div>
            <div className="payment-summary-box pending">
              <div>PENDIENTE x PAGAR</div>
              <strong>🏷️ $0.00</strong>
            </div>
            <div className="payment-summary-box change">
              <div>DEVUELTA EFECTIVO</div>
              <strong>💵 ${devuelta.toLocaleString()}</strong>
            </div>
          </div>

          {/* Métodos de Pago - Nuevo estilo */}
          <div className="payment-methods">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`payment-method-btn ${metodoPago === tab.id ? 'active' : ''}`}
                onClick={() => setMetodoPago(tab.id)}
              >
                <i className={`bi bi-${tab.icon}`}></i> {tab.label}
              </button>
            ))}
          </div>

          <div className="payment-form">
            {/* Campos de entrada */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label text-muted small">Dinero Entregado</label>
                <div className="input-with-button">
                  <input
                    type="text"
                    className="form-control money-input"
                    value={`$ ${entregado.toLocaleString()}`}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '').replace('$ ', '');
                      setEntregado(value ? Number(value) : 0);
                    }}
                  />
                  <button
                    type="button"
                    className="exact-amount-btn"
                    onClick={setDineroExacto}
                    title="Establecer monto exacto"
                  >
                    <i className="bi bi-check2-circle"></i>
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label text-muted small">Devuelta</label>
                <input
                  type="text"
                  className="form-control money-input"
                  value={`$ ${devuelta.toLocaleString()}`}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label className="form-label text-muted small">Valor</label>
                <input
                  type="text"
                  className="form-control money-input"
                  value={`$ ${safeTotal.toLocaleString()}`}
                  readOnly
                />
              </div>
            </div>

            {/* Botón de Nota */}
            <div className="form-row">
              <div className="form-group">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-nota"
                  onClick={() => setShowNotaModal(true)}
                  style={{ width: '100%', fontSize: '16px', padding: '7px 14px' }}
                >
                  <i className="bi bi-pencil-square"></i> Nota
                </button>
              </div>
            </div>

            {/* Modal de Nota */}
            {showNotaModal && (
              <div className="nota-modal-overlay" onClick={() => setShowNotaModal(false)}>
                <div className="nota-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="nota-modal-header">
                    <h5>Nota de la Venta</h5>
                    <button className="close-button" onClick={() => setShowNotaModal(false)}>
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                  <div className="nota-modal-body">
                    <textarea
                      className="form-control nota-textarea"
                      rows={6}
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                      placeholder="Escribe una nota para esta venta..."
                      autoFocus
                      style={{ minHeight: '120px', fontSize: '14px' }}
                    />
                  </div>
                  <div className="nota-modal-footer">
                    <button className="btn btn-outline-secondary" onClick={() => setShowNotaModal(false)}>
                      <i className="bi bi-x-lg"></i> Cancelar
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowNotaModal(false)}>
                      <i className="bi bi-check-lg"></i> Guardar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Fila con Bancos y Centro de Costo */}
            <div className="form-row compact-row">
              <div className="form-group">
                <label className="form-label compact-label">Bancos</label>
                <select
                  className="form-select compact-select"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                >
                  <option>Caja General</option>
                  <option>Bancolombia</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label compact-label">Centro de Costo <i className="bi bi-info-circle"></i></label>
                <select
                  className="form-select compact-select"
                  value={centroCosto}
                  onChange={(e) => setCentroCosto(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Centro 1">Centro 1</option>
                </select>
              </div>
            </div>

            {/* Fila con Resumen de Pagos, Impresión y Bodega */}
            <div className="form-row compact-row">
              <div className="form-group">
                <label className="form-label compact-label">Resumen de Pagos</label>
                <div className="payment-summary-detail">
                  <div className="payment-method-amount">{metodoPago} - $ {entregado.toLocaleString()}</div>
                  <div className="payment-bank">{banco}</div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label compact-label">Impresión</label>
                <select
                  className="form-select compact-select"
                  value={impresion}
                  onChange={(e) => setImpresion(e.target.value)}
                >
                  <option>Ninguna</option>
                  <option>Tirilla</option>
                  <option>Carta</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label compact-label">Bodega</label>
                <select
                  className="form-select compact-select"
                  value={bodega}
                  onChange={(e) => setBodega(e.target.value)}
                >
                  <option>Principal</option>
                  <option>Secundaria</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="payment-modal-footer">
          <button className="btn btn-outline-secondary" onClick={onClose}>
            <i className="bi bi-x-lg"></i> Cancelar
          </button>
          <button
            className="btn btn-primary pos-payment-confirm-btn"
            onClick={handleSubmit}
            disabled={processing || cart.length === 0}
          >
            {processing ? (
              <>
                <i className="bi bi-hourglass-split"></i> Procesando...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg"></i> Confirmar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;