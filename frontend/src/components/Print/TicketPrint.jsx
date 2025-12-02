import React, { useEffect, useState } from 'react';
import { configuracionImpresionService } from '../../services/api';
import './TicketPrint.css';

export default function TicketPrint({
    tipo = 'venta', // 'venta' o 'pedido'
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
    // Campos adicionales para pedidos
    direccionEntrega,
    telefonoContacto,
    fechaEntrega,
    tipoPedido,
    transportadora,
    nota
}) {
    const [config, setConfig] = useState(null);

    useEffect(() => {
        cargarConfiguracion();
    }, []);

    const cargarConfiguracion = async () => {
        const data = await configuracionImpresionService.getActiva();
        setConfig(data);
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

    if (!config) {
        return <div>Cargando configuración...</div>;
    }

    return (
        <div className="ticket-container">
            <div className="ticket-content">
                {/* ENCABEZADO */}
                <div className="ticket-header">
                    {config.mostrar_logo && config.logo && (
                        <img
                            src={`http://localhost:8000${config.logo}`}
                            alt="Logo"
                            className="ticket-logo"
                        />
                    )}
                    <h2 className="ticket-business-name">{config.nombre_negocio}</h2>
                    {config.nit_negocio && (
                        <p className="ticket-nit">NIT: {config.nit_negocio}</p>
                    )}
                    {config.direccion_negocio && (
                        <p className="ticket-address">{config.direccion_negocio}</p>
                    )}
                    {config.telefono_negocio && (
                        <p className="ticket-phone">Tel: {config.telefono_negocio}</p>
                    )}
                    {config.email_negocio && (
                        <p className="ticket-email">{config.email_negocio}</p>
                    )}
                    {config.regimen_tributario && (
                        <p className="ticket-regimen">{config.regimen_tributario}</p>
                    )}
                    {config.resolucion_facturacion && (
                        <p className="ticket-resolucion">{config.resolucion_facturacion}</p>
                    )}
                    {config.encabezado_ticket && (
                        <p className="ticket-custom-header">{config.encabezado_ticket}</p>
                    )}
                </div>

                <div className="ticket-divider">================================</div>

                {/* INFORMACIÓN DEL DOCUMENTO */}
                <div className="ticket-info">
                    <p><strong>{tipo === 'venta' ? 'FACTURA' : 'PEDIDO'}:</strong> {numero}</p>
                    <p><strong>Fecha:</strong> {formatFecha(fecha)}</p>
                    <p><strong>Cliente:</strong> {cliente}</p>
                    <p><strong>Vendedor:</strong> {vendedor}</p>

                    {tipo === 'pedido' && (
                        <>
                            {direccionEntrega && <p><strong>Dirección:</strong> {direccionEntrega}</p>}
                            {telefonoContacto && <p><strong>Teléfono:</strong> {telefonoContacto}</p>}
                            {fechaEntrega && <p><strong>Fecha Entrega:</strong> {fechaEntrega}</p>}
                            {tipoPedido && <p><strong>Tipo:</strong> {tipoPedido}</p>}
                            {transportadora && <p><strong>Transportadora:</strong> {transportadora}</p>}
                        </>
                    )}
                </div>

                <div className="ticket-divider">================================</div>

                {/* PRODUCTOS */}
                <div className="ticket-items">
                    <table className="ticket-table">
                        <thead>
                            <tr>
                                <th>Cant</th>
                                <th>Producto</th>
                                <th>P.Unit</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.cantidad || item.qty}</td>
                                    <td className="item-name">{item.producto_nombre || item.name}</td>
                                    <td>{formatCurrency(item.precio_unitario || item.price)}</td>
                                    <td>{formatCurrency((item.cantidad || item.qty) * (item.precio_unitario || item.price))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="ticket-divider">================================</div>

                {/* TOTALES */}
                <div className="ticket-totals">
                    <div className="total-row">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {impuestos > 0 && (
                        <div className="total-row">
                            <span>Impuestos:</span>
                            <span>{formatCurrency(impuestos)}</span>
                        </div>
                    )}
                    {descuentos > 0 && (
                        <div className="total-row">
                            <span>Descuentos:</span>
                            <span>{formatCurrency(descuentos)}</span>
                        </div>
                    )}
                    <div className="total-row total-final">
                        <span><strong>TOTAL:</strong></span>
                        <span><strong>{formatCurrency(total)}</strong></span>
                    </div>
                </div>

                {/* INFORMACIÓN DE PAGO (solo para ventas) */}
                {tipo === 'venta' && metodoPago && (
                    <>
                        <div className="ticket-divider">================================</div>
                        <div className="ticket-payment">
                            <p><strong>Método de Pago:</strong> {metodoPago}</p>
                            {dineroEntregado > 0 && (
                                <>
                                    <p><strong>Efectivo Recibido:</strong> {formatCurrency(dineroEntregado)}</p>
                                    <p><strong>Cambio:</strong> {formatCurrency(devuelta)}</p>
                                </>
                            )}
                        </div>
                    </>
                )}

                {/* NOTA (para pedidos) */}
                {tipo === 'pedido' && nota && (
                    <>
                        <div className="ticket-divider">================================</div>
                        <div className="ticket-note">
                            <p><strong>Nota:</strong></p>
                            <p>{nota}</p>
                        </div>
                    </>
                )}

                <div className="ticket-divider">================================</div>

                {/* PIE DE PÁGINA */}
                <div className="ticket-footer">
                    {config.mensaje_agradecimiento && (
                        <p className="ticket-thanks">{config.mensaje_agradecimiento}</p>
                    )}
                    {config.pie_pagina_ticket && (
                        <p className="ticket-custom-footer">{config.pie_pagina_ticket}</p>
                    )}

                    {config.mostrar_codigo_barras && numero && (
                        <div className="ticket-barcode">
                            <p>*{numero}*</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
