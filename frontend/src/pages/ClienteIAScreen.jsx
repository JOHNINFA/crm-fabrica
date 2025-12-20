import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { clienteService } from '../services/clienteService';
import usePageTitle from '../hooks/usePageTitle';

// Pasos del asistente (obligatorio = true significa que no se puede saltar)
const PASOS = [
    { campo: 'alias', pregunta: '📍 ¿Cuál es el **nombre del negocio**?', placeholder: 'Ej: Tienda El Sol', tipo: 'text', obligatorio: true },
    { campo: 'nombre_completo', pregunta: '👤 ¿Cuál es el **nombre del contacto** o propietario?', placeholder: 'Ej: Juan Pérez', tipo: 'text', obligatorio: true },
    { campo: 'tipo_identificacion', pregunta: '🆔 ¿Qué **tipo de identificación** tiene?\n_(Escribe: CC, NIT o RUT)_', placeholder: 'CC, NIT o RUT', tipo: 'tipo_id', obligatorio: false },
    { campo: 'identificacion', pregunta: '🔢 ¿Cuál es el **número de identificación**?\n_(escribe "saltar" si no lo tienes ahora)_', placeholder: 'Ej: 123456789', tipo: 'text', obligatorio: false },
    { campo: 'movil', pregunta: '📱 ¿Cuál es el **número de celular**?\n_(escribe "saltar" si no lo tienes)_', placeholder: 'Ej: 3001234567', tipo: 'tel', obligatorio: false },
    { campo: 'direccion', pregunta: '🏠 ¿Cuál es la **dirección** del negocio?\n_(escribe "saltar" si no la tienes)_', placeholder: 'Ej: Calle 123 #45-67', tipo: 'text', obligatorio: false },
    { campo: 'ciudad', pregunta: '🌆 ¿En qué **ciudad** se encuentra?', placeholder: 'Ej: Bogotá', tipo: 'text', obligatorio: false },
    { campo: 'dia_entrega', pregunta: '📅 ¿Qué **días de entrega** prefiere?\n_Ejemplo: Lunes, Miércoles, Viernes_', placeholder: 'Ej: Lunes, Miércoles', tipo: 'dias', obligatorio: false },
    { campo: 'zona_barrio', pregunta: '🛣️ ¿A qué **ruta/zona** pertenece este cliente?\n_(puedes escribir "saltar" o elegir de las opciones)_', placeholder: 'Selecciona una ruta', tipo: 'ruta', obligatorio: false },
    { campo: 'vendedor_asignado', pregunta: '👔 ¿A qué **vendedor** asignamos este cliente?\n_(puedes escribir "saltar" o elegir de las opciones)_', placeholder: 'Selecciona un vendedor', tipo: 'vendedor', obligatorio: false },
    { campo: 'tipo_lista_precio', pregunta: '💰 ¿Qué **lista de precios** aplica?\n_(puedes escribir "saltar" o elegir de las opciones)_', placeholder: 'Selecciona una lista', tipo: 'lista_precio', obligatorio: false },
];

