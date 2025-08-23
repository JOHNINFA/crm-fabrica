import React, { useState, useEffect } from 'react';
import { useProducts } from '../../context/ProductContext';
import { useVendedores } from '../../context/VendedoresContext';
import { simpleStorage } from '../../services/simpleStorage';
import TablaProductos from './TablaProductos';
import ResumenVentas from './ResumenVentas';
import BotonLimpiar from './BotonLimpiar';
import './PlantillaOperativa.css';

const PlantillaOperativa = ({ responsable = "RESPONSABLE", dia, idSheet, idUsuario, onEditarNombre }) => {
  const { products } = useProducts();
  const { actualizarDatosVendedor } = useVendedores();
  const [nombreResponsable, setNombreResponsable] = useState(responsable);

  // Buscar vendedor asignado a este ID
  useEffect(() => {
    const vendedoresGuardados = localStorage.getItem('vendedores');
    if (vendedoresGuardados) {
      const vendedores = JSON.parse(vendedoresGuardados);
      const vendedorAsignado = vendedores.find(v => v.idVendedor === idSheet);
      if (vendedorAsignado) {
        setNombreResponsable(vendedorAsignado.nombre.toUpperCase());
      } else {
        setNombreResponsable(responsable);
      }
    }
  }, [idSheet, responsable]);
  const [productosOperativos, setProductosOperativos] = useState([]);
  const [datosResumen, setDatosResumen] = useState({
    totalDespacho: 0,
    totalPedidos: 0,
    totalDctos: 0,
    venta: 0,
    totalEfectivo: 0,
  });

  // Cargar datos desde PostgreSQL y localStorage
  const cargarDatosGuardados = async () => {
    try {
      const key = `cargue_${dia}_${idSheet}`;
      const datos = await simpleStorage.getItem(key);
      
      if (datos && datos.productos) {
        const productosConDatos = products.map(product => {
          const productoGuardado = datos.productos.find(p => p.producto === product.name);
          
          if (productoGuardado) {
            return {
              id: product.id,
              producto: product.name,
              cantidad: productoGuardado.cantidad || 0,
              dctos: productoGuardado.dctos || 0,
              adicional: productoGuardado.adicional || 0,
              devoluciones: productoGuardado.devoluciones || 0,
              vencidas: productoGuardado.vencidas || 0,
              total: productoGuardado.total || 0,
              valor: Math.round(product.price * 0.65),
              neto: productoGuardado.neto || 0,
              vendedor: false,
              despachador: false
            };
          }
          
          return {
            id: product.id,
            producto: product.name,
            cantidad: 0,
            dctos: 0,
            adicional: 0,
            devoluciones: 0,
            vencidas: 0,
            total: 0,
            valor: Math.round(product.price * 0.65),
            neto: 0,
            vendedor: false,
            despachador: false
          };
        });
        
        setProductosOperativos(productosConDatos);
        return;
      }
      
      // Si no hay datos, usar formato inicial
      const productosFormateados = products.map(product => ({
        id: product.id,
        producto: product.name,
        cantidad: 0,
        dctos: 0,
        adicional: 0,
        devoluciones: 0,
        vencidas: 0,
        total: 0,
        valor: Math.round(product.price * 0.65),
        neto: 0,
        vendedor: false,
        despachador: false
      }));
      
      setProductosOperativos(productosFormateados);
    } catch (error) {

    }
  };

  useEffect(() => {
    if (products.length > 0) {
      cargarDatosGuardados();
    }
  }, [products, dia, idSheet]);

  const actualizarProducto = (id, campo, valor) => {
    setProductosOperativos(prev => 
      prev.map(p => {
        if (p.id === id) {
          // Manejar checkboxes (booleanos) y números por separado
          const valorProcesado = (campo === 'vendedor' || campo === 'despachador') 
            ? valor 
            : parseInt(valor) || 0;
          
          const updated = { ...p, [campo]: valorProcesado };
          
          // Calcular total automáticamente solo para campos numéricos
          if (campo !== 'vendedor' && campo !== 'despachador') {
            updated.total = updated.cantidad - updated.dctos + updated.adicional - updated.devoluciones - updated.vencidas;
            updated.neto = updated.total * updated.valor;
          }
          
          return updated;
        }
        return p;
      })
    );
  };

  // Función para guardar en PostgreSQL y localStorage
  const guardarEnBaseDatos = async (productos) => {
    try {
      const key = `cargue_${dia}_${idSheet}`;
      const datos = {
        dia,
        idSheet,
        productos: productos.filter(p => p.cantidad > 0),
        timestamp: Date.now()
      };
      
      await simpleStorage.setItem(key, datos);
    } catch (error) {

    }
  };

  useEffect(() => {
    // Calcular resumen automáticamente
    const totalNeto = productosOperativos.reduce((sum, p) => sum + (p.neto || 0), 0);
    setDatosResumen({
      totalDespacho: totalNeto,
      totalPedidos: 0,
      totalDctos: 0,
      venta: totalNeto,
      totalEfectivo: totalNeto,
    });
    
    // Actualizar contexto global de vendedores
    actualizarDatosVendedor(idSheet, productosOperativos);
    
    // Guardar en base de datos con debounce
    if (productosOperativos.length > 0) {
      const timeoutId = setTimeout(() => {
        guardarEnBaseDatos(productosOperativos);
      }, 2000); // Espera 2 segundos después del último cambio
      
      return () => clearTimeout(timeoutId);
    }
  }, [productosOperativos, idSheet]);

  const limpiarDatos = () => {
    setProductosOperativos(prev => 
      prev.map(p => ({
        ...p,
        cantidad: 0,
        dctos: 0,
        adicional: 0,
        devoluciones: 0,
        vencidas: 0,
        total: 0,
        neto: 0
      }))
    );
  };

  return (
    <div className="container-fluid plantilla-operativa" style={{ minWidth: '1200px' }}>
      <div className="d-flex justify-content-between align-items-center">
        <h6 
          className="responsable-title m-0" 
          onDoubleClick={onEditarNombre}
          style={{ cursor: 'pointer', userSelect: 'none', color: 'red' }}
        >
          {nombreResponsable}
        </h6>
      </div>
      <div className="row">
        <div className="col-lg-8">
          <TablaProductos 
            productos={productosOperativos} 
            onActualizarProducto={actualizarProducto}
          />
          <BotonLimpiar onLimpiar={limpiarDatos} />
        </div>
        <div className="col-lg-4">
          <ResumenVentas datos={datosResumen} productos={productosOperativos} />
        </div>
      </div>
    </div>
  );
};

export default PlantillaOperativa;