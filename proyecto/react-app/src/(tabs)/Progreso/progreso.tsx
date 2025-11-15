import { useState, useEffect } from "react";
import "./progreso.css";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, RadialBarChart, RadialBar, ResponsiveContainer, LineChart, Line } from 'recharts';

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

function Progreso() {
    // Mock data - replace with actual data fetching
    const [stats, setStats] = useState({
        completedExercises: 45,
        totalExercises: 100,
        correctExercises: 38,
        incorrectExercises: 7,
        currentLevel: 5,
        maxLevel: 10,
        streakDays: 12,
        achievements: [
            { id: 1, name: 'Primer ejercicio completado', icon: '🏆' },
            { id: 2, name: 'Racha de 7 días', icon: '🔥' },
            { id: 3, name: 'Nivel 5 alcanzado', icon: '⭐' },
            { id: 4, name: '100 ejercicios correctos', icon: '🎯' }
        ]
    });

    const exerciseData = [
        { name: 'Completados', value: stats.completedExercises },
        { name: 'Pendientes', value: stats.totalExercises - stats.completedExercises }
    ];

    const correctData = [
        { name: 'Correctos', value: stats.correctExercises },
        { name: 'Incorrectos', value: stats.incorrectExercises }
    ];

    const levelData = [
        { name: 'Nivel', value: (stats.currentLevel / stats.maxLevel) * 100 }
    ];

    const streakData = [
        { day: 'Lun', streak: 1 },
        { day: 'Mar', streak: 2 },
        { day: 'Mié', streak: 3 },
        { day: 'Jue', streak: 4 },
        { day: 'Vie', streak: 5 },
        { day: 'Sáb', streak: 6 },
        { day: 'Dom', streak: 7 }
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="progreso-container">
            <h1 className="progreso-title">Mi Progreso</h1>

            <div className="charts-grid">
                {/* Número de ejercicios completados */}
                <div className="chart-card">
                    <h2>Ejercicios Completados</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={exerciseData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Ejercicios correctos */}
                <div className="chart-card">
                    <h2>Ejercicios Correctos</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={correctData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {correctData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Nivel actual */}
                <div className="chart-card">
                    <h2>Nivel Actual</h2>
                    <div className="level-display">
                        <div className="level-number">{stats.currentLevel}</div>
                        <div className="level-text">de {stats.maxLevel}</div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" data={levelData}>
                            <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>

                {/* Racha en días */}
                <div className="chart-card">
                    <h2>Racha en Días</h2>
                    <div className="streak-display">
                        <div className="streak-number">{stats.streakDays}</div>
                        <div className="streak-text">días consecutivos</div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={streakData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="streak" stroke="#ff7300" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Sección de logros */}
            <div className="achievements-section">
                <h2>Logros Obtenidos</h2>
                <div className="achievements-grid">
                    {stats.achievements.map(achievement => (
                        <div key={achievement.id} className="achievement-card">
                            <div className="achievement-icon">{achievement.icon}</div>
                            <div className="achievement-name">{achievement.name}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Progreso;
