// src/components/RegistroForm.jsx

import React, { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import '../styles.css';

export default function RegistroForm({
  registrosIniciales,
  dia,
  id_sheet,
  id_usuario,
}) {
  const [registros, setRegistros] = useState([]);


  useEffect(() => {
    async function load() {
      try {
        const url = new URL("/api/registros/");
        url.searchParams.append("dia", dia);
        url.searchParams.append("id_sheet", id_sheet);
        url.searchParams.append("id_usuario", id_usuario);

        const res = await fetch(url);
        const data = await res.json();

        if (data.length > 0) {
          setRegistros(data);
        } else {
          // Si no hay datos guardados, cargamos la plantilla inicial
          setRegistros(registrosIniciales);
        }
      } catch (err) {
        console.error("Error cargando registros:", err);
        setRegistros(registrosIniciales);
      }
    }
    load();
  }, [dia, id_sheet, id_usuario, registrosIniciales]);

  // 2) Función que decide POST o PATCH en función de si tiene id
  const saveData = async (registro) => {
    const isNew = !registro.id;
    const endpoint = isNew
      ? "/api/registros/"
      : `/api/registros/${registro.id}/`;
    const method = isNew ? "POST" : "PATCH";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registro),
      });
      if (!res.ok) {
        console.error("API error:", await res.text());
      } else if (isNew) {
        const created = await res.json();
        // Reemplazamos el placeholder (sin id) por el objeto ya creado (con id)
        setRegistros((prev) =>
          prev.map((r) => (r === registro ? created : r))
        );
      }
    } catch (err) {
      console.error("Error de red guardando registro:", err);
    }
  };

  // 3) Evitamos llamar demasiado a la API con debounce
  const debouncedSave = useCallback(debounce(saveData, 800), []);

  // 4) Cálculo local de total (para renderizar en la tabla)
  const calcularTotal = (r) =>
    r.cantidad - r.descuentos + r.adicional - r.devoluciones - r.vencidas;

  // 5) Manejador de cambios en inputs
  const handleChange = (index, field, value) => {
    setRegistros((prev) => {
      const updated = prev.map((r, i) =>
        i === index ? { ...r, [field]: Number(value) } : r
      );

      // Preparamos el payload completo
      const base = updated[index];
      const payload = {
        id: base.id, // undefined si es nuevo
        dia,
        id_sheet,
        id_usuario,
        v_vendedor: base.v_vendedor ?? false,
        d_despachador: base.d_despachador ?? false,
        producto: base.producto,
        cantidad: base.cantidad,
        descuentos: base.descuentos,
        adicional: base.adicional,
        devoluciones: base.devoluciones,
        vencidas: base.vencidas,
        valor: base.valor,
        // total y neto los calcula el backend
      };

      debouncedSave(payload);
      return updated;
    });
  };

  return (
    <table className="registro-table">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Cantidad</th>
          <th>Dctos.</th>
          <th>Adicional</th>
          <th>Devol.</th>
          <th>Vencidas</th>
          <th>Total</th>
          <th>Valor</th>
          <th>Neto</th>
        </tr>
      </thead>
      <tbody>
        {registros.map((r, i) => (
          <tr
            key={r.id ?? i}
            className={i % 2 === 0 ? "fila-verde" : "fila-blanca"}
          >
            <td>{r.producto}</td>

            {["cantidad", "descuentos", "adicional", "devoluciones", "vencidas"].map(
              (f) => (
                <td key={f}>
                  <input
                    type="number"
                    value={r[f]}
                    onChange={(e) => handleChange(i, f, e.target.value)}
                  />
                </td>
              )
            )}

            <td>{calcularTotal(r)}</td>
            <td>${r.valor.toLocaleString()}</td>
            <td>${(calcularTotal(r) * r.valor).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}