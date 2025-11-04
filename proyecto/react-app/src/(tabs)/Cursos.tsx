function Cursos() {
    return (    
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Mis Cursos</h1>
            <ul className="space-y-4">
                <li className="border border-slate-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <h2 className="text-xl font-semibold">Curso de Matemáticas</h2>
                    <p className="text-slate-600">Nivel: Intermedio</p>
                </li>
            </ul>
        </div>
    );
}
export default Cursos;