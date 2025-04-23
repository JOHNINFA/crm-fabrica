import React, { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import "./styles.css"; // Asegúrate de crear este archivo

function RegistroForm({ registrosIniciales }) {
  const [registros, setRegistros] = useState(registrosIniciales || []);

  const calcularTotal = (registro) => {
    return (
      registro.cantidad -
      registro.descuentos +
      registro.adicional -
      registro.devoluciones -
      registro.vencidas
    );
  };

  const saveData = async (data) => {
    try {
      await fetch("http://localhost:8000/api/registros/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error en la conexión:", error);
    }
  };

  const debouncedSave = useCallback(debounce((data) => saveData(data), 1000), []);

  const handleChange = (index, field, value) => {
    const updatedRegistros = [...registros];
    updatedRegistros[index][field] = Number(value);
    setRegistros(updatedRegistros);
    debouncedSave(updatedRegistros[index]);
  };

  return (
    <table className="registro-table">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Cantidad</th>
          <th>Dctos.</th>
          <th>Adicional</th>
          <th>Devoluciones</th>
          <th>Vencidas</th>
          <th>Total</th>
          <th>Valor</th>
          <th>Neto</th>
        </tr>
      </thead>
      <tbody>
        {registros.map((registro, index) => (
          <tr
            key={index}
            className={index % 2 === 0 ? "fila-verde" : "fila-blanca"}
          >
            <td>{registro.producto}</td>
            <td>
              <input
                type="number"
                value={registro.cantidad}
                onChange={(e) => handleChange(index, "cantidad", e.target.value)}
              />
            </td>
            <td>
              <input
                type="number"
                value={registro.descuentos}
                onChange={(e) => handleChange(index, "descuentos", e.target.value)}
              />
            </td>
            <td>
              <input
                type="number"
                value={registro.adicional}
                onChange={(e) => handleChange(index, "adicional", e.target.value)}
              />
            </td>
            <td>
              <input
                type="number"
                value={registro.devoluciones}
                onChange={(e) => handleChange(index, "devoluciones", e.target.value)}
              />
            </td>
            <td>
              <input
                type="number"
                value={registro.vencidas}
                onChange={(e) => handleChange(index, "vencidas", e.target.value)}
              />
            </td>
            <td>{calcularTotal(registro)}</td>
            <td>${registro.valor.toLocaleString()}</td>
            <td>
              ${(
                calcularTotal(registro) * registro.valor
              ).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default RegistroForm;
