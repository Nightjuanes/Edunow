import React, { useState, useEffect, useRef } from 'react';
import Button from '../../../../components/Button';
import { useAudio } from '../../../../hooks/useAudio';
import './ejercicio.css';

interface Exercise {
  id_ejercicio: number;
  pregunta: string;
  tipo: string;
  respuesta_correcta: string;
  puntos: number;
}

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

interface EjercicioProps {
  exercise: Exercise;
  studentId: number;
  onComplete: (score: number) => void;
}

const Ejercicio: React.FC<EjercicioProps> = ({ exercise, studentId, onComplete }) => {
  const { playSuccess, playError } = useAudio();
  const [matches, setMatches] = useState<{ [key: string]: string }>({});
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [lines, setLines] = useState<{x1: number, y1: number, x2: number, y2: number, correct: boolean}[]>([]);

  // Word search states
  const [grid, setGrid] = useState<string[][]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());
  const [selectedCells, setSelectedCells] = useState<{row: number, col: number}[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [gridSize, setGridSize] = useState(10);

  const exerciseData = JSON.parse(exercise.pregunta);
  const terms = exerciseData.terms;
  const definitions = exerciseData.definitions;
  const correctMatches = JSON.parse(exercise.respuesta_correcta);

  const handleTermClick = (term: string) => {
    if (isSubmitted) return;
    setSelectedTerm(term);
    if (selectedDef) {
      setMatches({ ...matches, [term]: selectedDef });
      setSelectedTerm(null);
      setSelectedDef(null);
    }
  };

  const handleDefClick = (def: string) => {
    if (isSubmitted) return;
    setSelectedDef(def);
    if (selectedTerm) {
      setMatches({ ...matches, [selectedTerm]: def });
      setSelectedTerm(null);
      setSelectedDef(null);
    }
  };

  const handleSubmit = async () => {
    let correctCount = 0;
    Object.keys(correctMatches).forEach(term => {
      if (matches[term] === correctMatches[term]) {
        correctCount++;
      }
    });
    const calculatedScore = Math.round((correctCount / terms.length) * exercise.puntos);
    setScore(calculatedScore);
    setIsSubmitted(true);

    // Play success or error sound based on performance
    const isPerfect = correctCount === terms.length;
    const isGood = correctCount >= terms.length * 0.7; // 70% correct
    if (isPerfect) {
      playSuccess();
    } else if (isGood) {
      // Could add a different sound for partial success
    } else {
      playError();
    }

    // Save progress to backend
    try {
      await (window as any).edunow.db.updateProgress({
        id_estudiante: studentId,
        id_ejercicio: exercise.id_ejercicio,
        estado: 'completado',
        intentos: 1, // Assuming first attempt
        fecha_completado: new Date().toISOString(),
        puntaje_obtenido: calculatedScore
      });
      // Notify to refresh student data
      window.dispatchEvent(new CustomEvent('studentDataUpdated'));
    } catch (error) {
      console.error('Error saving progress:', error);
      alert(error instanceof Error ? error.message : 'Error saving progress'); // Show block message
      setIsSubmitted(false); // Allow retry or something
      return;
    }

    onComplete(calculatedScore);
  };

  const handleSubmitWordSearch = async () => {
    const foundCount = foundWords.size;
    const calculatedScore = Math.round((foundCount / words.length) * exercise.puntos);
    setScore(calculatedScore);
    setIsSubmitted(true);

    // Play success or error sound based on performance
    const isPerfect = foundCount === words.length;
    const isGood = foundCount >= words.length * 0.7; // 70% found
    if (isPerfect) {
      playSuccess();
    } else if (isGood) {
      // Could add a different sound for partial success
    } else {
      playError();
    }

    // Save progress to backend
    try {
      await (window as any).edunow.db.updateProgress({
        id_estudiante: studentId,
        id_ejercicio: exercise.id_ejercicio,
        estado: 'completado',
        intentos: 1,
        fecha_completado: new Date().toISOString(),
        puntaje_obtenido: calculatedScore
      });
      // Notify to refresh student data
      window.dispatchEvent(new CustomEvent('studentDataUpdated'));
    } catch (error) {
      console.error('Error saving progress:', error);
      alert(error instanceof Error ? error.message : 'Error saving progress'); // Show block message
      setIsSubmitted(false); // Allow retry or something
      return;
    }

    onComplete(calculatedScore);
  };

  const getMatchClass = (term: string, def: string) => {
    if (!isSubmitted) return '';
    if (matches[term] === def) {
      return correctMatches[term] === def ? 'correct' : 'incorrect';
    }
    return '';
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const newLines: {x1: number, y1: number, x2: number, y2: number, correct: boolean}[] = [];

    Object.entries(matches).forEach(([term, def]) => {
      const termEl = container.querySelector(`[data-term="${term}"]`) as HTMLElement;
      const defEl = container.querySelector(`[data-def="${def}"]`) as HTMLElement;
      if (termEl && defEl) {
        const termRect = termEl.getBoundingClientRect();
        const defRect = defEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const x1 = termRect.right - containerRect.left;
        const y1 = termRect.top + termRect.height / 2 - containerRect.top;
        const x2 = defRect.left - containerRect.left;
        const y2 = defRect.top + defRect.height / 2 - containerRect.top;
        const correct = isSubmitted ? (correctMatches[term] === def) : false;
        newLines.push({ x1, y1, x2, y2, correct });
      }
    });

    setLines(newLines);
  }, [matches, isSubmitted]);

  // Function to generate word search grid
  const generateGrid = (words: string[], size: number): string[][] => {
    const grid: string[][] = Array(size).fill(null).map(() => Array(size).fill(''));
    const directions = [
      {dr: 0, dc: 1}, // right
      {dr: 1, dc: 0}, // down
      {dr: 1, dc: 1}, // down right
      {dr: 1, dc: -1} // down left
    ];

    words.forEach(word => {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 100) {
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const startRow = Math.floor(Math.random() * size);
        const startCol = Math.floor(Math.random() * size);
        if (canPlaceWord(grid, word, startRow, startCol, dir.dr, dir.dc, size)) {
          placeWord(grid, word, startRow, startCol, dir.dr, dir.dc);
          placed = true;
        }
        attempts++;
      }
    });

    // Fill empty cells with random letters
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === '') {
          grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
      }
    }
    return grid;
  };

  const canPlaceWord = (grid: string[][], word: string, row: number, col: number, dr: number, dc: number, size: number): boolean => {
    for (let i = 0; i < word.length; i++) {
      const r = row + i * dr;
      const c = col + i * dc;
      if (r < 0 || r >= size || c < 0 || c >= size) return false;
      if (grid[r][c] !== '' && grid[r][c] !== word[i]) return false;
    }
    return true;
  };

  const placeWord = (grid: string[][], word: string, row: number, col: number, dr: number, dc: number) => {
    for (let i = 0; i < word.length; i++) {
      const r = row + i * dr;
      const c = col + i * dc;
      grid[r][c] = word[i];
    }
  };

  // Word search interaction handlers
  const handleMouseDown = (row: number, col: number) => {
    if (isSubmitted) return;
    setIsSelecting(true);
    setSelectedCells([{row, col}]);
  };

  const handleMouseOver = (row: number, col: number) => {
    if (!isSelecting || isSubmitted) return;
    const lastCell = selectedCells[selectedCells.length - 1];
    if (lastCell && (Math.abs(row - lastCell.row) <= 1 && Math.abs(col - lastCell.col) <= 1)) {
      setSelectedCells([...selectedCells, {row, col}]);
    }
  };

  const handleMouseUp = () => {
    if (!isSelecting || isSubmitted) return;
    setIsSelecting(false);
    const word = getSelectedWord();
    if (word && (words.includes(word) || words.includes(word.split('').reverse().join(''))) && !foundWords.has(word)) {
      setFoundWords(new Set([...foundWords, word]));
      // Add cells to found cells for highlighting
      const cellKeys = selectedCells.map(cell => `${cell.row},${cell.col}`);
      setFoundCells(new Set([...foundCells, ...cellKeys]));
    }
    setSelectedCells([]);
  };

  const getSelectedWord = (): string | null => {
    if (selectedCells.length < 2) return null;
    // Check if in straight line
    const sorted = [...selectedCells].sort((a, b) => a.row - b.row || a.col - b.col);
    let dr = sorted[1].row - sorted[0].row;
    let dc = sorted[1].col - sorted[0].col;
    if (dr !== 0) dr = dr > 0 ? 1 : -1;
    if (dc !== 0) dc = dc > 0 ? 1 : -1;
    for (let i = 2; i < sorted.length; i++) {
      if (sorted[i].row - sorted[i-1].row !== dr || sorted[i].col - sorted[i-1].col !== dc) return null;
    }
    return sorted.map(cell => grid[cell.row][cell.col]).join('');
  };

  // Initialize word search
  useEffect(() => {
    if (exercise.tipo === 'sopa_de_letras') {
      const data = JSON.parse(exercise.pregunta);
      const wordList = data.words || [];
      const size = data.gridSize || 10;
      setWords(wordList);
      setGridSize(size);
      setGrid(generateGrid(wordList, size));
    }
  }, [exercise]);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        if (window.edunow?.db) {
          const studentData = await window.edunow.db.getStudent(studentId);
          setStudent(studentData);
        }
      } catch (error) {
        console.error('Error fetching student:', error);
      }
    };
    fetchStudent();
  }, [studentId]);

  let content;

  if (exercise.tipo === 'empareja') {
    content = (
      <div className="ejercicio-container">
        <h2>Ejercicio de Emparejamiento</h2>
        <p>Empareja los términos con sus definiciones haciendo clic en un término y luego en su definición correspondiente.</p>

        <div className="matching-container" ref={containerRef}>
          <div className="terms-column">
            <h3>Términos</h3>
            {terms.map((term: string) => (
              <div
                key={term}
                className={`term-item ${selectedTerm === term ? 'selected' : ''} ${isSubmitted && matches[term] ? (correctMatches[term] === matches[term] ? 'correct' : 'incorrect') : ''}`}
                onClick={() => handleTermClick(term)}
                data-term={term}
              >
                {term}
              </div>
            ))}
          </div>

          <div className="definitions-column">
            <h3>Definiciones</h3>
            {definitions.map((def: string) => (
              <div
                key={def}
                className={`def-item ${selectedDef === def ? 'selected' : ''} ${Object.values(matches).includes(def) ? getMatchClass(Object.keys(matches).find(key => matches[key] === def)!, def) : ''}`}
                onClick={() => handleDefClick(def)}
                data-def={def}
              >
                {def}
              </div>
            ))}
          </div>
          <svg className="lines-svg">
            {lines.map((line, index) => (
              <line key={index} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke={line.correct ? 'green' : 'red'} strokeWidth="2" />
            ))}
          </svg>
        </div>

        {!isSubmitted && (
          <Button
            variant="primary"
            size="medium"
            className="submit-btn"
            onClick={handleSubmit}
            disabled={Object.keys(matches).length !== terms.length}
          >
            Enviar Respuestas
          </Button>
        )}

        {isSubmitted && (
          <div className="result">
            <p>Puntuación: {score.toFixed(0)} / {exercise.puntos}</p>
            <p>Emparejamientos correctos: {Object.keys(correctMatches).filter(term => matches[term] === correctMatches[term]).length} / {terms.length}</p>
            <h4>Tus emparejamientos:</h4>
            <ul>
              {Object.entries(matches).map(([term, def]) => (
                <li key={term} className={def === correctMatches[term] ? 'correct-match' : 'incorrect-match'}>
                  <strong>{term}</strong> → {def as string} {def === correctMatches[term] ? '✓' : '✗'}
                </li>
              ))}
            </ul>
            <h4>Respuestas correctas:</h4>
            <ul>
              {Object.entries(correctMatches).map(([term, def]) => (
                <li key={term}><strong>{term}</strong> → {def as string}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  } else if (exercise.tipo === 'sopa_de_letras') {
    content = (
      <div className="ejercicio-container">
        <h2>Sopa de Letras</h2>
        <p>Encuentra las palabras ocultas en la cuadrícula seleccionándolas con el mouse.</p>

        <div className="word-search-container">
          <div className="grid-container">
            <table className="word-grid">
              <tbody>
                {grid.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td
                        key={c}
                        className={`grid-cell ${selectedCells.some(sc => sc.row === r && sc.col === c) ? 'selected' : ''} ${foundCells.has(`${r},${c}`) ? 'found' : ''}`}
                        onMouseDown={() => handleMouseDown(r, c)}
                        onMouseOver={() => handleMouseOver(r, c)}
                        onMouseUp={handleMouseUp}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="words-list">
            <h3>Palabras a encontrar:</h3>
            <ul>
              {words.map(word => (
                <li key={word} className={foundWords.has(word) ? 'found' : ''}>
                  {word} {foundWords.has(word) ? '✓' : ''}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {!isSubmitted && (
          <Button
            variant="primary"
            size="medium"
            className="submit-btn"
            onClick={handleSubmitWordSearch}
          >
            Enviar Respuestas
          </Button>
        )}

        {isSubmitted && (
          <div className="result">
            <p>Puntuación: {score.toFixed(0)} / {exercise.puntos}</p>
            <p>Palabras encontradas: {foundWords.size} / {words.length}</p>
            <h4>Palabras encontradas:</h4>
            <ul>
              {Array.from(foundWords).map(word => (
                <li key={word}>{word}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  } else if (exercise.tipo === 'orden correcto') {
    // Circuit Diagram Completion Exercise with Drag & Drop
    const circuitData = JSON.parse(exercise.pregunta);
    const correctAnswers = JSON.parse(exercise.respuesta_correcta);
    const [draggedComponents, setDraggedComponents] = useState<{[key: string]: string}>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const handleDragStart = (e: React.DragEvent, component: string) => {
      e.dataTransfer.setData('text/plain', component);
      e.dataTransfer.setData('text/source', 'palette');
    };

    const handleDrop = (e: React.DragEvent, placeholderIndex: number) => {
      e.preventDefault();
      const component = e.dataTransfer.getData('text/plain');
      const source = e.dataTransfer.getData('text/source');

      // Only allow drops from palette
      if (source === 'palette' && !isSubmitted) {
        setDraggedComponents(prev => ({
          ...prev,
          [placeholderIndex]: component
        }));
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
    };

    const handleRemoveComponent = (placeholderIndex: number) => {
      if (!isSubmitted) {
        setDraggedComponents(prev => {
          const newDragged = {...prev};
          delete newDragged[placeholderIndex];
          return newDragged;
        });
      }
    };

    const handleSubmitCircuit = async () => {
      let correctCount = 0;
      correctAnswers.forEach((answer: string, index: number) => {
        if (draggedComponents[index]?.toLowerCase() === answer.toLowerCase()) {
          correctCount++;
        }
      });

      const calculatedScore = Math.round((correctCount / correctAnswers.length) * exercise.puntos);
      setScore(calculatedScore);
      setIsSubmitted(true);

      // Play success or error sound based on performance
      const isPerfectCircuit = correctCount === correctAnswers.length;
      const isGoodCircuit = correctCount >= correctAnswers.length * 0.7; // 70% correct
      if (isPerfectCircuit) {
        playSuccess();
      } else if (isGoodCircuit) {
        // Could add a different sound for partial success
      } else {
        playError();
      }

      // Play success or error sound based on performance
      const isPerfectMC = correctCount === correctAnswers.length;
      const isGoodMC = correctCount >= correctAnswers.length * 0.7; // 70% correct
      if (isPerfectMC) {
        playSuccess();
      } else if (isGoodMC) {
        // Could add a different sound for partial success
      } else {
        playError();
      }

      try {
        await (window as any).edunow.db.updateProgress({
          id_estudiante: studentId,
          id_ejercicio: exercise.id_ejercicio,
          estado: 'completado',
          intentos: 1,
          fecha_completado: new Date().toISOString(),
          puntaje_obtenido: calculatedScore
        });
        // Notify to refresh student data
        window.dispatchEvent(new CustomEvent('studentDataUpdated'));
      } catch (error) {
        console.error('Error saving progress:', error);
        alert(error instanceof Error ? error.message : 'Error saving progress'); // Show block message
        setIsSubmitted(false); // Allow retry or something
        return;
      }

      onComplete(calculatedScore);
    };

    content = (
      <div className="ejercicio-container">
        <h2>Completar Diagrama de Circuito</h2>
        <p>Arrastra los componentes desde abajo hacia los espacios vacíos del diagrama.</p>

        <div className="circuit-diagram">
          <div className="diagram-display">
            {circuitData.diagram.map((line: string, lineIndex: number) => (
              <div key={lineIndex} className="diagram-line">
                {line.split(/(\[.*?\])/).map((part, partIndex) => {
                  if (part.startsWith('[') && part.endsWith(']')) {
                    const placeholderIndex = circuitData.placeholders.indexOf(part);
                    if (placeholderIndex !== -1) {
                      const isCorrect = isSubmitted && draggedComponents[placeholderIndex]?.toLowerCase() === correctAnswers[placeholderIndex]?.toLowerCase();
                      const isIncorrect = isSubmitted && draggedComponents[placeholderIndex] && !isCorrect;

                      return (
                        <div
                          key={partIndex}
                          className={`component-drop-zone ${isCorrect ? 'correct' : ''} ${isIncorrect ? 'incorrect' : ''}`}
                          onDrop={(e) => handleDrop(e, placeholderIndex)}
                          onDragOver={handleDragOver}
                          onClick={() => handleRemoveComponent(placeholderIndex)}
                        >
                          {draggedComponents[placeholderIndex] || 'Soltar aquí'}
                        </div>
                      );
                    }
                  }
                  return <span key={partIndex}>{part}</span>;
                })}
              </div>
            ))}
          </div>

          {!isSubmitted && (
            <div className="component-palette">
              <h3>Componentes disponibles (arrastra hacia el diagrama):</h3>
              <div className="draggable-components">
                {correctAnswers.map((component: string, index: number) => (
                  <div
                    key={index}
                    className="draggable-component"
                    draggable
                    onDragStart={(e) => handleDragStart(e, component)}
                  >
                    {component}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSubmitted && (
            <div className="component-hints">
              <h3>Resultados:</h3>
              <ul>
                {correctAnswers.map((answer: string, index: number) => (
                  <li key={index} className={draggedComponents[index]?.toLowerCase() === answer.toLowerCase() ? 'correct-placement' : 'incorrect-placement'}>
                    <strong>{circuitData.placeholders[index]}:</strong> {answer}
                    {draggedComponents[index]?.toLowerCase() === answer.toLowerCase() ? ' ✓' : ` ✗ (Colocaste: ${draggedComponents[index] || 'nada'})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {!isSubmitted && (
          <Button
            variant="primary"
            size="medium"
            className="submit-btn"
            onClick={handleSubmitCircuit}
          >
            Enviar Respuestas
          </Button>
        )}

        {isSubmitted && (
          <div className="result">
            <p>Puntuación: {score} / {exercise.puntos}</p>
            <p>Componentes colocados correctamente: {Object.values(draggedComponents).filter((component, index) => component?.toLowerCase() === correctAnswers[index]?.toLowerCase()).length} / {correctAnswers.length}</p>
          </div>
        )}
      </div>
    );
  } else if (exercise.tipo === 'opcion_multiple') {
    const questions = JSON.parse(exercise.pregunta);
    const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: string}>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const handleAnswerSelect = (questionIndex: number, answer: string) => {
      setSelectedAnswers({...selectedAnswers, [questionIndex]: answer});
    };

    const handleSubmitMultipleChoice = async () => {
      const correctAnswers = JSON.parse(exercise.respuesta_correcta);
      let correctCount = 0;

      correctAnswers.forEach((correct: string, index: number) => {
        if (selectedAnswers[index] === correct) correctCount++;
      });

      const calculatedScore = Math.round((correctCount / correctAnswers.length) * exercise.puntos);
      setScore(calculatedScore);
      setIsSubmitted(true);

      try {
        await (window as any).edunow.db.updateProgress({
          id_estudiante: studentId,
          id_ejercicio: exercise.id_ejercicio,
          estado: 'completado',
          intentos: 1,
          fecha_completado: new Date().toISOString(),
          puntaje_obtenido: calculatedScore
        });
        // Notify to refresh student data
        window.dispatchEvent(new CustomEvent('studentDataUpdated'));
      } catch (error) {
        console.error('Error saving progress:', error);
        alert(error instanceof Error ? error.message : 'Error saving progress'); // Show block message
        setIsSubmitted(false); // Allow retry or something
        return;
      }

      onComplete(calculatedScore);
    };

    content = (
      <div className="ejercicio-container">
        <h2>Opción Múltiple "Electrón no perdona errores"</h2>
        <p>Elige la respuesta correcta. No hay pistas suaves, va directo.</p>

        <div className="multiple-choice-container">
          {questions.map((q: any, index: number) => (
            <div key={index} className="question">
              <h4>{q.question}</h4>
              {q.options.map((option: string) => (
                <label key={option} className="option">
                  <input
                    type="radio"
                    name={`question-${index}`}
                    value={option[0]}
                    onChange={() => handleAnswerSelect(index, option[0])}
                    disabled={isSubmitted}
                  />
                  {option}
                </label>
              ))}
            </div>
          ))}
        </div>

        {!isSubmitted && (
          <Button
            variant="primary"
            size="medium"
            className="submit-btn"
            onClick={handleSubmitMultipleChoice}
          >
            Enviar Respuestas
          </Button>
        )}

        {isSubmitted && (
          <div className="result">
            <p>Puntuación: {score} / {exercise.puntos}</p>
            <p>Respuestas correctas: {Object.values(selectedAnswers).filter((answer, index) => answer === JSON.parse(exercise.respuesta_correcta)[index]).length} / {questions.length}</p>
            <h4>Explicaciones:</h4>
            <ul>
              {questions.map((q: any, index: number) => (
                <li key={index}>
                  <strong>{q.question}</strong><br/>
                  {q.explanation}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  } else {
    content = <div>Tipo de ejercicio no soportado</div>;
  }

  const timeRemainingText = (() => {
    if (!student) return '';
    if (student.vidas !== 0) return '';
    const blockTime = student.fecha_bloqueo_vidas ? new Date(student.fecha_bloqueo_vidas!).getTime() : Date.now();
    const now = Date.now();
    const timePassed = now - blockTime;
    const oneHour = 60 * 60 * 1000;
    const timeRemaining = Math.max(0, oneHour - timePassed);
    const minutes = Math.floor(timeRemaining / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  })();

  return (
    <>
      {content}
      {isSubmitted && student && student.vidas === 0 && (
        <div className="lives-reloading-overlay">
          <div className="overlay-background"></div>
          <div className="loading-content">
            <div className="spinner"></div>
            <h2>Tus vidas se están recargando</h2>
            <p>Espera un momento mientras recuperas tus vidas...</p>
            <p>Próxima vida en: {timeRemainingText}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default Ejercicio;

