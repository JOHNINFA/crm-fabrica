import React, { useState, useEffect } from 'react';
import { useProducts } from '../../context/ProductContext';
import { useVendedores } from '../../context/VendedoresContext';
import { simpleStorage } from '../../services/simpleStorage';
import TablaProductos from './TablaProductos';
import ResumenVentas from './ResumenVentas';
import BotonLimpiar from './BotonLimpiar';
import './PlantillaOperativa.css';

const PlantillaOperativa = ({ responsable = "RESPONSABLE", dia, idSheet, idUsuario, onEditarNombre, fechaSeleccionada }) => {
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

  // Cargar datos desde localStorage
  const cargarDatosGuardados = async () => {
    try {
      // Usar fecha actual si no se proporciona fechaSeleccionada
      const fechaAUsar = fechaSeleccionada || new Date().toISOString().split('T')[0];
      const key = `cargue_${dia}_${idSheet}_${fechaAUsar}`;
      
      console.log(`🔍 CARGANDO ${idSheet} - Key: ${key}`);
      
      // Primero intentar desde localStorage directamente
      const datosLocalString = localStorage.getItem(key);
      let datos = null;
      
      if (datosLocalString) {
        try {
          datos = JSON.parse(datosLocalString);
          console.log(`📂 ${idSheet} - Datos encontrados:`, datos.productos ? datos.productos.length : 0, 'productos');
        } catch (error) {
          console.error(`❌ ${idSheet} - Error parsing localStorage:`, error);
        }
      } else {
        console.log(`⚠️ ${idSheet} - No hay datos en localStorage para ${key}`);
      }
      
      if (datos && datos.productos) {
        console.log(`🔍 ${idSheet} - Estructura de datos:`, datos.productos.slice(0, 2)); // Mostrar primeros 2 productos
        
        console.log(`🔍 ${idSheet} - Productos del contexto:`, products.length);
        console.log(`🔍 ${idSheet} - Primer producto contexto:`, products[0]?.name);
        console.log(`🔍 ${idSheet} - Primer producto guardado:`, datos.productos[0]?.producto);
        
        // Orden específico de productos
        const ordenEspecifico = [
          'AREPA TIPO OBLEA 500Gr',
          'AREPA MEDIANA 330Gr',
          'AREPA TIPO PINCHO 330Gr',
          'AREPA QUESO ESPECIAL GRANDE 600Gr',
          'AREPA CON QUESO CUADRADA 450Gr',
          'AREPA CON QUESO ESPECIAL PEQUEÑA 600Gr',
          'AREPA QUESO CORRIENTE 450Gr',
          'AREPA BOYACENSE X 10',
          'ALMOJABANA X 5 300Gr',
          'AREPA SANTANDEREANA 450Gr',
          'AREPA DE CHOCLO CON QUESO PEQUEÑA 700 Gr',
          'AREPA DE CHOCLO CON QUESO PEQUEÑA 700Gr',
          'AREPA CON SEMILLA DE QUINUA 450Gr',
          'AREPA DE CHOCLO CON QUESO GRANDE 1200Gr',
          'AREPA DE CHOCLO CORRIENTE 300Gr',
          'AREPA BOYACENSE X 5 450Gr',
          'ALMOJABANAS X 10 600Gr',
          'AREPA QUESO MINI X10'
        ];
        
        const productosOrdenados = [...products].sort((a, b) => {
          const indexA = ordenEspecifico.indexOf(a.name);
          const indexB = ordenEspecifico.indexOf(b.name);
          
          if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          
          return indexA - indexB;
        });
        
        const productosConDatos = productosOrdenados.map(product => {
          const productoGuardado = datos.productos.find(p => p.producto === product.name);
          
          if (productoGuardado) {
            console.log(`✅ ${idSheet} - Cargando producto: ${product.name} - Cantidad: ${productoGuardado.cantidad}`);
            return {
              id: product.id,
              producto: product.name,
              cantidad: productoGuardado.cantidad || 0,
              dctos: productoGuardado.dctos || 0,
              adicional: productoGuardado.adicional || 0,
              devoluciones: productoGuardado.devoluciones || 0,
              vencidas: productoGuardado.vencidas || 0,
              lotesVencidos: productoGuardado.lotesVencidos || [],
              total: productoGuardado.total || 0,
              valor: productoGuardado.valor || Math.round(product.price * 0.65),
              neto: productoGuardado.neto || 0,
              vendedor: productoGuardado.vendedor || false,
              despachador: productoGuardado.despachador || false
            };
          } else {
            console.log(`❌ ${idSheet} - NO encontrado: ${product.name}`);
          }
          
          return {
            id: product.id,
            producto: product.name,
            cantidad: 0,
            dctos: 0,
            adicional: 0,
            devoluciones: 0,
            vencidas: 0,
            lotesVencidos: [],
            total: 0,
            valor: Math.round(product.price * 0.65),
            neto: 0,
            vendedor: false,
            despachador: false
          };
        });
        
        console.log(`✅ ${idSheet} - Datos cargados correctamente desde localStorage`);
        console.log(`🔄 ${idSheet} - Estableciendo productos:`, productosConDatos.filter(p => p.cantidad > 0).map(p => `${p.producto}: ${p.cantidad}`));
        setProductosOperativos(productosConDatos);
        return;
      }
      
      // Si no hay datos, usar formato inicial con orden específico
      const ordenEspecifico = [
        'AREPA TIPO OBLEA 500Gr',
        'AREPA MEDIANA 330Gr',
        'AREPA TIPO PINCHO 330Gr',
        'AREPA QUESO ESPECIAL GRANDE 600Gr',
        'AREPA CON QUESO CUADRADA 450Gr',
        'AREPA CON QUESO ESPECIAL PEQUEÑA 600Gr',
        'AREPA QUESO CORRIENTE 450Gr',
        'AREPA BOYACENSE X 10',
        'ALMOJABANA X 5 300Gr',
        'AREPA SANTANDEREANA 450Gr',
        'AREPA DE CHOCLO CON QUESO PEQUEÑA 700 Gr',
        'AREPA DE CHOCLO CON QUESO PEQUEÑA 700Gr',
        'AREPA CON SEMILLA DE QUINUA 450Gr',
        'AREPA DE CHOCLO CON QUESO GRANDE 1200Gr',
        'AREPA DE CHOCLO CORRIENTE 300Gr',
        'AREPA BOYACENSE X 5 450Gr',
        'ALMOJABANAS X 10 600Gr',
        'AREPA QUESO MINI X10'
      ];
      
      const productosOrdenados = [...products].sort((a, b) => {
        const indexA = ordenEspecifico.indexOf(a.name);
        const indexB = ordenEspecifico.indexOf(b.name);
        
        if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        
        return indexA - indexB;
      });
      
      const productosFormateados = productosOrdenados.map(product => ({
        id: product.id,
        producto: product.name,
        cantidad: 0,
        dctos: 0,
        adicional: 0,
        devoluciones: 0,
        vencidas: 0,
        lotesVencidos: [],
        total: 0,
        valor: Math.round(product.price * 0.65),
        neto: 0,
        vendedor: false,
        despachador: false
      }));
      
      console.log(`🆕 ${idSheet} - Usando datos iniciales (${productosFormateados.length} productos)`);
      console.log(`⚠️ ${idSheet} - RESETEO A DATOS INICIALES - Esto no debería pasar si hay datos guardados`);
      setProductosOperativos(productosFormateados);
    } catch (error) {

    }
  };

  useEffect(() => {
    console.log(`🔍 ${idSheet} - Productos disponibles:`, products.length, products.map(p => p.name));
    if (products.length > 5) { // Esperar a que se carguen todos los productos (no solo "Servicio")
      cargarDatosGuardados();
    } else {
      console.log(`⏳ ${idSheet} - Esperando productos completos... (actual: ${products.length})`);
    }
  }, [products, dia, idSheet, fechaSeleccionada]);

  // Función deshabilitada - solo el botón DESPACHO afecta inventario

  const actualizarProducto = async (id, campo, valor) => {
    setProductosOperativos(prev => 
      prev.map(p => {
        if (p.id === id) {
          // Manejar diferentes tipos de campos
          let valorProcesado;
          
          if (campo === 'vendedor' || campo === 'despachador') {
            // Campos booleanos
            valorProcesado = valor;
          } else if (campo === 'lotesVencidos') {
            // Array de lotes vencidos
            valorProcesado = valor;
          } else {
            // Campos numéricos
            valorProcesado = parseInt(valor) || 0;
          }
          
          const updated = { ...p, [campo]: valorProcesado };
          
          // Calcular total automáticamente solo para campos numéricos (no para texto o checkboxes)
          if (campo !== 'vendedor' && campo !== 'despachador' && campo !== 'lotesVencidos') {
            updated.total = updated.cantidad - updated.dctos + updated.adicional - updated.devoluciones - updated.vencidas;
            updated.neto = Math.round(updated.total * updated.valor);
            
            console.log(`📊 ${updated.producto}: cantidad=${updated.cantidad}, total=${updated.total} - Sin afectar inventario`);
          }
          
          return updated;
        }
        return p;
      })
    );
  };



  // Sin lógica especial de sincronización - todos los IDs funcionan igual

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
    
    // Actualizar contexto siempre, excepto cuando esté en modo ALISTAMIENTO activo
    const estadoBoton = localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`);
    const estadoDespacho = localStorage.getItem(`estado_despacho_${dia}_${fechaSeleccionada}`);
    
    // SIEMPRE actualizar datos locales - el congelamiento solo afecta PRODUCCION
    actualizarDatosVendedor(idSheet, productosOperativos);
    console.log(`✅ Datos actualizados para ${idSheet}:`, productosOperativos.filter(p => p.total > 0).map(p => `${p.producto}: ${p.total}`));
    
    // IMPORTANTE: SIEMPRE guardar en localStorage (independiente del estado de PRODUCCION)
    console.log(`💾 Guardando en localStorage ${idSheet}:`, productosOperativos.filter(p => p.total > 0).length, 'productos con datos');
    
    // Guardar inmediatamente en localStorage
    if (productosOperativos.length > 0) {
      const fechaAUsar = fechaSeleccionada || new Date().toISOString().split('T')[0];
      const key = `cargue_${dia}_${idSheet}_${fechaAUsar}`;
      // Guardar todos los productos (sin filtrar)
      const productosFiltrados = productosOperativos;
      
      const datos = {
        dia,
        idSheet,
        fecha: fechaAUsar,
        productos: productosFiltrados,
        timestamp: Date.now(),
        sincronizado: false // Marcar como no sincronizado
      };
      
      localStorage.setItem(key, JSON.stringify(datos));
      console.log(`💾 Guardado en localStorage: ${idSheet} - Productos con datos:`, productosFiltrados.filter(p => p.cantidad > 0).length);
    }
  }, [productosOperativos, idSheet]);

  // Función limpiarDatos deshabilitada para debug
  const limpiarDatos = () => {
    console.log('⚠️ limpiarDatos llamada - DESHABILITADA para debug');
    // Función deshabilitada temporalmente
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
          <BotonLimpiar 
            productos={productosOperativos}
            dia={dia}
            idSheet={idSheet}
            fechaSeleccionada={fechaSeleccionada}
            onLimpiar={limpiarDatos}
          />
        </div>
        <div className="col-lg-4">
          <ResumenVentas datos={datosResumen} productos={productosOperativos} />
        </div>
      </div>
    </div>
  );
};

export default PlantillaOperativa;