const ClienteIAScreen = () => {
    usePageTitle('Cliente IA');
    const navigate = useNavigate();
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    // Estado del chat
    const [mensajes, setMensajes] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [pasoActual, setPasoActual] = useState(-1); // -1 = saludo inicial
    const [clienteData, setClienteData] = useState({
        tipo_identificacion: 'CC',
        activo: true
    });
    const [creandoCliente, setCreandoCliente] = useState(false);
    const [clienteCreado, setClienteCreado] = useState(false);
    const [modoConfirmacion, setModoConfirmacion] = useState(false); // Para confirmar antes de crear
    const [modoEdicion, setModoEdicion] = useState(false); // Para editar un campo específico y volver al resumen

    // Datos para dropdowns
    const [vendedores, setVendedores] = useState([]);
    const [listaPrecios, setListaPrecios] = useState([]);
    const [rutas, setRutas] = useState([]);

    // Cargar datos iniciales
    useEffect(() => {
        cargarDatosIniciales();
        // Mensaje de bienvenida
        agregarMensajeBot('¡Hola! 👋 Soy tu asistente para crear clientes.');
        setTimeout(() => {
            agregarMensajeBot('Te guiaré paso a paso para registrar un nuevo cliente.');
            setTimeout(() => {
                agregarMensajeBot('Escribe **"crear cliente"** para comenzar, o **"ayuda"** si necesitas información.');
            }, 500);
        }, 800);
    }, []);

    // Auto-scroll al último mensaje
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes]);

    // Focus en input
    useEffect(() => {
        inputRef.current?.focus();
    }, [pasoActual]);

    const cargarDatosIniciales = async () => {
        try {
            const [resVendedores, resPrecios, resRutas] = await Promise.all([
                fetch('http://localhost:8000/api/vendedores/'),
                fetch('http://localhost:8000/api/lista-precios/?activo=true'),
                fetch('http://localhost:8000/api/rutas/')
            ]);

            if (resVendedores.ok) setVendedores(await resVendedores.json());
            if (resPrecios.ok) setListaPrecios(await resPrecios.json());
            if (resRutas.ok) setRutas(await resRutas.json());
        } catch (error) {
            console.error('Error cargando datos:', error);
        }
    };

    const agregarMensajeBot = (texto, opciones = null) => {
        setMensajes(prev => [...prev, { tipo: 'bot', texto, opciones, timestamp: new Date() }]);
    };

    const agregarMensajeUsuario = (texto) => {
        setMensajes(prev => [...prev, { tipo: 'usuario', texto, timestamp: new Date() }]);
    };

    const procesarRespuesta = (texto) => {
        const textoLower = texto.toLowerCase().trim();

        // Si no hemos empezado
        if (pasoActual === -1) {
            if (textoLower.includes('crear') || textoLower.includes('nuevo') || textoLower.includes('cliente') || textoLower === 'si') {
                setPasoActual(0);
                setTimeout(() => {
                    agregarMensajeBot(`¡Perfecto! Empecemos. 📝\n\n${PASOS[0].pregunta}`);
                }, 300);
                return;
            } else if (textoLower === 'ayuda') {
                agregarMensajeBot('Puedo ayudarte a:\n\n• **Crear cliente** - Registrar un nuevo cliente paso a paso\n• **Cancelar** - Volver a la lista de clientes\n\nEscribe lo que necesites. 😊');
                return;
            } else if (textoLower === 'cancelar' || textoLower === 'salir') {
                agregarMensajeBot('¡Hasta luego! 👋 Volviendo a la lista de clientes...');
                setTimeout(() => navigate('/clientes'), 1500);
                return;
            }
            agregarMensajeBot('No entendí eso. 🤔 Escribe **"crear cliente"** para comenzar o **"ayuda"** para ver las opciones.');
            return;
        }

        // Si ya se creó el cliente
        if (clienteCreado) {
            if (textoLower.includes('otro') || textoLower.includes('nuevo') || textoLower === 'si') {
                reiniciarChat();
                return;
            } else if (textoLower.includes('pedido') || textoLower.includes('hacer pedido')) {
                agregarMensajeBot('¡Perfecto! Te llevo a crear el pedido... 🛒');
                setTimeout(() => navigate('/pedidos'), 1500);
                return;
            } else if (textoLower === 'no' || textoLower.includes('salir') || textoLower.includes('lista')) {
                agregarMensajeBot('¡Perfecto! Volviendo a la lista de clientes... 👋');
                setTimeout(() => navigate('/clientes'), 1500);
                return;
            }
            agregarMensajeBot('¿Qué deseas hacer?', ['Hacer pedido', 'Crear otro cliente', 'Ir a lista de clientes']);
            return;
        }

        // Si estamos en modo confirmación
        if (modoConfirmacion) {
            if (textoLower.includes('crear') || textoLower.includes('confirmar') || textoLower === 'si' || textoLower.includes('correcto') || textoLower.includes('guardar')) {
                setModoConfirmacion(false);
                crearCliente(clienteData);
                return;
            } else if (textoLower.includes('editar') || textoLower.includes('corregir') || textoLower.includes('cambiar') || textoLower.includes('datos')) {
                // NO quitamos modoConfirmacion aquí para seguir en el flujo de edición
                agregarMensajeBot('¿Qué campo deseas editar?', ['Nombre negocio', 'Nombre contacto', 'Identificación', 'Celular', 'Dirección', 'Ciudad', 'Días entrega', 'Empezar de nuevo']);
                return;
            } else if (textoLower.includes('negocio') || textoLower.includes('alias')) {
                setModoConfirmacion(false);
                setModoEdicion(true); // Activar modo edición
                setPasoActual(0);
                agregarMensajeBot('📍 ¿Cuál es el **nombre del negocio** correcto?');
                return;
            } else if (textoLower.includes('contacto') || textoLower.includes('propietario')) {
                setModoConfirmacion(false);
                setModoEdicion(true);
                setPasoActual(1);
                agregarMensajeBot('👤 ¿Cuál es el **nombre del contacto** correcto?');
                return;
            } else if (textoLower.includes('identificacion') || textoLower.includes('cedula') || textoLower.includes('nit')) {
                setModoConfirmacion(false);
                setModoEdicion(true);
                setPasoActual(3);
                agregarMensajeBot('🔢 ¿Cuál es el **número de identificación** correcto?');
                return;
            } else if (textoLower.includes('celular') || textoLower.includes('telefono') || textoLower.includes('movil')) {
                setModoConfirmacion(false);
                setModoEdicion(true);
                setPasoActual(4);
                agregarMensajeBot('📱 ¿Cuál es el **número de celular** correcto?');
                return;
            } else if (textoLower.includes('direccion') || textoLower.includes('dirección')) {
                setModoConfirmacion(false);
                setModoEdicion(true);
                setPasoActual(5);
                agregarMensajeBot('🏠 ¿Cuál es la **dirección** correcta?');
                return;
            } else if (textoLower.includes('ciudad')) {
                setModoConfirmacion(false);
                setModoEdicion(true);
                setPasoActual(6);
                agregarMensajeBot('🌆 ¿Cuál es la **ciudad** correcta?');
                return;
            } else if (textoLower.includes('dia') || textoLower.includes('entrega')) {
                setModoConfirmacion(false);
                setModoEdicion(true);
                setPasoActual(7);
                agregarMensajeBot('📅 ¿Qué **días de entrega** prefieres?\n\n_Escribe los días separados por coma, ej: Lunes, Miércoles, Viernes_');
                return;
            } else if (textoLower.includes('empezar') || textoLower.includes('nuevo') || textoLower.includes('reiniciar')) {
                reiniciarChat();
                return;
            }
            agregarMensajeBot('¿Qué deseas hacer?', ['Guardar', 'Editar datos', 'Empezar de nuevo']);
            return;
        }

        // Procesar paso actual
        const paso = PASOS[pasoActual];

        // Cancelar en cualquier momento
        if (textoLower === 'cancelar') {
            agregarMensajeBot('Proceso cancelado. ❌ ¿Deseas empezar de nuevo? Escribe **"crear cliente"**.');
            setPasoActual(-1);
            setClienteData({ tipo_identificacion: 'CC', activo: true });
            return;
        }

        // Permitir saltar campos opcionales
        const esSaltar = ['saltar', 'no', 'no tengo', 'siguiente', 'skip', '-', 'n/a'].includes(textoLower);
        if (esSaltar) {
            if (paso.obligatorio) {
                agregarMensajeBot('⚠️ Este campo es **obligatorio**, no puedo saltarlo. Por favor escribe una respuesta.');
                return;
            }
            // Avanzar al siguiente paso sin guardar valor
            avanzarSiguientePaso(null);
            return;
        }

        // Validar respuesta
        if (!texto.trim()) {
            agregarMensajeBot('Por favor, escribe una respuesta válida. 🙏');
            return;
        }

        // Guardar respuesta según el tipo
        let valorFinal = texto.trim();

        // ========== VALIDACIONES INTELIGENTES POR CAMPO ==========

        // Validar nombre del negocio
        if (paso.campo === 'alias') {
            if (valorFinal.length < 3) {
                agregarMensajeBot('🤔 El nombre del negocio parece muy corto. ¿Puedes escribirlo completo?\n\n_Ejemplo: Tienda El Sol, Minimercado La Esquina_');
                return;
            }
        }

        // Validar nombre del contacto
        if (paso.campo === 'nombre_completo') {
            if (valorFinal.length < 3) {
                agregarMensajeBot('🤔 El nombre parece muy corto. ¿Puedes escribir el nombre completo?\n\n_Ejemplo: Juan Pérez, María García_');
                return;
            }
            // Verificar que tenga al menos una letra
            if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(valorFinal)) {
                agregarMensajeBot('🤔 Eso no parece un nombre. Por favor escribe el nombre del contacto.\n\n_Ejemplo: María García_');
                return;
            }
        }

        // Validar tipo de identificación
        if (paso.campo === 'tipo_identificacion') {
            const tiposValidos = {
                'cc': 'CC', 'cedula': 'CC', 'cédula': 'CC',
                'nit': 'NIT',
                'rut': 'RUT',
                'ce': 'CE', 'extranjeria': 'CE'
            };
            const tipoNormalizado = tiposValidos[textoLower];

            if (!tipoNormalizado) {
                agregarMensajeBot('🤔 No reconocí ese tipo. Por favor escribe:\n\n• **CC** - Cédula de Ciudadanía\n• **NIT** - Número de Identificación Tributaria\n• **RUT** - Registro Único Tributario\n• **CE** - Cédula de Extranjería', ['CC', 'NIT', 'RUT']);
                return;
            }
            valorFinal = tipoNormalizado;
        }

        // Validar identificación (cédula o NIT)
        if (paso.campo === 'identificacion') {
            // Limpiar: solo dejar números
            const soloNumeros = valorFinal.replace(/[^0-9]/g, '');

            if (soloNumeros.length < 6) {
                agregarMensajeBot('🤔 La cédula o NIT debe tener al menos **6 dígitos**.\n\n_Ejemplo: 1234567890 o 900123456_\n\n¿Puedes verificar el número?');
                return;
            }
            if (soloNumeros.length > 12) {
                agregarMensajeBot('🤔 Ese número parece muy largo. Una cédula tiene máximo **10 dígitos** y un NIT **11 dígitos**.\n\n¿Puedes verificarlo?');
                return;
            }
            valorFinal = soloNumeros; // Guardar solo números
        }

        // Validar celular
        if (paso.campo === 'movil') {
            // Limpiar: solo dejar números
            const soloNumeros = valorFinal.replace(/[^0-9]/g, '');

            if (soloNumeros.length !== 10) {
                agregarMensajeBot('🤔 El celular debe tener exactamente **10 dígitos**.\n\n_Ejemplo: 3001234567_\n\n¿Puedes verificar el número?');
                return;
            }
            if (!soloNumeros.startsWith('3')) {
                agregarMensajeBot('🤔 Los celulares en Colombia empiezan con **3**.\n\n_Ejemplo: 3001234567, 3101234567_\n\n¿Es correcto el número?');
                return;
            }
            valorFinal = soloNumeros; // Guardar solo números
        }

        // Validar dirección
        if (paso.campo === 'direccion') {
            if (valorFinal.length < 5) {
                agregarMensajeBot('🤔 La dirección parece muy corta. ¿Puedes escribirla más completa?\n\n_Ejemplo: Calle 123 #45-67, Barrio Centro_');
                return;
            }
        }

        // Validar ciudad
        if (paso.campo === 'ciudad') {
            if (valorFinal.length < 3) {
                agregarMensajeBot('🤔 La ciudad parece muy corta. ¿Puedes escribirla completa?\n\n_Ejemplo: Bogotá, Medellín, Cali_');
                return;
            }
            if (/\d/.test(valorFinal)) {
                agregarMensajeBot('🤔 La ciudad no debería tener números. ¿Puedes verificarla?\n\n_Ejemplo: Villavicencio, Santa Marta_');
                return;
            }
        }

        // ========== FIN VALIDACIONES ==========

        if (paso.campo === 'dia_entrega') {
            // Convertir días a formato correcto
            const diasMap = {
                'lunes': 'LUNES', 'lu': 'LUNES', 'l': 'LUNES',
                'martes': 'MARTES', 'ma': 'MARTES',
                'miercoles': 'MIERCOLES', 'miércoles': 'MIERCOLES', 'mi': 'MIERCOLES',
                'jueves': 'JUEVES', 'ju': 'JUEVES',
                'viernes': 'VIERNES', 'vi': 'VIERNES',
                'sabado': 'SABADO', 'sábado': 'SABADO', 'sa': 'SABADO'
            };

            const diasTexto = texto.toLowerCase().split(/[,\s]+/);
            const diasValidos = diasTexto
                .map(d => diasMap[d.trim()])
                .filter(Boolean);

            if (diasValidos.length === 0) {
                agregarMensajeBot('No reconocí esos días. 🤔 Por favor escribe los días, por ejemplo: **Lunes, Miércoles, Viernes**');
                return;
            }

            valorFinal = diasValidos.join(',');
        }

        // Guardar el valor y avanzar
        avanzarSiguientePaso(valorFinal);
    };

    // Función para avanzar al siguiente paso
    const avanzarSiguientePaso = (valor) => {
        const paso = PASOS[pasoActual];

        // Guardar el valor si existe
        const nuevosClienteData = valor !== null
            ? { ...clienteData, [paso.campo]: valor }
            : clienteData;

        if (valor !== null) {
            setClienteData(nuevosClienteData);
        }

        // Si estamos editando un campo, volver al resumen
        if (modoEdicion) {
            setModoEdicion(false);
            setModoConfirmacion(true);
            setTimeout(() => {
                const datos = nuevosClienteData;
                const resumen = `✅ Campo actualizado!\n\n📋 **Resumen del cliente:**\n\n` +
                    `📍 **Negocio:** ${datos.alias || '-'}\n` +
                    `👤 **Contacto:** ${datos.nombre_completo || '-'}\n` +
                    `🆔 **${datos.tipo_identificacion || 'CC'}:** ${datos.identificacion || '-'}\n` +
                    `📱 **Celular:** ${datos.movil || '-'}\n` +
                    `🏠 **Dirección:** ${datos.direccion || '-'}\n` +
                    `🌆 **Ciudad:** ${datos.ciudad || '-'}\n` +
                    `📅 **Días:** ${datos.dia_entrega || '-'}\n` +
                    `🛣️ **Ruta:** ${datos.zona_barrio || '-'}\n` +
                    `👔 **Vendedor:** ${datos.vendedor_asignado || '-'}\n` +
                    `💰 **Lista precios:** ${datos.tipo_lista_precio || '-'}`;

                agregarMensajeBot(resumen);
                setTimeout(() => {
                    agregarMensajeBot('¿Los datos están **correctos**? ¿O deseas **editar** algo más?', ['Guardar', 'Editar datos', 'Empezar de nuevo']);
                }, 500);
            }, 300);
            return;
        }

        // Siguiente paso o crear cliente
        if (pasoActual < PASOS.length - 1) {
            const siguientePaso = pasoActual + 1;
            setPasoActual(siguientePaso);

            setTimeout(() => {
                const msgConfirm = valor !== null ? '✓ Perfecto!\n\n' : '➡️ ';
                // Determinar opciones según el tipo de campo
                let opciones = null;
                if (PASOS[siguientePaso].tipo === 'vendedor') {
                    opciones = vendedores.map(v => v.nombre);
                } else if (PASOS[siguientePaso].tipo === 'lista_precio') {
                    opciones = listaPrecios.map(l => l.nombre);
                } else if (PASOS[siguientePaso].tipo === 'tipo_id') {
                    opciones = ['CC', 'NIT', 'RUT'];
                } else if (PASOS[siguientePaso].tipo === 'ruta') {
                    opciones = rutas.map(r => r.nombre);
                }
                // Para días NO mostramos botones, el usuario escribe: "Lunes, Miércoles, Viernes"

                agregarMensajeBot(`${msgConfirm}${PASOS[siguientePaso].pregunta}`, opciones);
            }, 300);
        } else {
            // Guardar el último valor
            const datosFinales = valor !== null
                ? { ...clienteData, [paso.campo]: valor }
                : clienteData;
            setClienteData(datosFinales);

            // Mostrar resumen para confirmar
            setModoConfirmacion(true);
            setTimeout(() => {
                const resumen = `📋 **Resumen del cliente:**\n\n` +
                    `📍 **Negocio:** ${datosFinales.alias || '-'}\n` +
                    `👤 **Contacto:** ${datosFinales.nombre_completo || '-'}\n` +
                    `🆔 **${datosFinales.tipo_identificacion || 'CC'}:** ${datosFinales.identificacion || '-'}\n` +
                    `📱 **Celular:** ${datosFinales.movil || '-'}\n` +
                    `🏠 **Dirección:** ${datosFinales.direccion || '-'}\n` +
                    `🌆 **Ciudad:** ${datosFinales.ciudad || '-'}\n` +
                    `📅 **Días:** ${datosFinales.dia_entrega || '-'}\n` +
                    `🛣️ **Ruta:** ${datosFinales.zona_barrio || '-'}\n` +
                    `👔 **Vendedor:** ${datosFinales.vendedor_asignado || '-'}\n` +
                    `💰 **Lista precios:** ${datosFinales.tipo_lista_precio || '-'}`;

                agregarMensajeBot(resumen);
                setTimeout(() => {
                    agregarMensajeBot('¿Los datos están **correctos**? ¿O deseas **editar** algo?', ['Guardar', 'Editar datos', 'Empezar de nuevo']);
                }, 500);
            }, 300);
        }
    };

    const crearCliente = async (datos) => {
        setCreandoCliente(true);
        agregarMensajeBot('⏳ Creando cliente...');

        try {
            // Asegurar que identificacion tenga un valor por defecto si está vacío
            const datosLimpios = {
                ...datos,
                identificacion: datos.identificacion || 'SIN-ID-' + Date.now(),
                tipo_identificacion: datos.tipo_identificacion || 'CC'
            };

            console.log('📤 Enviando datos:', datosLimpios);
            const resultado = await clienteService.create(datosLimpios);
            console.log('📥 Resultado:', resultado);

            if (resultado && !resultado.error && resultado.id) {
                setClienteCreado(true);
                setTimeout(() => {
                    agregarMensajeBot(`✅ **¡Cliente creado exitosamente!**\n\n📍 **${datosLimpios.alias || datosLimpios.nombre_completo}**\n👤 ${datosLimpios.nombre_completo}\n📱 ${datosLimpios.movil || 'Sin celular'}\n📍 ${datosLimpios.direccion || 'Sin dirección'}\n📅 Días: ${datosLimpios.dia_entrega || 'Sin días'}`);
                    setTimeout(() => {
                        agregarMensajeBot('¿Qué deseas hacer ahora?', ['Hacer pedido', 'Crear otro cliente', 'Ir a lista de clientes']);
                    }, 500);
                }, 500);
            } else {
                console.error('Error en resultado:', resultado);
                agregarMensajeBot(`❌ Hubo un error al crear el cliente.\n\n_${resultado?.message || 'Error desconocido'}_\n\nPor favor intenta de nuevo.`);
            }
        } catch (error) {
            console.error('Error creando cliente:', error);
            agregarMensajeBot('❌ Error de conexión. Verifica tu conexión e intenta de nuevo.');
        } finally {
            setCreandoCliente(false);
        }
    };

    const reiniciarChat = () => {
        setMensajes([]);
        setPasoActual(-1);
        setClienteData({ tipo_identificacion: 'CC', activo: true });
        setClienteCreado(false);

        agregarMensajeBot('¡Perfecto! Vamos a crear otro cliente. 🚀');
        setTimeout(() => {
            setPasoActual(0);
            agregarMensajeBot(PASOS[0].pregunta);
        }, 500);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputValue.trim() || creandoCliente) return;

        agregarMensajeUsuario(inputValue);
        procesarRespuesta(inputValue);
        setInputValue('');
    };

    const handleOptionClick = (opcion) => {
        agregarMensajeUsuario(opcion);
        procesarRespuesta(opcion);
        setInputValue(''); // Limpiar input
    };

    // Renderizar mensaje con formato markdown básico
    const renderTexto = (texto) => {
        return texto.split('\n').map((linea, i) => (
            <span key={i}>
                {linea.split(/(\*\*.*?\*\*)/).map((parte, j) => {
                    if (parte.startsWith('**') && parte.endsWith('**')) {
                        return <strong key={j}>{parte.slice(2, -2)}</strong>;
                    }
                    return parte;
                })}
                {i < texto.split('\n').length - 1 && <br />}
            </span>
        ));
    };

    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', paddingTop: '20px' }}>
            <Container>
                <Row className="justify-content-center">
                    <Col md={8} lg={6}>
                        {/* Header */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div className="d-flex align-items-center gap-2">
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: '#06386d',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '20px'
                                }}>
                                    🤖
                                </div>
                                <div>
                                    <h5 className="mb-0" style={{ color: '#06386d' }}>Asistente de Clientes</h5>
                                    <small className="text-muted">Crea clientes de forma fácil</small>
                                </div>
                            </div>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => navigate('/clientes')}
                            >
                                ← Volver
                            </Button>
                        </div>

                        {/* Chat Container */}
                        <Card style={{
                            borderRadius: '16px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                            height: 'calc(100vh - 200px)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {/* Mensajes */}
                            <Card.Body style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                {mensajes.map((msg, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: 'flex',
                                            justifyContent: msg.tipo === 'usuario' ? 'flex-end' : 'flex-start',
                                            flexDirection: 'column',
                                            alignItems: msg.tipo === 'usuario' ? 'flex-end' : 'flex-start'
                                        }}
                                    >
                                        <div style={{
                                            maxWidth: '85%',
                                            padding: '12px 16px',
                                            borderRadius: msg.tipo === 'usuario'
                                                ? '18px 18px 4px 18px'
                                                : '18px 18px 18px 4px',
                                            backgroundColor: msg.tipo === 'usuario' ? '#06386d' : 'white',
                                            color: msg.tipo === 'usuario' ? 'white' : '#333',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                            fontSize: '0.95rem',
                                            lineHeight: '1.5'
                                        }}>
                                            {renderTexto(msg.texto)}
                                        </div>

                                        {/* Opciones de respuesta rápida */}
                                        {msg.opciones && msg.tipo === 'bot' && (
                                            <div style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '8px',
                                                marginTop: '8px',
                                                maxWidth: '85%'
                                            }}>
                                                {msg.opciones.slice(0, 5).map((opcion, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleOptionClick(opcion)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '16px',
                                                            border: '1px solid #06386d',
                                                            backgroundColor: 'white',
                                                            color: '#06386d',
                                                            fontSize: '0.85rem',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseOver={(e) => {
                                                            e.target.style.backgroundColor = '#06386d';
                                                            e.target.style.color = 'white';
                                                        }}
                                                        onMouseOut={(e) => {
                                                            e.target.style.backgroundColor = 'white';
                                                            e.target.style.color = '#06386d';
                                                        }}
                                                    >
                                                        {opcion}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </Card.Body>

                            {/* Input */}
                            <div style={{
                                padding: '16px',
                                borderTop: '1px solid #eee',
                                backgroundColor: '#fafafa'
                            }}>
                                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder={pasoActual >= 0 && pasoActual < PASOS.length
                                            ? PASOS[pasoActual].placeholder
                                            : "Escribe un mensaje..."}
                                        disabled={creandoCliente}
                                        style={{
                                            flex: 1,
                                            padding: '12px 16px',
                                            borderRadius: '24px',
                                            border: '1px solid #ddd',
                                            fontSize: '0.95rem',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#06386d'}
                                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                    />
                                    <button
                                        type="submit"
                                        disabled={creandoCliente || !inputValue.trim()}
                                        style={{
                                            padding: '12px 24px',
                                            borderRadius: '24px',
                                            border: 'none',
                                            backgroundColor: inputValue.trim() ? '#06386d' : '#ccc',
                                            color: 'white',
                                            fontWeight: '600',
                                            cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        {creandoCliente ? '...' : 'Enviar'}
                                    </button>
                                </form>
                            </div>
                        </Card>

                        {/* Indicador de progreso */}
                        {pasoActual >= 0 && pasoActual < PASOS.length && !clienteCreado && (
                            <div className="text-center mt-3">
                                <small className="text-muted">
                                    Paso {pasoActual + 1} de {PASOS.length}
                                </small>
                                <div style={{
                                    height: '4px',
                                    backgroundColor: '#e0e0e0',
                                    borderRadius: '2px',
                                    marginTop: '8px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${((pasoActual + 1) / PASOS.length) * 100}%`,
                                        backgroundColor: '#06386d',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                            </div>
                        )}
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default ClienteIAScreen;
