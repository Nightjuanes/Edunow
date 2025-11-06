import { Link, useParams } from "react-router-dom";
import "./contenido.css";

function ContenidoCursos() {
  const { id } = useParams();

  const cursos = [
    {
      id: 1,
      titulo: "Energías Renovables",
      etapas: [
        { id: 1, titulo: "Etapa 1: Energía Solar", icono: "☀️" },
        { id: 2, titulo: "Etapa 2: Energía Eólica", icono: "🌬️" },
        { id: 3, titulo: "Etapa 3: Energía Hidroeléctrica", icono: "💧" },
      ],
    },
    {
      id: 2,
      titulo: "Pseudo-código",
      etapas: [
        { id: 1, titulo: "Etapa 1: Estructuras Básicas", icono: "📘" },
        { id: 2, titulo: "Etapa 2: Condicionales", icono: "⚙️" },
        { id: 3, titulo: "Etapa 3: Ciclos y Bucles", icono: "🔁" },
      ],
    },
  ];

  const cursoSeleccionado = cursos.find(
    (curso) => curso.id === parseInt(id || "0")
  );

  return (
    <div className="contenido-container">
      {cursoSeleccionado ? (
        <>
        <Link to="/cursos">
        <button className="boton-mis-cursos"> Mis cursos</button>
        </Link>
          <h1 className="titulo-curso">
            Curso de {cursoSeleccionado.titulo}
          </h1>

          <div className="mapa-progreso">
            {cursoSeleccionado.etapas.map((etapa, index) => (
              <div key={etapa.id} className="etapa">
                <div className="icono">{etapa.icono}</div>
                <p className="etapa-titulo">{etapa.titulo}</p>
                {index < cursoSeleccionado.etapas.length - 1 && (
                  <div className="linea"></div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p>Curso no encontrado</p>
      )}
    </div>
  );
}

export default ContenidoCursos;
