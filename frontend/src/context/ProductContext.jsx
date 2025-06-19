/**
 * ProductContext.jsx
 * 
 * Este contexto maneja el estado global de los productos en el sistema POS.
 * Proporciona funciones para gestionar productos, categorías y el carrito de compras.
 * 
 * Características principales:
 * - Persistencia de productos y categorías en localStorage
 * - Sincronización con el sistema de inventario y el backend
 * - Gestión de productos (agregar, actualizar, eliminar)
 * - Gestión de categorías
 * - Funciones para el carrito de compras
 */

import React, { createContext, useState, useContext, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { syncService } from '../services/syncService';
import { localImageService } from '../services/localImageService';
import { fileSystemImageService } from '../services/fileSystemImageService';
import { productoService, categoriaService } from '../services/api';

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
   * Estos estados se cargan desde el backend, con localStorage como respaldo.
   */
  
  // Estados para productos y categorías
  const [products, setProducts] = useState([
    { id: 2, name: "Servicio", price: 0, category: "Servicios", image: null, stock: 0, brand: "GENERICA", tax: "IVA(0%)" },
  ]);
  const [categories, setCategories] = useState(["Servicios"]);
  
  // Estado para controlar si estamos sincronizando con el backend
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Efecto para cargar datos desde el backend y localStorage
  useEffect(() => {
    const loadData = async () => {
      setIsSyncing(true);
      setIsLoading(true);
      
      try {
        // Intentar cargar productos desde el backend primero
        console.log("Intentando cargar productos desde el backend...");
        let backendProductsLoaded = false;
        
        try {
          const backendProducts = await productoService.getAll();
          
          if (backendProducts && backendProducts.length > 0 && !backendProducts.error) {
            // Convertir productos del backend al formato local
            const formattedProducts = backendProducts
              .filter(product => product.activo !== false) // Solo productos activos
              .map(product => {
                console.log("Procesando producto:", product.nombre, "Imagen:", product.imagen);
                return {
                  id: product.id,
                  name: product.nombre,
                  price: parseFloat(product.precio) || 0,
                  purchasePrice: parseFloat(product.precio_compra) || 0,
                  stock: product.stock_total || 0,
                  category: product.categoria_nombre || 'General',
                  brand: product.marca || 'GENERICA',
                  tax: product.impuesto || 'IVA(0%)',
                  image: product.imagen || null
                };
              });
            
            console.log("Productos cargados desde backend:", formattedProducts.length);
            
            if (formattedProducts.length > 0) {
              setProducts(formattedProducts);
              
              // Guardar en localStorage como respaldo
              localStorage.setItem('products', JSON.stringify(formattedProducts));
              backendProductsLoaded = true;
            }
          }
        } catch (backendError) {
          console.log('Error al cargar datos desde el backend:', backendError);
        }
        
        // Si no se pudieron cargar productos desde el backend, intentar desde localStorage
        if (!backendProductsLoaded) {
          console.log("Cargando productos desde localStorage como respaldo");
          const savedProducts = localStorage.getItem('products');
          if (savedProducts) {
            const parsedProducts = JSON.parse(savedProducts);
            setProducts(parsedProducts);
            console.log("Productos cargados desde localStorage:", parsedProducts.length);
          }
        }
        
        // SINCRONIZACIÓN CON INVENTARIO: Verificar si hay existencias actualizadas en el inventario
        try {
          const inventoryProductsStr = localStorage.getItem('productos');
          if (inventoryProductsStr) {
            const inventoryProducts = JSON.parse(inventoryProductsStr);
            
            // Actualizar existencias de productos del POS con datos del inventario
            const currentProducts = JSON.parse(localStorage.getItem('products') || '[]');
            const updatedProducts = currentProducts.map(posProduct => {
              // Buscar el producto correspondiente en el inventario
              const inventoryProduct = inventoryProducts.find(invProduct => invProduct.id === posProduct.id);
              if (inventoryProduct) {
                console.log(`Sincronizando desde inventario: ${posProduct.name} - Stock POS: ${posProduct.stock} - Stock Inventario: ${inventoryProduct.existencias}`);
                return {
                  ...posProduct,
                  stock: inventoryProduct.existencias
                };
              }
              return posProduct;
            });
            
            // Solo actualizar si hay cambios
            const hasChanges = updatedProducts.some((product, index) => 
              product.stock !== currentProducts[index]?.stock
            );
            
            if (hasChanges) {
              setProducts(updatedProducts);
              localStorage.setItem('products', JSON.stringify(updatedProducts));
              console.log('Existencias sincronizadas desde inventario al POS');
            }
          }
        } catch (error) {
          console.error('Error al sincronizar con inventario:', error);
        }
        
        // Cargar categorías (primero desde backend, luego desde localStorage como respaldo)
        let backendCategoriesLoaded = false;
        
        try {
          const backendCategories = await categoriaService.getAll();
          if (backendCategories && backendCategories.length > 0 && !backendCategories.error) {
            const categoryNames = backendCategories.map(cat => cat.nombre);
            setCategories(categoryNames);
            localStorage.setItem('categories', JSON.stringify(categoryNames));
            backendCategoriesLoaded = true;
          }
        } catch (catError) {
          console.log('Error al cargar categorías desde el backend:', catError);
        }
        
        // Si no se pudieron cargar categorías desde el backend, intentar desde localStorage
        if (!backendCategoriesLoaded) {
          const savedCategories = localStorage.getItem('categories');
          if (savedCategories) {
            setCategories(JSON.parse(savedCategories));
          }
        }
      } catch (error) {
        console.log('Error al cargar datos:', error);
      } finally {
        setIsSyncing(false);
        setIsLoading(false);
      }
    };
    
    // Cargar datos al iniciar
    loadData();
    
    // Procesamiento de cola de sincronización (frecuencia normal)
    const syncInterval = setInterval(() => {
      console.log("Procesando cola de sincronización...");
      syncService.processSyncQueue();
    }, 30000); // Procesar cada 30 segundos
    
    // Escuchar eventos de storage para mantener sincronizado entre pestañas
    const handleStorageChange = (e) => {
      if (e.key === 'products') {
        try {
          const newProducts = JSON.parse(e.newValue);
          if (newProducts && Array.isArray(newProducts)) {
            setProducts(newProducts);
          }
        } catch (error) {
          console.error('Error al procesar cambios en localStorage:', error);
        }
      } else if (e.key === 'productos') {
        // ESCUCHAR CAMBIOS DEL INVENTARIO: Cuando el inventario actualiza existencias
        try {
          const inventoryProducts = JSON.parse(e.newValue || '[]');
          const currentProducts = JSON.parse(localStorage.getItem('products') || '[]');
          
          // Actualizar existencias de productos del POS con datos del inventario
          const updatedProducts = currentProducts.map(posProduct => {
            const inventoryProduct = inventoryProducts.find(invProduct => invProduct.id === posProduct.id);
            if (inventoryProduct) {
              console.log(`Actualizando desde inventario: ${posProduct.name} - Stock anterior: ${posProduct.stock} - Stock nuevo: ${inventoryProduct.existencias}`);
              return {
                ...posProduct,
                stock: inventoryProduct.existencias
              };
            }
            return posProduct;
          });
          
          // Actualizar estado y localStorage del POS
          setProducts(updatedProducts);
          localStorage.setItem('products', JSON.stringify(updatedProducts));
          console.log('Existencias actualizadas desde inventario');
        } catch (error) {
          console.error('Error al procesar cambios del inventario:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  /**
   * SECCIÓN 1.2: FUNCIONES DE GESTIÓN DE PRODUCTOS
   * 
   * Estas funciones permiten actualizar, agregar y eliminar productos,
   * manteniendo la sincronización con localStorage.
   */
  
  // Guarda productos localmente sin intentar sincronizar con el backend
  const saveProductsLocally = (newProducts) => {
    try {
      console.log("Guardando productos localmente:", newProducts.length);
      
      // Actualizar el estado de productos
      setProducts(newProducts);
      
      // Guardar en localStorage como respaldo
      localStorage.setItem('products', JSON.stringify(newProducts));
      
      // Forzar un evento de storage para notificar a otras pestañas
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('productosUpdated'));
      
      // Extraer categorías únicas de los productos y actualizarlas
      const uniqueCategories = [...new Set(newProducts.map(p => p.category).filter(Boolean))];
      if (uniqueCategories.length > 0) {
        setCategories(uniqueCategories);
        localStorage.setItem('categories', JSON.stringify(uniqueCategories));
      }
      
      return true;
    } catch (error) {
      console.error("Error al guardar productos localmente:", error);
      return false;
    }
  };

  
  /**
   * Actualiza todos los productos a la vez y los sincroniza con el backend
   * 
   * FLUJO DE COMUNICACIÓN:
   * 1. Frontend: Guarda productos en localStorage para respaldo
   * 2. Frontend: Obtiene categorías del backend para mapear nombres a IDs
   * 3. Frontend: Crea categorías nuevas en el backend si es necesario
   * 4. Frontend: Para cada producto:
   *    a. Si tiene ID numérico: Envía PATCH a /api/productos/{id}/
   *    b. Si no tiene ID o es temporal: Envía POST a /api/productos/
   * 5. Backend: Recibe la solicitud y valida los datos con ProductoSerializer
   * 6. Backend: Guarda en la tabla api_producto de la base de datos
   * 7. Backend: Si hay imagen, la guarda en media/productos/
   * 8. Backend: Devuelve el producto creado/actualizado con su ID
   * 9. Frontend: Actualiza el ID local con el ID del backend
   * 
   * ESTRUCTURA EN BASE DE DATOS:
   * - api_producto: id, nombre, precio, precio_compra, stock_total, categoria, imagen, marca, impuesto, activo
   * - api_categoria: id, nombre
   * 
   * @param {Array} newProducts - Lista de productos a actualizar
   * @returns {Promise<boolean>} - True si la operación fue exitosa
   */
  const updateProducts = async (newProducts) => {
    try {
      console.log("Guardando productos:", newProducts.length);
      
      // Primero guardar localmente para asegurar que los cambios persistan
      // Esto garantiza que los datos no se pierdan incluso si falla la sincronización
      saveProductsLocally(newProducts);
      
      // Intentar sincronizar con el backend (pero no depender de ello)
      try {
        // Obtener categorías del backend para mapear nombres a IDs
        // IMPORTANTE: El backend espera IDs numéricos para las categorías, no nombres
        let categoriasMap = {};
        try {
          // GET /api/categorias/ -> Devuelve lista de objetos {id, nombre}
          const backendCategorias = await categoriaService.getAll();
          if (backendCategorias && Array.isArray(backendCategorias)) {
            // Crear un mapa de nombre de categoría a ID para búsqueda rápida
            categoriasMap = backendCategorias.reduce((map, cat) => {
              map[cat.nombre.toLowerCase()] = cat.id;
              return map;
            }, {});
            console.log("Mapa de categorías cargado:", categoriasMap);
          }
        } catch (catMapError) {
          console.error("Error al cargar mapa de categorías:", catMapError);
        }
        
        // Extraer categorías únicas de los productos y actualizarlas
        const uniqueCategories = [...new Set(newProducts.map(p => p.category).filter(Boolean))];
        if (uniqueCategories.length > 0) {
          console.log("Sincronizando categorías:", uniqueCategories);
          
          // Crear categorías en el backend directamente si no existen
          for (const categoryName of uniqueCategories) {
            try {
              if (!categoriasMap[categoryName.toLowerCase()]) {
                // POST /api/categorias/ {nombre: categoryName}
                // El backend crea un registro en la tabla api_categoria
                const createdCat = await categoriaService.create(categoryName);
                if (createdCat && createdCat.id) {
                  categoriasMap[categoryName.toLowerCase()] = createdCat.id;
                  console.log(`Categoría creada: ${categoryName} con ID ${createdCat.id}`);
                }
              } else {
                console.log(`Categoría ya existe: ${categoryName} con ID ${categoriasMap[categoryName.toLowerCase()]}`);
              }
            } catch (catError) {
              console.log(`Error al crear categoría ${categoryName}:`, catError);
            }
          }
        }
        
        // Sincronizar productos con el backend directamente
        console.log("Sincronizando productos con el backend...");
        
        for (const product of newProducts) {
          try {
            // Obtener el ID de la categoría del mapa
            let categoriaId = 3; // ID por defecto (General)
            if (product.category && categoriasMap[product.category.toLowerCase()]) {
              categoriaId = categoriasMap[product.category.toLowerCase()];
            }
            
            if (product.id && !product.id.toString().includes('-')) {
              // Producto existente con ID numérico (del backend), actualizarlo
              console.log(`Actualizando producto en backend: ${product.name} (ID: ${product.id})`);
              
              // Preparar datos para enviar al backend (CON stock_total)
              // NOTA: Los nombres de campos deben coincidir con el modelo en Django
              const updateData = {
                nombre: product.name,
                precio: product.price,
                precio_compra: product.purchasePrice || 0,
                stock_total: product.stock || 0, // Enviar stock total directamente
                categoria: categoriaId, // Usar ID de categoría, no el nombre
                marca: product.brand || 'GENERICA',
                impuesto: product.tax || 'IVA(0%)',
                activo: true
              };
              
              // Si hay imagen, incluirla en la actualización
              if (product.image?.startsWith('data:')) {
                updateData.imagen = product.image;
              }
              
              // PATCH /api/productos/{id}/ con los datos actualizados
              // El backend actualiza el registro en la tabla api_producto
              await productoService.update(product.id, updateData);
            } else {
              // Producto nuevo o con ID temporal, crearlo
              console.log(`Creando producto en backend: ${product.name}`);
              
              const createData = {
                nombre: product.name,
                precio: product.price,
                precio_compra: product.purchasePrice || 0,
                stock_total: product.stock || 0, // Enviar stock total directamente
                categoria: categoriaId, // Usar ID de categoría, no el nombre
                marca: product.brand || 'GENERICA',
                impuesto: product.tax || 'IVA(0%)',
                activo: true
              };
              
              // Si hay imagen, incluirla en la creación
              if (product.image?.startsWith('data:')) {
                createData.imagen = product.image;
              }
              
              // POST /api/productos/ con los datos del nuevo producto
              // El backend crea un registro en la tabla api_producto
              const createdProduct = await productoService.create(createData);
              if (createdProduct?.id) {
                console.log(`Producto creado con ID: ${createdProduct.id}`);
                // Actualizar el ID temporal con el ID real asignado por el backend
                product.id = createdProduct.id;
              }
            }
          } catch (productError) {
            console.error(`Error al sincronizar producto ${product.name}:`, productError);
          }
        }
        
        // Actualizar productos locales con los IDs actualizados
        saveProductsLocally(newProducts);
        
        console.log("Sincronización completada");
      } catch (syncError) {
        console.error("Error en sincronización:", syncError);
      }
      
      return true;
    } catch (error) {
      console.error("Error al guardar productos:", error);
      return false;
    }
  };
  /**
   * SECCIÓN 1.3: FUNCIONES DE GESTIÓN DE CATEGORÍAS
   * 
   * Estas funciones permiten agregar y eliminar categorías,
   * manteniendo la integridad de los productos asociados.
   */
  
  // Agrega una nueva categoría si no existe
  const addCategory = async (newCategory) => {
    if (newCategory && !categories.includes(newCategory)) {
      try {
        // Intentar crear la categoría en el backend
        await categoriaService.create(newCategory);
        
        // Actualizar el estado local
        const updatedCategories = [...categories, newCategory];
        setCategories(updatedCategories);
        
        // Guardar en localStorage como respaldo
        localStorage.setItem('categories', JSON.stringify(updatedCategories));
        
        return true;
      } catch (error) {
        console.error('Error al crear categoría en el backend:', error);
        
        // Si falla, guardar solo localmente y encolar para sincronización
        const updatedCategories = [...categories, newCategory];
        setCategories(updatedCategories);
        localStorage.setItem('categories', JSON.stringify(updatedCategories));
        
        // Encolar para sincronización posterior
        syncService.queueOperation('CATEGORY_CREATE', { nombre: newCategory });
        
        return true;
      }
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

  // Función para actualizar el stock de un producto
  const updateStock = async (productId, newStock, usuario = 'Sistema', nota = '') => {
    // Buscar el producto
    const product = products.find(p => p.id === productId);
    if (!product) return false;
    
    // Calcular la diferencia para el movimiento
    const diferencia = newStock - (product.stock || 0);
    if (diferencia === 0) return true; // No hay cambio
    
    try {
      // Actualizar el stock en el backend
      await productoService.updateStock(productId, diferencia, usuario, nota);
      
      // Actualizar el stock en el estado local
      const updatedProducts = products.map(p => 
        p.id === productId ? { ...p, stock: newStock } : p
      );
      
      // Actualizar estado y localStorage
      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      
      // SINCRONIZAR CON INVENTARIO: Actualizar existencias en el inventario
      try {
        const inventoryProductsStr = localStorage.getItem('productos');
        if (inventoryProductsStr) {
          const inventoryProducts = JSON.parse(inventoryProductsStr);
          
          // Actualizar existencias en el inventario
          const updatedInventoryProducts = inventoryProducts.map(invProduct => {
            if (invProduct.id === productId) {
              console.log(`Sincronizando POS → Inventario: ${invProduct.nombre} - Stock: ${invProduct.existencias} → ${newStock}`);
              return {
                ...invProduct,
                existencias: newStock
              };
            }
            return invProduct;
          });
          
          // Guardar en localStorage del inventario
          localStorage.setItem('productos', JSON.stringify(updatedInventoryProducts));
          
          // Disparar evento para notificar al inventario
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('productosUpdated'));
        }
      } catch (error) {
        console.error('Error al sincronizar con inventario:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Error al actualizar stock en el backend:', error);
      
      // Si falla, actualizar solo localmente y encolar para sincronización
      const updatedProducts = products.map(p => 
        p.id === productId ? { ...p, stock: newStock } : p
      );
      
      // Actualizar estado y localStorage
      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      
      // También sincronizar con inventario en caso de error
      try {
        const inventoryProductsStr = localStorage.getItem('productos');
        if (inventoryProductsStr) {
          const inventoryProducts = JSON.parse(inventoryProductsStr);
          const updatedInventoryProducts = inventoryProducts.map(invProduct => {
            if (invProduct.id === productId) {
              return { ...invProduct, existencias: newStock };
            }
            return invProduct;
          });
          localStorage.setItem('productos', JSON.stringify(updatedInventoryProducts));
        }
      } catch (syncError) {
        console.error('Error al sincronizar con inventario:', syncError);
      }
      
      return true;
    }
  };

  // Función para agregar un nuevo producto
  const addProduct = async (productData) => {
    let updatedProduct;
    
    // Si el producto ya existe (tiene id), actualizarlo
    if (productData.id) {
      try {
        // Obtener categorías del backend para mapear nombres a IDs
        let categoriaId = 3; // ID por defecto (General)
        try {
          const backendCategorias = await categoriaService.getAll();
          if (backendCategorias && Array.isArray(backendCategorias)) {
            // Buscar la categoría por nombre
            const categoriaName = productData.categoria || productData.category || '';
            const categoria = backendCategorias.find(
              cat => cat.nombre.toLowerCase() === categoriaName.toLowerCase()
            );
            if (categoria) {
              categoriaId = categoria.id;
            }
          }
        } catch (catError) {
          console.error("Error al obtener categorías:", catError);
        }
        
        // Preparar datos para el backend
        const backendData = {
          id: productData.id,
          nombre: productData.nombre || productData.name,
          precio: productData.precioVenta || productData.price || 0,
          precio_compra: productData.precioCompra || productData.purchasePrice || 0,
          stock_total: productData.existencias || productData.stock || 0,
          categoria: categoriaId, // Usar ID de categoría
          marca: productData.marca || productData.brand || 'GENERICA',
          impuesto: productData.impuesto || productData.tax || 'IVA(0%)',
          activo: true
        };
        
        // Si hay imagen, incluirla en los datos
        if (productData.imagen && typeof productData.imagen === 'string' && productData.imagen.startsWith('data:')) {
          backendData.imagen = productData.imagen;
        } else if (productData.image && typeof productData.image === 'string' && productData.image.startsWith('data:')) {
          backendData.imagen = productData.image;
        }
        
        // Actualizar en el backend
        const updatedBackendProduct = await productoService.update(productData.id, backendData);
        
        // Actualizar en el estado local
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
        
        // Guardar en localStorage como respaldo
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        updatedProduct = updatedProducts.find(p => p.id === productData.id);
        
        // Si hay imagen, guardarla en el sistema de archivos
        if (updatedProduct.image && typeof updatedProduct.image === 'string' && updatedProduct.image.startsWith('data:')) {
          try {
            // Guardar imagen en el sistema de archivos a través del backend
            const imageUrl = await fileSystemImageService.saveImageToFileSystem(
              updatedProduct.image, 
              updatedProduct.id, 
              updatedProduct.name
            );
            
            if (imageUrl) {
              console.log(`Imagen guardada en sistema de archivos para producto ${updatedProduct.name}`);
              
              // Actualizar la URL de la imagen en el estado local
              const updatedProductsWithImage = products.map(p => 
                p.id === updatedProduct.id ? { ...p, image: imageUrl } : p
              );
              setProducts(updatedProductsWithImage);
              
              // Guardar en localStorage como respaldo
              localStorage.setItem('products', JSON.stringify(updatedProductsWithImage));
            }
          } catch (error) {
            console.error('Error al guardar imagen:', error);
          }
        }
      } catch (error) {
        console.error('Error al actualizar producto en el backend:', error);
        
        // Si falla, actualizar solo localmente y encolar para sincronización
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
        
        // Encolar para sincronización posterior
        syncService.queueOperation('PRODUCT_UPDATE', {
          id: updatedProduct.id,
          nombre: updatedProduct.name,
          precio: updatedProduct.price,
          precio_compra: updatedProduct.purchasePrice || 0,
          stock_total: updatedProduct.stock || 0,
          categoria: updatedProduct.category,
          marca: updatedProduct.brand || 'GENERICA',
          impuesto: updatedProduct.tax || 'IVA(0%)',
          activo: true
        });
        
        // Si hay imagen, guardarla localmente
        if (updatedProduct.image && typeof updatedProduct.image === 'string' && updatedProduct.image.startsWith('data:')) {
          try {
            fileSystemImageService.saveImageToFileSystem(updatedProduct.image, updatedProduct.id, updatedProduct.name);
            localImageService.saveImage(updatedProduct.id, updatedProduct.image);
          } catch (imageError) {
            console.error('Error al guardar imagen localmente:', imageError);
          }
        }
      }
    } else {
      // Si es un producto nuevo, crearlo
      try {
        // Obtener categorías del backend para mapear nombres a IDs
        let categoriaId = 3; // ID por defecto (General)
        try {
          const backendCategorias = await categoriaService.getAll();
          if (backendCategorias && Array.isArray(backendCategorias)) {
            // Buscar la categoría por nombre
            const categoria = backendCategorias.find(
              cat => cat.nombre.toLowerCase() === (productData.categoria || '').toLowerCase()
            );
            if (categoria) {
              categoriaId = categoria.id;
            }
          }
        } catch (catError) {
          console.error("Error al obtener categorías:", catError);
        }
        
        // Preparar datos para el backend
        const backendData = {
          nombre: productData.nombre,
          precio: productData.precioVenta || productData.precioCompra || 0,
          precio_compra: productData.precioCompra || 0,
          stock_total: productData.existencias || 0,
          categoria: categoriaId, // Usar ID de categoría
          marca: productData.marca || 'GENERICA',
          impuesto: productData.impuesto || 'IVA(0%)',
          activo: true
        };
        
        // Si hay imagen, incluirla en los datos
        if (productData.imagen && typeof productData.imagen === 'string' && productData.imagen.startsWith('data:')) {
          backendData.imagen = productData.imagen;
        } else if (productData.image && typeof productData.image === 'string' && productData.image.startsWith('data:')) {
          backendData.imagen = productData.image;
        }
        
        // Crear en el backend
        const createdBackendProduct = await productoService.create(backendData);
        
        // Crear en el estado local con el ID del backend
        const newProduct = {
          id: createdBackendProduct.id,
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
        
        // Guardar en localStorage como respaldo
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        updatedProduct = newProduct;
        
        // Si hay imagen, guardarla en el sistema de archivos
        if (newProduct.image && typeof newProduct.image === 'string' && newProduct.image.startsWith('data:')) {
          try {
            // Guardar imagen en el sistema de archivos a través del backend
            const imageUrl = await fileSystemImageService.saveImageToFileSystem(
              newProduct.image, 
              newProduct.id, 
              newProduct.name
            );
            
            if (imageUrl) {
              console.log(`Imagen guardada en sistema de archivos para producto ${newProduct.name}`);
              
              // Actualizar la URL de la imagen en el estado local
              const updatedProductsWithImage = updatedProducts.map(p => 
                p.id === newProduct.id ? { ...p, image: imageUrl } : p
              );
              setProducts(updatedProductsWithImage);
              
              // Guardar en localStorage como respaldo
              localStorage.setItem('products', JSON.stringify(updatedProductsWithImage));
            }
          } catch (error) {
            console.error('Error al guardar imagen:', error);
          }
        }
      } catch (error) {
        console.error('Error al crear producto en el backend:', error);
        
        // Si falla, crear solo localmente y encolar para sincronización
        const newProduct = {
          id: uuidv4(), // Genera un ID único local
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
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        updatedProduct = newProduct;
        
        // Encolar para sincronización posterior
        syncService.queueOperation('PRODUCT_CREATE', {
          nombre: newProduct.name,
          precio: newProduct.price,
          precio_compra: newProduct.purchasePrice || 0,
          stock_total: newProduct.stock || 0,
          categoria: newProduct.category,
          marca: newProduct.brand || 'GENERICA',
          impuesto: newProduct.tax || 'IVA(0%)',
          activo: true
        });
        
        // Si hay imagen, guardarla localmente
        if (newProduct.image && typeof newProduct.image === 'string' && newProduct.image.startsWith('data:')) {
          try {
            fileSystemImageService.saveImageToFileSystem(newProduct.image, newProduct.id, newProduct.name);
            localImageService.saveImage(newProduct.id, newProduct.image);
          } catch (imageError) {
            console.error('Error al guardar imagen localmente:', imageError);
          }
        }
      }
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
        
        // Encolar sincronización del cambio de stock con el backend
        const updatedProduct = updatedProducts.find(p => p.id === productId);
        if (updatedProduct) {
          syncService.queueOperation('PRODUCT_UPDATE_STOCK', {
            id: productId,
            stock: updatedProduct.stock,
            usuario: 'Usuario POS',
            nota: 'Venta desde POS'
          });
          
          // Registrar movimiento de salida
          syncService.queueOperation('MOVEMENT_CREATE', {
            producto: productId,
            tipo: 'SALIDA',
            cantidad: 1,
            usuario: 'Usuario POS',
            nota: 'Venta desde POS'
          });
        }
        
        console.log(`Producto ${productId} agregado al carrito y stock actualizado`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al agregar producto al carrito:', error);
      return false;
    }
  };

  // Función para eliminar un producto localmente sin depender del backend
  const deleteProductLocally = (productId) => {
    try {
      console.log("Eliminando producto localmente:", productId);
      
      // Eliminar del estado local
      const updatedProducts = products.filter(product => product.id !== productId);
      setProducts(updatedProducts);
      
      // Guardar en localStorage como respaldo
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      
      // Forzar un evento de storage para notificar a otras pestañas
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('productosUpdated'));
      
      // Eliminar también del inventario
      try {
        const inventoryProductsStr = localStorage.getItem('productos');
        if (inventoryProductsStr) {
          const inventoryProducts = JSON.parse(inventoryProductsStr);
          const updatedInventoryProducts = inventoryProducts.filter(product => product.id !== productId);
          localStorage.setItem('productos', JSON.stringify(updatedInventoryProducts));
        }
      } catch (error) {
        console.error('Error al eliminar producto del inventario:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Error al eliminar producto localmente:', error);
      return false;
    }
  };

  // Función para eliminar un producto
  const deleteProduct = async (productId) => {
    try {
      console.log("Eliminando producto:", productId);
      
      // Primero eliminar localmente para asegurar que los cambios persistan
      deleteProductLocally(productId);
      
      // Intentar marcar como inactivo en el backend
      try {
        await productoService.update(productId, { activo: false });
      } catch (apiError) {
        console.warn('Error al marcar producto como inactivo en el backend:', apiError);
        // Encolar para sincronización posterior
        syncService.queueOperation('PRODUCT_UPDATE', {
          id: productId,
          activo: false
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      
      // Asegurarse de que el producto se elimine localmente aunque falle todo lo demás
      deleteProductLocally(productId);
      
      return true;
    }
  };

  // Función para sincronizar manualmente con el backend
  const syncWithBackend = async () => {
    setIsSyncing(true);
    try {
      // Primero sincronizar hacia el backend
      await syncService.syncAllToBackend();
      // Luego sincronizar desde el backend
      await syncService.syncFromBackend();
      return true;
    } catch (error) {
      console.error('Error al sincronizar con el backend:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };
  
  /**
   * Carga productos directamente desde el backend y actualiza el estado local
   * 
   * FLUJO DE COMUNICACIÓN:
   * 1. Frontend: Envía GET a /api/productos/
   * 2. Backend: Consulta la tabla api_producto en la base de datos
   * 3. Backend: Serializa los productos con ProductoSerializer
   * 4. Backend: Devuelve lista de productos con todos sus campos
   * 5. Frontend: Convierte el formato del backend al formato local
   * 6. Frontend: Actualiza el estado y localStorage
   * 
   * MAPEO DE CAMPOS:
   * Backend (Django)    | Frontend (React)
   * -------------------|------------------
   * id                 | id
   * nombre             | name
   * precio             | price
   * precio_compra      | purchasePrice
   * stock_total        | stock
   * categoria_nombre   | category
   * marca              | brand
   * impuesto           | tax
   * imagen             | image
   * 
   * @returns {Promise<boolean>} - True si la operación fue exitosa
   */
  const loadProductsFromBackend = async () => {
    setIsSyncing(true);
    try {
      // GET /api/productos/ -> Devuelve lista completa de productos
      const backendProducts = await productoService.getAll();
      if (backendProducts?.length > 0 && !backendProducts.error) {
        // Filtrar productos activos y convertir al formato del frontend
        const formattedProducts = backendProducts
          .filter(p => p.activo !== false) // Solo incluir productos activos
          .map(p => ({
            // Mapeo de campos del backend al frontend
            id: p.id,
            name: p.nombre,
            price: parseFloat(p.precio) || 0,
            purchasePrice: parseFloat(p.precio_compra) || 0,
            stock: p.stock_total || 0,
            category: p.categoria_nombre || 'General', // Usamos el nombre, no el ID
            brand: p.marca || 'GENERICA',
            tax: p.impuesto || 'IVA(0%)',
            image: p.imagen || null
          }));
        
        if (formattedProducts.length > 0) {
          // Actualizar el estado de React con los productos cargados
          setProducts(formattedProducts);
          
          // Guardar en localStorage para persistencia y acceso offline
          localStorage.setItem('products', JSON.stringify(formattedProducts));
          
          // IMPORTANTE: Esto también debería sincronizar con el módulo de inventario
          // pero actualmente no lo hace, lo que causa inconsistencias
        }
      }
      return true;
    } catch (error) {
      console.error("Error al cargar productos:", error);
      return false;
    } finally {
      setIsSyncing(false);
    }
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
      deleteProduct,
      updateStock,
      syncWithBackend,
      loadProductsFromBackend,
      isSyncing
    }}>
      {children}
    </ProductContext.Provider>
  );
};