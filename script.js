// Themes: each theme has a name, type ('geo' or 'word') and items
const THEMES = [
  {
    name: 'Kraje',
    type: 'geo',
    items: [
      { name: 'Polska', lat: 51.9194, lon: 19.1451 },
      { name: 'Niemcy', lat: 51.1657, lon: 10.4515 },
      { name: 'Francja', lat: 46.2276, lon: 2.2137 },
      { name: 'Włochy', lat: 41.8719, lon: 12.5674 },
      { name: 'Hiszpania', lat: 40.4637, lon: -3.7492 },
      { name: 'Wielka Brytania', lat: 55.3781, lon: -3.436 },
      { name: 'Portugalia', lat: 39.3999, lon: -8.2245 },
      { name: 'Holandia', lat: 52.1326, lon: 5.2913 },
      { name: 'Szwecja', lat: 60.1282, lon: 18.6435 },
      { name: 'Norwegia', lat: 60.472, lon: 8.4689 }
    ]
  },
  {
    name: 'Ziemia',
    type: 'word',
    items: [
      'Ocean',
      'Góra',
      'Rzeka',
      'Pustynia',
      'Wyspa',
      'Lodowiec',
      'Dolina',
      'Jezioro',
      'Wulkan',
      'Równina'
    ]
  },
  {
    name: 'Handel',
    type: 'word',
    items: [
      'Złoto',
      'Sól',
      'Futro',
      'Ropa',
      'Herbata',
      'Bawełna',
      'Przyprawy',
      'Jedwab',
      'Orzechy',
      'Kawa'
    ]
  }
];

const MAX_ATTEMPTS = 6;
const guessForm = document.getElementById('guess-form');
const countryInput = document.getElementById('country-input');
const historyEl = document.getElementById('history');
const messageEl = document.getElementById('message');
const attemptsLeftEl = document.getElementById('attempts-left');
// theme name intentionally not shown to the player to create the guessing effect
const themeNameEl = document.getElementById('theme-name');
const newGameButton = document.getElementById('new-game');

let currentTheme = null;
let target = null;
let attempts = [];
let gameOver = false;

function initDatalist(items) {
  // intentionally empty: do NOT populate a visible list of possible answers
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomTheme() {
  return randomFrom(THEMES);
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
      if (currentTheme.type === 'geo') {
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
      } else {
        // word theme: show basic hint (length and first letter)
        const tone = attempt.isCorrect ? 'good' : 'bad';
        return `
          <div class="guess-row">
            <div class="guess-country">${attempt.name}</div>
            <div class="guess-metric">Długość: ${attempt.length}</div>
            <div class="guess-value ${tone}">Pierwsza litera: ${attempt.first}</div>
          </div>
        `;
      }
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
    setMessage(`Gratulacje! ${typeof target === 'string' ? target : target.name} to poprawna odpowiedź.`, 'success');
  } else {
    setMessage(`Koniec gry. Poprawna odpowiedź to: ${typeof target === 'string' ? target : target.name}.`, 'error');
  }
}

function handleGuess(input) {
  if (gameOver) return;

  const normalizedInput = input.trim();
  if (!normalizedInput) {
    setMessage('Wpisz odpowiedź.', 'error');
    return;
  }

  // find match in current theme (but the theme is hidden from the player)
  let match = null;
  if (currentTheme.type === 'geo') {
    match = currentTheme.items.find(
      (c) => c.name.toLowerCase() === normalizedInput.toLowerCase()
    );
    if (!match) {
      setMessage('Takiego kraju nie ma w tajnym temacie. Spróbuj innej nazwy.', 'error');
      return;
    }

    if (attempts.some((a) => a.name.toLowerCase() === match.name.toLowerCase())) {
      setMessage('Ten kraj już próbowałeś. Wybierz inny.', 'error');
      return;
    }

    const distance = Math.round(
      haversineKm(match.lat, match.lon, target.lat, target.lon)
    );

    const direction = getDirection(match.lat, match.lon, target.lat, target.lon);

    const guessRecord = {
      name: match.name,
      distance,
      direction,
      isCorrect: match.name.toLowerCase() === target.name.toLowerCase()
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
  } else {
    // word theme
    match = currentTheme.items.find(
      (it) => it.toLowerCase() === normalizedInput.toLowerCase()
    );

    if (!match) {
      setMessage('Nie ma takiego słowa w tajnym temacie. Spróbuj ponownie.', 'error');
      return;
    }

    if (attempts.some((a) => a.name.toLowerCase() === match.toLowerCase())) {
      setMessage('Już próbowałeś tego słowa.', 'error');
      return;
    }

    const guessRecord = {
      name: match,
      length: match.length,
      first: match[0].toUpperCase(),
      isCorrect: match.toLowerCase() === target.toLowerCase()
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
    setMessage(`Niepoprawne. Masz jeszcze ${remaining} prób. Podpowiedź: słowo ma ${guessRecord.length} liter.`, 'info');
  }
}

function resetGame() {
  attempts = [];
  gameOver = false;
  currentTheme = randomTheme();

  // pick target depending on type
  if (currentTheme.type === 'geo') {
    target = randomFrom(currentTheme.items);
  } else {
    target = randomFrom(currentTheme.items);
  }

  // intentionally do NOT show currentTheme.name to the player
  if (themeNameEl) themeNameEl.textContent = 'tajne';

  initDatalist(currentTheme.items); // no-op: we don't reveal choices
  countryInput.value = '';
  setMessage('Nowa gra. Zacznij zgadywać — temat jest ukryty.');
  updateAttemptsLeft();
  renderHistory();
}

guessForm.addEventListener('submit', (event) => {
  event.preventDefault();
  handleGuess(countryInput.value);
  countryInput.value = '';
});

newGameButton.addEventListener('click', resetGame);

// initialize
resetGame();
