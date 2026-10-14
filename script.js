const boardEl = document.getElementById('board');
const keyboardEl = document.querySelector('.keyboard');
const ROWS = 6;
const COLS = 6;
const TARGET = 'POLSKA';

let currentRow = 0;
let currentCol = 0;
let isRevealing = false;

function createBoard(rows = ROWS, cols = COLS) {
  boardEl.innerHTML = '';

  for (let r = 0; r < rows; r += 1) {
    const row = document.createElement('div');
    row.className = 'board-row';
    row.dataset.row = String(r);
    row.setAttribute('role', 'row');

    for (let c = 0; c < cols; c += 1) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.row = String(r);
      tile.dataset.col = String(c);
      tile.setAttribute('role', 'gridcell');
      row.appendChild(tile);
    }

    boardEl.appendChild(row);
  }
}

function getTile(row, col) {
  return boardEl.querySelector(`.board-row[data-row="${row}"] .tile[data-col="${col}"]`);
}

function insertLetter(letter) {
  if (isRevealing || currentCol >= COLS) return;

  const tile = getTile(currentRow, currentCol);
  if (!tile) return;

  tile.textContent = letter.toUpperCase();
  tile.classList.add('filled');
  currentCol += 1;
}

function deleteLetter() {
  if (isRevealing) return;
  if (currentCol === 0) return;

  currentCol -= 1;
  const tile = getTile(currentRow, currentCol);
  if (!tile) return;

  tile.textContent = '';
  tile.classList.remove('filled');
}

function updateKeyboardKey(letter, status) {
  if (!letter) return;

  const keyEls = Array.from(document.querySelectorAll('.key'));
  const key = keyEls.find((el) => el.textContent.trim().toUpperCase() === letter.toUpperCase());
  if (!key) return;

  if (key.classList.contains('correct')) return;

  if (status === 'correct') {
    key.classList.remove('present', 'absent');
    key.classList.add('correct');
  } else if (status === 'present') {
    if (!key.classList.contains('correct')) {
      key.classList.remove('absent');
      key.classList.add('present');
    }
  } else if (status === 'absent') {
    if (!key.classList.contains('correct') && !key.classList.contains('present')) {
      key.classList.add('absent');
    }
  }
}

function submitRow() {
  if (isRevealing || currentCol !== COLS) return;

  const row = boardEl.querySelector(`.board-row[data-row="${currentRow}"]`);
  const tiles = Array.from(row.querySelectorAll('.tile'));
  const guess = tiles.map((tile) => tile.textContent || '').join('').toUpperCase();
  if (guess.length !== COLS) return;

  isRevealing = true;

  const targetChars = TARGET.split('');
  const guessChars = guess.split('');
  const statuses = Array(COLS).fill('absent');
  const used = Array(COLS).fill(false);

  // first pass: correct letters
  for (let i = 0; i < COLS; i += 1) {
    if (guessChars[i] === targetChars[i]) {
      statuses[i] = 'correct';
      used[i] = true;
    }
  }

  // second pass: present letters
  for (let i = 0; i < COLS; i += 1) {
    if (statuses[i] === 'correct') continue;
    const targetIndex = targetChars.findIndex((char, idx) => char === guessChars[i] && !used[idx]);
    if (targetIndex !== -1) {
      statuses[i] = 'present';
      used[targetIndex] = true;
    }
  }

  tiles.forEach((tile, index) => {
    const status = statuses[index];
    tile.classList.add('revealing');

    setTimeout(() => {
      tile.classList.remove('revealing');
      tile.classList.add(status);
      updateKeyboardKey(guessChars[index], status);
    }, index * 240);
  });

  setTimeout(() => {
    isRevealing = false;
    currentRow += 1;
    currentCol = 0;

    if (guess === TARGET) {
      setTimeout(() => {
        alert('Gratulacje! Zgadłeś(aś) słowo!');
      }, 300);
    } else if (currentRow >= ROWS) {
      setTimeout(() => {
        alert(`Koniec gry! Szukane słowo: ${TARGET}`);
      }, 300);
    }
  }, COLS * 240 + 420);
}

function onKeyboardClick(event) {
  const button = event.target.closest('button');
  if (!button) return;

  const label = button.textContent.trim();
  if (button.classList.contains('backspace')) {
    deleteLetter();
  } else if (button.classList.contains('enter')) {
    submitRow();
  } else if (label) {
    insertLetter(label);
  }
}

function onPhysicalKey(event) {
  if (isRevealing) return;
  const key = event.key;

  if (key === 'Backspace') {
    deleteLetter();
  } else if (key === 'Enter') {
    submitRow();
  } else if (/^[a-zA-ZĄĆĘŁŃÓŚŹŻąćęłńóśźż]$/.test(key)) {
    insertLetter(key);
  }
}

createBoard();
keyboardEl.addEventListener('click', onKeyboardClick);
document.addEventListener('keydown', onPhysicalKey);
