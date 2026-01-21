import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import icono from '../assets/images/icono.png';

const LoginScreen = () => {
    const navigate = useNavigate();
    const { login, recuperarPassword, loading } = useAuth();

    const [formData, setFormData] = useState({
        codigo: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Modal de recuperación
    const [showRecuperarModal, setShowRecuperarModal] = useState(false);
    const [contactoRecuperar, setContactoRecuperar] = useState('');
    const [recuperarLoading, setRecuperarLoading] = useState(false);
    const [recuperarMensaje, setRecuperarMensaje] = useState({ tipo: '', texto: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.codigo || !formData.password) {
            setError('Complete todos los campos');
            return;
        }

        const result = await login(formData.codigo, formData.password);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
    };

    const handleRecuperar = async () => {
        if (!contactoRecuperar.trim()) {
            setRecuperarMensaje({ tipo: 'danger', texto: 'Ingrese su email o teléfono' });
            return;
        }

        setRecuperarLoading(true);
        const result = await recuperarPassword(contactoRecuperar);
        setRecuperarLoading(false);

        if (result.success) {
            setRecuperarMensaje({
                tipo: 'success',
                texto: result.message + (result.codigo_temporal ? ` (Código: ${result.codigo_temporal})` : '')
            });
        } else {
            setRecuperarMensaje({ tipo: 'danger', texto: result.error });
        }
    };

    // Estilos inline basados en el diseño proporcionado
    const styles = {
        page: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '20px 16px',
            fontFamily: "'Inter', sans-serif",
            position: 'relative',
            overflow: 'auto'
        },
        backgroundPattern: {
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)',
            backgroundSize: '32px 32px',
            pointerEvents: 'none'
        },
        blurCircle1: {
            position: 'fixed',
            top: '-10%',
            left: '-5%',
            width: '40%',
            height: '40%',
            background: 'rgba(30, 64, 175, 0.15)',
            borderRadius: '50%',
            filter: 'blur(100px)',
            pointerEvents: 'none',
            zIndex: 0
        },
        blurCircle2: {
            position: 'fixed',
            bottom: '-10%',
            right: '-5%',
            width: '40%',
            height: '40%',
            background: 'rgba(15, 23, 42, 0.3)',
            borderRadius: '50%',
            filter: 'blur(100px)',
            pointerEvents: 'none',
            zIndex: 0
        },
        card: {
            width: '100%',
            maxWidth: '420px',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
            border: '1px solid rgba(226, 232, 240, 0.1)',
            position: 'relative',
            zIndex: 10
        },
        header: {
            background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)',
            padding: '8px 24px 12px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
        },
        headerWave: {
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            pointerEvents: 'none'
        },
        iconContainer: {
            display: 'inline-flex',
            marginBottom: '0'
        },
        icon: {
            fontSize: '36px',
            color: 'white'
        },
        title: {
            color: 'white',
            fontWeight: '700',
            fontSize: '1.3rem',
            marginBottom: '2px',
            letterSpacing: '-0.025em'
        },
        subtitle: {
            color: 'rgba(191, 219, 254, 0.9)',
            fontSize: '0.75rem',
            fontWeight: '500',
            margin: 0
        },
        body: {
            padding: '12px 28px 16px'
        },
        sectionTitle: {
            textAlign: 'center',
            marginBottom: '10px'
        },
        sectionTitleText: {
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#94A3B8'
        },
        divider: {
            height: '1px',
            background: '#E2E8F0',
            marginTop: '8px'
        },
        label: {
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#475569',
            marginBottom: '8px'
        },
        labelIcon: {
            fontSize: '18px',
            marginRight: '8px',
            color: '#94A3B8'
        },
        input: {
            width: '100%',
            padding: '14px 16px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            fontSize: '1rem',
            color: '#0F172A',
            transition: 'all 0.2s ease',
            outline: 'none'
        },
        inputFocus: {
            borderColor: '#1E3A8A',
            boxShadow: '0 0 0 3px rgba(30, 58, 138, 0.1)'
        },
        inputContainer: {
            position: 'relative',
            marginBottom: '10px'
        },
        togglePassword: {
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center'
        },
        submitButton: {
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)',
            border: 'none',
            color: 'white',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(30, 58, 138, 0.25)',
            transition: 'all 0.2s ease',
            marginTop: '10px'
        },
        forgotLink: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            marginTop: '10px',
            color: '#1E3A8A',
            fontSize: '0.85rem',
            fontWeight: '500',
            textDecoration: 'none',
            cursor: 'pointer',
            background: 'none',
            border: 'none'
        },
        footer: {
            textAlign: 'center',
            marginTop: '20px',
            color: '#64748B',
            fontSize: '0.8rem'
        },
        errorAlert: {
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            padding: '8px 12px',
            borderRadius: '10px',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem'
        }
    };

    return (
        <div style={styles.page}>
            {/* Fondo con patrón */}
            <div style={styles.backgroundPattern}></div>

            {/* Círculos difuminados de fondo */}
            <div style={styles.blurCircle1}></div>
            <div style={styles.blurCircle2}></div>

            {/* Tarjeta principal */}
            <div style={styles.card}>
                {/* Header con gradiente */}
                <div style={styles.header}>
                    <div style={{ position: 'relative', zIndex: 10 }}>
                        <div style={styles.iconContainer}>
                            <img src={icono} alt="Logo" style={{ width: '120px', height: '120px', objectFit: 'contain', marginTop: '-5px' }} />
                        </div>
                        <h1 style={styles.title}>SOFTWARE GUERRERO</h1>
                        <p style={styles.subtitle}>SISTEMA DE GESTIÓN EMPRESARIAL</p>
                    </div>
                </div>

                {/* Cuerpo del formulario */}
                <div style={styles.body}>
                    <div style={styles.sectionTitle}>
                        <span style={styles.sectionTitleText}>Iniciar Sesión</span>
                        <div style={styles.divider}></div>
                    </div>

                    {error && (
                        <div style={styles.errorAlert}>
                            <span className="material-icons-round" style={{ fontSize: '20px' }}>error</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Campo Usuario */}
                        <div style={styles.inputContainer}>
                            <label style={styles.label}>
                                Usuario
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: ADMIN, POS1..."
                                value={formData.codigo}
                                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                style={styles.input}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#1E3A8A';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(30, 58, 138, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#E2E8F0';
                                    e.target.style.boxShadow = 'none';
                                }}
                                autoFocus
                            />
                        </div>

                        {/* Campo Contraseña */}
                        <div style={styles.inputContainer}>
                            <label style={styles.label}>
                                Contraseña
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Ingrese su contraseña"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    style={{ ...styles.input, paddingRight: '48px' }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#1E3A8A';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(30, 58, 138, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#E2E8F0';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={styles.togglePassword}
                                >
                                    <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`} style={{ fontSize: '1.2rem' }}></i>
                                </button>
                            </div>
                        </div>

                        {/* Botón Ingresar */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                ...styles.submitButton,
                                opacity: loading ? 0.7 : 1
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(30, 58, 138, 0.35)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 14px rgba(30, 58, 138, 0.25)';
                            }}
                        >
                            {loading ? (
                                <>
                                    <Spinner animation="border" size="sm" />
                                    Verificando...
                                </>
                            ) : (
                                <>
                                    LOGIN
                                </>
                            )}
                        </button>
                    </form>

                    {/* Link recuperar contraseña */}
                    {/* Link recuperar contraseña */}
                    <button
                        onClick={() => setShowRecuperarModal(true)}
                        style={styles.forgotLink}
                    >
                        ¿Olvidaste tu contraseña?
                    </button>
                </div>
            </div>

            {/* Footer */}
            <p style={{
                position: 'absolute',
                bottom: '10px',
                left: 0,
                right: 0,
                textAlign: 'center',
                color: '#64748B',
                fontSize: '0.75rem'
            }}>
                © 2026 Software Guerrero v2.5
            </p>

            {/* Modal de Recuperación de Contraseña */}
            <Modal
                show={showRecuperarModal}
                onHide={() => {
                    setShowRecuperarModal(false);
                    setRecuperarMensaje({ tipo: '', texto: '' });
                    setContactoRecuperar('');
                }}
                centered
            >
                <Modal.Header closeButton style={{
                    background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)',
                    border: 'none'
                }}>
                    <Modal.Title style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-icons-round">vpn_key</span>
                        Recuperar Contraseña
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <p style={{ color: '#64748B', marginBottom: '20px' }}>
                        Ingresa tu email o teléfono registrado para recibir instrucciones de recuperación.
                    </p>

                    {recuperarMensaje.texto && (
                        <Alert variant={recuperarMensaje.tipo} className="py-2">
                            {recuperarMensaje.texto}
                        </Alert>
                    )}

                    <Form.Group>
                        <Form.Label style={{ fontWeight: '500', color: '#475569' }}>Email o Teléfono</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="ejemplo@correo.com o 3001234567"
                            value={contactoRecuperar}
                            onChange={(e) => setContactoRecuperar(e.target.value)}
                            style={{
                                borderRadius: '10px',
                                padding: '12px',
                                border: '1px solid #E2E8F0'
                            }}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRecuperarModal(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleRecuperar}
                        disabled={recuperarLoading}
                        style={{
                            background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)',
                            border: 'none'
                        }}
                    >
                        {recuperarLoading ? (
                            <Spinner animation="border" size="sm" />
                        ) : (
                            'Enviar Código'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default LoginScreen;
