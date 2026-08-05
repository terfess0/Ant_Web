// --- INICIALIZACIÓN DE FIREBASE REALTIME DATABASE (CLIENT-SIDE WEB SDK) ---
const firebaseConfig = {
    apiKey: "AIzaSyDemoKeyForAntMazeBumperArcade",
    authDomain: "antmaze-bumper-arcade.firebaseapp.com",
    databaseURL: "https://antmaze-bumper-arcade-default-rtdb.firebaseio.com",
    projectId: "antmaze-bumper-arcade",
    storageBucket: "antmaze-bumper-arcade.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456"
};

let db = null;
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.database();
} catch (e) {
    console.warn("Firebase no inicializado (Modo Demo/Offline):", e);
}

const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const rankingList = document.getElementById('ranking-list');
const firebaseTop5Div = document.getElementById('firebase-top5');
const statusBanner = document.getElementById('status-banner');
const bannerText = document.getElementById('banner-text');
const btnResetRanking = document.getElementById('btn-reset-ranking');

const COLOR_WALL = '#3d5240';
const COLOR_WALL_BORDER = '#2d3b2d';
const COLOR_PATH = '#e6cead';
const COLOR_ALTAR = '#d84315';

const antSprites = { DOWN: new Image() };
const spriteLoaded = { DOWN: false };
antSprites.DOWN.src = '/static/images/ant_down.png';
antSprites.DOWN.onload = () => { spriteLoaded.DOWN = true; };

// LISTENER EN TIEMPO REAL DE FIREBASE (/rankings)
if (db) {
    db.ref('rankings').orderByChild('score').limitToLast(10).on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            if (firebaseTop5Div) firebaseTop5Div.innerHTML = '<div style="color:#795548; font-style:italic; font-size:0.85rem;">Sin datos en el ranking</div>';
            return;
        }
        const items = [];
        Object.values(data).forEach(entry => {
            if (entry && entry.nickname && typeof entry.score === 'number') {
                items.push(entry);
            }
        });

        items.sort((a, b) => b.score - a.score);
        const top5 = items.slice(0, 5);

        if (firebaseTop5Div) {
            firebaseTop5Div.innerHTML = '';
            top5.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = `ranking-item ${index === 0 ? 'top1' : ''}`;
                div.innerHTML = `<span>#${index + 1} ${item.nickname}</span> <span>${item.score} pts</span>`;
                firebaseTop5Div.appendChild(div);
            });
        }
    });
}

if (btnResetRanking) {
    btnResetRanking.addEventListener('click', () => {
        if (confirm("¿Deseas reiniciar la ronda y limpiar el ranking actual?")) {
            socket.emit('reset_ranking', {});
        }
    });
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

function updateAndDrawFloatingTexts(scale) {
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
        ctx.fillText(ft.text, ft.x * scale, ft.y * scale);
        ctx.restore();
    }
}

