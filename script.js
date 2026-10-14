const MAX_ROWS = 6;
const MAX_COLS = 6;

const THEMES = [
  {
    name: 'Ziemia',
    items: ['PLANET', 'DESERT', 'FOREST', 'STREAM', 'TUNDRA', 'ISLAND', 'CANYON', 'MOUNTA', 'VALLEY', 'GLACER']
  },
  {
    name: 'Handel',
    items: ['EXPORT', 'IMPORT', 'MARKET', 'CREDIT', 'RETAIL', 'BUDGET', 'SUPPLY', 'BARTER', 'MARGIN', 'TRADE']
  },
  {
    name: 'Nauka',
    items: ['ATOMIC', 'ENERGY', 'MATRIX', 'PLANAR', 'VECTOR', 'PHOTON', 'ORBITA', 'MOLECU', 'LABORA', 'SYSTEM']
  }
];

const boardEl = document.getElementById('board');
const messageEl = document.getElementById('message');
const rows = [];

let currentTheme = null;
let targetWord = '';
let currentGuess = '';
let currentRow = 0;
let boardState = [];
let keyboardState = {};
let gameOver = false;

const LETTERS = ['Q','W','E','R','T','Y','U','I','O','P','A','S','D','F','G','H','J','K','L','Z','X','C','V','B','N','M','Ą','Ć','Ę','Ł','Ń','Ó','Ś','Ź','Ż'];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalizeKey(rawKey) {
  const key = String(rawKey || '').trim();

  if (!key) return null;

  const map = {
    ą: 'Ą', ć: 'Ć', ę: 'Ę', ł: 'Ł', ń: 'Ń', ó: 'Ó', ś: 'Ś', ź: 'Ź', ż: 'Ż'
  };

  if (map[key.toLowerCase()]) {
    return map[key.toLowerCase()];
  }

  if (/^[a-zA-Z]$/.test(key)) {
    return key.toUpperCase();
  }

  if (key === 'Backspace') return 'BACKSPACE';
  if (key === 'Enter') return 'ENTER';
  return null;
}

function createBoard() {
  boardEl.innerHTML = '';
  boardState = Array.from({ length: MAX_ROWS }, () => Array(MAX_COLS).fill(''));

  for (let rowIndex = 0; rowIndex < MAX_ROWS; rowIndex += 1) {
    const row = [];
    for (let colIndex = 0; colIndex < MAX_COLS; colIndex += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = String(rowIndex);
      cell.dataset.col = String(colIndex);
      boardEl.appendChild(cell);
      row.push(cell);
    }
    rows.push(row);
  }
}

function updateBoard() {
  for (let rowIndex = 0; rowIndex < MAX_ROWS; rowIndex += 1) {
    for (let colIndex = 0; colIndex < MAX_COLS; colIndex += 1) {
      const value = boardState[rowIndex][colIndex];
      const cell = rows[rowIndex][colIndex];
      cell.textContent = value || '';
      cell.classList.remove('filled', 'correct', 'present', 'absent');

      if (value) {
        cell.classList.add('filled');
      }
    }
  }
}

function applyGuessEvaluation(rowIndex, guess) {
  const result = Array(MAX_COLS).fill('absent');
  const targetLetters = targetWord.split('');
  const guessLetters = guess.split('');

  const correctPositions = new Set();

  guessLetters.forEach((letter, index) => {
    if (letter === targetLetters[index]) {
      result[index] = 'correct';
      correctPositions.add(index);
    }
  });

  guessLetters.forEach((letter, index) => {
    if (result[index] === 'correct') return;

    const targetIndex = targetLetters.findIndex((targetLetter, targetPosition) => {
      if (correctPositions.has(targetPosition)) return false;
      return targetLetter === letter;
    });

    if (targetIndex !== -1) {
      result[index] = 'present';
      correctPositions.add(targetIndex);
    }
  });

  result.forEach((state, index) => {
    const cell = rows[rowIndex][index];
    cell.classList.add(state);
    if (boardState[rowIndex][index]) {
      cell.classList.add('filled');
    }
    boardState[rowIndex][index] = guess[index];
  });

  guessLetters.forEach((letter, index) => {
    const cell = rows[rowIndex][index];
    if (cell.classList.contains('correct')) {
      keyboardState[letter] = 'correct';
    } else if (cell.classList.contains('present') && keyboardState[letter] !== 'correct') {
      keyboardState[letter] = 'present';
    } else if (keyboardState[letter] !== 'correct' && keyboardState[letter] !== 'present') {
      keyboardState[letter] = 'absent';
    }
  });

  updateKeyboard();
}

