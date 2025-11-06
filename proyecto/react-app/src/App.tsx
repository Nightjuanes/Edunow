import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './(tabs)/Home/Home';
import ProfeNow from './(tabs)/ProfeNow/ProfeNow';
import Cursos from './(tabs)/Cursos/Cursos';
import Progreso from './(tabs)/Progreso/progreso';
import Start from './Start/Start';


import { Link } from 'react-router-dom';


function App() {
  return (
    <Router>
      <div>
        {/* Aquí puedes poner tu menú de navegación */}
        <nav>
          <Link to="/home">Home</Link>
          <Link to="/profe-now">Profe Now</Link>
          <Link to="/cursos">Cursos</Link>
          <Link to="/progreso">Progreso</Link>
        </nav>

        {/* Aquí defines las rutas */}
        <Routes>
          
          <Route path="/home" element={<Home />} />
          <Route path="/profe-now" element={<ProfeNow />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/progreso" element={<Progreso />} />
          
        </Routes>
      </div>
    </Router>
  );
}

export default App;