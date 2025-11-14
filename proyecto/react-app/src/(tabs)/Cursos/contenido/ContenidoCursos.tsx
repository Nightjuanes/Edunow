import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import "./contenido.css";
import Ejercicio from "./ejercicio/Ejercicio";

function ContenidoCursos() {
  const { id } = useParams();
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<any | null>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [courseTitle, setCourseTitle] = useState("");

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!id) return;
      const courseId = parseInt(id);
      try {
        const courses = await (window as any).edunow.db.getCourses();
        const course = courses.find((c: any) => c.id_curso === courseId);
        if (course) {
          setCourseTitle(course.titulo);
          const mods = await (window as any).edunow.db.getModules(courseId);
          setModules(mods);
        }
      } catch (error) {
        console.error("Error fetching course data:", error);
      }
    };
    fetchCourseData();
  }, [id]);

  const handleModuleClick = async (module: any) => {
    setSelectedModule(module);
    setSelectedLesson(null);
    setSelectedExercise(null);
    try {
      const less = await (window as any).edunow.db.getLessons(module.id_modulo);
      setLessons(less);
      // Fetch exercises for all lessons in this module
      const allExercises: any[] = [];
      for (const lesson of less) {
        const exs = await (window as any).edunow.db.getExercises(lesson.id_leccion);
        allExercises.push(...exs);
      }
      setExercises(allExercises);
    } catch (error) {
      console.error("Error fetching lessons and exercises:", error);
    }
  };

  const handleLessonClick = async (lesson: any) => {
    setSelectedLesson(lesson);
    setSelectedExercise(null);
    try {
      const exs = await (window as any).edunow.db.getExercises(lesson.id_leccion);
      setExercises(exs);
    } catch (error) {
      console.error("Error fetching exercises:", error);
    }
  };

  const handleExerciseClick = (exercise: any) => {
    setSelectedExercise(exercise);
  };

  const handleExerciseComplete = (score: number) => {
    // Handle completion, perhaps update UI or navigate
    console.log("Exercise completed with score:", score);
  };

  return (
    <div className="contenido-container">
      <Link to="/cursos">
        <button className="boton-mis-cursos">Mis cursos</button>
      </Link>
      <h1 className="titulo-curso">{courseTitle}</h1>

      {!selectedModule && (
        <div className="mapa-progreso">
          {modules.map((module) => (
            <div key={module.id_modulo} className="etapa" onClick={() => handleModuleClick(module)}>
              <div className="icono">📘</div>
              <p className="etapa-titulo">{module.titulo_modulo}</p>
            </div>
          ))}
        </div>
      )}

      {selectedModule && !selectedExercise && (
        <div>
          <button onClick={() => setSelectedModule(null)}>Volver a módulos</button>
          <h2>{selectedModule.titulo_modulo}</h2>
          <div className="exercises-list">
            {exercises.map((exercise) => (
              <div key={exercise.id_ejercicio} className="exercise-item" onClick={() => handleExerciseClick(exercise)}>
                <p>Ejercicio de {exercise.tipo}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedExercise && (
        <div>
          <button onClick={() => setSelectedExercise(null)}>Volver a ejercicios</button>
          <Ejercicio exercise={selectedExercise} studentId={1} onComplete={handleExerciseComplete} />
        </div>
      )}
    </div>
  );
}

export default ContenidoCursos;
