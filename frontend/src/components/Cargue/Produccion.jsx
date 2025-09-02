import React, { useState, useEffect } from 'react';
import { Table, Row, Col } from 'react-bootstrap';
import { useProducts } from '../../context/ProductContext';
import { useVendedores } from '../../context/VendedoresContext';
import { cargueService, detalleCargueService } from '../../services/cargueService';
import './Produccion.css';

const Produccion = () => {
  const { products } = useProducts();
  const { calcularTotalProductos } = useVendedores();
  
  // Estado para pedidos y sugeridos
  const [pedidos, setPedidos] = useState({});
  const [sugeridos, setSugeridos] = useState({});
  const [datosProduccionCargados, setDatosProduccionCargados] = useState(false);

  // Cargar datos de producción guardados
  const cargarDatosProduccion = async () => {
    try {
      const datosGuardados = await cargueService.getByDiaVendedor('PRODUCCION', 'PRODUCCION');
      
      if (datosGuardados && datosGuardados.length > 0) {
        const cargue = datosGuardados[0];
        const detalles = await detalleCargueService.getAll({ cargue_operativo: cargue.id });
        
        if (detalles && detalles.length > 0) {
          const pedidosGuardados = {};
          const sugeridosGuardados = {};
          
          detalles.forEach(detalle => {
            pedidosGuardados[detalle.producto_nombre] = detalle.adicional || 0;
            sugeridosGuardados[detalle.producto_nombre] = detalle.vencidas || 0; // Usar vencidas para sugeridos
          });
          
          setPedidos(pedidosGuardados);
          setSugeridos(sugeridosGuardados);
        }
      }
      setDatosProduccionCargados(true);
    } catch (error) {
      console.error('Error al cargar datos de producción:', error);
      setDatosProduccionCargados(true);
    }
  };

  // Cargar datos de todos los IDs al inicializar PRODUCCION
  useEffect(() => {
    const cargarTodosLosIDs = async () => {
      if (products.length === 0) return;
      
      try {
        const { simpleStorage } = await import('../../services/simpleStorage');
        const fechaActual = new Date().toISOString().split('T')[0];
        const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
        const idsVendedores = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];
        
        // Detectar el día actual o usar el último con datos
        let diaConDatos = null;
        
        for (const dia of diasSemana) {
          for (const id of idsVendedores) {
            const key = `cargue_${dia}_${id}_${fechaActual}`;
            const datos = await simpleStorage.getItem(key);
            if (datos && datos.productos && datos.productos.length > 0) {
              diaConDatos = dia;
              break;
            }
          }
          if (diaConDatos) break;
        }
        
        if (diaConDatos) {
          console.log(`📅 Cargando datos de ${diaConDatos}`);
          
          // Cargar datos de todos los IDs para ese día
          for (const id of idsVendedores) {
            const key = `cargue_${diaConDatos}_${id}_${fechaActual}`;
            const datos = await simpleStorage.getItem(key);
            
            if (datos && datos.productos) {
              const productosFormateados = datos.productos.map(p => ({
                id: p.id,
                producto: p.producto,
                total: p.total || 0
              }));
              
              // Simular actualización del contexto
              const { actualizarDatosVendedor } = await import('../../context/VendedoresContext');
              // Usar el contexto directamente
              window.dispatchEvent(new CustomEvent('actualizarVendedor', {
                detail: { id, productos: productosFormateados }
              }));
            }
          }
        }
        
        await cargarDatosProduccion();
      } catch (error) {
        console.error('Error cargando datos de IDs:', error);
      }
    };
    
    if (!datosProduccionCargados) {
      cargarTodosLosIDs();
    }
  }, [products, datosProduccionCargados]);

  // Calcular total directamente desde localStorage
  const calcularTotalDirecto = (nombreProducto) => {
    const fechaActual = new Date().toISOString().split('T')[0];
    const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    
    // Verificar si hay datos congelados para algún día
    for (const dia of diasSemana) {
      const estadoBoton = localStorage.getItem(`estado_boton_${dia}_${fechaActual}`);
      
      if (estadoBoton === 'ALISTAMIENTO_ACTIVO' || estadoBoton === 'DESPACHO' || estadoBoton === 'FINALIZAR') {
        // Usar datos congelados
        const datosCongelados = localStorage.getItem(`produccion_congelada_${dia}_${fechaActual}`);
        if (datosCongelados) {
          try {
            const totalesCongelados = JSON.parse(datosCongelados);
            console.log(`❄️ PRODUCCION usando datos congelados para ${nombreProducto}: ${totalesCongelados[nombreProducto] || 0}`);
            return totalesCongelados[nombreProducto] || 0;
          } catch (error) {
            // Si hay error, continuar con cálculo normal
          }
        }
      }
    }
    
    // Cálculo normal si no hay datos congelados
    let total = 0;
    const idsVendedores = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];
    
    for (const dia of diasSemana) {
      for (const id of idsVendedores) {
        const key = `cargue_${dia}_${id}_${fechaActual}`;
        const datosString = localStorage.getItem(key);
        
        if (datosString) {
          try {
            const datos = JSON.parse(datosString);
            if (datos && datos.productos) {
              const producto = datos.productos.find(p => p.producto === nombreProducto);
              if (producto && producto.total > 0) {
                total += producto.total;
              }
            }
          } catch (error) {
            // Ignorar errores de parsing
          }
        }
      }
    }
    
    return total;
  };

  // Función para calcular total (TOTAL PRODUCTOS + PEDIDOS)
  const calcularTotal = (nombreProducto) => {
    const totalProductos = calcularTotalDirecto(nombreProducto);
    const pedidosProducto = pedidos[nombreProducto] || 0;
    return totalProductos + pedidosProducto;
  };

  // Manejar cambios en pedidos
  const handlePedidoChange = (nombreProducto, valor) => {
    setPedidos(prev => ({
      ...prev,
      [nombreProducto]: parseInt(valor) || 0
    }));
  };

  // Manejar cambios en sugeridos
  const handleSugeridoChange = (nombreProducto, valor) => {
    setSugeridos(prev => ({
      ...prev,
      [nombreProducto]: parseInt(valor) || 0
    }));
  };

  // Función para guardar datos de producción
  const guardarProduccion = async () => {
    try {
      const datosProduccion = {
        dia_semana: 'PRODUCCION',
        vendedor_id: 'PRODUCCION',
        fecha: new Date().toISOString().split('T')[0],
        responsable: 'SISTEMA',
        productos: products.map(producto => ({
          producto_nombre: producto.name,
          cantidad: calcularTotalProductos(producto.name),
          dctos: 0,
          adicional: pedidos[producto.name] || 0,
          devoluciones: 0,
          vencidas: 0,
          total: calcularTotal(producto.name),
          valor: producto.price,
          neto: calcularTotal(producto.name) * producto.price,
          vendedor: false,
          despachador: false
        }))
      };
      
      await cargueService.guardarCargue(datosProduccion);
      console.log('Datos de producción guardados');
    } catch (error) {
      console.error('Error al guardar producción:', error);
    }
  };

  // Guardar automáticamente cuando cambien los datos
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (Object.keys(pedidos).length > 0 || Object.keys(sugeridos).length > 0) {
        guardarProduccion();
      }
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [pedidos, sugeridos]);

  // Datos para la tabla de porciones
  const datosPorciones = Array(22).fill({});

  return (
    <div className="container-fluid mt-4">
      <Row>
        <Col md={7}>
          <Table bordered responsive className="tabla-produccion">
            <thead className="header-produccion">
              <tr>
                <th>PRODUCTOS</th>
                <th>TOTAL PRODUCTOS</th>
                <th>PEDIDOS</th>
                <th>TOTAL</th>
                <th>SUGERIDO</th>
              </tr>
            </thead>
            <tbody>
              {products.map((producto, index) => (
                <tr key={index} className="fila-produccion">
                  <td className="producto-cell">{producto.name}</td>
                  <td>
                    <input 
                      type="number" 
                      value={calcularTotalDirecto(producto.name)} 
                      readOnly 
                      style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={pedidos[producto.name] || 0}
                      onChange={(e) => handlePedidoChange(producto.name, e.target.value)}
                      style={{ textAlign: 'center' }}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={calcularTotal(producto.name)}
                      readOnly
                      style={{ 
                        backgroundColor: '#e2efda', 
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#cc0000'
                      }}
                    />
                  </td>
                  <td className="sugerido-cell">
                    <input 
                      type="number" 
                      value={sugeridos[producto.name] || 0}
                      onChange={(e) => handleSugeridoChange(producto.name, e.target.value)}
                      style={{ textAlign: 'center' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
        <Col md={5}>
          <Table bordered responsive className="tabla-porciones">
            <thead className="header-porciones">
              <tr>
                <th>PORCION X2</th>
                <th>PORCION X3</th>
                <th>PORCION X4</th>
                <th>PORCION X5</th>
              </tr>
            </thead>
            <tbody>
              {datosPorciones.map((_, index) => (
                <tr key={index}>
                  <td><input type="number" defaultValue={0} /></td>
                  <td><input type="number" defaultValue={0} /></td>
                  <td><input type="number" defaultValue={0} /></td>
                  <td><input type="number" defaultValue={0} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot className="footer-porciones">
              <tr>
                <td colSpan="4" className="text-center fw-bold">TOTAL</td>
              </tr>
              <tr>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
              </tr>
            </tfoot>
          </Table>
        </Col>
      </Row>
    </div>
  );
};

export default Produccion;