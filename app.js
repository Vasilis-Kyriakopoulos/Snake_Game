const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const statusEl = document.getElementById("status");
const overlay = document.getElementById("overlay");
const overlayKicker = document.getElementById("overlay-kicker");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const restartButton = document.getElementById("restart-button");
const pauseButton = document.getElementById("pause-button");
const newGameButton = document.getElementById("new-game-button");

const gridSize = 20;
const tileCount = canvas.width / gridSize;
const baseSpeed = 120;
const minSpeed = 62;
const bestScoreKey = "neon-snake-best-score";

let snake;
let direction;
let queuedDirection;
let food;
let score;
let bestScore = Number(localStorage.getItem(bestScoreKey) || 0);
let gameStarted;
let isPaused;
let isGameOver;
let loopId;
let currentSpeed;

bestScoreEl.textContent = String(bestScore);

function randomCell() {
  return {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount),
  };
}

function spawnFood() {
  let nextFood = randomCell();

  while (snake.some((segment) => segment.x === nextFood.x && segment.y === nextFood.y)) {
    nextFood = randomCell();
  }

  food = nextFood;
}

function updateHud() {
  scoreEl.textContent = String(score);
  bestScoreEl.textContent = String(bestScore);

  if (isGameOver) {
    statusEl.textContent = "Crashed";
    statusEl.style.color = "#ff5f7a";
    return;
  }

  if (!gameStarted) {
    statusEl.textContent = "Ready";
    statusEl.style.color = "#74f3ff";
    return;
  }

  if (isPaused) {
    statusEl.textContent = "Paused";
    statusEl.style.color = "#ffe57c";
    return;
  }

  statusEl.textContent = "Running";
  statusEl.style.color = "#7cff85";
}

