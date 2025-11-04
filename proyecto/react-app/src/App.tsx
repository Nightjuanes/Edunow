import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './(tabs)/Home';
import ProfeNow from './(tabs)/ProfeNow';
import Cursos from './(tabs)/Cursos';
import Progreso from './(tabs)/progreso';


import { Link } from 'react-router-dom';


function App() {
  return (
    <Router>
      <div>
        {/* Aquí puedes poner tu menú de navegación */}
        <nav>
          <Link to="/">Home</Link>
          <Link to="/profe-now">Profe Now</Link>
          <Link to="/cursos">Cursos</Link>
          <Link to="/progreso">Progreso</Link>
        </nav>

        {/* Aquí defines las rutas */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profe-now" element={<ProfeNow />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/progreso" element={<Progreso />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;