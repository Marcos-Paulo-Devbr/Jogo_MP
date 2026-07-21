// ==================== CONFIGURAÇÕES ====================
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const SPEED = 4;
const TILE = 40; 


// ==================== CANVAS ====================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

// ==================== NÍVEL ====================
// 0 = vazio | 1 = chão | 2 = plataforma | 3 = moeda | 4 = espinho | 5 = fim
const MAP = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 5],
  [0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 2, 2, 2, 2, 2, 2],
  [0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 4, 0, 4, 0, 4, 0, 0, 0, 0, 4, 0, 4, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];
const ROWS = MAP.length;
const COLS = MAP[0].length;
const originalMap = MAP.map((row) => [...row]);

// ==================== ESTADO DO JOGO ====================
let player;
let coinsCollected;
let score;
let lives;
let gameOver;
let won;
let keys;
let camX = 0;

function init() {
  player = { x: 60, y: 280, w: 28, h: 36, vx: 0, vy: 0, onGround: false, facing: 1 };
  coinsCollected = 0;
  score = 0;
  lives = 3;
  gameOver = false;
  won = false;
  keys = {};

  // Restaura as moedas coletadas antes de reiniciar.
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (originalMap[row][col] === 3) MAP[row][col] = 3;
    }
  }

  updateHUD();
  hideMsg();
}

// ==================== HUD ====================
function updateHUD() {
  document.getElementById("score").textContent = score;
  document.getElementById("coins").textContent = coinsCollected;
  document.getElementById("lives").textContent = lives;
}

function showMsg(text) {
  const message = document.getElementById("msg");
  message.innerHTML = text;
  message.style.display = "block";
}

function hideMsg() {
  document.getElementById("msg").style.display = "none";
}

// ==================== MAPA E COLISÃO ====================
function isSolid(tile) {
  return tile === 1 || tile === 2;
}

function getTile(px, py) {
  const col = Math.floor(px / TILE);
  const row = Math.floor(py / TILE);

  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return 0;
  return MAP[row][col];
}

function resolveCollisions(p) {
  // Movimento horizontal.
  p.x += p.vx;
  const cornersX = [
    [p.x, p.y + 2], [p.x + p.w, p.y + 2],
    [p.x, p.y + p.h - 2], [p.x + p.w, p.y + p.h - 2],
  ];

  for (const [x, y] of cornersX) {
    if (!isSolid(getTile(x, y))) continue;

    if (p.vx > 0) p.x = Math.floor(x / TILE) * TILE - p.w - 0.1;
    if (p.vx < 0) p.x = Math.floor(x / TILE) * TILE + TILE + 0.1;
    p.vx = 0;
    break;
  }

  // Movimento vertical, com gravidade.
  p.vy += GRAVITY;
  p.y += p.vy;
  p.onGround = false;

  const cornersY = [
    [p.x + 2, p.y], [p.x + p.w - 2, p.y],
    [p.x + 2, p.y + p.h], [p.x + p.w - 2, p.y + p.h],
  ];

  for (const [x, y] of cornersY) {
    if (!isSolid(getTile(x, y))) continue;

    if (p.vy > 0) {
      p.y = Math.floor(y / TILE) * TILE - p.h;
      p.onGround = true;
    }
    if (p.vy < 0) p.y = Math.floor(y / TILE) * TILE + TILE;
    p.vy = 0;
    break;
  }
}

// ==================== ITENS E OBJETIVO ====================
function checkTiles(p) {
  const centerX = p.x + p.w / 2;
  const centerY = p.y + p.h / 2;
  const row = Math.floor(centerY / TILE);
  const col = Math.floor(centerX / TILE);

  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;

  const tile = MAP[row][col];
  if (tile === 3) {
    MAP[row][col] = 0;
    coinsCollected++;
    score += 100;
    updateHUD();
  }

  if (tile === 4) loseLife();

  if (tile === 5) {
    won = true;
    score += 500;
    updateHUD();
    showMsg('🏆 VOCÊ VENCEU!<br><small style="font-size:1rem">R para jogar novamente</small>');
  }
}

function loseLife() {
  lives--;
  updateHUD();

  if (lives <= 0) {
    gameOver = true;
    showMsg('💀 GAME OVER<br><small style="font-size:1rem">R para reiniciar</small>');
    return;
  }

  player.x = 60;
  player.y = 280;
  player.vx = 0;
  player.vy = 0;
}

// ==================== CÂMERA ====================
function updateCamera() {
  camX = player.x - W / 2 + player.w / 2;
  camX = Math.max(0, Math.min(camX, COLS * TILE - W));
}