function setOverlay(kicker, title, text, buttonLabel) {
  overlayKicker.textContent = kicker;
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  restartButton.textContent = buttonLabel;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function resetGame() {
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  queuedDirection = { x: 1, y: 0 };
  score = 0;
  gameStarted = false;
  isPaused = false;
  isGameOver = false;
  currentSpeed = baseSpeed;
  pauseButton.textContent = "Pause";
  spawnFood();
  updateHud();
  setOverlay(
    "Press any arrow key",
    "Start the Run",
    "Use the arrow keys or WASD to move. Press space to pause.",
    "Play"
  );
  draw();
  restartLoop();
}

function restartLoop() {
  clearInterval(loopId);
  loopId = setInterval(tick, currentSpeed);
}

function startGameIfNeeded() {
  if (!gameStarted && !isGameOver) {
    gameStarted = true;
    hideOverlay();
    updateHud();
  }
}

function setDirection(nextX, nextY) {
  const isOpposite = queuedDirection.x === -nextX && queuedDirection.y === -nextY;
  if (isOpposite) {
    return;
  }

  queuedDirection = { x: nextX, y: nextY };
  startGameIfNeeded();
}

function togglePause(forceResume = false) {
  if (isGameOver || !gameStarted) {
    return;
  }

  isPaused = forceResume ? false : !isPaused;

  if (isPaused) {
    setOverlay("Breather", "Paused", "Hit space or the button again when you are ready.", "Resume");
  } else {
    hideOverlay();
  }

  pauseButton.textContent = isPaused ? "Resume" : "Pause";
  updateHud();
}

function endGame() {
  isGameOver = true;
  const isNewHighScore = score > bestScore;

  if (isNewHighScore) {
    bestScore = score;
    localStorage.setItem(bestScoreKey, String(bestScore));
  }

  updateHud();
  setOverlay(
    isNewHighScore ? "New high score" : "Run complete",
    "Game Over",
    `You scored ${score}. Press Enter or the button below to jump back in.`,
    "Play Again"
  );
}

function tick() {
  if (!gameStarted || isPaused || isGameOver) {
    draw();
    return;
  }

  direction = queuedDirection;
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  const hitWall = head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount;
  const hitSelf = snake.some((segment) => segment.x === head.x && segment.y === head.y);

  if (hitWall || hitSelf) {
    endGame();
    draw();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    currentSpeed = Math.max(minSpeed, baseSpeed - Math.floor(score / 20) * 4);
    spawnFood();
    restartLoop();
  } else {
    snake.pop();
  }

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem(bestScoreKey, String(bestScore));
  }

  updateHud();
  draw();
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = "rgba(116, 243, 255, 0.08)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= tileCount; i += 1) {
    const offset = i * gridSize + 0.5;

    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, offset);
    ctx.lineTo(canvas.width, offset);
    ctx.stroke();
  }

  ctx.restore();
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawFood() {
  const foodX = food.x * gridSize;
  const foodY = food.y * gridSize;
  const centerX = foodX + gridSize / 2;
  const centerY = foodY + gridSize / 2;

  const pulse = 0.82 + Math.sin(Date.now() / 120) * 0.08;
  const radius = (gridSize / 2 - 3) * pulse;

  ctx.save();
  ctx.shadowColor = "rgba(255, 95, 122, 0.75)";
  ctx.shadowBlur = 22;
  ctx.fillStyle = "#ff5f7a";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 240, 240, 0.9)";
  ctx.beginPath();
  ctx.arc(centerX - 4, centerY - 4, radius * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const x = segment.x * gridSize + 2;
    const y = segment.y * gridSize + 2;
    const size = gridSize - 4;
    const isHead = index === 0;

    ctx.save();
    ctx.shadowColor = isHead ? "rgba(124, 255, 133, 0.75)" : "rgba(116, 243, 255, 0.42)";
    ctx.shadowBlur = isHead ? 18 : 12;
    ctx.fillStyle = isHead ? "#7cff85" : `rgba(116, 243, 255, ${1 - index * 0.045})`;
    roundRect(x, y, size, size, 6);
    ctx.fill();

    if (isHead) {
      const eyeOffsetX = direction.x === -1 ? 6 : direction.x === 1 ? size - 6 : 6;
      const eyeOffsetY = direction.y === -1 ? 6 : direction.y === 1 ? size - 6 : 6;
      const secondEyeX = direction.y !== 0 ? size - 6 : eyeOffsetX;
      const secondEyeY = direction.x !== 0 ? size - 6 : eyeOffsetY;

      ctx.fillStyle = "#04212a";
      ctx.beginPath();
      ctx.arc(x + eyeOffsetX, y + eyeOffsetY, 2.2, 0, Math.PI * 2);
      ctx.arc(x + secondEyeX, y + secondEyeY, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const boardGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  boardGradient.addColorStop(0, "rgba(7, 24, 38, 0.92)");
  boardGradient.addColorStop(1, "rgba(3, 10, 18, 0.98)");
  ctx.fillStyle = boardGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawFood();
  drawSnake();
}

function handleKeydown(event) {
  const key = event.key.toLowerCase();

  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "enter", "w", "a", "s", "d"].includes(key)) {
    event.preventDefault();
  }

  if (key === "arrowup" || key === "w") {
    setDirection(0, -1);
  } else if (key === "arrowdown" || key === "s") {
    setDirection(0, 1);
  } else if (key === "arrowleft" || key === "a") {
    setDirection(-1, 0);
  } else if (key === "arrowright" || key === "d") {
    setDirection(1, 0);
  } else if (key === " ") {
    togglePause();
  } else if (key === "enter") {
    resetGame();
  }
}

restartButton.addEventListener("click", () => {
  if (isGameOver) {
    resetGame();
    return;
  }

  if (isPaused) {
    togglePause(true);
    return;
  }

  if (!gameStarted) {
    gameStarted = true;
    hideOverlay();
    updateHud();
  }
});

pauseButton.addEventListener("click", () => togglePause());
newGameButton.addEventListener("click", resetGame);
document.addEventListener("keydown", handleKeydown);

resetGame();
