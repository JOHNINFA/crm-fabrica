import React, { createContext, useContext, useState, useEffect } from 'react';
import { cajeroService } from '../services/cajeroService';
import { sucursalService } from '../services/sucursalService';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const UsuariosContext = createContext();

export const useUsuarios = () => {
    const context = useContext(UsuariosContext);
    if (!context) {
        throw new Error('useUsuarios debe ser usado dentro de UsuariosProvider');
    }
    return context;
};

export const UsuariosProvider = ({ children }) => {
    const [usuarios, setUsuarios] = useState([]);          // Usuarios del sistema (Cajero)
    const [vendedores, setVendedores] = useState([]);      // 🆕 Vendedores de App Móvil
    const [rutas, setRutas] = useState([]);                // 🆕 Todas las rutas
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(false);

    // Cargar datos iniciales
    useEffect(() => {
        cargarDatos();

        // 🆕 Escuchar evento de actualización de vendedores desde otros componentes
        const handleVendedorActualizado = () => {
            console.log('🔄 Recargando vendedores por evento global...');
            cargarVendedores();
            cargarRutas();
        };

        window.addEventListener('vendedorActualizado', handleVendedorActualizado);

        return () => {
            window.removeEventListener('vendedorActualizado', handleVendedorActualizado);
        };
    }, []);

    // 🆕 Función separada para cargar solo vendedores
    const cargarVendedores = async () => {
        try {
            const vendedoresData = await fetch(`${API_URL}/vendedores/`).then(r => r.json()).catch(() => []);
            setVendedores(vendedoresData);
        } catch (error) {
            console.error('Error cargando vendedores:', error);
        }
    };

    // 🆕 Función para cargar rutas
    const cargarRutas = async () => {
        try {
            const rutasData = await fetch(`${API_URL}/rutas/`).then(r => r.json()).catch(() => []);
            setRutas(rutasData);
        } catch (error) {
            console.error('Error cargando rutas:', error);
        }
    };

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [usuariosData, sucursalesData, vendedoresData, rutasData] = await Promise.all([
                cajeroService.getAll(),
                sucursalService.getAll(),
                // 🆕 Cargar vendedores de App Móvil
                fetch(`${API_URL}/vendedores/`).then(r => r.json()).catch(() => []),
                // 🆕 Cargar rutas
                fetch(`${API_URL}/rutas/`).then(r => r.json()).catch(() => [])
            ]);
            setUsuarios(usuariosData);
            setSucursales(sucursalesData);
            setVendedores(vendedoresData);
            setRutas(rutasData);
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setLoading(false);
        }
    };

    // 🆕 Obtener rutas de un vendedor específico
    const getRutasVendedor = (idVendedor) => {
        return rutas.filter(r => r.vendedor === idVendedor);
    };

    // 🆕 Obtener todos los usuarios unificados (sistema + vendedores)
    const getUsuariosUnificados = () => {
        // Convertir vendedores al formato unificado
        const vendedoresUnificados = vendedores.map(v => ({
            id: v.id_vendedor, // 🔧 Usar id_vendedor como ID (ej: "ID1", "ID2")
            codigo: v.id_vendedor, // ID1, ID2, etc.
            nombre: v.nombre,
            ruta: v.ruta, // 🆕 Mapear ruta
            email: null,
            telefono: v.telefono,
            rol: 'VENDEDOR',
            activo: v.activo !== false,
            // Permisos por defecto para vendedores
            acceso_app_movil: true,
            acceso_pos: false,
            acceso_pedidos: false,
            acceso_cargue: false,
            acceso_produccion: false,
            acceso_inventario: false,
            acceso_reportes: false,
            acceso_configuracion: false,
            // Marcar como vendedor de app
            es_vendedor_app: true,
            password_visible: v.password // Los vendedores muestran password
        }));

        // Usuarios del sistema
        const usuariosSistema = usuarios.map(u => ({
            ...u,
            es_vendedor_app: false,
            password_visible: u.password_plano // 🆕 Ahora usamos la copia visible
        }));

        // Combinar y ordenar: usuarios sistema primero, vendedores app al final
        return [...usuariosSistema, ...vendedoresUnificados].sort((a, b) => {
            // Primero usuarios sistema, luego vendedores de app
            if (!a.es_vendedor_app && b.es_vendedor_app) return -1;
            if (a.es_vendedor_app && !b.es_vendedor_app) return 1;
            return a.nombre.localeCompare(b.nombre);
        });
    };

    // Crear usuario
    const crearUsuario = async (datosUsuario) => {
        try {
            const nuevoUsuario = await cajeroService.create(datosUsuario);
            setUsuarios(prev => [...prev, nuevoUsuario]);
            return { success: true, usuario: nuevoUsuario };
        } catch (error) {
            console.error('Error creando usuario:', error);
            return { success: false, error: error.message };
        }
    };

    // 🆕 Crear vendedor de App Móvil
    const crearVendedor = async (datosVendedor) => {
        try {
            const response = await fetch(`${API_URL}/vendedores/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosVendedor)
            });
            if (response.ok) {
                const nuevoVendedor = await response.json();
                setVendedores(prev => [...prev, nuevoVendedor]);
                return { success: true, vendedor: nuevoVendedor };
            }
            return { success: false, error: 'Error creando vendedor' };
        } catch (error) {
            console.error('Error creando vendedor:', error);
            return { success: false, error: error.message };
        }
    };

    // Actualizar usuario
    const actualizarUsuario = async (id, datosUsuario, esVendedorApp = false) => {
        try {
            if (esVendedorApp) {
                // Actualizar vendedor de App (id es id_vendedor, ej: "ID1")
                const response = await fetch(`${API_URL}/vendedores/${id}/`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosUsuario)
                });
                if (response.ok) {
                    const vendedorActualizado = await response.json();
                    setVendedores(prev => prev.map(v => v.id_vendedor === id ? vendedorActualizado : v));
                    return { success: true, usuario: vendedorActualizado };
                }
                return { success: false, error: 'Error actualizando vendedor' };
            } else {
                const usuarioActualizado = await cajeroService.update(id, datosUsuario);
                setUsuarios(prev => prev.map(u => u.id === id ? usuarioActualizado : u));
                return { success: true, usuario: usuarioActualizado };
            }
        } catch (error) {
            console.error('Error actualizando usuario:', error);
            return { success: false, error: error.message };
        }
    };

    // Eliminar usuario
    const eliminarUsuario = async (id, esVendedorApp = false) => {
        try {
            if (esVendedorApp) {
                // id es id_vendedor para vendedores (ej: "ID1")
                const response = await fetch(`${API_URL}/vendedores/${id}/`, { method: 'DELETE' });
                if (response.ok) {
                    setVendedores(prev => prev.filter(v => v.id_vendedor !== id));
                    return { success: true };
                }
                return { success: false, error: 'Error eliminando vendedor' };
            } else {
                await cajeroService.delete(id);
                setUsuarios(prev => prev.filter(u => u.id !== id));
                return { success: true };
            }
        } catch (error) {
            console.error('Error eliminando usuario:', error);
            return { success: false, error: error.message };
        }
    };

    // Crear sucursal
    const crearSucursal = async (datosSucursal) => {
        try {
            const nuevaSucursal = await sucursalService.create(datosSucursal);
            setSucursales(prev => [...prev, nuevaSucursal]);
            return { success: true, sucursal: nuevaSucursal };
        } catch (error) {
            console.error('Error creando sucursal:', error);
            return { success: false, error: error.message };
        }
    };

    // Obtener usuarios por módulo
    const getUsuariosPorModulo = (modulo) => {
        const todos = getUsuariosUnificados();
        return todos.filter(usuario => {
            if (modulo === 'POS') {
                return usuario.activo && usuario.acceso_pos;
            } else if (modulo === 'REMISIONES' || modulo === 'PEDIDOS') {
                return usuario.activo && usuario.acceso_pedidos;
            } else if (modulo === 'APP') {
                return usuario.activo && usuario.acceso_app_movil;
            }
            return true;
        });
    };

    const value = {
        usuarios,
        vendedores,
        rutas,  // 🆕 Exponer rutas
        sucursales,
        loading,
        cargarDatos,
        crearUsuario,
        crearVendedor,
        actualizarUsuario,
        eliminarUsuario,
        crearSucursal,
        getUsuariosPorModulo,
        getUsuariosUnificados,  // 🆕 Obtener lista unificada
        getRutasVendedor  // 🆕 Obtener rutas de un vendedor
    };

    return (
        <UsuariosContext.Provider value={value}>
            {children}
        </UsuariosContext.Provider>
    );
};