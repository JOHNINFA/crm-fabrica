import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { configuracionImpresionService } from '../services/api';
import './ConfiguracionImpresionScreen.css';

export default function ConfiguracionImpresionScreen() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [configId, setConfigId] = useState(null);

    // Estados del formulario
    const [nombreNegocio, setNombreNegocio] = useState('MI NEGOCIO');
    const [nitNegocio, setNitNegocio] = useState('');
    const [direccionNegocio, setDireccionNegocio] = useState('');
    const [telefonoNegocio, setTelefonoNegocio] = useState('');
    const [emailNegocio, setEmailNegocio] = useState('');
    const [encabezadoTicket, setEncabezadoTicket] = useState('');
    const [piePaginaTicket, setPiePaginaTicket] = useState('');
    const [mensajeAgradecimiento, setMensajeAgradecimiento] = useState('¡Gracias por su compra!');
    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [anchoPapel, setAnchoPapel] = useState('80mm');
    const [mostrarLogo, setMostrarLogo] = useState(true);
    const [mostrarCodigoBarras, setMostrarCodigoBarras] = useState(false);
    const [impresoraPredeterminada, setImpresoraPredeterminada] = useState('');
    const [resolucionFacturacion, setResolucionFacturacion] = useState('');
    const [regimenTributario, setRegimenTributario] = useState('');

    useEffect(() => {
        cargarConfiguracion();
    }, []);

    const cargarConfiguracion = async () => {
        try {
            setLoading(true);
            const data = await configuracionImpresionService.getActiva();

            if (data && data.id) {
                setConfigId(data.id);
                setNombreNegocio(data.nombre_negocio || 'MI NEGOCIO');
                setNitNegocio(data.nit_negocio || '');
                setDireccionNegocio(data.direccion_negocio || '');
                setTelefonoNegocio(data.telefono_negocio || '');
                setEmailNegocio(data.email_negocio || '');
                setEncabezadoTicket(data.encabezado_ticket || '');
                setPiePaginaTicket(data.pie_pagina_ticket || '');
                setMensajeAgradecimiento(data.mensaje_agradecimiento || '¡Gracias por su compra!');
                setAnchoPapel(data.ancho_papel || '80mm');
                setMostrarLogo(data.mostrar_logo !== false);
                setMostrarCodigoBarras(data.mostrar_codigo_barras || false);
                setImpresoraPredeterminada(data.impresora_predeterminada || '');
                setResolucionFacturacion(data.resolucion_facturacion || '');
                setRegimenTributario(data.regimen_tributario || '');

                if (data.logo) {
                    setLogoPreview(`http://localhost:8000${data.logo}`);
                }
            }
        } catch (error) {
            console.error('Error al cargar configuración:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogo(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);

            const configData = {
                nombre_negocio: nombreNegocio,
                nit_negocio: nitNegocio,
                direccion_negocio: direccionNegocio,
                telefono_negocio: telefonoNegocio,
                email_negocio: emailNegocio,
                encabezado_ticket: encabezadoTicket,
                pie_pagina_ticket: piePaginaTicket,
                mensaje_agradecimiento: mensajeAgradecimiento,
                ancho_papel: anchoPapel,
                mostrar_logo: mostrarLogo,
                mostrar_codigo_barras: mostrarCodigoBarras,
                impresora_predeterminada: impresoraPredeterminada,
                resolucion_facturacion: resolucionFacturacion,
                regimen_tributario: regimenTributario,
                activo: true
            };

            if (logo) {
                configData.logo = logo;
            }

            let result;
            if (configId) {
                result = await configuracionImpresionService.update(configId, configData);
            } else {
                result = await configuracionImpresionService.create(configData);
            }

            if (result && !result.error) {
                alert('✅ Configuración guardada exitosamente');
                if (!configId && result.id) {
                    setConfigId(result.id);
                }
            } else {
                alert('❌ Error al guardar la configuración');
            }
        } catch (error) {
            console.error('Error al guardar:', error);
            alert('❌ Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="config-impresion-screen">
                <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="config-impresion-screen">
            {/* Header */}
            <div className="config-header">
                <button className="btn-back" onClick={() => navigate('/')}>
                    <i className="bi bi-arrow-left"></i>
                </button>
                <h1>
                    <i className="bi bi-printer me-2"></i>
                    Configuración de Impresión
                </h1>
            </div>

            <div className="config-content">
                <form onSubmit={handleSubmit}>
                    {/* Información del Negocio */}
                    <div className="config-section">
                        <h3>
                            <i className="bi bi-building me-2"></i>
                            Información del Negocio
                        </h3>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Nombre del Negocio *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={nombreNegocio}
                                    onChange={(e) => setNombreNegocio(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">NIT</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={nitNegocio}
                                    onChange={(e) => setNitNegocio(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Dirección</label>
                            <input
                                type="text"
                                className="form-control"
                                value={direccionNegocio}
                                onChange={(e) => setDireccionNegocio(e.target.value)}
                            />
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Teléfono</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={telefonoNegocio}
                                    onChange={(e) => setTelefonoNegocio(e.target.value)}
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={emailNegocio}
                                    onChange={(e) => setEmailNegocio(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Régimen Tributario</label>
                            <input
                                type="text"
                                className="form-control"
                                value={regimenTributario}
                                onChange={(e) => setRegimenTributario(e.target.value)}
                                placeholder="Ej: Régimen Simplificado"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Resolución de Facturación</label>
                            <textarea
                                className="form-control"
                                rows="2"
                                value={resolucionFacturacion}
                                onChange={(e) => setResolucionFacturacion(e.target.value)}
                                placeholder="Ej: Resolución DIAN No. 123456 del 01/01/2024"
                            />
                        </div>
                    </div>

                    {/* Textos Personalizables */}
                    <div className="config-section">
                        <h3>
                            <i className="bi bi-file-text me-2"></i>
                            Textos Personalizables
                        </h3>

                        <div className="mb-3">
                            <label className="form-label">Encabezado del Ticket</label>
                            <textarea
                                className="form-control"
                                rows="3"
                                value={encabezadoTicket}
                                onChange={(e) => setEncabezadoTicket(e.target.value)}
                                placeholder="Texto que aparece al inicio del ticket"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Mensaje de Agradecimiento</label>
                            <input
                                type="text"
                                className="form-control"
                                value={mensajeAgradecimiento}
                                onChange={(e) => setMensajeAgradecimiento(e.target.value)}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Pie de Página del Ticket</label>
                            <textarea
                                className="form-control"
                                rows="3"
                                value={piePaginaTicket}
                                onChange={(e) => setPiePaginaTicket(e.target.value)}
                                placeholder="Texto que aparece al final del ticket"
                            />
                        </div>
                    </div>

                    {/* Configuración de Impresión */}
                    <div className="config-section">
                        <h3>
                            <i className="bi bi-gear me-2"></i>
                            Configuración de Impresión
                        </h3>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Ancho del Papel</label>
                                <select
                                    className="form-select"
                                    value={anchoPapel}
                                    onChange={(e) => setAnchoPapel(e.target.value)}
                                >
                                    <option value="58mm">58mm</option>
                                    <option value="80mm">80mm</option>
                                </select>
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Impresora Predeterminada</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={impresoraPredeterminada}
                                    onChange={(e) => setImpresoraPredeterminada(e.target.value)}
                                    placeholder="Nombre de la impresora"
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Logo del Negocio</label>
                            <input
                                type="file"
                                className="form-control"
                                accept="image/*"
                                onChange={handleLogoChange}
                            />
                            {logoPreview && (
                                <div className="logo-preview mt-2">
                                    <img src={logoPreview} alt="Logo Preview" />
                                </div>
                            )}
                        </div>

                        <div className="form-check mb-3">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="mostrarLogo"
                                checked={mostrarLogo}
                                onChange={(e) => setMostrarLogo(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="mostrarLogo">
                                Mostrar logo en el ticket
                            </label>
                        </div>

                        <div className="form-check mb-3">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="mostrarCodigoBarras"
                                checked={mostrarCodigoBarras}
                                onChange={(e) => setMostrarCodigoBarras(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="mostrarCodigoBarras">
                                Mostrar código de barras
                            </label>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="config-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/')}
                        >
                            <i className="bi bi-x-circle me-2"></i>
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-save me-2"></i>
                                    Guardar Configuración
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
