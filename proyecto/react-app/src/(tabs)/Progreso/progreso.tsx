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

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
}

interface Stats {
  completedExercises: number;
  totalExercises: number;
  correctExercises: number;
  incorrectExercises: number;
  currentLevel: number;
  maxLevel: number;
  streakDays: number;
  achievements: Achievement[];
}

function Progreso() {
    const [stats, setStats] = useState<Stats>({
        completedExercises: 0,
        totalExercises: 0,
        correctExercises: 0,
        incorrectExercises: 0,
        currentLevel: 1,
        maxLevel: 10,
        streakDays: 0,
        achievements: []
    });

    useEffect(() => {
        async function fetchStats() {
            try {
                if (window.edunow?.db) {
                    const studentStats = await window.edunow.db.getStudentStats(1); // Assuming student ID 1
                    const achievements = await window.edunow.db.getStudentAchievements(1);
                    setStats({
                        ...studentStats,
                        achievements
                    });
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        }

        fetchStats();
    }, []);

    const exerciseData = [
        { name: 'Completados', value: stats.correctExercises },
        { name: 'Pendientes', value: stats.totalExercises - stats.correctExercises }
    ];

    const correctData = [
        { name: 'Correctos', value: stats.correctExercises },
        { name: 'No Correctos', value: stats.totalExercises - stats.correctExercises }
    ];

    const levelPercentage = (stats.currentLevel / stats.maxLevel) * 100;
    const levelData = [
        { name: 'Completado', value: stats.currentLevel },
        { name: 'Restante', value: stats.maxLevel - stats.currentLevel }
    ];

    const getLevelColor = (percentage: number) => {
        if (percentage >= 80) return '#00C49F'; // Green
        if (percentage >= 50) return '#a476ffff'; // Yellow
        return '#a476ffff'; // Red
    };

    const levelColors = [getLevelColor(levelPercentage), '#E0E0E0'];

    const streakData = [
        { day: 'Lun', streak: 1 },
        { day: 'Mar', streak: 1 },
        { day: 'Mié', streak: 0 },
        { day: 'Jue', streak: 0 },
        { day: 'Vie', streak: 0 },
        { day: 'Sáb', streak: 0 },
        { day: 'Dom', streak: 0 }
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
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={levelData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {levelData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={levelColors[index % levelColors.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
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
