import React, { useState, useEffect, useRef } from 'react';
import './ejercicio.css';

interface Exercise {
  id_ejercicio: number;
  pregunta: string;
  tipo: string;
  respuesta_correcta: string;
  puntos: number;
}

interface EjercicioProps {
  exercise: Exercise;
  studentId: number;
  onComplete: (score: number) => void;
}

const Ejercicio: React.FC<EjercicioProps> = ({ exercise, studentId, onComplete }) => {
  const [matches, setMatches] = useState<{ [key: string]: string }>({});
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
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
    } catch (error) {
      console.error('Error saving progress:', error);
    }

    onComplete(calculatedScore);
  };

  const handleSubmitWordSearch = async () => {
    const foundCount = foundWords.size;
    const calculatedScore = Math.round((foundCount / words.length) * exercise.puntos);
    setScore(calculatedScore);
    setIsSubmitted(true);

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
    } catch (error) {
      console.error('Error saving progress:', error);
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

  if (exercise.tipo === 'empareja') {
    return (
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
          <button className="submit-btn" onClick={handleSubmit} disabled={Object.keys(matches).length !== terms.length}>
            Enviar Respuestas
          </button>
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
    return (
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
          <button className="submit-btn" onClick={handleSubmitWordSearch}>
            Enviar Respuestas
          </button>
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
  } else {
    return <div>Tipo de ejercicio no soportado</div>;
  }
};

export default Ejercicio;
