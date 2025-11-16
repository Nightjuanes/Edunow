import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Home from "./(tabs)/Home/Home";
import ProfeNow from "./(tabs)/ProfeNow/ProfeNow";
import Cursos from "./(tabs)/Cursos/Cursos";
import Progreso from "./(tabs)/Progreso/progreso";
import Start from "./Start/Start";
import ContenidoCurso from "./(tabs)/Cursos/contenido/ContenidoCursos";
import { AudioProvider } from "./hooks/AudioContext";


function App() {
  return (
    <AudioProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/start" replace />} />
          {/* Pantalla de inicio fuera del layout */}
          <Route path="/start" element={<Start />} />

          {/* Todo lo que va dentro del layout */}
          <Route element={<Layout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/profe-now" element={<ProfeNow />} />
            <Route path="/cursos" element={<Cursos />} />
            <Route path="/progreso" element={<Progreso />} />
            <Route path="/contenido_curso/:id" element={<ContenidoCurso />} />
          </Route>
        </Routes>
      </Router>
    </AudioProvider>
  );
}

export default App;
