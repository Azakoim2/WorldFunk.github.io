const MAX_ROWS = 6;
const MAX_COLS = 6;

const THEMES = [
  { name: 'Ziemia', items: ['PLANET','DESERT','FOREST','STREAM','TUNDRA','ISLAND','CANYON','MOUNTA','VALLEY','GLACER'] },
  { name: 'Handel', items: ['EXPORT','IMPORT','MARKET','CREDIT','RETAIL','BUDGET','SUPPLY','BARTER','MARGIN','TRADE'] },
  { name: 'Nauka', items: ['ATOMIC','ENERGY','MATRIX','PLANAR','VECTOR','PHOTON','ORBITA','MOLECU','LABORA','SYSTEM'] }
];

const boardEl = document.getElementById('board');
const keys = Array.from(document.querySelectorAll('.key'));
const messageEl = null; // not needed for mockup copy

let rows = [];
let currentRow = 0;
let currentCol = 0;
let currentGuess = '';
let targetWord = '';
let gameOver = false;

function randomFrom(arr){return arr[Math.floor(Math.random()*arr.length)]}

function createBoard(){
  boardEl.innerHTML = '';
  rows = [];
  for(let r=0;r<MAX_ROWS;r++){
    const row = [];
    for(let c=0;c<MAX_COLS;c++){
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.r = r; cell.dataset.c = c;
      boardEl.appendChild(cell);
      row.push(cell);
    }
    rows.push(row);
  }
}

function startNewGame(){
  const theme = randomFrom(THEMES);
  targetWord = randomFrom(theme.items).toUpperCase();
  currentRow = 0; currentCol = 0; currentGuess = ''; gameOver=false;
  rows.forEach(row=>row.forEach(cell=>{cell.textContent='';cell.classList.remove('filled','correct','present','absent')}));
}

function handleKey(k){
  if(gameOver) return;
  if(k === 'Enter'){
    if(currentCol < MAX_COLS) return; // require filled row
    // evaluate - simple letter match like Wordle
    const guess = rows[currentRow].map(c=>c.textContent).join('');
    evaluateGuess(guess);
    return;
  }
  if(k === '⌫' || k === 'Backspace'){
    if(currentCol===0) return;
    currentCol--;
    rows[currentRow][currentCol].textContent='';
    return;
  }
  if(currentCol >= MAX_COLS) return;
  // only accept single letter
  const letter = k.length===1 ? k.toUpperCase() : null;
  if(!letter) return;
  rows[currentRow][currentCol].textContent = letter;
  currentCol++;
}

function evaluateGuess(guess){
  const target = targetWord.split('');
  const guessArr = guess.split('');
  const result = Array(MAX_COLS).fill('absent');
  const used = Array(MAX_COLS).fill(false);
  // correct
  for(let i=0;i<MAX_COLS;i++){
    if(guessArr[i]===target[i]){ result[i]='correct'; used[i]=true }
  }
  // present
  for(let i=0;i<MAX_COLS;i++){
    if(result[i]==='correct') continue;
    const idx = target.findIndex((t,j)=>t===guessArr[i] && !used[j]);
    if(idx!==-1){ result[i]='present'; used[idx]=true }
  }
  // apply classes
  for(let i=0;i<MAX_COLS;i++){
    const cell = rows[currentRow][i];
    cell.classList.add(result[i]);
    cell.classList.add('filled');
  }
  if(guess===targetWord){ gameOver=true; return }
  currentRow++;
  currentCol=0;
  if(currentRow>=MAX_ROWS){ gameOver=true; return }
}

// attach keyboard
keys.forEach(k=>k.addEventListener('click',()=>{
  handleKey(k.textContent.trim());
}));

// physical keyboard
document.addEventListener('keydown',(e)=>{
  const k = e.key;
  if(k==='Enter' || k==='Backspace' || k==='Delete'){
    handleKey(k==='Backspace'?'⌫':(k==='Enter'?'Enter':k));
    e.preventDefault();
    return;
  }
  if(k.length===1){ handleKey(k); }
});

createBoard();
startNewGame();
