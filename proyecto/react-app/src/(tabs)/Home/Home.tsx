import { useState, useEffect } from "react";
import "./home.css";

interface CourseInProgress {
  id_curso: number;
  titulo: string;
  descripcion: string;
  imagen_curso: string;
  banner: string;
  nivel_dificultad: string;
  duracion: string;
  progressPercentage: number;
}

function Home() {
  const [coursesInProgress, setCoursesInProgress] = useState<CourseInProgress[]>([]);

  useEffect(() => {
    async function fetchCoursesInProgress() {
      try {
        if (window.edunow?.db) {
          const courses = await window.edunow.db.getCoursesInProgress(1); // Assuming student ID 1
          setCoursesInProgress(courses);
        }
      } catch (error) {
        console.error('Error fetching courses in progress:', error);
      }
    }

    fetchCoursesInProgress();
  }, []);

  return (
    <div className="home-container">
      <h1 className="home-title">Bienvenido a EDUNOW</h1>
      <p className="home-subtitle">Continúa aprendiendo con tus cursos en progreso</p>

      {coursesInProgress.length > 0 ? (
        <div className="courses-in-progress">
          <h2>Mis Cursos en Progreso</h2>
          <div className="courses-grid">
            {coursesInProgress.map((course) => (
              <div key={course.id_curso} className="course-card">
                <img src={course.imagen_curso} alt={course.titulo} className="course-image" />
                <div className="course-info">
                  <h3 className="course-title">{course.titulo}</h3>
                  <p className="course-description">{course.descripcion}</p>
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${course.progressPercentage}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{course.progressPercentage}% completado</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-courses">
          <p>No tienes cursos en progreso. ¡Empieza a aprender!</p>
        </div>
      )}
    </div>
  );
}

export default Home;
