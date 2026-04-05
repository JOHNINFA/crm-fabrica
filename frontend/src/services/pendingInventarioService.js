/**
 * Servicio para manejar grabados de inventario pendientes (sin internet)
 * Guarda el payload en localStorage y lo reintenta cuando vuelve la conexión
 */

const PREFIX = 'pending_inventario_';

export const pendingInventarioService = {
  guardar: (tipo, fecha, payload) => {
    const key = `${PREFIX}${tipo}_${fecha}`;
    localStorage.setItem(key, JSON.stringify({ tipo, fecha, payload, ts: Date.now() }));
  },

  borrar: (tipo, fecha) => {
    const key = `${PREFIX}${tipo}_${fecha}`;
    localStorage.removeItem(key);
  },

  obtenerTodos: () => {
    const pendientes = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data) pendientes.push({ key, ...data });
        } catch (e) { /* ignorar */ }
      }
    }
    return pendientes;
  },

  borrarPorKey: (key) => {
    localStorage.removeItem(key);
  }
};
