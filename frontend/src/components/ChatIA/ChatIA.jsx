import React, { useState, useRef, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner, Badge, Modal } from 'react-bootstrap';
import LogoGuerrero from '../../assets/images/icono.png'; // Importar Logo

const API_URL = process.env.REACT_APP_API_URL || '/api';

const ChatIA = ({ onBack }) => { // Recibir onBack
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('chat_history_v1');
        return saved ? JSON.parse(saved) : [];
    });

    // Estado Configuración
    const [showConfig, setShowConfig] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
    const [savingConfig, setSavingConfig] = useState(false);

    // Persistir mensajes
    useEffect(() => {
        localStorage.setItem('chat_history_v1', JSON.stringify(messages));
    }, [messages]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [iaStatus, setIaStatus] = useState({ status: 'checking', models: [] });
    const [restarting, setRestarting] = useState(false);
    const [agentMode, setAgentMode] = useState(true);  // true = Agente, false = Chat
    const [sessionId, setSessionId] = useState(null); // Nuevo estado para sesión conversacional
    // Inicializar tema leyendo de localStorage, si no existe default true (Oscuro)
    const [darkMode, setDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('chat_theme_preference');
        return savedTheme !== null ? JSON.parse(savedTheme) : true;
    });

    // Guardar preferencia cuando cambia
    useEffect(() => {
        localStorage.setItem('chat_theme_preference', JSON.stringify(darkMode));
    }, [darkMode]);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null); // Ref para el input

    // Definición de colores estilo DeepSeek (Gris Oscuro Mate)
    const theme = {
        bg: darkMode ? '#212121' : '#FFFFFF', // Gris oscuro material (no negro puro)
        text: darkMode ? '#ECECF1' : '#343541',
        border: darkMode ? '#333' : '#e5e5e5', // Bordes más sutiles
        header: darkMode ? 'rgba(33,33,33,0.95)' : '#FFFFFF', // Header semitransparente
        aiBubble: darkMode ? '#2f2f2f' : '#F7F7F8', // Burbujas un poco más claras que el fondo
        userBubble: darkMode ? '#212121' : '#FFFFFF',
        inputBg: darkMode ? '#2f2f2f' : '#FFFFFF',
        inputBorder: darkMode ? 'transparent' : '#d9d9e3',
        toggleBg: darkMode ? '#2f2f2f' : '#f0f0f0',
        toggleText: darkMode ? '#ECECF1' : '#202123',
        placeholder: darkMode ? '#8e8ea0' : '#8e8ea0',
        modalBg: darkMode ? '#2f2f2f' : '#fff',
        modalText: darkMode ? '#ECECF1' : '#212529',
        inputModalBg: darkMode ? '#3e3e3e' : '#fff',
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Enfocar input al cargar o terminar loading
    useEffect(() => {
        if (!loading) {
            inputRef.current?.focus();
        }
    }, [loading]);

    useEffect(() => {
        checkIAHealth();
        loadConfig();
    }, []);

    const checkIAHealth = async () => {
        try {
            const response = await fetch(`${API_URL}/ai/health/`);
            const data = await response.json();
            setIaStatus(data);
        } catch (error) {
            console.error('Error verificando IA:', error);
            setIaStatus({ status: 'error', message: 'No se puede conectar con la IA' });
        }
    };

    const loadConfig = async () => {
        try {
            const res = await fetch(`${API_URL}/ia/config/`);
            if (res.ok) {
                const data = await res.json();
                if (data.gemini_api_key) {
                    setApiKey(data.gemini_api_key);
                }
                if (data.gemini_model) {
                    setSelectedModel(data.gemini_model);
                }
            }
        } catch (e) {
            console.error("Error cargando config", e);
        }
    };

    const handleSaveConfig = async () => {
        setSavingConfig(true);
        try {
            const res = await fetch(`${API_URL}/ia/config/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gemini_api_key: apiKey,
                    gemini_model: selectedModel
                })
            });
            if (res.ok) {
                setShowConfig(false);
                checkIAHealth(); // Re-verificar salud con nueva key
            } else {
                alert('Error guardando configuración');
            }
        } catch (e) {
            alert('Error conectando al servidor');
        } finally {
            setSavingConfig(false);
        }
    };

    const handleRestart = async () => {
        setSessionId(null); // Limpiar sesión al reiniciar
        setMessages([]);
        setRestarting(true);
        setTimeout(() => setRestarting(false), 500);
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = {
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const userInput = input;
        setInput('');
        setLoading(true);
        setError(null);

        try {
            // Decidir endpoint según modo
            const endpoint = agentMode ? `${API_URL}/ai/agent/` : `${API_URL}/ai/chat/`;
            const payload = agentMode
                ? { command: userInput, session_id: sessionId } // Enviar sessionId
                : { question: userInput, include_docs: false };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                let aiMessage;

                if (agentMode) {
                    // Guardar nueva sesión si se recibe
                    if (data.session_id) {
                        setSessionId(data.session_id);
                    } else if (data.action_taken && data.tool_result?.success) {
                        // Si la acción fue exitosa y completada, limpiar sesión
                        // Opcional: setSessionId(null); 
                        // Mejor mantenerla por si el usuario quiere seguir
                    }

                    // Modo Agente: mostrar acción ejecutada
                    const actionText = data.action_taken
                        ? `🤖 Acción ejecutada: ${data.tool_used}\n\n${data.tool_result?.message || data.ai_response}`
                        : data.ai_response || data.error;

                    aiMessage = {
                        role: 'assistant',
                        content: actionText,
                        timestamp: new Date(),
                        action: data.action_taken,
                        tool: data.tool_used,
                        toolResult: data.tool_result
                    };
                } else {
                    // Modo Chat
                    aiMessage = {
                        role: 'assistant',
                        content: data.answer,
                        timestamp: new Date(),
                        model: data.model
                    };
                }

                setMessages(prev => [...prev, aiMessage]);
            } else {
                setError(data.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Ejemplos según modo
    const chatQuestions = [
        "¿Cómo cierro el turno de un vendedor?",
        "¿Cómo registro una vencida?",
        "¿Cómo funciona el módulo de planeación?"
    ];

    const agentCommands = [
        "Crea un cliente llamado Juan con teléfono 123456",
        "Dame el reporte de ventas de hoy",
        "Muéstrame el inventario",
        "Busca el producto pan"
    ];

    const quickQuestions = agentMode ? agentCommands : chatQuestions;

    // JSX DEL INPUT (Reutilizable como variable para no repetir código, pero ejecutado en el scope)
    const renderInputContent = (centered) => (
        <div style={{
            width: centered ? '100%' : 'auto',
            maxWidth: centered ? '700px' : '768px',
            margin: centered ? '0 auto' : '0 auto',
            backgroundColor: theme.inputBg,
            borderRadius: '20px',
            padding: '12px 16px',
            boxShadow: centered ? '0 4px 20px rgba(0,0,0,0.2)' : '0 0 15px rgba(0,0,0,0.1)',
            border: `1px solid ${theme.inputBorder}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            transition: 'all 0.3s ease'
        }}>
            <textarea
                ref={inputRef /* Nota: El ref solo funcionará para uno de los dos inputs si se montan ambos, pero aquí es condicional */}
                rows={3}
                placeholder="Envía un mensaje a Guerrero IA..."
                value={input}
                onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                }}
                onKeyDown={handleKeyPress}
                disabled={loading}
                autoFocus={true} // Auto enfocar
                style={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: theme.text,
                    resize: 'none',
                    maxHeight: '200px',
                    outline: 'none',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    lineHeight: '1.5',
                    minHeight: '60px'
                }}
            />

            <div className="d-flex justify-content-between align-items-center" style={{ paddingTop: '8px', borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
                {/* Botones de Modo Estilo DeepSeek */}
                <div className="d-flex gap-2">
                    <div
                        onClick={() => setAgentMode(true)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '18px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            backgroundColor: agentMode ? 'rgba(16, 163, 127, 0.1)' : 'transparent',
                            color: agentMode ? '#10a37f' : (darkMode ? '#aaa' : '#666'),
                            border: agentMode ? '1px solid #10a37f' : `1px solid ${darkMode ? '#444' : '#ddd'}`,
                            transition: 'all 0.2s'
                        }}
                    >
                        🤖 <span style={{ fontWeight: agentMode ? 600 : 400 }}>Agente</span>
                    </div>
                    <div
                        onClick={() => setAgentMode(false)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '18px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            backgroundColor: !agentMode ? 'rgba(84, 54, 218, 0.1)' : 'transparent',
                            color: !agentMode ? '#5436DA' : (darkMode ? '#aaa' : '#666'),
                            border: !agentMode ? '1px solid #5436DA' : `1px solid ${darkMode ? '#444' : '#ddd'}`,
                            transition: 'all 0.2s'
                        }}
                    >
                        💬 <span style={{ fontWeight: !agentMode ? 600 : 400 }}>Chat</span>
                    </div>
                </div>

                <button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    style={{
                        backgroundColor: input.trim() ? (darkMode ? '#fff' : '#101010') : 'transparent',
                        border: 'none',
                        color: input.trim() ? (darkMode ? '#101010' : '#fff') : (darkMode ? '#555' : '#ccc'),
                        borderRadius: '50%',
                        width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: input.trim() ? 'pointer' : 'default',
                        transition: 'all 0.2s'
                    }}
                >
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        </div>
    );

    return (
        <div style={{
            position: 'fixed', // FULL SCREEN OVERLAY
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 1040, // Lower than Bootstrap Modal (1050)
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.bg,
            color: theme.text,
            boxShadow: 'none',
            border: 'none'
        }}>

            {/* 1. Header Minimalista */}
            <div style={{
                padding: '15px 20px',
                backgroundColor: 'transparent',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'absolute', top: 0, right: 0, left: 0, zIndex: 10
            }}>
                {/* Botón Volver e Info Modelo */}
                <div className="d-flex align-items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            style={{
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                color: theme.text, opacity: 0.7, display: 'flex'
                            }}
                            title="Volver"
                        >
                            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        </button>
                    )}

                    <div style={{ opacity: 0.6 }}>
                        <small style={{ fontSize: '0.75rem', color: theme.text }}>
                            ● {iaStatus?.provider || iaStatus?.models?.[0] || 'Cargando...'}
                        </small>
                    </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                    {/* Botón Configuración (Nuevo) - SVG */}
                    <button
                        onClick={() => setShowConfig(true)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            color: theme.text,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                            opacity: 0.7
                        }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                        onMouseOut={(e) => e.currentTarget.style.opacity = 0.7}
                        title="Configuración API"
                    >
                        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                    </button>

                    {/* Botón Tema Minimalista SVG */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            color: theme.text,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                            opacity: 0.7
                        }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                        onMouseOut={(e) => e.currentTarget.style.opacity = 0.7}
                        title={darkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
                    >
                        {darkMode ? (
                            // Icono Sol (Sun) - Feather Icons
                            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="5"></circle>
                                <line x1="12" y1="1" x2="12" y2="3"></line>
                                <line x1="12" y1="21" x2="12" y2="23"></line>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                <line x1="1" y1="12" x2="3" y2="12"></line>
                                <line x1="21" y1="12" x2="23" y2="12"></line>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                            </svg>
                        ) : (
                            // Icono Luna (Moon)
                            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            </svg>
                        )}
                    </button>

                    {/* Botón Reinicio SVG */}
                    <button
                        onClick={handleRestart}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            color: theme.text,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                            opacity: 0.7
                        }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                        onMouseOut={(e) => e.currentTarget.style.opacity = 0.7}
                        title="Nueva Conversación"
                    >
                        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <polyline points="1 20 1 14 7 14"></polyline>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                    </button>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL */}
            {messages.length === 0 ? (
                /* VISTA INICIAL CENTRADA (DeepSeek Style) */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 20px' }}>

                    <div className="mb-4 text-center">
                        <div style={{
                            width: '80px', height: '80px', margin: '0 auto 20px auto',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <img src={LogoGuerrero} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <h4 style={{ fontWeight: 600, color: theme.text, marginBottom: '0.5rem' }}>¿En qué puedo ayudarte?</h4>
                        <p style={{ color: darkMode ? '#888' : '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            Agente Guerrero IA listo para colaborar.
                        </p>

                        {/* Status de Modelo Visible en el Centro */}
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#f8f9fa',
                            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e9ecef'}`,
                            fontSize: '0.8rem',
                            color: theme.text
                        }}>
                            <span style={{
                                width: '8px', height: '8px',
                                borderRadius: '50%',
                                backgroundColor: iaStatus?.status === 'ok' ? '#10a37f' : '#ef4146',
                                boxShadow: iaStatus?.status === 'ok' ? '0 0 5px #10a37f' : 'none'
                            }}></span>
                            {iaStatus?.provider || iaStatus?.message || iaStatus?.models?.[0] || (iaStatus?.status === 'error' ? 'Desconectado' : 'Conectando...')}
                        </div>
                    </div>

                    <div style={{ width: '100%', maxWidth: '700px' }}>
                        {renderInputContent(true)}
                    </div>

                    {/* Footer muy sutil */}
                    <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
                        {quickQuestions.slice(0, 3).map((q, i) => (
                            <div key={i}
                                onClick={() => { setInput(q); }}
                                style={{
                                    padding: '8px 16px',
                                    fontSize: '0.8rem',
                                    color: darkMode ? '#aaa' : '#666',
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    backgroundColor: 'transparent'
                                }}
                                className="hover-btn"
                            >
                                {q.length > 30 ? q.substring(0, 30) + '...' : q}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* VISTA CHAT ACTIVO */
                <>
                    {/* Header flotante sutil al hacer scroll sería ideal, pero lo dejaremos fijo simple */}
                    <div style={{
                        padding: '10px 20px',
                        borderBottom: `1px solid ${theme.border}`,
                        backgroundColor: theme.header,
                        display: 'flex',
                        alignItems: 'center',
                        zIndex: 5, marginTop: '50px' // Compensar el header absoluto
                    }}>
                        <img src={LogoGuerrero} alt="Logo" style={{ width: '24px', height: '24px', marginRight: '10px' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>AGENTE GUERRERO</span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '0', display: 'flex', flexDirection: 'column' }}>
                        {messages.map((msg, index) => (
                            <div key={index} style={{
                                padding: '24px 0',
                                backgroundColor: msg.role === 'assistant' ? theme.aiBubble : theme.userBubble,
                                borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                            }}>
                                <div style={{ maxWidth: '768px', margin: '0 auto', display: 'flex', gap: '16px', padding: '0 20px' }}>
                                    {msg.role === 'assistant' && (
                                        <div style={{ width: '32px', height: '32px', flexShrink: 0 }}>
                                            <img src={LogoGuerrero} alt="Bot" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        </div>
                                    )}
                                    <div style={{ flex: 1, lineHeight: '1.6', fontSize: '0.95rem', color: theme.text, marginLeft: msg.role === 'user' ? '48px' : '0' }}>
                                        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ padding: '24px 0', backgroundColor: theme.aiBubble }}>
                                <div style={{ maxWidth: '768px', margin: '0 auto', display: 'flex', gap: '16px', padding: '0 20px' }}>
                                    <div style={{ width: '32px', height: '32px' }}>
                                        <img src={LogoGuerrero} alt="Bot" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <span style={{ color: '#888' }}>Pensando...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input fijo abajo */}
                    <div style={{
                        padding: '20px',
                        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0), ${theme.bg} 20%)`,
                        backgroundColor: theme.bg
                    }}>
                        {renderInputContent(false)}
                        <div className="text-center mt-2">
                            <small style={{ color: '#666', fontSize: '0.7rem' }}>IA puede cometer errores.</small>
                        </div>
                    </div>
                </>
            )}

            {/* Errores Flotantes */}
            {error && (
                <div style={{ position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
                    <Alert variant="danger" onClose={() => setError(null)} dismissible>
                        {error}
                    </Alert>
                </div>
            )}

            {/* MODAL CONFIGURACIÓN API KEY */}
            <Modal show={showConfig} onHide={() => setShowConfig(false)} centered>
                <Modal.Header closeButton style={{ backgroundColor: theme.modalBg, color: theme.modalText, borderBottomColor: theme.border }}>
                    <Modal.Title>Configuración del Agente IA</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ backgroundColor: theme.modalBg, color: theme.modalText }}>
                    <Form.Group className="mb-3">
                        <Form.Label>Google Gemini API Key</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Introduce tu API Key (sk-...)"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            style={{ backgroundColor: theme.inputModalBg, color: theme.modalText, borderColor: theme.border }}
                        />
                        <Form.Text className="text-muted">
                            Si se deja vacío, se usará la clave del sistema.
                        </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Modelo de IA</Form.Label>
                        <Form.Select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            style={{ backgroundColor: theme.inputModalBg, color: theme.modalText, borderColor: theme.border }}
                        >
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Rápido)</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Potente)</option>
                            <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
                            {!['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'].includes(selectedModel) && (
                                <option value={selectedModel}>{selectedModel} (Personalizado)</option>
                            )}
                        </Form.Select>
                        <div className="mt-2 text-end">
                            <small
                                style={{ cursor: 'pointer', color: '#0d6efd' }}
                                onClick={() => {
                                    const custom = prompt("Nombre técnico del modelo (ej: gemini-1.5-pro-002):", selectedModel);
                                    if (custom) setSelectedModel(custom);
                                }}
                            >
                                ¿Usar otro modelo?
                            </small>
                        </div>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: theme.modalBg, borderTopColor: theme.border }}>
                    <Button variant="secondary" onClick={() => setShowConfig(false)}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleSaveConfig} disabled={savingConfig}>
                        {savingConfig ? 'Guardando...' : 'Guardar Configuración'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ChatIA;
