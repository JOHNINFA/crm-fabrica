/**
 * Contexto Unificado de Productos
 * 
 * Este contexto unifica ProductContext y ProductosContext para mantener
 * sincronizados todos los módulos: POS, Pedidos, Inventario y Cargue
 */

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { productoService, categoriaService } from '../services/api';
import { sincronizarConBD } from '../services/syncService';
import { localImageService } from '../services/localImageService';

const UnifiedProductContext = createContext();

export const useUnifiedProducts = () => {
    const context = useContext(UnifiedProductContext);
    if (!context) {
        throw new Error('useUnifiedProducts debe usarse dentro de UnifiedProductProvider');
    }
    return context;
};

export const UnifiedProductProvider = ({ children }) => {
    // Estados principales
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(['General', 'Servicios']);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [productImages, setProductImages] = useState({}); // Cache de imágenes en memoria

    // ============================================
    // UTILIDADES DE ALMACENAMIENTO
    // ============================================

    const saveToLocalStorage = useCallback((key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Error guardando ${key}:`, error);
        }
    }, []);

    const getFromLocalStorage = useCallback((key, defaultValue = []) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Error cargando ${key}:`, error);
            return defaultValue;
        }
    }, []);

    // ============================================
    // CONVERSIÓN DE FORMATOS
    // ============================================

    // Convertir producto a formato POS/Pedidos
    const toProductsFormat = useCallback((product) => ({
        id: product.id,
        name: product.nombre || product.name,
        price: product.precio || product.price || 0,
        stock: product.existencias || product.stock || 0,
        category: product.categoria || product.category || 'General',
        brand: product.marca || product.brand || 'GENERICA',
        tax: product.impuesto || product.tax || 'IVA(0%)',
        image: product.imagen || product.image || null,
        purchasePrice: product.precio_compra || product.purchasePrice || 0,
        orden: product.orden || 0,
        ubicacionInventario: product.ubicacionInventario || 'PRODUCCION' // Campo visual para Inventario
    }), []);

    // Convertir producto a formato Inventario/Cargue
    const toInventoryFormat = useCallback((product) => ({
        id: product.id,
        nombre: product.name || product.nombre,
        existencias: product.stock || product.existencias || 0,
        categoria: product.category || product.categoria || 'General',
        precio: product.price || product.precio || 0,
        cantidad: 0, // Para el módulo de producción
        orden: product.orden || 0,
        ubicacionInventario: product.ubicacionInventario || 'PRODUCCION' // Campo visual para Inventario
    }), []);

    // ============================================
    // SINCRONIZACIÓN CON LOCALSTORAGE
    // ============================================

    const syncToLocalStorage = useCallback((productsList) => {
        // Ordenar productos por orden personalizado, luego por ID
        const sortedProducts = [...productsList].sort((a, b) => {
            // Primero por orden (si existe)
            const ordenA = a.orden !== undefined ? a.orden : 999999;
            const ordenB = b.orden !== undefined ? b.orden : 999999;
            if (ordenA !== ordenB) {
                return ordenA - ordenB;
            }
            // Si el orden es igual, ordenar por ID
            const idA = parseInt(a.id) || 999999;
            const idB = parseInt(b.id) || 999999;
            return idA - idB;
        });

        // Guardar en formato POS/Pedidos
        const productsFormat = sortedProducts.map(toProductsFormat);
        saveToLocalStorage('products', productsFormat);

        // Guardar en formato Inventario/Cargue
        const inventoryFormat = sortedProducts.map(toInventoryFormat);
        saveToLocalStorage('productos', inventoryFormat);

        // Notificar cambios a todos los módulos
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('productosUpdated'));
        window.dispatchEvent(new CustomEvent('unifiedProductsUpdated', { detail: sortedProducts }));
    }, [toProductsFormat, toInventoryFormat, saveToLocalStorage]);

    // ============================================
    // SINCRONIZACIÓN CON BACKEND
    // ============================================

    const loadFromBackend = useCallback(async () => {
        setIsSyncing(true);
        try {
            console.log('🔄 Cargando productos desde backend...');

            // Cargar productos
            const backendProducts = await productoService.getAll();

            if (backendProducts && !backendProducts.error && backendProducts.length > 0) {
                const formattedProducts = backendProducts
                    .filter(p => p.activo !== false)
                    .map(p => ({
                        id: p.id,
                        name: p.nombre,
                        price: parseFloat(p.precio) || 0,
                        stock: p.stock_total || 0,
                        category: p.categoria_nombre || 'General',
                        brand: p.marca || 'GENERICA',
                        tax: p.impuesto || 'IVA(0%)',
                        image: p.imagen || null,
                        purchasePrice: parseFloat(p.precio_compra) || 0,
                        orden: p.orden || 0,
                        ubicacionInventario: p.ubicacion_inventario || 'PRODUCCION'
                    }));

                setProducts(formattedProducts);
                syncToLocalStorage(formattedProducts);
                console.log(`✅ ${formattedProducts.length} productos cargados desde backend`);
            }

            // Cargar categorías
            const backendCategories = await categoriaService.getAll();
            if (backendCategories && !backendCategories.error && backendCategories.length > 0) {
                const categoryNames = backendCategories.map(cat => cat.nombre);
                setCategories(categoryNames);
                saveToLocalStorage('categories', categoryNames);
            }

            return true;
        } catch (error) {
            console.error('❌ Error cargando desde backend:', error);
            // Cargar desde localStorage como fallback
            const localProducts = getFromLocalStorage('products', []);
            if (localProducts.length > 0) {
                setProducts(localProducts);
            }
            return false;
        } finally {
            setIsSyncing(false);
        }
    }, [syncToLocalStorage, saveToLocalStorage, getFromLocalStorage]);

    const syncToBackend = useCallback(async (productsList) => {
        try {
            console.log('🔄 Sincronizando productos al backend...');
            await sincronizarConBD();
            console.log('✅ Productos sincronizados al backend');
            return true;
        } catch (error) {
            console.error('❌ Error sincronizando al backend:', error);
            return false;
        }
    }, []);

    // ============================================
    // OPERACIONES CRUD
    // ============================================

    const addProduct = useCallback(async (productData) => {
        try {
            console.log('➕ Agregando producto:', productData.nombre);

            // Preparar datos para el backend
            let productToSave = {
                nombre: productData.nombre,
                precio: productData.precioVenta || productData.precio || 0,
                precio_compra: productData.precioCompra || 0,
                marca: productData.marca || 'GENERICA',
                impuesto: productData.impuesto || 'IVA(0%)',
                stock_total: productData.existencias || 0,
                ubicacion_inventario: productData.ubicacionInventario || 'PRODUCCION',
                activo: true
            };

            // Solo incluir imagen si es nueva (base64) o si es null
            if (productData.imagen && productData.imagen.startsWith('data:image')) {
                productToSave.imagen = productData.imagen;
            } else if (productData.imagen === null) {
                productToSave.imagen = null;
            }
            // Si la imagen es una URL existente, no la incluimos en la actualización

            // Obtener o crear categoría
            const categoriasMap = await getCategoriesMap();
            const categoriaName = productData.categoria || 'General';
            let categoriaId = categoriasMap[categoriaName.toLowerCase()];

            if (!categoriaId) {
                console.log(`📁 Creando categoría: ${categoriaName}`);
                const createdCat = await categoriaService.create(categoriaName);
                if (createdCat?.id) {
                    categoriaId = createdCat.id;
                    // Actualizar categorías
                    if (!categories.includes(categoriaName)) {
                        const newCategories = [...categories, categoriaName];
                        setCategories(newCategories);
                        saveToLocalStorage('categories', newCategories);
                    }
                }
            }

            productToSave.categoria = categoriaId;

            // Guardar en backend
            let savedProduct;
            let backendId;

            if (productData.id && !productData.id.toString().includes('-')) {
                // Actualizar producto existente
                savedProduct = await productoService.update(productData.id, productToSave);
                backendId = productData.id;
                console.log('✏️ Producto actualizado:', backendId);
            } else {
                // Crear nuevo producto
                savedProduct = await productoService.create(productToSave);
                backendId = savedProduct?.id;
                console.log('✅ Producto creado:', backendId);
            }

            // Crear objeto de producto unificado
            const newProduct = {
                id: backendId || productData.id || uuidv4(),
                name: productData.nombre,
                price: productData.precioVenta || productData.precio || 0,
                stock: productData.existencias || 0,
                category: categoriaName,
                brand: productData.marca || 'GENERICA',
                tax: productData.impuesto || 'IVA(0%)',
                image: productData.imagen,
                purchasePrice: productData.precioCompra || 0,
                orden: productData.orden || 0,
                ubicacionInventario: productData.ubicacionInventario || 'PRODUCCION'
            };

            // Actualizar estado
            const updatedProducts = productData.id && !productData.id.toString().includes('-')
                ? products.map(p => p.id === productData.id ? newProduct : p)
                : [...products, newProduct];

            setProducts(updatedProducts);
            syncToLocalStorage(updatedProducts);

            console.log('✅ Producto sincronizado en todos los módulos');
            return newProduct;

        } catch (error) {
            console.error('❌ Error agregando producto:', error);

            // Fallback: guardar localmente
            const newProduct = {
                id: productData.id || uuidv4(),
                name: productData.nombre,
                price: productData.precioVenta || productData.precio || 0,
                stock: productData.existencias || 0,
                category: productData.categoria || 'General',
                brand: productData.marca || 'GENERICA',
                tax: productData.impuesto || 'IVA(0%)',
                image: productData.imagen,
                purchasePrice: productData.precioCompra || 0
            };

            const updatedProducts = productData.id
                ? products.map(p => p.id === productData.id ? newProduct : p)
                : [...products, newProduct];

            setProducts(updatedProducts);
            syncToLocalStorage(updatedProducts);

            console.log('⚠️ Producto guardado localmente (offline)');
            return newProduct;
        }
    }, [products, categories, syncToLocalStorage, saveToLocalStorage]);

    const updateProduct = useCallback(async (productId, updates) => {
        try {
            console.log('✏️ Actualizando producto:', productId);

            // Actualizar en backend
            await productoService.update(productId, updates);

            // Actualizar en estado local
            const updatedProducts = products.map(p =>
                p.id === productId ? { ...p, ...updates } : p
            );

            setProducts(updatedProducts);
            syncToLocalStorage(updatedProducts);

            console.log('✅ Producto actualizado en todos los módulos');
            return true;
        } catch (error) {
            console.error('❌ Error actualizando producto:', error);
            return false;
        }
    }, [products, syncToLocalStorage]);

    const deleteProduct = useCallback(async (productId) => {
        try {
            console.log('🗑️ Eliminando producto FÍSICAMENTE:', productId);

            // 🔥 ELIMINAR FÍSICAMENTE del backend (DELETE)
            await productoService.delete(productId);

            // Eliminar del estado local
            const updatedProducts = products.filter(p => p.id !== productId);

            setProducts(updatedProducts);
            syncToLocalStorage(updatedProducts);

            console.log('✅ Producto eliminado PERMANENTEMENTE de la BD');
            return true;
        } catch (error) {
            console.error('❌ Error eliminando producto:', error);
            return false;
        }
    }, [products, syncToLocalStorage]);

    const updateStock = useCallback(async (productId, newStock, usuario = 'Sistema', nota = '') => {
        try {
            console.log('📦 Actualizando stock:', productId, newStock);

            const product = products.find(p => p.id === productId);
            if (!product) return false;

            const stockChange = newStock - product.stock;

            // Actualizar en backend
            await productoService.updateStock(productId, stockChange, usuario, nota);

            // Actualizar en estado local
            const updatedProducts = products.map(p =>
                p.id === productId ? { ...p, stock: newStock } : p
            );

            setProducts(updatedProducts);
            syncToLocalStorage(updatedProducts);

            console.log('✅ Stock actualizado en todos los módulos');
            return true;
        } catch (error) {
            console.error('❌ Error actualizando stock:', error);
            return false;
        }
    }, [products, syncToLocalStorage]);

    // ============================================
    // REORDENAMIENTO DE PRODUCTOS
    // ============================================

    const reorderProducts = useCallback(async (reorderedProducts) => {
        try {
            console.log('🔄 Reordenando productos...');

            // Asignar nuevo orden a cada producto
            const productsWithOrder = reorderedProducts.map((product, index) => ({
                ...product,
                orden: index
            }));

            // Actualizar estado local inmediatamente
            setProducts(productsWithOrder);
            syncToLocalStorage(productsWithOrder);

            // Actualizar en backend
            for (const product of productsWithOrder) {
                try {
                    await productoService.update(product.id, { orden: product.orden });
                } catch (error) {
                    console.error(`Error actualizando orden de ${product.name}:`, error);
                }
            }

            console.log('✅ Productos reordenados en todos los módulos');
            return true;
        } catch (error) {
            console.error('❌ Error reordenando productos:', error);
            return false;
        }
    }, [syncToLocalStorage]);

    // ============================================
    // OPERACIONES DE CATEGORÍAS
    // ============================================

    const getCategoriesMap = useCallback(async () => {
        try {
            const backendCategorias = await categoriaService.getAll();
            return backendCategorias?.reduce((map, cat) => {
                map[cat.nombre.toLowerCase()] = cat.id;
                return map;
            }, {}) || {};
        } catch (error) {
            console.error('Error cargando mapa de categorías:', error);
            return {};
        }
    }, []);

    const addCategory = useCallback(async (newCategory) => {
        if (!newCategory || categories.includes(newCategory)) return false;

        try {
            console.log('📁 Agregando categoría:', newCategory);
            await categoriaService.create(newCategory);

            const updatedCategories = [...categories, newCategory];
            setCategories(updatedCategories);
            saveToLocalStorage('categories', updatedCategories);

            console.log('✅ Categoría agregada');
            return true;
        } catch (error) {
            console.error('❌ Error agregando categoría:', error);
            // Guardar localmente de todos modos
            const updatedCategories = [...categories, newCategory];
            setCategories(updatedCategories);
            saveToLocalStorage('categories', updatedCategories);
            return true;
        }
    }, [categories, saveToLocalStorage]);

    const removeCategory = useCallback(async (categoryToRemove) => {
        if (categories.length <= 1) return false;

        try {
            console.log('🗑️ Eliminando categoría:', categoryToRemove);

            const fallbackCategory = categories.find(cat => cat !== categoryToRemove) || 'General';

            // Actualizar productos que usan esta categoría
            const updatedProducts = products.map(product =>
                product.category === categoryToRemove
                    ? { ...product, category: fallbackCategory }
                    : product
            );

            // Eliminar del backend
            const categoriasMap = await getCategoriesMap();
            const categoryId = categoriasMap[categoryToRemove.toLowerCase()];
            if (categoryId) {
                await categoriaService.delete(categoryId);
            }

            // Actualizar estado
            const updatedCategories = categories.filter(cat => cat !== categoryToRemove);
            setCategories(updatedCategories);
            saveToLocalStorage('categories', updatedCategories);

            setProducts(updatedProducts);
            syncToLocalStorage(updatedProducts);

            console.log('✅ Categoría eliminada');
            return true;
        } catch (error) {
            console.error('❌ Error eliminando categoría:', error);
            return false;
        }
    }, [categories, products, getCategoriesMap, saveToLocalStorage, syncToLocalStorage]);

    // ============================================
    // ACTUALIZACIÓN DE EXISTENCIAS (INVENTARIO)
    // ============================================

    const actualizarExistencias = useCallback((productosActualizados) => {
        console.log('📦 Actualizando existencias desde inventario');

        // Convertir formato inventario a formato unificado
        const updatedProducts = products.map(product => {
            const inventoryProduct = productosActualizados.find(p => p.id === product.id);
            return inventoryProduct
                ? { ...product, stock: inventoryProduct.existencias }
                : product;
        });

        setProducts(updatedProducts);
        syncToLocalStorage(updatedProducts);

        // Sincronizar con backend
        productosActualizados.forEach(async (producto) => {
            try {
                await productoService.update(producto.id, {
                    stock_total: producto.existencias
                });
            } catch (error) {
                console.error(`Error actualizando stock para ${producto.nombre}:`, error);
            }
        });

        console.log('✅ Existencias actualizadas en todos los módulos');
    }, [products, syncToLocalStorage]);

    // ============================================
    // CARGA DE IMÁGENES LOCALES
    // ============================================

    const loadLocalImages = useCallback(async () => {
        try {
            const images = await localImageService.getAllImages();
            const imagesMap = {};
            if (images && Array.isArray(images)) {
                images.forEach(img => {
                    if (img.id && img.data) {
                        imagesMap[img.id] = img.data;
                    }
                });
            }
            setProductImages(imagesMap);
            console.log(`🖼️ ${Object.keys(imagesMap).length} imágenes cargadas en memoria`);
        } catch (error) {
            console.error('Error cargando imágenes locales:', error);
        }
    }, []);

    // ============================================
    // INICIALIZACIÓN Y SINCRONIZACIÓN AUTOMÁTICA
    // ============================================

    useEffect(() => {
        const initialize = async () => {
            console.log('🚀 Inicializando contexto unificado de productos...');
            setIsInitialLoading(true);

            // Cargar imágenes en paralelo
            loadLocalImages();

            // 1. Cargar PRIMERO desde localStorage (instantáneo)
            const localProducts = getFromLocalStorage('products', []);
            const localCategories = getFromLocalStorage('categories', ['General', 'Servicios']);

            if (localProducts.length > 0) {
                console.log(`⚡ ${localProducts.length} productos cargados desde caché local`);
                setProducts(localProducts);
                setCategories(localCategories);
                setIsInitialLoading(false);

                // 2. Sincronizar con backend en segundo plano (sin bloquear UI)
                setTimeout(() => {
                    console.log('🔄 Sincronizando con backend en segundo plano...');
                    loadFromBackend();
                }, 100);
            } else {
                // Si no hay caché, cargar desde backend
                console.log('📡 No hay caché local, cargando desde backend...');
                await loadFromBackend();
                setIsInitialLoading(false);
            }

            console.log('✅ Contexto unificado inicializado');
        };

        initialize();

        // Sincronización periódica cada 10 minutos (en lugar de 60 segundos)
        const syncInterval = setInterval(() => {
            console.log('🔄 Sincronización automática en background...');
            loadFromBackend();
        }, 10 * 60 * 1000); // 10 minutos

        // Escuchar cambios de storage de otras pestañas
        const handleStorageChange = (e) => {
            if (e.key === 'products' || e.key === 'productos') {
                console.log('🔄 Detectado cambio en localStorage, recargando...');
                loadFromBackend();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Sincronizar cuando la ventana recupera el foco
        const handleFocus = () => {
            console.log('🔄 Ventana enfocada, sincronizando...');
            loadFromBackend();
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(syncInterval);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [loadFromBackend, loadLocalImages, getFromLocalStorage]);

    // ============================================
    // VALOR DEL CONTEXTO
    // ============================================

    const value = {
        // Estado
        products,
        categories,
        isSyncing,
        isInitialLoading,
        productImages, // Exponer imágenes

        // Operaciones CRUD
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        reorderProducts,

        // Categorías
        addCategory,
        removeCategory,

        // Sincronización
        loadFromBackend,
        syncToBackend,
        syncWithBackend: loadFromBackend, // Alias para compatibilidad
        loadProductsFromBackend: loadFromBackend, // Alias para compatibilidad

        // Inventario
        actualizarExistencias,

        // Utilidades
        toProductsFormat,
        toInventoryFormat
    };

    return (
        <UnifiedProductContext.Provider value={value}>
            {children}
        </UnifiedProductContext.Provider>
    );
};

export default UnifiedProductContext;
