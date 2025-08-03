import React from 'react';
import { Table, Row, Col } from 'react-bootstrap';
import './Produccion.css';

const Produccion = () => {
  // Productos de la tabla principal (usando los mismos productos del sistema)
  const productosProduccion = [
    "AREPA TIPO OBLEA 500Gr",
    "AREPA MEDIANA 330Gr",
    "AREPA TIPO PINCHO 330Gr",
    "AREPA QUESO CORRIENTE 450Gr",
    "AREPA DE CHOCLO CON QUESO PEQUEÑA 700Gr",
    "AREPA QUESO MINI X10",
    "AREPA CON QUESO CUADRADA 450Gr",
    "AREPA DE CHOCLO CON QUESO GRANDE 1200Gr",
    "AREPA DE CHOCLO CORRIENTE 300Gr",
    "AREPA DE CHOCLO CON QUESO PEQUEÑA 700",
    "AREPA QUESO ESPECIAL GRANDE 600Gr",
    "AREPA CON QUESO ESPECIAL PEQUEÑA 600Gr"
  ];

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
              {productosProduccion.map((producto, index) => (
                <tr key={index} className="fila-produccion">
                  <td className="producto-cell">{producto}</td>
                  <td><input type="number" defaultValue={0} /></td>
                  <td><input type="number" defaultValue={0} /></td>
                  <td><input type="number" defaultValue={0} /></td>
                  <td className="sugerido-cell"><input type="number" defaultValue={0} /></td>
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