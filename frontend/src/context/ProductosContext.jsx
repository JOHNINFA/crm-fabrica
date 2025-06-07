import React, { createContext, useState, useContext, useEffect } from 'react';
import productosIniciales from '../data/productos';

// Crear el contexto
const ProductosContext = createContext();

// Hook personalizado para usar el contexto
export const useProductos = () => useContext(ProductosContext);

// Proveedor del contexto
export const ProductosProvider = ({ children }) => {
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    setProductos(productosIniciales);
    
    const movimientosIniciales = [
      { 
        id: 1, 
        fecha: '2023-05-10', 
        hora: '10:30', 
        producto: 'AREPA TIPO OBLEA', 
        cantidad: 5, 
        tipo: 'Entrada', 
        usuario: 'Admin',
        lote: 'L001',
        fechaVencimiento: '10/11/2023'
      },
      { 
        id: 2, 
        fecha: '2023-05-09', 
        hora: '15:45', 
        producto: 'AREPA MEDIANA', 
        cantidad: 3, 
        tipo: 'Salida', 
        usuario: 'Usuario',
        lote: 'L002',
        fechaVencimiento: '-'
      },
    ];
    
    setMovimientos(movimientosIniciales);
  }, []);

  // Función para actualizar existencias
  const actualizarExistencias = (productosActualizados) => {
    setProductos(productosActualizados);
  };

  // Función para agregar movimientos
  const agregarMovimientos = (nuevosMovimientos) => {
    setMovimientos(prevMovimientos => [...nuevosMovimientos, ...prevMovimientos]);
  };

  // Valor del contexto
  const value = {
    productos,
    movimientos,
    actualizarExistencias,
    agregarMovimientos
  };

  return (
    <ProductosContext.Provider value={value}>
      {children}
    </ProductosContext.Provider>
  );
};

export default ProductosContext;