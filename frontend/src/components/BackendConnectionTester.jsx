import React, { useState } from 'react';
import { Button, Modal, Alert, Spinner, Table } from 'react-bootstrap';
import { productoService, categoriaService } from '../services/api';

/**
 * Componente para probar la conexión con el backend
 */
const BackendConnectionTester = ({ show, onHide }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [testProductId, setTestProductId] = useState(null);

  // Función para probar la conexión
  const runTests = async () => {
    setIsLoading(true);
    setError('');
    setResults(null);
    
    const testResults = {
      productos: {
        getAll: { success: false, message: '', data: null },
        create: { success: false, message: '', data: null },
        update: { success: false, message: '', data: null },
        delete: { success: false, message: '', data: null }
      },
      categorias: {
        getAll: { success: false, message: '', data: null },
        create: { success: false, message: '', data: null }
      }
    };

    try {
      // 1. Probar obtener todos los productos
      try {
        const productos = await productoService.getAll();
        if (productos && Array.isArray(productos)) {
          testResults.productos.getAll = {
            success: true,
            message: `Se obtuvieron ${productos.length} productos`,
            data: productos.length
          };
        } else {
          testResults.productos.getAll = {
            success: false,
            message: 'No se pudieron obtener los productos',
            data: null
          };
        }
      } catch (error) {
        testResults.productos.getAll = {
          success: false,
          message: `Error: ${error.message || 'Desconocido'}`,
          data: null
        };
      }

      // 1.5 Obtener categorías primero para usar un ID válido
      let categoriaId = 3; // Valor por defecto (General)
      try {
        const categorias = await categoriaService.getAll();
        if (categorias && Array.isArray(categorias) && categorias.length > 0) {
          testResults.categorias.getAll = {
            success: true,
            message: `Se obtuvieron ${categorias.length} categorías`,
            data: categorias.length
          };
          
          // Buscar la categoría "General" o usar la primera disponible
          const generalCategoria = categorias.find(c => c.nombre === "General") || categorias[0];
          categoriaId = generalCategoria.id;
        } else {
          testResults.categorias.getAll = {
            success: false,
            message: 'No se pudieron obtener las categorías',
            data: null
          };
        }
      } catch (error) {
        testResults.categorias.getAll = {
          success: false,
          message: `Error: ${error.message || 'Desconocido'}`,
          data: null
        };
      }

      // 2. Probar crear un producto de prueba
      try {
        const testProduct = {
          nombre: `Producto de prueba ${Date.now()}`,
          precio: 100,
          precio_compra: 80,
          stock_total: 10,
          categoria: categoriaId, // Usar ID de categoría válido
          marca: 'TEST',
          impuesto: 'IVA(0%)',
          activo: true
        };
        
        const createdProduct = await productoService.create(testProduct);
        if (createdProduct && createdProduct.id) {
          setTestProductId(createdProduct.id);
          testResults.productos.create = {
            success: true,
            message: `Producto creado con ID ${createdProduct.id}`,
            data: createdProduct.id
          };
        } else {
          testResults.productos.create = {
            success: false,
            message: 'No se pudo crear el producto',
            data: null
          };
        }
      } catch (error) {
        testResults.productos.create = {
          success: false,
          message: `Error: ${error.message || 'Desconocido'}`,
          data: null
        };
      }

      // 3. Probar actualizar el producto de prueba
      if (testResults.productos.create.success) {
        try {
          const updateData = {
            precio: 120,
            stock_total: 15
          };
          
          const updatedProduct = await productoService.update(testResults.productos.create.data, updateData);
          if (updatedProduct) {
            testResults.productos.update = {
              success: true,
              message: 'Producto actualizado correctamente',
              data: updatedProduct
            };
          } else {
            testResults.productos.update = {
              success: false,
              message: 'No se pudo actualizar el producto',
              data: null
            };
          }
        } catch (error) {
          testResults.productos.update = {
            success: false,
            message: `Error: ${error.message || 'Desconocido'}`,
            data: null
          };
        }

        // 4. Probar marcar como inactivo (eliminar) el producto de prueba
        try {
          const deleteResult = await productoService.update(testResults.productos.create.data, { activo: false });
          if (deleteResult) {
            testResults.productos.delete = {
              success: true,
              message: 'Producto marcado como inactivo correctamente',
              data: deleteResult
            };
          } else {
            testResults.productos.delete = {
              success: false,
              message: 'No se pudo marcar el producto como inactivo',
              data: null
            };
          }
        } catch (error) {
          testResults.productos.delete = {
            success: false,
            message: `Error: ${error.message || 'Desconocido'}`,
            data: null
          };
        }
      }

      // 6. Probar crear una categoría de prueba
      try {
        const testCategory = `Test_${Date.now()}`;
        const createdCategory = await categoriaService.create(testCategory);
        if (createdCategory) {
          testResults.categorias.create = {
            success: true,
            message: 'Categoría creada correctamente',
            data: testCategory
          };
        } else {
          testResults.categorias.create = {
            success: false,
            message: 'No se pudo crear la categoría',
            data: null
          };
        }
      } catch (error) {
        testResults.categorias.create = {
          success: false,
          message: `Error: ${error.message || 'Desconocido'}`,
          data: null
        };
      }

      setResults(testResults);
    } catch (error) {
      setError(`Error general durante las pruebas: ${error.message || 'Desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular si todas las pruebas pasaron
  const allPassed = results && 
    Object.values(results.productos).every(r => r.success) && 
    Object.values(results.categorias).every(r => r.success);

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Prueba de Conexión con el Backend</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}
        
        <div className="mb-3">
          <Button 
            variant="primary" 
            onClick={runTests}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Ejecutando pruebas...
              </>
            ) : (
              'Ejecutar Pruebas de Conexión'
            )}
          </Button>
        </div>
        
        {results && (
          <>
            <Alert variant={allPassed ? "success" : "warning"}>
              {allPassed 
                ? "✅ Todas las pruebas pasaron. La conexión con el backend funciona correctamente." 
                : "⚠️ Algunas pruebas fallaron. Hay problemas con la conexión al backend."}
            </Alert>
            
            <h5>Resultados de las pruebas:</h5>
            
            <h6>Productos:</h6>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Operación</th>
                  <th>Resultado</th>
                  <th>Mensaje</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Obtener todos</td>
                  <td>{results.productos.getAll.success ? '✅' : '❌'}</td>
                  <td>{results.productos.getAll.message}</td>
                </tr>
                <tr>
                  <td>Crear</td>
                  <td>{results.productos.create.success ? '✅' : '❌'}</td>
                  <td>{results.productos.create.message}</td>
                </tr>
                <tr>
                  <td>Actualizar</td>
                  <td>{results.productos.update.success ? '✅' : '❌'}</td>
                  <td>{results.productos.update.message}</td>
                </tr>
                <tr>
                  <td>Eliminar</td>
                  <td>{results.productos.delete.success ? '✅' : '❌'}</td>
                  <td>{results.productos.delete.message}</td>
                </tr>
              </tbody>
            </Table>
            
            <h6>Categorías:</h6>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Operación</th>
                  <th>Resultado</th>
                  <th>Mensaje</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Obtener todas</td>
                  <td>{results.categorias.getAll.success ? '✅' : '❌'}</td>
                  <td>{results.categorias.getAll.message}</td>
                </tr>
                <tr>
                  <td>Crear</td>
                  <td>{results.categorias.create.success ? '✅' : '❌'}</td>
                  <td>{results.categorias.create.message}</td>
                </tr>
              </tbody>
            </Table>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BackendConnectionTester;