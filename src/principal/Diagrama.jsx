import { useState, useEffect, useRef } from "react";
import "./Diagrama.css"
import * as d3 from "d3";


const SHEET_URL = "https://script.google.com/macros/s/AKfycbz_qeuYoHkhtdatI-WqLrPzDVkwA_be4uXYuBddqXCPkDaBEgKglh46a9t5nJrTwy7A4w/exec";

const GENEROS = [
  { id: "reggaeton", label: "Reggaetón", color: "#7F77DD" },
  { id: "rock",      label: "Rock",      color: "#D85A30" },
  { id: "salsa",     label: "Salsa",     color: "#1D9E75" },
];

export default function Diagrama() {
  const [seleccion, setSeleccion] = useState({});
  const [estado, setEstado] = useState("idle");
  const [datos, setDatos] = useState(null);
  const svgRef = useRef();

  const toggle = (id) =>
    setSeleccion(prev => ({ ...prev, [id]: !prev[id] }));

  const alguno = Object.values(seleccion).some(Boolean);

  const votar = async () => {
    setEstado("enviando");
    const params = new URLSearchParams({
      action: "votar",
      reggaeton: seleccion.reggaeton ? "1" : "0",
      rock: seleccion.rock ? "1" : "0",
      salsa: seleccion.salsa ? "1" : "0",
    });
    await fetch(`${SHEET_URL}?${params}`, { method: "GET", mode: "no-cors" });
    setEstado("votado");
    cargarDatos();
  };

  const cargarDatos = async () => {
    try {
      const res = await fetch(`${SHEET_URL}?action=datos`);
      const json = await res.json();
      setDatos(json);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  useEffect(() => {
    if (!datos || !svgRef.current) return;
    dibujarVenn(svgRef.current, datos);
  }, [datos]);

  return (
    <div className="wrap">
      <h1>¿Qué géneros musicales te gustan?</h1>
      <p className="sub">Puedes elegir más de uno</p>

      {estado !== "votado" ? (
        <>
          <div className="opciones">
            {GENEROS.map(g => (
              <button
                key={g.id}
                className={`opcion ${seleccion[g.id] ? "activo" : ""}`}
                style={{ "--color": g.color }}
                onClick={() => toggle(g.id)}
              >
                {seleccion[g.id] ? "✓ " : ""}{g.label}
              </button>
            ))}
          </div>
          <button className="btn-votar" disabled={!alguno || estado === "enviando"} onClick={votar}>
            {estado === "enviando" ? "Enviando..." : "Votar"}
          </button>
        </>
      ) : (
        <p className="gracias">¡Gracias por votar! Así van los resultados:</p>
      )}

      {datos && (
        <div className="venn-wrap">
          <svg ref={svgRef} viewBox="0 0 500 480" width="500" height="600" style={{ width: "100%", height: "auto" }} />
        </div>
      )}
    </div>
  );
}
function dibujarVenn(svgEl, d) {
  const svg = d3.select(svgEl);
  svg.selectAll("*").remove();

  const w = 500, h = 480, r = 120, op = 0.35;
  const cx = w / 2, cy = h / 2;

  const circles = [
    { x: cx - 65, y: cy - 50, color: "#7F77DD", label: "Reggaetón", val: d.reggaeton },
    { x: cx + 65, y: cy - 50, color: "#D85A30", label: "Rock",      val: d.rock },
    { x: cx,      y: cy + 65, color: "#1D9E75", label: "Salsa",     val: d.salsa },
  ];

  circles.forEach(c => {
    svg.append("circle")
      .attr("cx", c.x).attr("cy", c.y).attr("r", r)
      .attr("fill", c.color).attr("opacity", op)
      .attr("stroke", c.color).attr("stroke-width", 1.5);
  });

  const labelOffset = [
    { dx: -10, dy: -r - 14 },
    { dx:  10, dy: -r - 14 },
    { dx:   0, dy:  r + 22 },
  ];

  circles.forEach((c, i) => {
    svg.append("text")
      .attr("x", c.x + labelOffset[i].dx)
      .attr("y", c.y + labelOffset[i].dy)
      .attr("text-anchor", "middle")
      .attr("font-size", "13px").attr("font-weight", "500")
      .attr("fill", c.color)
      .text(`${c.label} (${c.val})`);
  });

  const intersecciones = [
    { x: cx,      y: cy - 68, val: d.reggaeton_rock - d.todos },
    { x: cx - 52, y: cy + 42, val: d.reggaeton_salsa - d.todos },
    { x: cx + 52, y: cy + 42, val: d.rock_salsa - d.todos },
    { x: cx,      y: cy + 5,  val: d.todos },
  ];

  intersecciones.forEach(i => {
    if (i.val <= 0) return;
    svg.append("text")
      .attr("x", i.x).attr("y", i.y)
      .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
      .attr("font-size", "15px").attr("font-weight", "500")
      .attr("fill", "#1a1a1a")
      .text(i.val);
  });
}