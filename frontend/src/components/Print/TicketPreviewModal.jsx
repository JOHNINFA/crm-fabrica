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
            nota
        } = ticketData;

        const fuenteTicket = config.fuente_ticket || 'Courier New';
        const anchoPapel = config.ancho_papel || '80mm';
        const nombreNegocio = config.nombre_negocio || 'MI NEGOCIO';
        const nitNegocio = config.nit_negocio || '';
        const direccionNegocio = config.direccion_negocio || '';
        const telefonoNegocio = config.telefono_negocio || '';
        const mensajeGracias = config.mensaje_agradecimiento || '¡Gracias por su compra!';
        const mostrarLogo = config.mostrar_logo !== false;
        const logoSrc = config.logo_base64 || null;

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
                        padding: 10px;
                        font-family: '${fuenteTicket}', monospace;
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
                        ${mostrarLogo && logoSrc ? `<img src="${logoSrc}" class="ticket-logo" />` : ''}
                        <div class="ticket-business-name">${nombreNegocio}</div>
                        ${nitNegocio ? `<div class="ticket-business-info">NIT: ${nitNegocio}</div>` : ''}
                        ${direccionNegocio ? `<div class="ticket-business-info">${direccionNegocio}</div>` : ''}
                        ${telefonoNegocio ? `<div class="ticket-business-info">Tel: ${telefonoNegocio}</div>` : ''}
                    </div>
                    
                    <div class="ticket-divider">================================</div>
                    
                    <div class="ticket-info">
                        <p><strong>${tipo === 'venta' ? 'FACTURA' : 'PEDIDO'}:</strong> ${numero}</p>
                        <p><strong>Fecha:</strong> ${formatFecha(fecha)}</p>
                        <p><strong>Cliente:</strong> ${cliente}</p>
                        <p><strong>Vendedor:</strong> ${vendedor}</p>
                        ${tipo === 'pedido' && direccionEntrega ? `<p><strong>Dirección:</strong> ${direccionEntrega}</p>` : ''}
                        ${tipo === 'pedido' && fechaEntrega ? `<p><strong>Fecha Entrega:</strong> ${fechaEntrega}</p>` : ''}
                        ${tipo === 'pedido' && tipoPedido ? `<p><strong>Tipo:</strong> ${tipoPedido}</p>` : ''}
                        ${tipo === 'pedido' && transportadora ? `<p><strong>Transportadora:</strong> ${transportadora}</p>` : ''}
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
                    
                    <div class="ticket-divider">================================</div>
                    
                    <div class="ticket-totals">
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
                        <div class="total-row total-final">
                            <span><strong>TOTAL:</strong></span>
                            <span><strong>${formatCurrency(total)}</strong></span>
                        </div>
                    </div>
                    
                    ${tipo === 'venta' && metodoPago ? `
                        <div class="ticket-divider">================================</div>
                        <div class="ticket-payment">
                            <p><strong>Método de Pago:</strong> ${metodoPago}</p>
                            ${dineroEntregado > 0 ? `
                                <p><strong>Efectivo Recibido:</strong> ${formatCurrency(dineroEntregado)}</p>
                                <p><strong>Cambio:</strong> ${formatCurrency(devuelta)}</p>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    ${tipo === 'pedido' && nota ? `
                        <div class="ticket-divider">================================</div>
                        <div class="ticket-payment">
                            <p><strong>Nota:</strong></p>
                            <p>${nota}</p>
                        </div>
                    ` : ''}
                    
                    <div class="ticket-divider">================================</div>
                    
                    <div class="ticket-footer">
                        <p><strong>${mensajeGracias}</strong></p>
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