function drawMaze(grid, cellSize) {
    const size = grid.length;
    const cellPixelSize = canvas.width / size;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const sx = x * cellPixelSize;
            const sy = y * cellPixelSize;
            const cell = grid[y][x];

            if (cell === 1) {
                ctx.fillStyle = COLOR_WALL;
                ctx.fillRect(sx, sy, cellPixelSize, cellPixelSize);
                ctx.strokeStyle = COLOR_WALL_BORDER;
                ctx.lineWidth = 1;
                ctx.strokeRect(sx, sy, cellPixelSize, cellPixelSize);
            } else {
                ctx.fillStyle = COLOR_PATH;
                ctx.fillRect(sx, sy, cellPixelSize, cellPixelSize);
                ctx.strokeStyle = "rgba(121, 85, 72, 0.08)";
                ctx.strokeRect(sx, sy, cellPixelSize, cellPixelSize);
            }

            // Altar Central Terracota
            if (cell === 2) {
                const cx = sx + cellPixelSize / 2;
                const cy = sy + cellPixelSize / 2;
                ctx.beginPath();
                ctx.arc(cx, cy, cellPixelSize * 0.45, 0, 2 * Math.PI);
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
}

function drawAnts(ants, gridLength, worldCellSize) {
    const scale = canvas.width / (gridLength * worldCellSize);

    for (const [pid, ant] of Object.entries(ants)) {
        const cx = ant.x * scale;
        const cy = ant.y * scale;
        const radius = 20 * scale;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ant.angle);

        if (spriteLoaded.DOWN && antSprites.DOWN.complete && antSprites.DOWN.naturalWidth !== 0) {
            const imgSize = radius * 2.6;
            ctx.drawImage(antSprites.DOWN, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
        } else {
            // Esfera Orgánica Terrosa
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, 2 * Math.PI);
            ctx.fillStyle = ant.color || '#5c4033';
            ctx.fill();
            ctx.strokeStyle = ant.is_stunned ? '#c62828' : '#3e2723';
            ctx.lineWidth = ant.is_stunned ? 3 : 2;
            ctx.stroke();

            // Puntero direccional
            ctx.beginPath();
            ctx.moveTo(radius * 0.8, 0);
            ctx.lineTo(-radius * 0.3, -radius * 0.4);
            ctx.lineTo(-radius * 0.3, radius * 0.4);
            ctx.closePath();
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }

        ctx.restore();

        // Nombre del jugador
        ctx.font = 'bold 11px sans-serif';
        const textWidth = ctx.measureText(ant.alias).width;
        const textY = cy - radius - 5;

        ctx.fillStyle = '#f5efe6';
        ctx.fillRect(cx - textWidth/2 - 3, textY - 10, textWidth + 6, 13);

        ctx.fillStyle = '#3e2723';
        ctx.textAlign = 'center';
        ctx.fillText(ant.alias, cx, textY);
    }

    updateAndDrawFloatingTexts(scale);
}

function updateRanking(ranking) {
    rankingList.innerHTML = '';
    if (!ranking || ranking.length === 0) {
        rankingList.innerHTML = '<li style="color:#795548; font-style:italic; justify-content:center;">Sin jugadores en la ronda</li>';
        return;
    }
    ranking.forEach(r => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${r.alias}</span> <span>${r.score} pts</span>`;
        rankingList.appendChild(li);
    });
}

function render(state) {
    if (!state.maze_grid) return;

    if (!state.round_active && state.winner) {
        statusBanner.classList.remove('hidden');
        bannerText.innerText = `¡Ronda Terminada!\nGanador: ${state.winner.alias} (+${state.winner.bonus_points} bonus)`;
    } else {
        statusBanner.classList.add('hidden');
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const worldCellSize = state.cell_size || 60;
    drawMaze(state.maze_grid, worldCellSize);

    if (state.bumps && state.bumps.length > 0) {
        state.bumps.forEach(b => {
            addFloatingText(b.x, b.y - 10, `+50 ${b.rammer}`, '#2e7d32');
            addFloatingText(b.x, b.y + 10, `-20 ${b.victim}`, '#c62828');
        });
    }

    drawAnts(state.ants, state.maze_grid.length, worldCellSize);
    updateRanking(state.ranking);
}

const socket = io();

socket.on('state_update', (data) => {
    render(data);
});

socket.on('round_over', (data) => {
    if (db && data.winner_alias && typeof data.final_score === 'number') {
        try {
            db.ref('rankings').push({
                nickname: data.winner_alias,
                score: data.final_score,
                timestamp: Date.now()
            });
        } catch (err) {
            console.error("Error guardando en Firebase:", err);
        }
    }

    if (typeof confetti === 'function') {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }

    if (canvas) {
        canvas.classList.add('shake');
        setTimeout(() => {
            canvas.classList.remove('shake');
        }, 500);
    }
});

socket.on('connect_error', (err) => {
    console.error("WS Error:", err);
});
