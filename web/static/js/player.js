const socket = io();

const loginView = document.getElementById('login-view');
const gameView = document.getElementById('game-view');
const btnConnect = document.getElementById('btn-connect');
const btnChangeSpawn = document.getElementById('btn-change-spawn');
const btnRandomName = document.getElementById('btn-random-name');

const aliasInput = document.getElementById('alias');
const spawnInput = document.getElementById('spawn_pref');
const scoreText = document.getElementById('score-text');

const canvas = document.getElementById('playerCanvas');
const ctx = canvas.getContext('2d');

const joystickZone = document.getElementById('joystick-zone');
const joystickThumb = document.getElementById('joystick-thumb');

let playerId = null;
let mazeGrid = [];
let gameState = null;
let cellSize = 60;

const COLOR_WALL = '#3d5240';
const COLOR_PATH = '#e6cead';
const COLOR_ALTAR = '#d84315';

// --- GENERADOR DE NOMBRES ARCADE 3 LETRAS ---
function generateRandomAntName() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let res = '';
    for (let i = 0; i < 3; i++) {
        res += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return res;
}

if (aliasInput) {
    aliasInput.value = generateRandomAntName();
    aliasInput.addEventListener('input', () => {
        aliasInput.value = aliasInput.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    });
}

if (btnRandomName) {
    btnRandomName.addEventListener('click', () => {
        if (aliasInput) aliasInput.value = generateRandomAntName();
    });
}

// --- SPRITES ---
const antSprites = { DOWN: new Image() };
const spriteLoaded = { DOWN: false };
antSprites.DOWN.src = '/static/images/ant_down.png';
antSprites.DOWN.onload = () => { spriteLoaded.DOWN = true; };

function doJoin() {
    let aliasVal = (aliasInput.value || '').trim().toUpperCase();
    if (aliasVal.length === 0) aliasVal = generateRandomAntName();
    const spawnVal = spawnInput ? spawnInput.value || 'AUTO' : 'AUTO';
    socket.emit('join', { alias: aliasVal, spawn_preference: spawnVal });
}

if (btnConnect) {
    btnConnect.addEventListener('click', (e) => {
        e.preventDefault();
        doJoin();
    });
}

if (btnChangeSpawn) {
    btnChangeSpawn.addEventListener('click', () => {
        if (aliasInput) aliasInput.value = generateRandomAntName();
        if (loginView) loginView.style.display = 'block';
        if (gameView) gameView.style.display = 'none';
    });
}

socket.on('welcome', (data) => {
    playerId = data.player_id;
    mazeGrid = data.maze_grid;
    if (data.cell_size) cellSize = data.cell_size;

    if (loginView) loginView.style.display = 'none';
    if (gameView) gameView.style.display = 'flex';
    render();
});

socket.on('state_update', (data) => {
    gameState = data;
    if (data.maze_grid) mazeGrid = data.maze_grid;
    if (data.cell_size) cellSize = data.cell_size;

    if (playerId && gameState.ants && gameState.ants[playerId]) {
        if (loginView && loginView.style.display !== 'none') {
            loginView.style.display = 'none';
            if (gameView) gameView.style.display = 'flex';
        }
        render();
    }
});

socket.on('round_over', (data) => {
    alert(`¡Ronda Terminada!\nGanador: ${data.winner_alias} (+${data.bonus_points} bonus)\nScore Final: ${data.final_score} pts`);
});

socket.on('kicked_out', (data) => {
    alert(`Has sido expulsado: ${data.reason}`);
    playerId = null;
    if (gameView) gameView.style.display = 'none';
    if (loginView) loginView.style.display = 'block';
});

socket.on('disconnect', () => {
    playerId = null;
    if (gameView) gameView.style.display = 'none';
    if (loginView) loginView.style.display = 'block';
});

// --- JOYSTICK TÁCTIL VIRTUAL 360° ---
let isJoystickActive = false;
let joyCenter = { x: 0, y: 0 };
const JOY_MAX_RADIUS = 45;

function sendInputVector(dx, dy) {
    if (!playerId) return;
    socket.emit('input_move', { dx, dy });
}

function handleJoystickStart(clientX, clientY) {
    if (!joystickZone) return;
    const rect = joystickZone.getBoundingClientRect();
    joyCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
    isJoystickActive = true;
    handleJoystickMove(clientX, clientY);
}

function handleJoystickMove(clientX, clientY) {
    if (!isJoystickActive) return;
    const deltaX = clientX - joyCenter.x;
    const deltaY = clientY - joyCenter.y;
    const dist = Math.hypot(deltaX, deltaY);

    let normX = 0, normY = 0;
    if (dist > 0) {
        normX = deltaX / dist;
        normY = deltaY / dist;
    }

    const clampedDist = Math.min(dist, JOY_MAX_RADIUS);
    const moveX = normX * clampedDist;
    const moveY = normY * clampedDist;

    if (joystickThumb) {
        joystickThumb.style.transform = `translate(${moveX}px, ${moveY}px)`;
    }

    const inputDx = normX * (clampedDist / JOY_MAX_RADIUS);
    const inputDy = normY * (clampedDist / JOY_MAX_RADIUS);

    sendInputVector(inputDx, inputDy);
}

function handleJoystickEnd() {
    isJoystickActive = false;
    if (joystickThumb) {
        joystickThumb.style.transform = `translate(0px, 0px)`;
    }
    sendInputVector(0, 0);
}

