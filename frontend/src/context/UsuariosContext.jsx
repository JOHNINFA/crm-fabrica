import React, { createContext, useContext, useState, useEffect } from 'react';
import { cajeroService } from '../services/cajeroService';
import { sucursalService } from '../services/sucursalService';

const UsuariosContext = createContext();

export const useUsuarios = () => {
    const context = useContext(UsuariosContext);
    if (!context) {
        throw new Error('useUsuarios debe ser usado dentro de UsuariosProvider');
    }
    return context;
};

export const UsuariosProvider = ({ children }) => {
    const [usuarios, setUsuarios] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(false);

    // Cargar datos iniciales
    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [usuariosData, sucursalesData] = await Promise.all([
                cajeroService.getAll(),
                sucursalService.getAll()
            ]);
            setUsuarios(usuariosData);
            setSucursales(sucursalesData);
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setLoading(false);
        }
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

    // Actualizar usuario
    const actualizarUsuario = async (id, datosUsuario) => {
        try {
            const usuarioActualizado = await cajeroService.update(id, datosUsuario);
            setUsuarios(prev => 
                prev.map(u => u.id === id ? usuarioActualizado : u)
            );
            return { success: true, usuario: usuarioActualizado };
        } catch (error) {
            console.error('Error actualizando usuario:', error);
            return { success: false, error: error.message };
        }
    };

    // Eliminar usuario
    const eliminarUsuario = async (id) => {
        try {
            await cajeroService.delete(id);
            setUsuarios(prev => prev.filter(u => u.id !== id));
            return { success: true };
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
        return usuarios.filter(usuario => {
            if (modulo === 'POS') {
                // Para POS: cajeros que pueden vender (rol CAJERO o que tengan permisos de venta)
                return usuario.activo && (
                    usuario.rol === 'CAJERO' || 
                    usuario.rol === 'SUPERVISOR' || 
                    usuario.rol === 'ADMINISTRADOR'
                );
            } else if (modulo === 'REMISIONES') {
                // Para Remisiones: cualquier usuario activo (no necesariamente vendedor)
                return usuario.activo;
            }
            return false;
        });
    };

    const value = {
        usuarios,
        sucursales,
        loading,
        cargarDatos,
        crearUsuario,
        actualizarUsuario,
        eliminarUsuario,
        crearSucursal,
        getUsuariosPorModulo
    };

    return (
        <UsuariosContext.Provider value={value}>
            {children}
        </UsuariosContext.Provider>
    );
};