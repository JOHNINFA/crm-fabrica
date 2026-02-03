import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../services/api';

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
            const response = await fetch(`${API_URL}/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo, password })
            });

            const data = await response.json();

            if (data.success) {
                setUsuario(data.usuario);
                localStorage.setItem('crm_usuario', JSON.stringify(data.usuario));

                // 🧹 Limpieza de higiene: Borrar cualquier rastro de turno de sesiones anteriores
                // Esto evita que un usuario nuevo herede un turno "zombie" en localStorage y se le bloquee el logout
                localStorage.removeItem('turno_activo');
                localStorage.removeItem('cajero_logueado');

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
        // 🔒 VERIFICACIÓN DE CAJA GLOBAL (Para Admins y Cajeros)
        // Verificar si hay un turno activo en localStorage antes de permitir la salida del sistema
        const turnoGuardado = localStorage.getItem('turno_activo');
        if (turnoGuardado) {
            try {
                const turno = JSON.parse(turnoGuardado);
                if (turno && turno.estado === 'ACTIVO') {
                    // ⛔ Bloquear salida
                    // Usamos alert nativo para asegurar bloqueo inmediato en cualquier parte del sistema
                    alert("⛔ CAJA ABIERTA\n\nNo puedes cerrar sesión del sistema mientras tengas un turno de caja activo.\n\nPor favor, dirígete al módulo POS/Caja y realiza el cierre de turno correspondiente.");
                    return; // Cancelar logout
                }
            } catch (e) {
                // Si el JSON es inválido, ignorar y permitir salir (limpiando basura)
                console.error('Error verificando turno activo en logout:', e);
                localStorage.removeItem('turno_activo');
            }
        }

        setUsuario(null);
        localStorage.removeItem('crm_usuario');

        // Limpiar también datos de caja por si acaso (aunque el bloqueo anterior debería prevenirlo)
        // Si llegamos aquí es porque no había turno activo o estaba corrupto
        localStorage.removeItem('turno_activo');
        localStorage.removeItem('cajero_logueado');
    };

    // Recuperar contraseña
    const recuperarPassword = async (contacto) => {
        try {
            const response = await fetch(`${API_URL}/auth/recuperar/`, {
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
            const response = await fetch(`${API_URL}/auth/cambiar-password/`, {
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
    // Verificar si es admin (Versión robusta)
    const esAdmin = () => {
        if (!usuario) return false;
        if (usuario.es_admin === true) return true;

        const rol = usuario.rol ? usuario.rol.toUpperCase() : '';
        const rolesAdmin = ['ADMIN', 'ADMINISTRADOR', 'ADMINISTRADOR DE SISTEMA', 'SUPERUSUARIO', 'GERENTE'];

        return rolesAdmin.includes(rol);
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
