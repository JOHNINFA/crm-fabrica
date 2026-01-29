import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { ventaService, configuracionImpresionService } from '../../services/api';
import { cajonService } from '../../services/cajonService'; // 🆕
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
  const [impresion, setImpresion] = useState(() => {
    // Cargar preferencia guardada o usar "Ninguna" por defecto
    return localStorage.getItem('preferencia_impresion_pos') || "Ninguna";
  });
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

  // Cambiar banco según método de pago
  useEffect(() => {
    if (metodoPago === 'Transf' || metodoPago === 'T_Credito' || metodoPago === 'Tarjeta') {
      setBanco('NEQUI');
    } else {
      // Restaurar a Caja General o el primer banco disponible
      if (bancos.length > 0) {
        setBanco(bancos[0].nombre);
      } else {
        setBanco('Caja General');
      }
    }
  }, [metodoPago, bancos]);

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



      // Crear la venta
      const result = await ventaService.create(ventaData);

      if (result && !result.error) {


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

            // Imprimir ticket
            await imprimirTicket(ticketData);

            // 🆕 SIEMPRE abrir cajón después de imprimir
            try {
              await cajonService.abrirCajon();
              console.log('✅ Cajón abierto (después de impresión)');
            } catch (cajonError) {
              console.error('Error al abrir cajón:', cajonError);
              // No detenemos el flujo
            }
          } catch (printError) {
            console.error('Error al intentar imprimir:', printError);
            // No detenemos el flujo, mostramos el mensaje de éxito igual
          }
        } else {
          // 🆕 Si NO imprime, abrir cajón manualmente
          try {
            await cajonService.abrirCajon();
            console.log('✅ Cajón abierto (sin impresión)');
          } catch (cajonError) {
            console.error('Error al abrir cajón:', cajonError);
            // No detenemos el flujo
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

  // Función para abrir el cajón monedero (imprimiendo un ticket vacío)
  const abrirCajon = () => {
    // Solo intentar abrir cajón si el método de pago es Efectivo
    if (metodoPago !== 'Efectivo') return;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(`
      <html>
        <head>
        <style>
            @page { size: auto; margin: 0mm; } 
            body { margin: 0; padding: 0; }
        </style>
        </head>
        <body>.</body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 500);
    }, 500);
  };

  // Función para imprimir el ticket
  const imprimirTicket = async (ticketData) => {
    const { formatoImpresion } = ticketData;
    const anchoPapel = formatoImpresion === 'Tirilla' ? '80mm' : '210mm'; // Tirilla = 80mm, Carta = A4

    // Crear el HTML del ticket
    const ticketHTML = generarHTMLTicket(ticketData, anchoPapel);

    // Usar método tradicional (con diálogo)
    imprimirTicketTradicional(ticketHTML);
  };

  // Función auxiliar para impresión tradicional (con diálogo)
  const imprimirTicketTradicional = (ticketHTML) => {
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
    const ciudadNegocio = configImpresion?.ciudad_negocio || '';
    const paisNegocio = configImpresion?.pais_negocio || '';
    const telefonoNegocio = configImpresion?.telefono_negocio || '';
    const encabezado = configImpresion?.encabezado_ticket || ''; // Keep this as it's used in the HTML
    const piePagina = configImpresion?.pie_pagina_ticket || '';
    const mensajeGracias = configImpresion?.mensaje_agradecimiento || '¡Gracias por su compra!';
    const mostrarLogo = configImpresion?.mostrar_logo !== false;
    const logoSrc = configImpresion?.logo_base64 || null;
    // Fuente del ticket
    const fuenteTicket = configImpresion?.fuente_ticket || 'Courier New, Courier, monospace';

    // 🆕 Tamaños y espaciados configurables (aumentados para Epson TM-T20II)
    const tamanioGeneral = configImpresion?.tamanio_fuente_general || 14;
    const tamanioNombreNegocio = configImpresion?.tamanio_fuente_nombre_negocio || 18;
    const tamanioInfo = configImpresion?.tamanio_fuente_info || 13;
    const tamanioTabla = configImpresion?.tamanio_fuente_tabla || 13;
    const tamanioTotales = configImpresion?.tamanio_fuente_totales || 14;
    const letraSpaciado = configImpresion?.letter_spacing || -0.2;
    const letraSpaciadoDivider = configImpresion?.letter_spacing_divider || -0.8;
    const fontWeightTabla = configImpresion?.font_weight_tabla || 'normal';

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
            padding: 5px;
            font-family: ${fuenteTicket}, monospace;
            font-size: ${tamanioGeneral}px;
            font-weight: bold;
            background: white;
            color: #000;
            letter-spacing: ${letraSpaciado}px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .ticket-logo {
            max-width: 150px;
            max-height: 130px;
            margin-bottom: 8px;
            filter: grayscale(100%) contrast(1);
            -webkit-filter: grayscale(100%) contrast(1);
          }
          
          .ticket-business-name,
          .ticket-business-info,
          .ticket-divider,
          .ticket-info,
          .ticket-totals,
          .ticket-payment,
          .ticket-footer,
          .total-row {
            -webkit-filter: contrast(3);
            filter: contrast(3);
            text-shadow: 0 0 0.3px #000, 0 0 0.3px #000;
            -webkit-text-stroke: 0.3px #000;
            font-size: ${tamanioGeneral + 2}px;
          }
          
          strong {
            font-weight: bold;
          }
          
          .ticket-container {
            width: ${anchoPapel};
            max-width: ${anchoPapel};
            margin: 0 auto;
            padding: 2mm;
            background: white;
            color: black;
          }
          
          .ticket-header {
            text-align: center;
            margin-bottom: 15px;
          }
          


          .ticket-business-name {
            font-size: ${tamanioNombreNegocio}px;
            font-weight: bold;
            margin: 8px 0;
            text-transform: uppercase;
            text-align: center;
          }
          
          .ticket-business-info {
            font-size: 12px;
            margin-bottom: 5px;
            font-weight: 900;
            color: #000;
            text-align: center;
          }

          .ticket-divider {
            text-align: center;
            margin: 8px 0;
            font-size: 10px;
            font-weight: normal;
            letter-spacing: ${letraSpaciadoDivider}px;
            line-height: 1;
          }
          
          .ticket-info p {
            margin: 5px 0;
            font-size: ${tamanioInfo}px;
            line-height: 1.6;
            font-weight: normal;
            text-align: left;
            display: flex;
            justify-content: space-between;
          }
          
          .ticket-info p strong {
            flex: 0 0 auto;
            margin-right: 10px;
            font-weight: bold;
          }
          
          .ticket-info p span {
            flex: 1;
            text-align: right;
          }
          
          .ticket-info-center {
            text-align: center;
            font-weight: bold;
            font-size: ${tamanioInfo + 1}px;
            margin: 8px 0;
          }
          
          .ticket-table {
            width: 100%;
            border-collapse: collapse;
            font-size: ${tamanioTabla}px;
            margin: 12px 0;
            font-weight: ${fontWeightTabla};
          }
          
          .ticket-table th {
            text-align: left;
            border-bottom: none;
            padding: 4px 2px 2px 2px;
            font-weight: 900;
            font-size: ${tamanioTabla + 2}px;
            color: #000;
            text-shadow: 0 0 0.3px #000, 0 0 0.3px #000;
            -webkit-text-stroke: 0.3px #000;
          }
          
          .ticket-table td {
            padding: 5px 2px;
            vertical-align: top;
            font-weight: bold;
            font-size: ${tamanioTabla + 1}px;
            line-height: 1.4;
          }
          
          .ticket-table th:first-child,
          .ticket-table td:first-child {
            width: 25px;
            text-align: left;
            padding-left: 0;
          }
          
          .ticket-table th:nth-child(2) {
            text-align: center;
          }
          .ticket-table td:nth-child(2) {
            text-align: left;
            padding-right: 8px;
          }
          
          .ticket-table th:nth-child(3),
          .ticket-table td:nth-child(3) {
            width: 55px;
            text-align: right;
          }
          
          .ticket-table th:last-child,
          .ticket-table td:last-child {
            width: 50px;
            text-align: right;
            padding-right: 0;
          }
          
          .ticket-totals {
            margin: 12px 0;
            font-size: ${tamanioTotales}px;
            font-weight: bold;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }
          
          .total-final {
            font-size: ${tamanioTotales + 1}px;
            margin-top: 5px;
            padding-top: 5px;
            border-top: 1px dashed #000;
            font-weight: bold;
          }
          
          .ticket-payment {
            margin: 8px 0;
            font-size: ${tamanioTotales}px;
            font-weight: bold;
          }
          
          .ticket-footer {
            text-align: center;
            margin-top: 8px;
            font-size: ${tamanioTotales}px;
            font-weight: bold;
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
            ${mostrarLogo && logoSrc ? `<img src="${logoSrc}" class="ticket-logo" />` : ''}
            <div class="ticket-business-name">${nombreNegocio}</div>
            ${nitNegocio ? `<div class="ticket-business-info">NIT: ${nitNegocio}</div>` : ''}
            ${telefonoNegocio ? `<div class="ticket-business-info">Tel: ${telefonoNegocio}</div>` : ''}
            ${paisNegocio || ciudadNegocio ? `<div class="ticket-business-info">${paisNegocio}${paisNegocio && ciudadNegocio ? '- ' : ''}${ciudadNegocio}</div>` : ''}
            ${direccionNegocio ? `<div class="ticket-business-info">${direccionNegocio}</div>` : ''}
          </div>
          
          <div class="ticket-divider">................................................</div>
          
          <div class="ticket-info">
            <p><strong>FACTURA: ${data.numero}</strong></p>
            <p><strong>Fecha: ${new Date(data.fecha).toLocaleString('es-CO')}</strong></p>
          </div>
          
          <div class="ticket-divider">................................................</div>
          
          <table class="ticket-table">
            <thead>
              <tr>
                <th>Cant</th>
                <th>Producto</th>
                <th>P.Unit</th>
                <th>Total</th>
              </tr>
              <tr>
                <td colspan="4" style="padding: 0; font-size: 10px; font-weight: normal; text-align: center; letter-spacing: -0.8px; line-height: 1; overflow: hidden;">................................................</td>
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
          
          <div class="ticket-divider">................................................</div>
          
          <div class="ticket-totals">
            <div class="total-row">
              <span>Art</span>
              <span>${data.items.length}</span>
            </div>
            <div class="total-row">
              <span>Cant.Art</span>
              <span>${data.items.reduce((sum, item) => sum + item.qty, 0)}</span>
            </div>
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
          </div>
          
          <div class="ticket-divider">................................................</div>
          
          <div class="total-row total-final" style="font-size: ${tamanioTotales + 2}px; margin: 8px 0;">
            <span><strong>TOTAL:</strong></span>
            <span><strong>${formatCurrency(data.total)}</strong></span>
          </div>
          
          ${data.metodoPago ? `
            <div class="ticket-divider">................................................</div>
            <div class="ticket-payment">
              <p><strong>Método de Pago:</strong> ${data.metodoPago}</p>
              ${data.dineroEntregado > 0 ? `
                <p><strong>Efectivo Recibido:</strong> ${formatCurrency(data.dineroEntregado)}</p>
                <p><strong>Cambio:</strong> ${formatCurrency(data.devuelta)}</p>
              ` : ''}
            </div>
          ` : ''}
          
          <div class="ticket-divider">................................................</div>
          
          <div class="ticket-info">
            <p>Cliente:<span><strong>${data.cliente}</strong></span></p>
            <p>Atendido por:<span><strong>${data.vendedor}</strong></span></p>
          </div>
          
          <div class="ticket-divider">........................................</div>
          
          <div class="ticket-footer">
            <p><strong>${mensajeGracias}</strong></p>
            <p style="font-size: 7px; margin-top: 8px; color: #666;">Elaborado por Software Guerrero</p>
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
            })()}</strong> | Atendido por: <strong>{seller}</strong>
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
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.target.select()}
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
                <label className="form-label compact-label">
                  {metodoPago === 'Transf' || metodoPago === 'T_Credito' || metodoPago === 'Tarjeta' ? 'Tipo de Pago' : 'Bancos'}
                </label>
                <select
                  className="form-select compact-select"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                >
                  {(metodoPago === 'Transf' || metodoPago === 'T_Credito' || metodoPago === 'Tarjeta') ? (
                    <>
                      <option value="NEQUI">NEQUI</option>
                      <option value="DAVIPLATA">DAVIPLATA</option>
                      <option value="TARJETA">TARJETA</option>
                      <option value="OTROS">OTROS</option>
                    </>
                  ) : bancos.length === 0 ? (
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
                  onChange={(e) => {
                    const nuevoValor = e.target.value;
                    setImpresion(nuevoValor);
                    // Guardar preferencia en localStorage
                    localStorage.setItem('preferencia_impresion_pos', nuevoValor);
                  }}
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