import { useState, useEffect } from "react";
import "./cursos.css";
import { Link } from "react-router-dom";
import energias from "./energias.jpg";
import logoenergias from "./logoenergia.png";

interface Course {
  id_curso: number;
  titulo: string;
  descripcion: string;
  imagen_curso: string;
  nivel_dificultad: string;
  imagen?: string;
  banner?: string;
  duracion?: string;
  id?: number;
}

function Cursos() {
  const [cursos, setCursos] = useState<Course[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<Course | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        if (window.edunow?.db) {
          const courses = await window.edunow.db.getCourses();
          // Map to add local images if needed
          const mappedCourses = courses.map(course => ({
            ...course,
            id: course.id_curso,
            imagen: course.titulo === "Energías Renovables" ? logoenergias : "https://cdn-icons-png.flaticon.com/512/2103/2103626.png",
            banner: course.titulo === "Energías Renovables" ? energias : "https://img.freepik.com/vector-gratis/fondo-codigo-binario_53876-116181.jpg",
            duracion: course.titulo === "Energías Renovables" ? "24 horas" : "15 horas"
          }));
          setCursos(mappedCourses);
          if (mappedCourses.length > 0) setCursoSeleccionado(mappedCourses[0]);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    }
    fetchCourses();
  }, []);

  if (!cursoSeleccionado) {
    return <div>Loading...</div>;
  }

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
