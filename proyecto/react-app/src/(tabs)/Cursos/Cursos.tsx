import { useState } from "react";
import "./cursos.css";
import { Link } from "react-router-dom";
import energias from "./energias.jpg";
import logoenergias from "./logoenergia.png";

function Cursos() {
  const cursos = [
    {
      id: 1,
      titulo: "Energías Renovables",
      descripcion:
        "Explora soluciones y aprende cómo las energías renovables cambiarán el futuro. Solar, eólica y tecnologías innovadoras.",
      duracion: "24 horas",
      imagen: logoenergias,
      banner:
        energias,
    },
    {
      id: 2,
      titulo: "Pseudo-código",
      descripcion:
        "Vuélvete un experto en el arte de la creación de algoritmos y pensamiento lógico.",
      duracion: "15 horas",
      imagen: "https://cdn-icons-png.flaticon.com/512/2103/2103626.png",
      banner:
        "https://img.freepik.com/vector-gratis/fondo-codigo-binario_53876-116181.jpg",
    },
  ];

  // Estado para el curso seleccionado
  const [cursoSeleccionado, setCursoSeleccionado] = useState(cursos[0]);

  return (
    <div className="cursos-container">
      {/* Columna izquierda con lista */}
      <div className="cursos-lista">
        <h1 className="titulo-principal">MIS CURSOS</h1>
        {cursos.map((curso) => (
          <div
            key={curso.id}
            className={`tarjeta-curso ${
              cursoSeleccionado.id === curso.id ? "activo" : ""
            }`}
            onClick={() => setCursoSeleccionado(curso)}
          >
            <img src={curso.imagen} alt={curso.titulo} className="curso-icono" />
            <div className="curso-info">
              <h2 className="curso-titulo">{curso.titulo}</h2>
              <p className="curso-descripcion">{curso.descripcion}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Columna derecha con detalle dinámico */}
      <div className="curso-detalle">
        <img
          src={cursoSeleccionado.banner}
          alt={cursoSeleccionado.titulo}
          className="curso-banner"
        />
        <h2 className="detalle-titulo">{cursoSeleccionado.titulo}</h2>
        <p className="detalle-duracion">⏱️ {cursoSeleccionado.duracion}</p>
        <p className="detalle-descripcion">
          {cursoSeleccionado.descripcion}
        </p>
        <div className="botones">
          {/* 🔗 Redirección dinámica con el ID */}
          <Link to={`/contenido_curso/${cursoSeleccionado.id}`}>
            <button className="btn">INICIAR</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Cursos;
