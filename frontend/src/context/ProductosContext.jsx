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

  // Cargar datos iniciales y persistir estado
  useEffect(() => {
    // Intentar cargar productos y movimientos desde localStorage
    try {
      const productosGuardados = localStorage.getItem('productos');
      const movimientosGuardados = localStorage.getItem('movimientos');
      
      if (productosGuardados) {
        // Verificar que todos los productos iniciales estén presentes
        const productosGuardadosObj = JSON.parse(productosGuardados);
        
        // Asegurarse de que todos los productos iniciales estén incluidos
        const productosCompletos = productosIniciales.map(productoInicial => {
          const productoGuardado = productosGuardadosObj.find(p => p.id === productoInicial.id);
          if (productoGuardado) {
            // Mantener los datos guardados pero asegurar que tenga todos los campos del inicial
            return {
              ...productoInicial,
              ...productoGuardado,
              // Asegurar que la categoría se mantenga del inicial
              categoria: productoInicial.categoria
            };
          }
          return productoInicial;
        });
        
        setProductos(productosCompletos);
      } else {
        setProductos(productosIniciales);
      }
      
      if (movimientosGuardados) {
        setMovimientos(JSON.parse(movimientosGuardados));
      } else {
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
      }
    } catch (error) {
      console.error('Error al cargar datos desde localStorage:', error);
      setProductos(productosIniciales);
      setMovimientos([]);
    }
  }, []);

  // Función para actualizar existencias
  const actualizarExistencias = (productosActualizados) => {
    setProductos(productosActualizados);
    
    // Guardar en localStorage
    try {
      localStorage.setItem('productos', JSON.stringify(productosActualizados));
    } catch (error) {
      console.error('Error al guardar productos en localStorage:', error);
    }
  };

  // Función para agregar movimientos
  const agregarMovimientos = (nuevosMovimientos) => {
    // Verificar si hay movimientos duplicados antes de agregarlos
    setMovimientos(prevMovimientos => {
      // Filtrar movimientos que ya existen (mismo id)
      const movimientosNoRepetidos = nuevosMovimientos.filter(
        nuevoMov => !prevMovimientos.some(prevMov => prevMov.id === nuevoMov.id)
      );
      
      const movimientosActualizados = [...movimientosNoRepetidos, ...prevMovimientos];
      
      // Guardar en localStorage
      try {
        localStorage.setItem('movimientos', JSON.stringify(movimientosActualizados));
      } catch (error) {
        console.error('Error al guardar movimientos en localStorage:', error);
      }
      
      return movimientosActualizados;
    });
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