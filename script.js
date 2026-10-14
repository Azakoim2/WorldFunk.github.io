const boardEl = document.getElementById('board');
const totalCells = 36;

for (let i = 0; i < totalCells; i += 1) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  boardEl.appendChild(cell);
}
