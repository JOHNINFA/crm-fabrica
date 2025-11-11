import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import TicketPrint from './TicketPrint';
import './TicketPreviewModal.css';

export default function TicketPreviewModal({
    show,
    onClose,
    ticketData
}) {
    const handlePrint = () => {
        // Obtener el contenido del ticket
        const ticketContent = document.querySelector('.ticket-container');

        if (!ticketContent) {
            console.error('No se encontró el contenido del ticket');
            return;
        }

        // Crear un iframe oculto para imprimir
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';

        document.body.appendChild(printFrame);

        // Obtener el documento del iframe
        const frameDoc = printFrame.contentWindow.document;

        // Escribir el contenido en el iframe
        frameDoc.open();
        frameDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Ticket de Venta</title>
                <style>
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }
                    
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        background: white;
                    }
                    
                    .ticket-container {
                        width: 80mm;
                        max-width: 80mm;
                        margin: 0;
                        padding: 5mm;
                        background: white;
                    }
                    
                    ${document.querySelector('style[data-ticket-styles]')?.textContent || ''}
                </style>
            </head>
            <body>
                ${ticketContent.outerHTML}
            </body>
            </html>
        `);
        frameDoc.close();

        // Esperar a que se cargue el contenido y luego imprimir
        setTimeout(() => {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();

            // Eliminar el iframe después de imprimir
            setTimeout(() => {
                document.body.removeChild(printFrame);
            }, 100);
        }, 250);
    };

    if (!ticketData) {
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
                <div className="preview-container">
                    <TicketPrint {...ticketData} />
                </div>
            </Modal.Body>

            <Modal.Footer className="no-print">
                <Button variant="secondary" onClick={onClose}>
                    <i className="bi bi-x-circle me-2"></i>
                    Cerrar
                </Button>
                <Button variant="primary" onClick={handlePrint}>
                    <i className="bi bi-printer me-2"></i>
                    Imprimir
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
