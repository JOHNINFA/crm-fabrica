import React, { useEffect, useState } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import TicketPrint from './TicketPrint';
import { configuracionImpresionService } from '../../services/api';
import './TicketPreviewModal.css';

export default function TicketPreviewModal({
    show,
    onClose,
    ticketData,
    autoPrint = false
}) {
    const [isReady, setIsReady] = useState(false);
    const [config, setConfig] = useState(null);

    // Cargar configuración cuando se muestra el modal
    useEffect(() => {
        if (show) {
            setIsReady(false);
            cargarConfiguracion();
        }
    }, [show]);

    const cargarConfiguracion = async () => {
        try {
            const data = await configuracionImpresionService.getActiva();
            setConfig(data);
            setTimeout(() => {
                setIsReady(true);
            }, 1000);
        } catch (error) {
            console.error('Error cargando configuración:', error);
            setIsReady(true);
        }
    };

    // Auto-print cuando esté listo (sin mostrar modal)
    useEffect(() => {
        if (show && autoPrint && isReady && config) {
            handlePrintDirect();
        }
    }, [show, autoPrint, isReady, config]);

    // Imprimir directamente sin usar el DOM del modal
    const handlePrintDirect = () => {
        if (!config || !ticketData) return;

        const ticketHTML = generarHTMLTicket();

        // Crear un iframe oculto para imprimir
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';
        printFrame.style.left = '-9999px';
        document.body.appendChild(printFrame);

        const frameDoc = printFrame.contentWindow.document;
        frameDoc.open();
        frameDoc.write(ticketHTML);
        frameDoc.close();

        // Esperar a que cargue y luego imprimir
        setTimeout(() => {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();

            setTimeout(() => {
                if (document.body.contains(printFrame)) {
                    document.body.removeChild(printFrame);
                }
                // Cerrar después de imprimir
                if (onClose) {
                    onClose();
                }
            }, 1000);
        }, 500);
    };

    const formatCurrency = (amount) => {
        return `$${parseFloat(amount || 0).toLocaleString('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })}`;
    };

    const formatFecha = (fechaStr) => {
        if (!fechaStr) return '';
        const fecha = new Date(fechaStr);
        return fecha.toLocaleString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Generar HTML del ticket (igual que PaymentModal.jsx)
    const generarHTMLTicket = () => {
        if (!config || !ticketData) return '';

        const {
            tipo = 'pedido',
            numero,
            fecha,
            cliente,
            vendedor,
            items = [],
            subtotal = 0,
            impuestos = 0,
            descuentos = 0,
            total = 0,
            metodoPago,
            dineroEntregado,
            devuelta,
            direccionEntrega,
            fechaEntrega,
            tipoPedido,
            transportadora,
            generadoPor, // 🆕 Usuario que generó el pedido
            nota,
            clienteTelefono, // 🆕 Teléfono del cliente
            clienteZona // 🆕 Zona/Barrio del cliente
        } = ticketData;

        const fuenteTicket = config.fuente_ticket || 'Courier New, Courier, monospace';
        const anchoPapel = config.ancho_papel || '80mm';
        const nombreNegocio = config.nombre_negocio || 'MI NEGOCIO';
        const nitNegocio = config.nit_negocio || '';
        const direccionNegocio = config.direccion_negocio || '';
        const ciudadNegocio = config.ciudad_negocio || '';
        const paisNegocio = config.pais_negocio || '';
        const telefonoNegocio = config.telefono_negocio || '';
        const mensajeGracias = config.mensaje_agradecimiento || '¡Gracias por su compra!';
        const mostrarLogo = config.mostrar_logo !== false;
        const logoSrc = config.logo_base64 || null;

        // 🆕 Tamaños y espaciados configurables (aumentados para Epson TM-T20II)
        const tamanioGeneral = config.tamanio_fuente_general || 14;
        const tamanioNombreNegocio = config.tamanio_fuente_nombre_negocio || 18;
        const tamanioInfo = config.tamanio_fuente_info || 13;
        const tamanioTabla = config.tamanio_fuente_tabla || 13;
        const tamanioTotales = config.tamanio_fuente_totales || 14;
        const letraSpaciado = config.letter_spacing || -0.2;
        const letraSpaciadoDivider = config.letter_spacing_divider || -0.8;
        const fontWeightTabla = config.font_weight_tabla || 'normal';

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Ticket - ${numero}</title>
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
                        -webkit-filter: contrast(1.8);
                        filter: contrast(1.8);
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
                    
                    .ticket-logo {
                        max-width: 135px;
                        max-height: 115px;
                        margin-bottom: 8px;
                        filter: grayscale(100%);
                        -webkit-filter: grayscale(100%);
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
                        font-size: ${tamanioTabla}px;
                        color: #000;
                    }
                    
                    .ticket-table td {
                        padding: 5px 2px;
                        vertical-align: top;
                        font-weight: normal;
                        font-size: ${tamanioTabla}px;
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
                        <p><strong>${tipo === 'venta' ? 'FACTURA' : 'CUENTA DE COBRO'}: ${numero}</strong></p>
                        <p><strong>Fecha: ${formatFecha(fecha)}</strong></p>
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
                            ${items.map(item => `
                                <tr>
                                    <td>${item.cantidad || item.qty}</td>
                                    <td>${item.producto_nombre || item.name}</td>
                                    <td>${formatCurrency(item.precio_unitario || item.price)}</td>
                                    <td>${formatCurrency((item.cantidad || item.qty) * (item.precio_unitario || item.price))}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div class="ticket-divider">................................................</div>
                    
                    <div class="ticket-totals">
                        <div class="total-row">
                            <span>Art</span>
                            <span>${items.length}</span>
                        </div>
                        <div class="total-row">
                            <span>Cant.Art</span>
                            <span>${items.reduce((sum, item) => sum + (item.cantidad || item.qty), 0)}</span>
                        </div>
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>${formatCurrency(subtotal)}</span>
                        </div>
                        ${impuestos > 0 ? `
                            <div class="total-row">
                                <span>Impuestos:</span>
                                <span>${formatCurrency(impuestos)}</span>
                            </div>
                        ` : ''}
                        ${descuentos > 0 ? `
                            <div class="total-row">
                                <span>Descuentos:</span>
                                <span>${formatCurrency(descuentos)}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="ticket-divider">................................................</div>
                    
                    <div class="total-row total-final" style="font-size: ${tamanioTotales + 2}px; margin: 8px 0;">
                        <span><strong>TOTAL:</strong></span>
                        <span><strong>${formatCurrency(total)}</strong></span>
                    </div>
                    
                    ${tipo === 'venta' && metodoPago ? `
                        <div class="ticket-divider">................................................</div>
                        <div class="ticket-payment">
                            <p><strong>Método de Pago:</strong> ${metodoPago}</p>
                            ${dineroEntregado > 0 ? `
                                <p><strong>Efectivo Recibido:</strong> ${formatCurrency(dineroEntregado)}</p>
                                <p><strong>Cambio:</strong> ${formatCurrency(devuelta)}</p>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="ticket-divider">................................................</div>
                    
                    <div class="ticket-info">
                        <p>Cliente:<span><strong>${cliente}</strong></span></p>
                        ${clienteTelefono ? `<p>Teléfono:<span><strong>${clienteTelefono}</strong></span></p>` : ''}
                        <p>Vendedor:<span><strong>${vendedor}</strong></span></p>
                        ${tipo === 'pedido' && direccionEntrega ? `<p>Dirección:<span><strong>${direccionEntrega}</strong></span></p>` : ''}
                        ${tipo === 'pedido' && clienteZona ? `<p>Barrio/Zona:<span><strong>${clienteZona}</strong></span></p>` : ''}
                        ${tipo === 'pedido' && fechaEntrega ? `<p>Fecha Entrega:<span><strong>${fechaEntrega}</strong></span></p>` : ''}
                        ${tipo === 'pedido' && generadoPor ? `<p>Atendido por:<span><strong>${generadoPor}</strong></span></p>` : ''}
                    </div>
                    
                    ${tipo === 'pedido' && nota ? `
                        <div class="ticket-divider">........................................</div>
                        <div class="ticket-payment">
                            <p><strong>Nota:</strong></p>
                            <p>${nota}</p>
                        </div>
                    ` : ''}
                    
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

    const handlePrint = () => {
        if (!config) {
            console.error('Configuración no cargada');
            return;
        }

        const ticketHTML = generarHTMLTicket();

        // Crear un iframe oculto para imprimir
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';
        printFrame.style.left = '-9999px';
        document.body.appendChild(printFrame);

        const frameDoc = printFrame.contentWindow.document;
        frameDoc.open();
        frameDoc.write(ticketHTML);
        frameDoc.close();

        // Esperar a que cargue y luego imprimir
        setTimeout(() => {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();

            setTimeout(() => {
                if (document.body.contains(printFrame)) {
                    document.body.removeChild(printFrame);
                }
            }, 1000);
        }, 500);

        if (autoPrint && onClose) {
            setTimeout(() => {
                onClose();
            }, 1500);
        }
    };

    if (!ticketData) {
        return null;
    }

    // Si autoPrint está activo, no mostrar el modal, solo imprimir
    if (autoPrint) {
        return null;
    }

    return (
        <Modal
            show={show}
            onHide={onClose}
            size="lg"
            centered
            className="ticket-preview-modal"
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-printer me-2"></i>
                    Vista Previa del Ticket
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div className="preview-container" id="ticket-to-print">
                    <TicketPrint {...ticketData} />
                </div>
                {!isReady && (
                    <div className="text-center mt-3">
                        <Spinner animation="border" size="sm" className="me-2" />
                        <small>Preparando impresión...</small>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer className="no-print">
                <Button variant="secondary" onClick={onClose}>
                    <i className="bi bi-x-circle me-2"></i>
                    Cerrar
                </Button>
                <Button
                    variant="primary"
                    onClick={handlePrint}
                    disabled={!isReady}
                >
                    <i className="bi bi-printer me-2"></i>
                    {isReady ? 'Imprimir' : 'Preparando...'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

