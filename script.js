const countries = [
  { name: 'Poland', lat: 51.9194, lon: 19.1451 },
  { name: 'Germany', lat: 51.1657, lon: 10.4515 },
  { name: 'France', lat: 46.2276, lon: 2.2137 },
  { name: 'Italy', lat: 41.8719, lon: 12.5674 },
  { name: 'Spain', lat: 40.4637, lon: -3.7492 },
  { name: 'United Kingdom', lat: 55.3781, lon: -3.436 },
  { name: 'Portugal', lat: 39.3999, lon: -8.2245 },
  { name: 'Netherlands', lat: 52.1326, lon: 5.2913 },
  { name: 'Sweden', lat: 60.1282, lon: 18.6435 },
  { name: 'Norway', lat: 60.472, lon: 8.4689 },
  { name: 'Finland', lat: 61.9241, lon: 25.7482 },
  { name: 'Greece', lat: 39.0742, lon: 21.8243 },
  { name: 'Turkey', lat: 38.9637, lon: 35.2433 },
  { name: 'Egypt', lat: 26.8206, lon: 30.8025 },
  { name: 'Morocco', lat: 31.7917, lon: -7.0926 },
  { name: 'Algeria', lat: 28.0339, lon: 1.6596 },
  { name: 'Canada', lat: 56.1304, lon: -106.3468 },
  { name: 'United States', lat: 37.0902, lon: -95.7129 },
  { name: 'Mexico', lat: 23.6345, lon: -102.5528 },
  { name: 'Brazil', lat: -14.235, lon: -51.9253 },
  { name: 'Argentina', lat: -38.4161, lon: -63.6167 },
  { name: 'Japan', lat: 36.2048, lon: 138.2529 },
  { name: 'Australia', lat: -25.2744, lon: 133.7751 },
  { name: 'India', lat: 20.5937, lon: 78.9629 },
  { name: 'China', lat: 35.8617, lon: 104.1954 },
  { name: 'South Korea', lat: 35.9078, lon: 127.7669 },
  { name: 'Thailand', lat: 15.87, lon: 100.9925 },
  { name: 'South Africa', lat: -30.5595, lon: 22.9375 }
];

const MAX_ATTEMPTS = 6;
const guessForm = document.getElementById('guess-form');
const countryInput = document.getElementById('country-input');
const historyEl = document.getElementById('history');
const messageEl = document.getElementById('message');
const attemptsLeftEl = document.getElementById('attempts-left');
const targetNameEl = document.getElementById('target-name');
const newGameButton = document.getElementById('new-game');
const countryOptions = document.getElementById('country-options');

let targetCountry = null;
let attempts = [];
let gameOver = false;

function initDatalist() {
  countryOptions.innerHTML = countries
    .map((country) => `<option value="${country.name}"></option>`)
    .join('');
}

function randomCountry() {
  return countries[Math.floor(Math.random() * countries.length)];
}

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function getDirection(lat1, lon1, lat2, lon2) {
  const x = Math.sin(toRadians(lon2 - lon1)) * Math.cos(toRadians(lat2));
  const y =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(toRadians(lon2 - lon1));

  const bearing = (Math.atan2(x, y) * 180) / Math.PI;
  const normalized = (bearing + 360) % 360;

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(normalized / 45) % 8;

  return directions[index];
}

function updateAttemptsLeft() {
  attemptsLeftEl.textContent = String(MAX_ATTEMPTS - attempts.length);
}

function renderHistory() {
  if (!attempts.length) {
    historyEl.innerHTML = '<p class="guess-metric">Brak prób. Zaczynaj od pierwszego zgadnięcia.</p>';
    return;
  }

  historyEl.innerHTML = attempts
    .map((attempt) => {
      const tone = attempt.isCorrect
        ? 'good'
        : attempt.distance < 1500
          ? 'good'
          : attempt.distance < 5000
            ? 'warn'
            : 'bad';

      return `
        <div class="guess-row">
          <div class="guess-country">${attempt.name}</div>
          <div class="guess-metric">${attempt.direction}</div>
          <div class="guess-value ${tone}">${attempt.distance} km</div>
        </div>
      `;
    })
    .join('');
}

function setMessage(text, type = 'info') {
  messageEl.textContent = text;
  messageEl.style.color = type === 'error' ? '#ff7a7a' : type === 'success' ? '#6ee7a8' : '#eaf2ff';
}

function endGame(won) {
  gameOver = true;

  if (won) {
    setMessage(`Gratulacje! ${targetCountry.name} to poprawna odpowiedź.`, 'success');
  } else {
    setMessage(`Koniec gry. Poprawna odpowiedź to: ${targetCountry.name}.`, 'error');
  }

  targetNameEl.textContent = targetCountry.name;
}

function handleGuess(name) {
  if (gameOver) return;

  const normalizedInput = name.trim();
  if (!normalizedInput) {
    setMessage('Wpisz nazwę kraju.', 'error');
    return;
  }

  const exactMatch = countries.find(
    (country) => country.name.toLowerCase() === normalizedInput.toLowerCase()
  );

  if (!exactMatch) {
    setMessage('Takiego kraju nie ma na liście. Spróbuj ponownie.', 'error');
    return;
  }

  if (attempts.some((attempt) => attempt.name.toLowerCase() === exactMatch.name.toLowerCase())) {
    setMessage('Ten kraj już próbowałeś. Wybierz inny.', 'error');
    return;
  }

  const distance = Math.round(
    haversineKm(
      exactMatch.lat,
      exactMatch.lon,
      targetCountry.lat,
      targetCountry.lon
    )
  );

  const direction = getDirection(
    exactMatch.lat,
    exactMatch.lon,
    targetCountry.lat,
    targetCountry.lon
  );

  const guessRecord = {
    name: exactMatch.name,
    distance,
    direction,
    isCorrect: exactMatch.name.toLowerCase() === targetCountry.name.toLowerCase()
  };

  attempts.push(guessRecord);
  renderHistory();
  updateAttemptsLeft();

  if (guessRecord.isCorrect) {
    endGame(true);
    return;
  }

  if (attempts.length >= MAX_ATTEMPTS) {
    endGame(false);
    return;
  }

  const remaining = MAX_ATTEMPTS - attempts.length;
  setMessage(`Błąd! Masz jeszcze ${remaining} prób. Kierunek: ${direction}.`, 'info');
}

function resetGame() {
  attempts = [];
  gameOver = false;
  targetCountry = randomCountry();
  targetNameEl.textContent = '?';
  countryInput.value = '';
  setMessage('Nowa gra. Wpisz nazwę kraju i zacznij zgadywać.');
  updateAttemptsLeft();
  renderHistory();
}

guessForm.addEventListener('submit', (event) => {
  event.preventDefault();
  handleGuess(countryInput.value);
  countryInput.value = '';
});

newGameButton.addEventListener('click', resetGame);

initDatalist();
resetGame();
