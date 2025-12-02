import React, { createContext, useState, useContext } from 'react';

// Crear el contexto
const ModalContext = createContext();

// Hook personalizado para usar el contexto
export const useModalContext = () => useContext(ModalContext);

// Proveedor del contexto
export const ModalProvider = ({ children }) => {
  // Estado para el modal de productos
  const [showProductsModal, setShowProductsModal] = useState(false);

  // Estado para el modal de añadir producto
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // Estado para almacenar el producto seleccionado (para editar)
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Función para abrir el modal de productos
  const openProductsModal = () => {
    setShowProductsModal(true);
  };

  // Función para cerrar el modal de productos
  const closeProductsModal = () => {
    setShowProductsModal(false);
  };

  // Función para abrir el modal de añadir producto
  const openAddProductModal = (product = null) => {
    setSelectedProduct(product); // Si se pasa un producto, es para editar
    setShowAddProductModal(true);
  };

  // Función para cerrar el modal de añadir producto
  const closeAddProductModal = () => {
    setShowAddProductModal(false);
    setSelectedProduct(null); // Limpiar el producto seleccionado al cerrar
  };

  // Valores para proporcionar en el contexto
  const value = {
    showProductsModal,
    showAddProductModal,
    selectedProduct,
    openProductsModal,
    closeProductsModal,
    openAddProductModal,
    closeAddProductModal,
    setSelectedProduct
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};