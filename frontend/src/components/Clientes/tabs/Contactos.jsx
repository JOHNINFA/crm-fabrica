import React from 'react';
import { Button, Table, Form } from 'react-bootstrap';

const Contactos = () => {
  return (
    <div>
      <Button variant="primary" className="mb-3">
        <i className="bi bi-plus-circle"></i> Crear Contacto
      </Button>
      <Form.Control 
        type="text" 
        className="mb-3" 
        placeholder="Búsqueda General"
      />
      <div className="table-responsive">
        <Table striped hover>
          <thead>
            <tr>
              <th>Acciones</th>
              <th>Id Contacto</th>
              <th>Contacto</th>
              <th>Tipo</th>
              <th>Teléfono</th>
              <th>E-Mail</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="7" className="text-center">
                No hay contactos para mostrar.
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default Contactos;