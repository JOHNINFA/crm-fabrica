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
    setDatosVendedores(prev => ({
      ...prev,
      [idVendedor]: productos
    }));
  };

  // Calcular total de productos para Producción
  const calcularTotalProductos = (nombreProducto) => {
    let total = 0;
    Object.values(datosVendedores).forEach(vendedor => {
      const producto = vendedor.find(p => p.producto === nombreProducto);
      if (producto) {
        total += producto.total || 0;
      }
    });
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