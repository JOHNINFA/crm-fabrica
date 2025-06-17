/**
 * ProductContext.jsx
 * 
 * Este contexto maneja el estado global de los productos en el sistema POS.
 * Proporciona funciones para gestionar productos, categorías y el carrito de compras.
 * 
 * Características principales:
 * - Persistencia de productos y categorías en localStorage
 * - Sincronización con el sistema de inventario
 * - Gestión de productos (agregar, actualizar, eliminar)
 * - Gestión de categorías
 * - Funciones para el carrito de compras
 */

import React, { createContext, useState, useContext } from "react";
import { v4 as uuidv4 } from 'uuid';

// Crear el contexto
const ProductContext = createContext();

// Hook personalizado para usar el contexto
export const useProducts = () => useContext(ProductContext);

/**
 * SECCIÓN 1: PROVEEDOR DEL CONTEXTO
 * 
 * Este componente proporciona el contexto de productos a toda la aplicación.
 * Inicializa los estados desde localStorage y define las funciones para
 * manipular productos y categorías.
 */
export const ProductProvider = ({ children }) => {
  /**
   * SECCIÓN 1.1: ESTADOS INICIALES
   * 
   * Estos estados se cargan desde localStorage para mantener
   * la persistencia entre recargas de página.
   */
  
  // Cargar productos desde localStorage o usar valor por defecto
  const [products, setProducts] = useState(() => {
    const savedProducts = localStorage.getItem('products');
    return savedProducts ? JSON.parse(savedProducts) : [
      { id: 2, name: "Servicio", price: 0, category: "Servicios", image: null, stock: 0, brand: "GENERICA", tax: "IVA(0%)" },
    ];
  });

  // Cargar categorías desde localStorage o usar valor por defecto
  const [categories, setCategories] = useState(() => {
    const savedCategories = localStorage.getItem('categories');
    return savedCategories ? JSON.parse(savedCategories) : ["Servicios"];
  });
  
  /**
   * SECCIÓN 1.2: FUNCIONES DE GESTIÓN DE PRODUCTOS
   * 
   * Estas funciones permiten actualizar, agregar y eliminar productos,
   * manteniendo la sincronización con localStorage.
   */
  
  // Actualiza todos los productos a la vez (útil para sincronización con API)
  const updateProducts = (newProducts) => {
    // Actualizar el estado de productos
    setProducts(newProducts);
    
    // Guardar en localStorage para persistencia
    localStorage.setItem('products', JSON.stringify(newProducts));
    
    // Extraer categorías únicas de los productos y actualizarlas
    const uniqueCategories = [...new Set(newProducts.map(p => p.category).filter(Boolean))];
    if (uniqueCategories.length > 0) {
      setCategories(uniqueCategories);
      localStorage.setItem('categories', JSON.stringify(uniqueCategories));
    }
  };

  /**
   * SECCIÓN 1.3: FUNCIONES DE GESTIÓN DE CATEGORÍAS
   * 
   * Estas funciones permiten agregar y eliminar categorías,
   * manteniendo la integridad de los productos asociados.
   */
  
  // Agrega una nueva categoría si no existe
  const addCategory = (newCategory) => {
    if (newCategory && !categories.includes(newCategory)) {
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      localStorage.setItem('categories', JSON.stringify(updatedCategories));
      return true;
    }
    return false;
  };
  
  // Elimina una categoría y reasigna sus productos
  const removeCategory = (categoryToRemove) => {
    // No permitir eliminar si solo queda una categoría (siempre debe haber al menos una)
    if (categories.length <= 1) {
      return false;
    }
    
    // Determinar a qué categoría mover los productos (la primera disponible que no sea la que se elimina)
    const fallbackCategory = categories.find(cat => cat !== categoryToRemove) || "Sin categoría";
    
    // Actualizar productos de la categoría eliminada a la categoría de respaldo
    const updatedProducts = products.map(product => 
      product.category === categoryToRemove 
        ? { ...product, category: fallbackCategory } 
        : product
    );
    
    // Actualizar productos en estado y localStorage
    setProducts(updatedProducts);
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    
    // Eliminar la categoría del listado
    const updatedCategories = categories.filter(cat => cat !== categoryToRemove);
    setCategories(updatedCategories);
    localStorage.setItem('categories', JSON.stringify(updatedCategories));
    return true;
  };

  // Función para agregar un nuevo producto
  const addProduct = (productData) => {
    let updatedProduct;
    
    // Si el producto ya existe (tiene id), actualizarlo
    if (productData.id) {
      const updatedProducts = products.map(product => 
        product.id === productData.id 
          ? {
              ...product,
              name: productData.nombre || productData.name,
              price: productData.precioVenta || productData.price || 0,
              category: productData.categoria || productData.category,
              image: productData.imagen || productData.image,
              stock: productData.existencias || productData.stock || 0,
              measureType: productData.tipoMedida || productData.measureType,
              tax: productData.impuesto || productData.tax,
              brand: productData.marca || productData.brand,
              accountGroup: productData.grupoContable || productData.accountGroup,
              purchasePrice: productData.precioCompra || productData.purchasePrice || 0,
            }
          : product
      );
      
      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      updatedProduct = updatedProducts.find(p => p.id === productData.id);
    } else {
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
      
      const updatedProducts = [...products, newProduct];
      setProducts(updatedProducts);
      // Guardar en localStorage
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      updatedProduct = newProduct;
    }
    
    // Sincronizar con el inventario manualmente
    try {
      // Convertir el producto al formato de inventario
      const inventoryProduct = {
        id: updatedProduct.id,
        nombre: updatedProduct.name.toUpperCase(),
        existencias: updatedProduct.stock || 0,
        categoria: updatedProduct.category || 'General',
        cantidad: 0,
        precio: updatedProduct.price || 0
      };
      
      // Obtener productos de inventario desde localStorage
      const inventoryProductsStr = localStorage.getItem('productos');
      const inventoryProducts = inventoryProductsStr ? JSON.parse(inventoryProductsStr) : [];
      
      // Buscar si el producto ya existe en el inventario
      const existingIndex = inventoryProducts.findIndex(p => p.id === inventoryProduct.id);
      
      if (existingIndex >= 0) {
        // Actualizar producto existente
        inventoryProducts[existingIndex] = {
          ...inventoryProducts[existingIndex],
          nombre: inventoryProduct.nombre,
          existencias: inventoryProduct.existencias,
          categoria: inventoryProduct.categoria,
          precio: inventoryProduct.precio
        };
      } else {
        // Agregar nuevo producto
        inventoryProducts.push(inventoryProduct);
      }
      
      // Guardar productos actualizados en localStorage
      localStorage.setItem('productos', JSON.stringify(inventoryProducts));
    } catch (error) {
      console.error('Error al sincronizar producto con inventario:', error);
    }
    
    return updatedProduct;
  };

  // Función para agregar un producto al carrito
  const addToCart = async (productId) => {
    try {
      // Buscar el producto en el estado local
      const product = products.find(p => p.id === productId);
      
      if (product) {
        // Verificar stock antes de agregar al carrito
        if (product.stock <= 0) {
          console.warn(`No hay stock disponible para ${product.name}`);
          return false;
        }
        
        // Actualizar stock localmente
        const updatedProducts = products.map(p => 
          p.id === productId 
            ? { ...p, stock: Math.max(0, p.stock - 1) } 
            : p
        );
        
        setProducts(updatedProducts);
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        
        console.log(`Producto ${productId} agregado al carrito y stock actualizado`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al agregar producto al carrito:', error);
      return false;
    }
  };

  // Función para eliminar un producto
  const deleteProduct = (productId) => {
    // Eliminar del POS
    const updatedProducts = products.filter(product => product.id !== productId);
    setProducts(updatedProducts);
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    
    // Eliminar también del inventario
    try {
      const inventoryProductsStr = localStorage.getItem('productos');
      if (inventoryProductsStr) {
        const inventoryProducts = JSON.parse(inventoryProductsStr);
        const updatedInventoryProducts = inventoryProducts.filter(product => product.id !== productId);
        localStorage.setItem('productos', JSON.stringify(updatedInventoryProducts));
        
        // Disparar un evento personalizado para notificar a otros componentes
        const event = new Event('productosUpdated');
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error al eliminar producto del inventario:', error);
    }
    
    return true;
  };

  return (
    <ProductContext.Provider value={{ 
      products, 
      categories, 
      addProduct, 
      addCategory, 
      removeCategory, 
      addToCart, 
      updateProducts,
      deleteProduct 
    }}>
      {children}
    </ProductContext.Provider>
  );
};