if (joystickZone) {
    joystickZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const t = e.touches[0];
        handleJoystickStart(t.clientX, t.clientY);
    }, { passive: false });

    joystickZone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const t = e.touches[0];
        handleJoystickMove(t.clientX, t.clientY);
    }, { passive: false });

    joystickZone.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleJoystickEnd();
    });

    joystickZone.addEventListener('mousedown', (e) => {
        handleJoystickStart(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
        if (isJoystickActive) handleJoystickMove(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
        if (isJoystickActive) handleJoystickEnd();
    });
}

// --- CONTROLES TECLADO (WASD / FLECHAS) ---
const activeKeys = new Set();

document.addEventListener('keydown', (e) => {
    if (!playerId || !gameState || !gameState.round_active) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'].includes(e.key)) {
        activeKeys.add(e.key.toLowerCase());
        updateKeyboardInput();
    }
});

document.addEventListener('keyup', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'].includes(e.key)) {
        activeKeys.delete(e.key.toLowerCase());
        updateKeyboardInput();
    }
});

function updateKeyboardInput() {
    if (isJoystickActive) return;
    let kdx = 0, kdy = 0;
    if (activeKeys.has('w') || activeKeys.has('arrowup')) kdy -= 1;
    if (activeKeys.has('s') || activeKeys.has('arrowdown')) kdy += 1;
    if (activeKeys.has('a') || activeKeys.has('arrowleft')) kdx -= 1;
    if (activeKeys.has('d') || activeKeys.has('arrowright')) kdx += 1;

    const mag = Math.hypot(kdx, kdy);
    if (mag > 0) {
        kdx /= mag;
        kdy /= mag;
    }
    sendInputVector(kdx, kdy);
}

// --- TEXTOS FLOTANTES (+50 / -20) ---
const floatingTexts = [];

function addFloatingText(x, y, text, color) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        alpha: 1.0,
        vy: -1.0,
        life: 1.0
    });
}

function updateAndDrawFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= 0.03;
        ft.life -= 0.03;

        if (ft.life <= 0 || ft.alpha <= 0) {
            floatingTexts.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = 'bold 15px sans-serif';
        ctx.fillStyle = ft.color;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    }
}

// --- RENDERIZADO 2D EN CANVAS ---
function render() {
    if (!gameState || !playerId || !gameState.ants || !gameState.ants[playerId]) return;

    const myAnt = gameState.ants[playerId];
    const px = myAnt.x;
    const py = myAnt.y;

    if (scoreText) scoreText.innerText = `Score: ${myAnt.score}`;

    if (gameState.bumps && gameState.bumps.length > 0) {
        gameState.bumps.forEach(b => {
            if (b.rammer === myAnt.alias) {
                addFloatingText(b.x, b.y - 10, "+50", '#2e7d32');
            } else if (b.victim === myAnt.alias) {
                addFloatingText(b.x, b.y - 10, "-20", '#c62828');
            }
        });
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    ctx.translate(canvas.width / 2 - px, canvas.height / 2 - py);

    const mazeSize = mazeGrid.length;
    for (let gy = 0; gy < mazeSize; gy++) {
        for (let gx = 0; gx < mazeSize; gx++) {
            const rx = gx * cellSize;
            const ry = gy * cellSize;
            const cell = mazeGrid[gy][gx];

            if (cell === 1) {
                ctx.fillStyle = COLOR_WALL;
                ctx.fillRect(rx, ry, cellSize, cellSize);
                ctx.strokeStyle = '#2d3b2d';
                ctx.lineWidth = 1;
                ctx.strokeRect(rx, ry, cellSize, cellSize);
            } else {
                ctx.fillStyle = COLOR_PATH;
                ctx.fillRect(rx, ry, cellSize, cellSize);
                ctx.strokeStyle = "rgba(121, 85, 72, 0.08)";
                ctx.strokeRect(rx, ry, cellSize, cellSize);
            }

            if (cell === 2) {
                const cx = rx + cellSize / 2;
                const cy = ry + cellSize / 2;
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.45, 0, 2 * Math.PI);
                ctx.fillStyle = COLOR_ALTAR;
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2.5;
                ctx.stroke();

                ctx.font = 'bold 12px sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText("ALTAR", cx, cy + 4);
            }
        }
    }

    for (const [pid, ant] of Object.entries(gameState.ants)) {
        const isMe = (pid === playerId);
        const radius = 20;

        ctx.save();
        ctx.translate(ant.x, ant.y);
        ctx.rotate(ant.angle);

        if (spriteLoaded.DOWN && antSprites.DOWN.complete && antSprites.DOWN.naturalWidth !== 0) {
            const imgSize = radius * 2.6;
            ctx.drawImage(antSprites.DOWN, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, 2 * Math.PI);
            ctx.fillStyle = ant.color || '#5c4033';
            ctx.fill();
            ctx.strokeStyle = ant.is_stunned ? '#c62828' : '#3e2723';
            ctx.lineWidth = isMe ? 3 : 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(radius * 0.8, 0);
            ctx.lineTo(-radius * 0.3, -radius * 0.4);
            ctx.lineTo(-radius * 0.3, radius * 0.4);
            ctx.closePath();
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }

        ctx.restore();

        ctx.font = isMe ? 'bold 12px sans-serif' : '11px sans-serif';
        const textWidth = ctx.measureText(ant.alias).width;
        const textY = ant.y - radius - 5;

        ctx.fillStyle = '#f5efe6';
        ctx.fillRect(ant.x - textWidth/2 - 3, textY - 10, textWidth + 6, 13);

        ctx.fillStyle = isMe ? '#2e7d32' : '#3e2723';
        ctx.textAlign = 'center';
        const label = isMe ? `⭐ ${ant.alias} ⭐` : ant.alias;
        ctx.fillText(label, ant.x, textY);
    }

    updateAndDrawFloatingTexts();

    ctx.restore();
}
