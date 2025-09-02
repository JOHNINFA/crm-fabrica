import React, { createContext, useContext, useState } from 'react';

const VendedoresContext = createContext();

export const useVendedores = () => {
  const context = useContext(VendedoresContext);
  if (!context) {
    throw new Error('useVendedores debe usarse dentro de VendedoresProvider');
  }
  return context;
};

export const VendedoresProvider = ({ children }) => {
  // Estado para almacenar datos de todos los vendedores
  const [datosVendedores, setDatosVendedores] = useState({
    ID1: [],
    ID2: [],
    ID3: [],
    ID4: [],
    ID5: [],
    ID6: []
  });

  // Actualizar datos de un vendedor específico
  const actualizarDatosVendedor = (idVendedor, productos) => {
    console.log(`\n🔄 ACTUALIZANDO ${idVendedor}:`);
    console.log('Productos recibidos:', productos.filter(p => p.total > 0).map(p => `${p.producto}: ${p.total}`));
    
    setDatosVendedores(prev => {
      const nuevo = {
        ...prev,
        [idVendedor]: productos
      };
      console.log('Estado actualizado:', Object.keys(nuevo).map(id => `${id}: ${nuevo[id].length} productos`));
      return nuevo;
    });
  };

  // Calcular total de productos para Producción
  const calcularTotalProductos = (nombreProducto) => {
    let total = 0;
    let debug = `\n=== ${nombreProducto} ===\n`;
    
    Object.entries(datosVendedores).forEach(([idVendedor, vendedor]) => {
      const producto = vendedor.find(p => p.producto === nombreProducto);
      if (producto && producto.total > 0) {
        debug += `${idVendedor}: ${producto.total}\n`;
        total += producto.total || 0;
      }
    });
    
    debug += `TOTAL: ${total}\n=================`;
    
    // Mostrar en la página si hay datos
    if (total > 0) {
      const debugElement = document.getElementById('debug-produccion');
      if (debugElement) {
        debugElement.innerHTML = debug.replace(/\n/g, '<br>');
      }
    }
    
    return total;
  };

  const value = {
    datosVendedores,
    actualizarDatosVendedor,
    calcularTotalProductos
  };

  return (
    <VendedoresContext.Provider value={value}>
      {children}
    </VendedoresContext.Provider>
  );
};