import { useState, useEffect } from "react";
import "./cursos.css";
import { Link } from "react-router-dom";


interface Course {
  id: number;
  titulo: string;
  descripcion: string;
  imagen: string;
  banner: string;
  duracion: string;
  nivel: string;
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
            id: course.id_curso,
            titulo: course.titulo,
            descripcion: course.descripcion,
            imagen: course.imagen_curso,
            banner: course.banner,
            duracion: course.duracion,
            nivel: course.nivel_dificultad
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
