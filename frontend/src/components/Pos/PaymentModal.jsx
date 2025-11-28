import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { ventaService, configuracionImpresionService } from '../../services/api';
import './PaymentModal.css';

const PaymentModal = ({
  show, onClose, cart, total, subtotal = 0, impuestos = 0, descuentos = 0,
  seller = 'Sistema', client = 'CONSUMIDOR FINAL', clearCart = () => { }
}) => {
  const safeTotal = typeof total === 'number' ? total : 0;
  const [entregado, setEntregado] = useState(safeTotal);
  const [nota, setNota] = useState("");
  const [banco, setBanco] = useState("Caja General");
  const [bancos, setBancos] = useState([]);
  const [centroCosto, setCentroCosto] = useState("");
  const [impresion, setImpresion] = useState("Ninguna");
  const [bodega, setBodega] = useState("Principal");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [processing, setProcessing] = useState(false);
  const [showNotaModal, setShowNotaModal] = useState(false);
  const [configImpresion, setConfigImpresion] = useState(null);


  // Cargar bancos y configuración de impresión
  useEffect(() => {
    const cargarDatos = async () => {
      // Bancos
      const bancosGuardados = localStorage.getItem('bancos');
      if (bancosGuardados) {
        const bancosList = JSON.parse(bancosGuardados);
        const bancosActivos = bancosList.filter(b => b.activo);
        setBancos(bancosActivos);
        if (bancosActivos.length > 0) {
          setBanco(bancosActivos[0].nombre);
        }
      } else {
        const bancosDefault = [
          { id: 1, nombre: 'Caja General', activo: true }
        ];
        setBancos(bancosDefault);
        setBanco('Caja General');
      }

      // Configuración de Impresión
      try {
        const config = await configuracionImpresionService.getActiva();
        if (config && config.id) {
          setConfigImpresion(config);
        }
      } catch (error) {
        console.error('Error al cargar configuración de impresión:', error);
      }
    };

    cargarDatos();
  }, []);

  // Actualizar dinero entregado cuando cambia el total
  useEffect(() => {
    setEntregado(safeTotal);
  }, [safeTotal]);

  // Ocultar elementos sticky cuando el modal está abierto
  useEffect(() => {
    if (show) {
      document.body.classList.add('payment-modal-open');
    } else {
      document.body.classList.remove('payment-modal-open');
    }

    return () => {
      document.body.classList.remove('payment-modal-open');
    };
  }, [show]);

  const devuelta = Math.max(0, entregado - safeTotal);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Carrito vacío',
        text: 'No hay productos para procesar la venta',
        confirmButtonColor: '#f39c12'
      });
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

        // Verificar si debe imprimir automáticamente
        if (impresion === 'Tirilla' || impresion === 'Carta') {
          try {
            // Preparar datos del ticket
            const ticketData = {
              tipo: 'venta',
              numero: result.numero_factura,
              fecha: result.fecha,
              cliente: client,
              vendedor: seller,
              items: cart,
              subtotal: subtotal,
              impuestos: impuestos,
              descuentos: descuentos,
              total: safeTotal,
              metodoPago: metodoPago,
              dineroEntregado: entregado,
              devuelta: devuelta,
              formatoImpresion: impresion // 'Tirilla' o 'Carta'
            };

            // Imprimir automáticamente
            imprimirTicket(ticketData);
          } catch (printError) {
            console.error('Error al intentar imprimir:', printError);
            // No detenemos el flujo, mostramos el mensaje de éxito igual
          }
        }

        // Limpiar y cerrar
        clearCart();
        onClose();
      } else {
        console.error('❌ Error al crear venta:', result);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al procesar la venta. Intente nuevamente.',
          confirmButtonColor: '#d33'
        });
      }
    } catch (error) {
      console.error('❌ Error al procesar venta:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error inesperado al procesar la venta.',
        confirmButtonColor: '#d33'
      });
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

  // Función para imprimir el ticket
  const imprimirTicket = (ticketData) => {
    const { formatoImpresion } = ticketData;
    const anchoPapel = formatoImpresion === 'Tirilla' ? '80mm' : '210mm'; // Tirilla = 80mm, Carta = A4

    // Crear el HTML del ticket
    const ticketHTML = generarHTMLTicket(ticketData, anchoPapel);

    // Crear un iframe oculto para imprimir
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(ticketHTML);
    frameDoc.close();

    // Esperar a que cargue y luego imprimir
    setTimeout(() => {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();

      // Eliminar el iframe después de imprimir
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 500);
    }, 500);
  };

  // Función para generar el HTML del ticket
  const generarHTMLTicket = (data, anchoPapel) => {
    const formatCurrency = (amount) => `$${parseFloat(amount || 0).toLocaleString('es-CO')}`;

    // Usar configuración o valores por defecto
    const nombreNegocio = configImpresion?.nombre_negocio || 'MI NEGOCIO';
    const nitNegocio = configImpresion?.nit_negocio || '';
    const direccionNegocio = configImpresion?.direccion_negocio || '';
    const telefonoNegocio = configImpresion?.telefono_negocio || '';
    const encabezado = configImpresion?.encabezado_ticket || '';
    const piePagina = configImpresion?.pie_pagina_ticket || '';
    const mensajeGracias = configImpresion?.mensaje_agradecimiento || '¡Gracias por su compra!';
    const mostrarLogo = configImpresion?.mostrar_logo !== false;
    const logoUrl = configImpresion?.logo ? `http://localhost:8000${configImpresion.logo}` : null;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ticket - ${data.numero}</title>
        <style>
          @page {
            size: ${anchoPapel} auto;
            margin: 0;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 10px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            background: white;
            color: black;
          }
          
          .ticket-container {
            width: ${anchoPapel};
            max-width: ${anchoPapel};
            margin: 0 auto;
            padding: 5mm;
            background: white;
            color: black;
          }
          
          .ticket-header {
            text-align: center;
            margin-bottom: 10px;
          }
          
          .ticket-logo {
            max-width: 100px;
            max-height: 80px;
            margin-bottom: 5px;
          }

          .ticket-business-name {
            font-size: 16px;
            font-weight: bold;
            margin: 5px 0;
            text-transform: uppercase;
          }
          
          .ticket-business-info {
            font-size: 11px;
            margin-bottom: 5px;
          }

          .ticket-divider {
            text-align: center;
            margin: 8px 0;
            font-size: 10px;
          }
          
          .ticket-info p {
            margin: 3px 0;
            font-size: 11px;
            line-height: 1.4;
          }
          
          .ticket-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin: 10px 0;
          }
          
          .ticket-table th {
            text-align: left;
            border-bottom: 1px dashed #000;
            padding: 3px 2px;
            font-weight: bold;
          }
          
          .ticket-table td {
            padding: 3px 2px;
            vertical-align: top;
          }
          
          .ticket-table th:first-child,
          .ticket-table td:first-child {
            width: 30px;
            text-align: center;
          }
          
          .ticket-table th:last-child,
          .ticket-table td:last-child {
            width: 60px;
            text-align: right;
          }
          
          .ticket-totals {
            margin: 10px 0;
            font-size: 11px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }
          
          .total-final {
            font-size: 13px;
            margin-top: 5px;
            padding-top: 5px;
            border-top: 1px dashed #000;
            font-weight: bold;
          }
          
          .ticket-payment {
            margin: 10px 0;
            font-size: 11px;
          }
          
          .ticket-footer {
            text-align: center;
            margin-top: 10px;
            font-size: 11px;
          }
          
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket-container">
          <div class="ticket-header">
            ${mostrarLogo && logoUrl ? `<img src="${logoUrl}" class="ticket-logo" />` : ''}
            <div class="ticket-business-name">${nombreNegocio}</div>
            ${nitNegocio ? `<div class="ticket-business-info">NIT: ${nitNegocio}</div>` : ''}
            ${direccionNegocio ? `<div class="ticket-business-info">${direccionNegocio}</div>` : ''}
            ${telefonoNegocio ? `<div class="ticket-business-info">Tel: ${telefonoNegocio}</div>` : ''}
            ${encabezado ? `<div class="ticket-business-info" style="margin-top:5px; font-style:italic;">${encabezado}</div>` : ''}
          </div>
          
          <div class="ticket-divider">================================</div>
          
          <div class="ticket-info">
            <p><strong>FACTURA:</strong> ${data.numero}</p>
            <p><strong>Fecha:</strong> ${new Date(data.fecha).toLocaleString('es-CO')}</p>
            <p><strong>Cliente:</strong> ${data.cliente}</p>
            <p><strong>Vendedor:</strong> ${data.vendedor}</p>
          </div>
          
          <div class="ticket-divider">================================</div>
          
          <table class="ticket-table">
            <thead>
              <tr>
                <th>Cant</th>
                <th>Producto</th>
                <th>P.Unit</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td>${item.qty}</td>
                  <td>${item.name}</td>
                  <td>${formatCurrency(item.price)}</td>
                  <td>${formatCurrency(item.qty * item.price)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="ticket-divider">================================</div>
          
          <div class="ticket-totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(data.subtotal)}</span>
            </div>
            ${data.impuestos > 0 ? `
              <div class="total-row">
                <span>Impuestos:</span>
                <span>${formatCurrency(data.impuestos)}</span>
              </div>
            ` : ''}
            ${data.descuentos > 0 ? `
              <div class="total-row">
                <span>Descuentos:</span>
                <span>${formatCurrency(data.descuentos)}</span>
              </div>
            ` : ''}
            <div class="total-row total-final">
              <span><strong>TOTAL:</strong></span>
              <span><strong>${formatCurrency(data.total)}</strong></span>
            </div>
          </div>
          
          <div class="ticket-divider">================================</div>
          
          <div class="ticket-payment">
            <p><strong>Método de Pago:</strong> ${data.metodoPago}</p>
            ${data.dineroEntregado > 0 ? `
              <p><strong>Efectivo Recibido:</strong> ${formatCurrency(data.dineroEntregado)}</p>
              <p><strong>Cambio:</strong> ${formatCurrency(data.devuelta)}</p>
            ` : ''}
          </div>
          
          <div class="ticket-divider">================================</div>
          
          <div class="ticket-footer">
            <p><strong>${mensajeGracias}</strong></p>
            ${piePagina ? `<p style="margin-top:5px; font-size:10px;">${piePagina}</p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
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
                  {bancos.length === 0 ? (
                    <option>Caja General</option>
                  ) : (
                    bancos.map(b => (
                      <option key={b.id} value={b.nombre}>{b.nombre}</option>
                    ))
                  )}
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