function updateKeyboard() {
  document.querySelectorAll('.key').forEach((button) => {
    const key = button.dataset.key;
    button.classList.remove('correct', 'present', 'absent');
    if (keyboardState[key]) {
      button.classList.add(keyboardState[key]);
    }
  });
}

function revealAnswer() {
  const finalText = `Odpowiedź: ${targetWord}`;
  setMessage(finalText, 'error');
}

function setMessage(text, type = 'info') {
  messageEl.textContent = text;
  messageEl.style.color = type === 'error' ? '#1a1f2a' : type === 'success' ? '#1a1f2a' : '#1a1f2a';
}

function submitGuess() {
  if (gameOver) return;

  if (currentGuess.length !== MAX_COLS) {
    setMessage('Słowo musi mieć 6 liter.');
    return;
  }

  applyGuessEvaluation(currentRow, currentGuess);

  if (currentGuess === targetWord) {
    gameOver = true;
    setMessage('Gratulacje! Trafiłeś.', 'success');
    return;
  }

  currentRow += 1;
  currentGuess = '';

  if (currentRow >= MAX_ROWS) {
    gameOver = true;
    revealAnswer();
    return;
  }

  setMessage(`Runda ${currentRow + 1}/${MAX_ROWS}.`);
  renderCurrentGuess();
}

function renderCurrentGuess() {
  const row = rows[currentRow];
  for (let i = 0; i < MAX_COLS; i += 1) {
    const cell = row[i];
    const value = i < currentGuess.length ? currentGuess[i] : '';
    cell.textContent = value;
    cell.classList.toggle('filled', Boolean(value));
    cell.classList.remove('correct', 'present', 'absent');
  }
}

function handleInput(letter) {
  if (gameOver) return;

  if (letter === 'BACKSPACE') {
    currentGuess = currentGuess.slice(0, -1);
    renderCurrentGuess();
    return;
  }

  if (letter === 'ENTER') {
    submitGuess();
    return;
  }

  if (currentGuess.length >= MAX_COLS) return;

  if (!LETTERS.includes(letter)) return;

  currentGuess += letter;
  renderCurrentGuess();
}

function startNewGame() {
  const theme = randomFrom(THEMES);
  currentTheme = theme;
  targetWord = randomFrom(theme.items).toUpperCase();
  currentGuess = '';
  currentRow = 0;
  gameOver = false;
  keyboardState = {};

  for (let rowIndex = 0; rowIndex < MAX_ROWS; rowIndex += 1) {
    for (let colIndex = 0; colIndex < MAX_COLS; colIndex += 1) {
      boardState[rowIndex][colIndex] = '';
    }
  }

  updateBoard();
  updateKeyboard();
  setMessage('Ukryty temat. Wpisz 6-literowe słowo.');
}

function attachKeyboardEvents() {
  document.addEventListener('keydown', (event) => {
    const normalized = normalizeKey(event.key);
    if (!normalized) return;

    if (normalized === 'BACKSPACE' || normalized === 'ENTER') {
      event.preventDefault();
    }

    handleInput(normalized);
  });

  document.querySelectorAll('.key').forEach((btn) => {
    btn.addEventListener('click', () => {
      handleInput(btn.dataset.key);
    });
  });
}

createBoard();
attachKeyboardEvents();
startNewGame();
