import { Link, Outlet } from "react-router-dom";
import "./Layout.css";
import logo from "../edunowlogo.png"; 


export default function Layout() {
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
            <span>🔥 20 días</span>
            <span>🚀 Nivel 5</span>
            <span>❤️❤️❤️</span>
          </div>
        </header>
        <section className="content">
          <Outlet /> {/* Aquí se renderizan las páginas */}
        </section>
      </main>
    </div>
  );
}
