import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import "./contenido.css";
import Ejercicio from "./ejercicio/Ejercicio";
import Button from "../../../components/Button";

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

function ContenidoCursos() {
  const { id } = useParams();
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<any | null>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [exerciseProgress, setExerciseProgress] = useState<{[key: number]: any}>({});

  const isEnergyCourse = courseTitle.toLowerCase().includes('energ');
  const progressIcons = isEnergyCourse ? ['☀️'] : ['📘',  '📗', '📙'];

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

    const fetchStudent = async () => {
      try {
        if (window.edunow?.db) {
          const studentData = await window.edunow.db.getStudent(1);
          setStudent(studentData);
        }
      } catch (error) {
        console.error('Error fetching student:', error);
      }
    };

    fetchCourseData();
    fetchStudent();
  }, [id]);

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

      // Fetch progress for these exercises
      const progress = await (window as any).edunow.db.getProgress(1); // Assuming student ID 1
      const progressMap: {[key: number]: any} = {};
      progress.forEach((p: any) => {
        progressMap[p.id_ejercicio] = p;
      });
      setExerciseProgress(progressMap);
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

      // Fetch progress for these exercises
      const progress = await (window as any).edunow.db.getProgress(1); // Assuming student ID 1
      const progressMap: {[key: number]: any} = {};
      progress.forEach((p: any) => {
        progressMap[p.id_ejercicio] = p;
      });
      setExerciseProgress(progressMap);
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

  if (!student) {
    return <div>Loading...</div>;
  }

  if (student.vidas === 0) {
    const minutes = Math.floor(timeRemaining / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    return (
      <div className="contenido-container" style={{ position: 'relative' }}>
        <div className="lives-reloading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <h2>Tus vidas se están recargando</h2>
            <p>Espera un momento mientras recuperas tus vidas...</p>
            <p>Próxima vida en: {minutes}:{seconds.toString().padStart(2, '0')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contenido-container" style={{ position: 'relative' }}>
      <Link to="/cursos">
        <Button variant="secondary" size="medium" className="boton-mis-cursos">
          Mis cursos
        </Button>
      </Link>
      <h1 className="titulo-curso">{courseTitle}</h1>

      {!selectedModule && (
        <div className="mapa-progreso">
          {modules.map((module, index) => (
            <div key={module.id_modulo} className="etapa" onClick={() => handleModuleClick(module)}>
              <div className="icono">{progressIcons[index % progressIcons.length]}</div>
              <p className="etapa-titulo">{module.titulo_modulo}</p>
            </div>
          ))}
        </div>
      )}

      {selectedModule && !selectedExercise && (
        <div>
          <Button variant="secondary" size="medium" onClick={() => setSelectedModule(null)}>
            Volver a módulos
          </Button>
          <h2>{selectedModule.titulo_modulo}</h2>
          <div className="exercises-list">
            {exercises.map((exercise) => {
              const progress = exerciseProgress[exercise.id_ejercicio];
              const isPerfectlyCompleted = progress && progress.completado_correctamente === 1;
              return (
                <div
                  key={exercise.id_ejercicio}
                  className={`exercise-item ${isPerfectlyCompleted ? 'completed-perfectly' : ''}`}
                  onClick={() => handleExerciseClick(exercise)}
                >
                  {isPerfectlyCompleted && <div className="completion-indicator">🟢</div>}
                  <p>{exercise.tipo === 'pseudocodigo' ? '💻 ' : ''}Ejercicio de {exercise.tipo}</p>
                  {isPerfectlyCompleted && <p className="completed-text">Completado perfectamente</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedExercise && (
        <div>
          <Button variant="secondary" size="medium" onClick={() => setSelectedExercise(null)}>
            Volver a ejercicios
          </Button>
          <Ejercicio exercise={selectedExercise} studentId={1} onComplete={handleExerciseComplete} />
        </div>
      )}
    </div>
  );
}

export default ContenidoCursos;
