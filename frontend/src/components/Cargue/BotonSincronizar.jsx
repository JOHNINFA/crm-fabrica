import React, { useState } from 'react';
import { Button } from 'react-bootstrap';

const BotonSincronizar = ({ productos, dia, idSheet, fechaSeleccionada }) => {
  const [sincronizando, setSincronizando] = useState(false);

  const sincronizar = async () => {
    setSincronizando(true);
    try {
      const { simpleStorage } = await import('../../services/simpleStorage');
      
      const fechaAUsar = fechaSeleccionada || new Date().toISOString().split('T')[0];
      const key = `cargue_${dia}_${idSheet}_${fechaAUsar}`;
      
      const productosFiltrados = productos.filter(p => 
        p.cantidad > 0 || 
        p.dctos > 0 || 
        p.adicional > 0 || 
        p.devoluciones > 0 || 
        p.vencidas > 0 || 
        p.vendedor || 
        p.despachador
      );
      
      const datos = {
        dia,
        idSheet,
        fecha: fechaAUsar,
        productos: productosFiltrados,
        timestamp: Date.now()
      };
      
      await simpleStorage.setItem(key, datos);
      
      // Mostrar confirmación visual
      const button = document.querySelector('.btn-sincronizar');
      if (button) {
        button.style.backgroundColor = '#28a745';
        button.textContent = '✅ Sincronizado';
        setTimeout(() => {
          button.style.backgroundColor = '';
          button.textContent = '🔄 Sincronizar';
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error sincronizando:', error);
      alert('Error al sincronizar datos');
    }
    setSincronizando(false);
  };

  return (
    <Button 
      variant="outline-primary" 
      size="sm"
      onClick={sincronizar}
      disabled={sincronizando}
      className="btn-sincronizar"
      style={{ minWidth: '100px' }}
    >
      {sincronizando ? '⏳ Guardando...' : '🔄 Sincronizar'}
    </Button>
  );
};

export default BotonSincronizar;