// ==================== DESENHO ====================
function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, "#0a0a2e");
  gradient.addColorStop(1, "#1a1a4a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  const stars = [[50, 30], [150, 60], [250, 20], [400, 45], [550, 15], [700, 55], [760, 35], [100, 80], [320, 70], [480, 25]];
  for (const [x, y] of stars) ctx.fillRect(x, y, 2, 2);
}

function drawTiles() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const tile = MAP[row][col];
      const x = col * TILE - camX;
      const y = row * TILE;

      if (x + TILE < 0 || x > W) continue;

      if (tile === 1) drawGround(x, y);
      if (tile === 2) drawPlatform(x, y);
      if (tile === 3) drawCoin(x, y);
      if (tile === 4) drawSpike(x, y);
      if (tile === 5) drawFinish(x, y);
    }
  }
}

function drawGround(x, y) {
  ctx.fillStyle = "#4a7c59";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "#6aaf7a";
  ctx.fillRect(x, y, TILE, 8);
  ctx.strokeStyle = "#2d4f38";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x, y, TILE, TILE);
}

function drawPlatform(x, y) {
  ctx.fillStyle = "#8b5e3c";
  ctx.fillRect(x, y, TILE, TILE / 2);
  ctx.fillStyle = "#c49a6c";
  ctx.fillRect(x, y, TILE, 6);
}

function drawCoin(x, y) {
  const centerX = x + TILE / 2;
  const centerY = y + TILE / 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
  ctx.fillStyle = "#f7c948";
  ctx.fill();
  ctx.strokeStyle = "#c8960a";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#fff8dc";
  ctx.font = "bold 10px Courier New";
  ctx.textAlign = "center";
  ctx.fillText("$", centerX, centerY + 4);
}

function drawSpike(x, y) {
  ctx.fillStyle = "#cc3333";
  ctx.beginPath();
  ctx.moveTo(x + 4, y + TILE);
  ctx.lineTo(x + TILE / 2, y + 4);
  ctx.lineTo(x + TILE - 4, y + TILE);
  ctx.closePath();
  ctx.fill();
}

function drawFinish(x, y) {
  ctx.fillStyle = "#f7c948";
  ctx.fillRect(x + 18, y - 20, 4, TILE + 20);
  ctx.fillStyle = "#e74c3c";
  ctx.fillRect(x + 22, y - 20, 20, 14);
  ctx.font = "10px Courier New";
  ctx.fillStyle = "#fff";
  ctx.fillText("FIM", x + 23, y - 9);
}

function drawPlayer(p) {
  const x = p.x - camX;
  const y = p.y;

  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(x + 2, y + p.h, p.w, 4);

  ctx.fillStyle = "#e74c3c";
  ctx.fillRect(x, y + 12, p.w, p.h - 12);
  ctx.fillStyle = "#f5cba7";
  ctx.fillRect(x + 2, y, p.w - 4, 16);

  ctx.fillStyle = "#c0392b";
  ctx.fillRect(x, y - 6, p.w, 8);
  ctx.fillRect(x + 4, y - 12, p.w - 8, 8);

  ctx.fillStyle = "#222";
  ctx.fillRect(p.facing === 1 ? x + p.w - 9 : x + 5, y + 4, 4, 4);
  ctx.fillStyle = "#5d4037";
  ctx.fillRect(x + 6, y + 10, p.w - 12, 3);
  ctx.fillStyle = "#2980b9";
  ctx.fillRect(x + 2, y + p.h - 14, p.w - 4, 10);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(x, y + p.h - 6, 12, 6);
  ctx.fillRect(x + p.w - 12, y + p.h - 6, 12, 6);
}

// ==================== ATUALIZAÇÃO E LOOP ====================
function update() {
  if (gameOver || won) return;

  if (keys.ArrowLeft || keys.a) {
    player.vx = -SPEED;
    player.facing = -1;
  } else if (keys.ArrowRight || keys.d) {
    player.vx = SPEED;
    player.facing = 1;
  } else {
    player.vx = 0;
  }

  if ((keys[" "] || keys.ArrowUp || keys.w) && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
  }

  resolveCollisions(player);
  checkTiles(player);
  updateCamera();

  if (player.y > H + 60) loseLife();
  if (player.x < 0) player.x = 0;
}

function loop() {
  update();
  drawBackground();
  drawTiles();
  drawPlayer(player);
  requestAnimationFrame(loop);
}

// ==================== EVENTOS ====================
window.addEventListener("keydown", (event) => {
  keys[event.key] = true;

  if (event.key === "r" || event.key === "R") init();
  if ([" ", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(event.key)) event.preventDefault();
});

window.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

// ==================== INÍCIO ====================
init();
loop();
