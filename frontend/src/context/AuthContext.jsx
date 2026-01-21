import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Cargar sesión guardada al iniciar
    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('crm_usuario');
        if (usuarioGuardado) {
            try {
                setUsuario(JSON.parse(usuarioGuardado));
            } catch (e) {
                localStorage.removeItem('crm_usuario');
            }
        }
        setLoading(false);
    }, []);

    // Login
    const login = async (codigo, password) => {
        setError(null);
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo, password })
            });

            const data = await response.json();

            if (data.success) {
                setUsuario(data.usuario);
                localStorage.setItem('crm_usuario', JSON.stringify(data.usuario));
                return { success: true, message: data.message };
            } else {
                setError(data.error);
                return { success: false, error: data.error };
            }
        } catch (err) {
            const errorMsg = 'Error de conexión con el servidor';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    // Logout
    const logout = () => {
        setUsuario(null);
        localStorage.removeItem('crm_usuario');
    };

    // Recuperar contraseña
    const recuperarPassword = async (contacto) => {
        try {
            const response = await fetch('/api/auth/recuperar/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contacto })
            });
            return await response.json();
        } catch (err) {
            return { success: false, error: 'Error de conexión' };
        }
    };

    // Cambiar contraseña
    const cambiarPassword = async (usuarioId, nuevaPassword, passwordActual = null) => {
        try {
            const response = await fetch('/api/auth/cambiar-password/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuario_id: usuarioId,
                    nueva_password: nuevaPassword,
                    password_actual: passwordActual
                })
            });
            return await response.json();
        } catch (err) {
            return { success: false, error: 'Error de conexión' };
        }
    };

    // Verificar si tiene permiso
    const tienePermiso = (permiso) => {
        if (!usuario) return false;
        if (usuario.es_admin) return true; // Admin tiene todos los permisos
        return usuario.permisos?.[permiso] === true;
    };

    // Verificar si es admin
    const esAdmin = () => {
        return usuario?.es_admin === true || usuario?.rol === 'ADMINISTRADOR';
    };

    const value = {
        usuario,
        loading,
        error,
        isAuthenticated: !!usuario,
        login,
        logout,
        recuperarPassword,
        cambiarPassword,
        tienePermiso,
        esAdmin
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
