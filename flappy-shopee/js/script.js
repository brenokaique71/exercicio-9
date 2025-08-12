// Variáveis globais
let move_speed;
let gravity;

const bird = document.querySelector('.bird');
const message = document.querySelector('.message');
const score_val = document.querySelector('.score_val');
const score_title = document.querySelector('.score_title');
const background = document.querySelector('.background').getBoundingClientRect();
const difficultySelect = document.getElementById('difficulty');
const highscoreList = document.getElementById('highscoreList');

let bird_props = bird.getBoundingClientRect();

let game_state = 'Start';
let score = 0;
let bird_dy = 0;
let pipe_separation = 0;
const pipe_gap = 35; // em vh
let pipes = [];
let speedIncreaseInterval = 10; // pontos para aumentar velocidade
let speedIncreaseFactor = 0.5; // quanto aumenta a velocidade

// Definições de dificuldade
const difficulties = {
  easy: { move_speed: 2, gravity: 0.3 },
  normal: { move_speed: 3, gravity: 0.5 },
  hard: { move_speed: 4, gravity: 0.7 }
};

function initDifficulty() {
  const selected = difficultySelect.value;
  move_speed = difficulties[selected].move_speed;
  gravity = difficulties[selected].gravity;
}

// Atualiza a lista de high scores na tela
function updateHighscores() {
  let highscores = JSON.parse(localStorage.getItem('flappyHighscores')) || [];
  highscores.sort((a, b) => b - a);
  highscores = highscores.slice(0, 5);

  highscoreList.innerHTML = '';
  highscores.forEach((score, i) => {
    const li = document.createElement('li');
    li.textContent = score;
    highscoreList.appendChild(li);
  });
}

// Salva um novo highscore
function saveHighscore(newScore) {
  let highscores = JSON.parse(localStorage.getItem('flappyHighscores')) || [];
  highscores.push(newScore);
  highscores.sort((a, b) => b - a);
  highscores = highscores.slice(0, 5);
  localStorage.setItem('flappyHighscores', JSON.stringify(highscores));
  updateHighscores();
}

difficultySelect.addEventListener('change', () => {
  if (game_state === 'Start' || game_state === 'End') {
    initDifficulty();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && game_state !== 'Play') {
    resetGame();
    game_state = 'Play';
    message.textContent = '';
    score_title.textContent = 'Score : ';
    score_val.textContent = '0';
    play();
  }

  if ((e.key === 'ArrowUp' || e.key === ' ') && game_state === 'Play') {
    bird_dy = -7.6;
  }
});

function resetGame() {
  initDifficulty();
  bird.style.top = '40vh';
  score = 0;
  bird_dy = 0;
  pipe_separation = 0;
  pipes.forEach(p => p.element.remove());
  pipes = [];
}

function play() {
  function move() {
    if (game_state !== 'Play') return;

    bird_props = bird.getBoundingClientRect();

    // Move os canos e verifica colisões
    pipes.forEach((pipeObj, index) => {
      let pipe_props = pipeObj.element.getBoundingClientRect();

      if (pipe_props.right <= 0) {
        pipeObj.element.remove();
        pipes.splice(index, 1);
      } else {
        // Colisão
        if (
          bird_props.left < pipe_props.left + pipe_props.width &&
          bird_props.left + bird_props.width > pipe_props.left &&
          bird_props.top < pipe_props.top + pipe_props.height &&
          bird_props.top + bird_props.height > pipe_props.top
        ) {
          gameOver();
          return;
        }

        // Passou pelo cano, pontua
        if (
          pipe_props.right < bird_props.left &&
          pipe_props.right + move_speed >= bird_props.left &&
          pipeObj.increase_score
        ) {
          score++;
          score_val.textContent = score;
          pipeObj.increase_score = false;

          // Aumenta velocidade a cada 10 pontos
          if (score % speedIncreaseInterval === 0) {
            move_speed += speedIncreaseFactor;
          }
        }

        pipeObj.element.style.left = pipe_props.left - move_speed + 'px';
      }
    });

    requestAnimationFrame(move);
  }

  requestAnimationFrame(move);

  function applyGravity() {
    if (game_state !== 'Play') return;

    bird_dy += gravity;
    let birdTop = bird.getBoundingClientRect().top;

    if (birdTop <= 0 || birdTop + bird_props.height >= background.bottom) {
      gameOver();
      return;
    }

    bird.style.top = birdTop + bird_dy + 'px';
    bird_props = bird.getBoundingClientRect();

    requestAnimationFrame(applyGravity);
  }

  requestAnimationFrame(applyGravity);

  function createPipe() {
    if (game_state !== 'Play') return;

    pipe_separation++;

    if (pipe_separation > 115) {
      pipe_separation = 0;

      let pipe_pos = Math.floor(Math.random() * 43) + 8;

      // Cano de cima (invertido)
      let pipe_top = document.createElement('div');
      pipe_top.classList.add('pipe_sprite', 'pipe_top');
      pipe_top.style.top = pipe_pos - 70 + 'vh';
      pipe_top.style.left = '100vw';
      document.body.appendChild(pipe_top);

      // Cano de baixo
      let pipe_bottom = document.createElement('div');
      pipe_bottom.classList.add('pipe_sprite', 'pipe_bottom');
      pipe_bottom.style.top = pipe_pos + pipe_gap + 'vh';
      pipe_bottom.style.left = '100vw';
      pipe_bottom.increase_score = true;
      document.body.appendChild(pipe_bottom);

      pipes.push({ element: pipe_top, increase_score: false });
      pipes.push({ element: pipe_bottom, increase_score: true });
    }

    requestAnimationFrame(createPipe);
  }

  requestAnimationFrame(createPipe);
}

function gameOver() {
  game_state = 'End';
  message.textContent = 'Pressione Enter para reiniciar';
  message.style.left = '28vw';

  saveHighscore(score);
  updateHighscores();
}

// Inicialização
updateHighscores();
initDifficulty();
