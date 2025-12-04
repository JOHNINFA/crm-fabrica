// 🚀 UTILIDAD PARA MANEJO DE RESPONSABLES EN LOCALSTORAGE
// Evita rebotes y centraliza la lógica de almacenamiento

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'responsables_cargue';

export const responsableStorage = {
  // Obtener responsable específico
  get: (idSheet) => {
    try {
      const responsables = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const responsable = responsables[idSheet];
      
      if (responsable && responsable !== 'RESPONSABLE') {
        console.log(`📦 ResponsableStorage.get(${idSheet}): "${responsable}"`);
        return responsable;
      }
      
      console.log(`⚠️ ResponsableStorage.get(${idSheet}): No encontrado o es RESPONSABLE`);
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo responsable:', error);
      return null;
    }
  },

  // Obtener todos los responsables
  getAll: () => {
    try {
      const responsables = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

      return responsables;
    } catch (error) {
      console.error('❌ Error obteniendo todos los responsables:', error);
      return {};
    }
  },

  // Guardar responsable específico
  set: (idSheet, nombre) => {
    try {
      const responsables = responsableStorage.getAll();
      responsables[idSheet] = nombre;
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(responsables));
      
      // Disparar evento para notificar cambios
      window.dispatchEvent(new CustomEvent('responsableActualizado', {
        detail: {
          idSheet,
          nuevoNombre: nombre
        }
      }));
      
      console.log(`💾 ResponsableStorage.set(${idSheet}): "${nombre}"`);
      return true;
    } catch (error) {
      console.error('❌ Error guardando responsable:', error);
      return false;
    }
  },

  // Guardar múltiples responsables
  setAll: (responsables) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(responsables));

      return true;
    } catch (error) {
      console.error('❌ Error guardando todos los responsables:', error);
      return false;
    }
  },

  // Limpiar todos los responsables
  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);

      return true;
    } catch (error) {
      console.error('❌ Error limpiando responsables:', error);
      return false;
    }
  },

  // Verificar si existe un responsable
  exists: (idSheet) => {
    const responsable = responsableStorage.get(idSheet);
    return responsable !== null;
  }
};

// Hook personalizado para usar responsables con React
export const useResponsableStorage = (idSheet) => {
  const [responsable, setResponsable] = useState(() => {
    return responsableStorage.get(idSheet) || 'RESPONSABLE';
  });

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail && e.detail.idSheet === idSheet) {
        setResponsable(e.detail.nuevoNombre);
      }
    };

    window.addEventListener('responsableActualizado', handleUpdate);
    return () => window.removeEventListener('responsableActualizado', handleUpdate);
  }, [idSheet]);

  const updateResponsable = (nuevoNombre) => {
    responsableStorage.set(idSheet, nuevoNombre);
  };

  return [responsable, updateResponsable];
};