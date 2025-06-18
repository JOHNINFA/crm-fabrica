/**
 * Script para probar la conexión con el backend
 * 
 * Este script verifica si el frontend puede comunicarse correctamente con el backend
 * probando las operaciones CRUD básicas para productos y categorías.
 */

import { productoService, categoriaService } from '../services/api';

// Función para probar la conexión
const testBackendConnection = async () => {
  console.log('=== PRUEBA DE CONEXIÓN CON EL BACKEND ===');
  const results = {
    productos: {
      getAll: false,
      create: false,
      update: false,
      delete: false
    },
    categorias: {
      getAll: false,
      create: false
    }
  };

  try {
    // 1. Probar obtener todos los productos
    console.log('1. Probando obtener todos los productos...');
    try {
      const productos = await productoService.getAll();
      if (productos && Array.isArray(productos)) {
        console.log(`✅ Éxito: Se obtuvieron ${productos.length} productos`);
        results.productos.getAll = true;
      } else {
        console.log('❌ Error: No se pudieron obtener los productos');
      }
    } catch (error) {
      console.error('❌ Error al obtener productos:', error);
    }

    // 2. Probar crear un producto de prueba
    console.log('\n2. Probando crear un producto de prueba...');
    let testProductId = null;
    try {
      const testProduct = {
        nombre: `Producto de prueba ${Date.now()}`,
        precio: 100,
        precio_compra: 80,
        stock_total: 10,
        categoria: 'Test',
        marca: 'TEST',
        impuesto: 'IVA(0%)',
        activo: true
      };
      
      const createdProduct = await productoService.create(testProduct);
      if (createdProduct && createdProduct.id) {
        console.log(`✅ Éxito: Producto creado con ID ${createdProduct.id}`);
        testProductId = createdProduct.id;
        results.productos.create = true;
      } else {
        console.log('❌ Error: No se pudo crear el producto');
      }
    } catch (error) {
      console.error('❌ Error al crear producto:', error);
    }

    // 3. Probar actualizar el producto de prueba
    if (testProductId) {
      console.log(`\n3. Probando actualizar el producto ${testProductId}...`);
      try {
        const updateData = {
          precio: 120,
          stock_total: 15
        };
        
        const updatedProduct = await productoService.update(testProductId, updateData);
        if (updatedProduct) {
          console.log('✅ Éxito: Producto actualizado');
          results.productos.update = true;
        } else {
          console.log('❌ Error: No se pudo actualizar el producto');
        }
      } catch (error) {
        console.error('❌ Error al actualizar producto:', error);
      }

      // 4. Probar marcar como inactivo (eliminar) el producto de prueba
      console.log(`\n4. Probando marcar como inactivo el producto ${testProductId}...`);
      try {
        const deleteResult = await productoService.update(testProductId, { activo: false });
        if (deleteResult) {
          console.log('✅ Éxito: Producto marcado como inactivo');
          results.productos.delete = true;
        } else {
          console.log('❌ Error: No se pudo marcar el producto como inactivo');
        }
      } catch (error) {
        console.error('❌ Error al marcar producto como inactivo:', error);
      }
    }

    // 5. Probar obtener todas las categorías
    console.log('\n5. Probando obtener todas las categorías...');
    try {
      const categorias = await categoriaService.getAll();
      if (categorias && Array.isArray(categorias)) {
        console.log(`✅ Éxito: Se obtuvieron ${categorias.length} categorías`);
        results.categorias.getAll = true;
      } else {
        console.log('❌ Error: No se pudieron obtener las categorías');
      }
    } catch (error) {
      console.error('❌ Error al obtener categorías:', error);
    }

    // 6. Probar crear una categoría de prueba
    console.log('\n6. Probando crear una categoría de prueba...');
    try {
      const testCategory = `Test_${Date.now()}`;
      const createdCategory = await categoriaService.create(testCategory);
      if (createdCategory) {
        console.log('✅ Éxito: Categoría creada');
        results.categorias.create = true;
      } else {
        console.log('❌ Error: No se pudo crear la categoría');
      }
    } catch (error) {
      console.error('❌ Error al crear categoría:', error);
    }

    // Resumen de resultados
    console.log('\n=== RESUMEN DE RESULTADOS ===');
    console.log('Productos:');
    console.log(`  - Obtener todos: ${results.productos.getAll ? '✅' : '❌'}`);
    console.log(`  - Crear: ${results.productos.create ? '✅' : '❌'}`);
    console.log(`  - Actualizar: ${results.productos.update ? '✅' : '❌'}`);
    console.log(`  - Eliminar: ${results.productos.delete ? '✅' : '❌'}`);
    console.log('Categorías:');
    console.log(`  - Obtener todas: ${results.categorias.getAll ? '✅' : '❌'}`);
    console.log(`  - Crear: ${results.categorias.create ? '✅' : '❌'}`);

    // Verificar si todas las pruebas pasaron
    const allPassed = 
      results.productos.getAll && 
      results.productos.create && 
      results.productos.update && 
      results.productos.delete && 
      results.categorias.getAll && 
      results.categorias.create;

    if (allPassed) {
      console.log('\n✅✅✅ TODAS LAS PRUEBAS PASARON - La conexión con el backend funciona correctamente');
    } else {
      console.log('\n❌❌❌ ALGUNAS PRUEBAS FALLARON - Hay problemas con la conexión al backend');
    }

    return results;
  } catch (error) {
    console.error('Error general durante las pruebas:', error);
    return results;
  }
};

// Exportar la función para uso en consola
window.testBackendConnection = testBackendConnection;

// Ejecutar automáticamente
testBackendConnection().then(results => {
  console.log('Prueba de conexión completada');
});

export default testBackendConnection;