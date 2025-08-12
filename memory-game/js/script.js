document.addEventListener('DOMContentLoaded', () => {
  // Elementos DOM
  const startScreen = document.getElementById('startScreen');
  const playerNameInput = document.getElementById('playerName');
  const difficultySelect = document.getElementById('difficultySelect');
  const startBtn = document.getElementById('startBtn');
  const message = document.getElementById('message');
  const gameBoard = document.getElementById('gameBoard');
  const winScreen = document.getElementById('winScreen');
  const winnerNameSpan = document.getElementById('winnerName');
  const finalScoreSpan = document.getElementById('finalScore');
  const restartBtn = document.getElementById('restartBtn');
  const highscoreList = document.getElementById('highscoreList');

  // Variáveis do jogo
  let playerName = '';
  let gridSize;  // total cartas: gridSize x gridSize
  let cardsArray = [];
  let flippedCards = [];
  let matchedCardsCount = 0;
  let score = 0;
  let canClick = true;

  // API para imagens (usar Unsplash via URL direta)
  // Usaremos imagens aleatórias via https://source.unsplash.com/
  // Para garantir pares, geraremos N imagens distintas, e duplicaremos

  // Configura os tamanhos da grade por dificuldade
  const difficulties = {
    easy: 4,    // 4x4 = 16 cartas (8 pares)
    medium: 6,  // 6x6 = 36 cartas (18 pares)
    hard: 8     // 8x8 = 64 cartas (32 pares)
  };

  // Função para embaralhar (Fisher-Yates)
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Cria cartas no DOM
  function createCard(id, imgUrl) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.id = id;

    const img = document.createElement('img');
    img.src = imgUrl;
    img.alt = 'Imagem do par';

    card.appendChild(img);

    // Evento clique
    card.addEventListener('click', () => {
      if (!canClick) return;
      if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

      flipCard(card);
    });

    return card;
  }

  // Função que exibe a carta
  function flipCard(card) {
    if (flippedCards.length === 2) return; // só duas cartas viradas

    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
      checkMatch();
    }
  }

  // Verifica se as cartas formam um par
  function checkMatch() {
    canClick = false;

    const [card1, card2] = flippedCards;
    if (card1.dataset.id === card2.dataset.id) {
      // Par encontrado
      card1.classList.add('matched');
      card2.classList.add('matched');
      matchedCardsCount += 2;
      score += 5;
      message.textContent = `Acertou! Pontos: ${score}`;

      flippedCards = [];
      canClick = true;

      if (matchedCardsCount === cardsArray.length) {
        // Venceu o jogo
        setTimeout(() => {
          gameWin();
        }, 700);
      }
    } else {
      // Erro
      score = Math.max(0, score - 3);
      message.textContent = `Errou! Pontos: ${score}`;

      setTimeout(() => {
        flippedCards.forEach(card => card.classList.remove('flipped'));
        flippedCards = [];
        canClick = true;
      }, 1000);
    }
  }

  // Inicializa o jogo
  async function initGame() {
    // Reset
    gameBoard.innerHTML = '';
    message.textContent = '';
    flippedCards = [];
    matchedCardsCount = 0;
    score = 0;
    canClick = true;

    const difficulty = difficultySelect.value;
    gridSize = difficulties[difficulty];

    // Configura grid CSS dinamicamente
    gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    // Calcula quantos pares precisamos
    const totalPairs = (gridSize * gridSize) / 2;

    // Busca imagens da API
    const images = await fetchImages(totalPairs);

    // Duplica as imagens (pares) e embaralha
    cardsArray = [...images, ...images];
    shuffle(cardsArray);

    // Cria cartas no DOM
    cardsArray.forEach((imgUrl, idx) => {
      const card = createCard(imgUrl, imgUrl);
      gameBoard.appendChild(card);
    });
  }

  // Busca N imagens únicas da API Unsplash (random)
  async function fetchImages(n) {
    const uniqueImages = new Set();
    const urls = [];

    while (uniqueImages.size < n) {
      // Usando source.unsplash.com/random/100x100?sig=<num> para garantir URLs diferentes
      const url = `https://source.unsplash.com/100x100/?nature,animal&sig=${Math.floor(Math.random() * 10000)}`;
      if (!uniqueImages.has(url)) {
        uniqueImages.add(url);
        urls.push(url);
      }
    }

    return urls;
  }

  // Função quando o jogador vence
  function gameWin() {
    playerName = playerNameInput.value.trim() || 'Jogador';

    // Salva pontuação
    saveScore(playerName, score);

    // Mostra tela vitória
    winnerNameSpan.textContent = playerName;
    finalScoreSpan.textContent = score;

    winScreen.classList.remove('hidden');
    startScreen.style.display = 'none';
    gameBoard.style.display = 'none';
    message.textContent = '';
  }

  // Salva as pontuações no localStorage
  function saveScore(name, points) {
    let scores = JSON.parse(localStorage.getItem('memoryHighscores')) || [];
    scores.push({ name, points });
    // Ordena decrescente
    scores.sort((a, b) => b.points - a.points);
    // Mantém só 5 top scores
    scores = scores.slice(0, 5);
    localStorage.setItem('memoryHighscores', JSON.stringify(scores));
    updateRanking();
  }

  // Atualiza o ranking na tela
  function updateRanking() {
    let scores = JSON.parse(localStorage.getItem('memoryHighscores')) || [];
    highscoreList.innerHTML = '';

    scores.forEach(({ name, points }) => {
      const li = document.createElement('li');
      li.textContent = `${name}: ${points} pts`;
      highscoreList.appendChild(li);
    });
  }

  // Reiniciar jogo
  restartBtn.addEventListener('click', () => {
    winScreen.classList.add('hidden');
    startScreen.style.display = 'flex';
    gameBoard.style.display = 'grid';
  });

  // Começar jogo (botão)
  startBtn.addEventListener('click', () => {
    if (playerNameInput.value.trim() === '') {
      alert('Por favor, digite seu nome.');
      return;
    }

    playerName = playerNameInput.value.trim();
    startScreen.style.display = 'none';
    gameBoard.style.display = 'grid';

    initGame();
  });

  // Atualiza ranking inicial
  updateRanking();
});
