import { Link, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Layout.css";
import logo from "../edunowlogo.png";


interface Student {
  id_estudiante: number;
  nombre_usuario: string;
  correo: string;
  vidas: number;
  racha_actual: number;
  racha_maxima: number;
  nivel_actual: number;
  puntos_totales: number;
  // other fields...
}

export default function Layout() {
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    async function fetchStudent() {
      try {
        if (window.edunow?.db) {
          const studentData = await window.edunow.db.getStudent(1); // Assuming student ID 1
          setStudent(studentData);
        }
      } catch (error) {
        console.error('Error fetching student:', error);
      }
    }
    fetchStudent();
  }, []);

  const renderHearts = (lives: number) => {
    return '❤️'.repeat(lives);
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        
        <div className="logo-container">
          <Link to= "/start" className="start">
            <img src={logo} alt="Logo EduNow" className="logo-img" />
          </Link>
          
        </div>

        <nav>
          <Link to="/home" className="tab">🏠 Home</Link>
          <Link to="/profe-now" className="tab">👩‍🏫 Profe Now</Link>
          <Link to="/cursos" className="tab">📚 Cursos</Link>
          <Link to="/progreso" className="tab">📈 Progreso</Link>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="stats">
            <span>EXP {student ? student.puntos_totales : 0} Puntos</span>
            <span>🔥 {student ? student.racha_actual : 0} días</span>
            <span>🚀 Nivel {student ? student.nivel_actual : 1}</span>
            <span>{student ? renderHearts(student.vidas) : '❤️❤️❤️'}</span>
          </div>
        </header>
        <section className="content">
          <Outlet /> {/* Aquí se renderizan las páginas */}
        </section>
      </main>
    </div>
  );
}
