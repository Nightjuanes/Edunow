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

interface Student {
  id_estudiante: number;
  nombre_usuario: string;
  correo: string;
  vidas: number;
  racha_actual: number;
  racha_maxima: number;
  nivel_actual: number;
  puntos_totales: number;
  fecha_bloqueo_vidas: string | null;
}

function Cursos() {
  const [cursos, setCursos] = useState<Course[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<Course | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    async function fetchCourses() {
      try {
        if (window.edunow?.db) {
          const courses = await window.edunow.db.getCourses();
          // Map to add local images if needed
          const mappedCourses = courses.map(course => {
            const isCircuitsCourse = course.titulo.toLowerCase().includes('circuito');
            return {
              id: course.id_curso,
              titulo: course.titulo,
              descripcion: course.descripcion,
              imagen: isCircuitsCourse ? '/images/circuito.png' : course.imagen_curso,
              banner: isCircuitsCourse ? '/images/circuitos.jpg' : course.banner,
              duracion: course.duracion,
              nivel: course.nivel_dificultad
            };
          });
          setCursos(mappedCourses);
          if (mappedCourses.length > 0) setCursoSeleccionado(mappedCourses[0]);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    }

    async function fetchStudent() {
      try {
        if (window.edunow?.db) {
          const studentData = await window.edunow.db.getStudent(1);
          setStudent(studentData);
        }
      } catch (error) {
        console.error('Error fetching student:', error);
      }
    }

    fetchCourses();
    fetchStudent();
  }, []);

  useEffect(() => {
    if (student?.vidas === 0) {
      const interval = setInterval(() => {
        const blockTime = student.fecha_bloqueo_vidas ? new Date(student.fecha_bloqueo_vidas).getTime() : Date.now();
        const now = Date.now();
        const timePassed = now - blockTime;
        const oneHour = 60 * 60 * 1000;
        const remaining = Math.max(0, oneHour - timePassed);
        setTimeRemaining(remaining);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [student]);

  if (!cursoSeleccionado || !student) {
    return <div>Loading...</div>;
  }

  if (student.vidas === 0) {
    const minutes = Math.floor(timeRemaining / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    return (
      <div className="cursos-container-nolives">

        <div className="loading-content">
          <h2 >Tus vidas se están recargando</h2>
          <p className="loading-text">Espera un momento mientras recuperas tus vidas...</p>
          <p className="time-remaining">Próxima vida en: {minutes}:{seconds.toString().padStart(2, '0')}</p>
          <div className="spinner"></div>
        </div>
      </div>

    );
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
