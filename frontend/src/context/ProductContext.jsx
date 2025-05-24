import React, { createContext, useState, useContext } from "react";
import { v4 as uuidv4 } from 'uuid';

// Crear el contexto
const ProductContext = createContext();

// Hook personalizado para usar el contexto
export const useProducts = () => useContext(ProductContext);

// Proveedor del contexto
export const ProductProvider = ({ children }) => {
  // Estado inicial con productos de ejemplo
  const [products, setProducts] = useState([
    { id: 1, name: "AREPA TIPO OBLEAS 500GR", price: 1.60, category: "Arepas", image: null, stock: 0, brand: "GENERICA", tax: "IVA(0%)" },
    { id: 2, name: "Servicio", price: 0, category: "Servicios", image: null, stock: 0, brand: "GENERICA", tax: "IVA(0%)" },
  ]);

  // Estado para categorías disponibles
  const [categories, setCategories] = useState(["Arepas", "Servicios"]);

  // Función para agregar una nueva categoría
  const addCategory = (newCategory) => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories(prev => [...prev, newCategory]);
      return true;
    }
    return false;
  };
  
  // Función para eliminar una categoría
  const removeCategory = (categoryToRemove) => {
    // No permitir eliminar si solo queda una categoría
    if (categories.length <= 1) {
      return false;
    }
    
    // Determinar a qué categoría mover los productos (la primera disponible que no sea la que se elimina)
    const fallbackCategory = categories.find(cat => cat !== categoryToRemove) || "Sin categoría";
    
    // Actualizar productos de la categoría eliminada
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.category === categoryToRemove 
          ? { ...product, category: fallbackCategory } 
          : product
      )
    );
    
    // Eliminar la categoría
    setCategories(prev => prev.filter(cat => cat !== categoryToRemove));
    return true;
  };

  // Función para agregar un nuevo producto
  const addProduct = (productData) => {
    // Si el producto ya existe (tiene id), actualizarlo
    if (productData.id) {
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productData.id 
            ? {
                ...product,
                name: productData.nombre,
                price: productData.precioVenta || productData.precioCompra || 0,
                category: productData.categoria,
                image: productData.imagen,
                stock: productData.existencias || 0,
                measureType: productData.tipoMedida,
                tax: productData.impuesto,
                brand: productData.marca,
                accountGroup: productData.grupoContable,
                purchasePrice: productData.precioCompra || 0,
              }
            : product
        )
      );
      return productData;
    }
    
    // Si es un producto nuevo, crearlo
    const newProduct = {
      id: uuidv4(), // Genera un ID único
      name: productData.nombre,
      price: productData.precioVenta || productData.precioCompra || 0,
      category: productData.categoria,
      image: productData.imagen,
      stock: productData.existencias || 0,
      measureType: productData.tipoMedida,
      tax: productData.impuesto,
      brand: productData.marca,
      accountGroup: productData.grupoContable,
      purchasePrice: productData.precioCompra || 0,
    };
    
    setProducts(prevProducts => [...prevProducts, newProduct]);
    return newProduct;
  };

  // Función para agregar un producto al carrito
  const addToCart = (productId) => {
    // Esta función será implementada en el CartContext
    console.log(`Producto ${productId} agregado al carrito`);
  };

  return (
    <ProductContext.Provider value={{ products, categories, addProduct, addCategory, removeCategory, addToCart }}>
      {children}
    </ProductContext.Provider>
  );
};