document.addEventListener('DOMContentLoaded', () => {
    // Generador de nombres aleatorios
    const palabrasAleatorias = ["unitropico", "numeros", "random", "chigui", "galipiar", "gavan", "oso", "rey", "princesa"];
    const inputUsername = document.getElementById('username-input');
    const btnRandomName = document.getElementById('btn-random-name');

    function generarNombreAzar() {
        const palabra = palabrasAleatorias[Math.floor(Math.random() * palabrasAleatorias.length)];
        const numAleatorio = Math.floor(Math.random() * 9999) + 1;
        inputUsername.value = palabra + numAleatorio;
    }

    if (inputUsername && btnRandomName) {
        generarNombreAzar();
        btnRandomName.addEventListener('click', generarNombreAzar);
    }

    // Referencias a vistas
    const viewLogin = document.getElementById('login-view');
    const layoutMain = document.getElementById('main-layout');
    
    const views = {
        'lobbies-view': document.getElementById('lobbies-view'),
        'game-view': document.getElementById('game-view'),
        'telemetry-view': document.getElementById('telemetry-view'),
        'view-ranking': document.getElementById('view-ranking')
    };
    
    // Navegación Sidebar
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            const target = item.getAttribute('data-target');
            Object.values(views).forEach(v => v.classList.add('hidden'));
            views[target].classList.remove('hidden');
            
            if (target === 'view-ranking' && ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ accion: "obtener_ranking_global" }));
            } else if (target === 'lobbies-view' && ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ accion: "obtener_salas" }));
            }
        });
    });

    // Controladores de Vistas
    let canvasView = null;
    let telemetryView = new TelemetryView();
    let ws = null;
    
    let currentIdJugador = null;
    let currentIdSala = null;
    let username = '';
    
    let globalRankingData = [];

    // Flujo de Login
    document.getElementById('btn-login').addEventListener('click', () => {
        const input = document.getElementById('username-input').value.trim();
        if(input.length === 0) return;
        username = input;
        
        viewLogin.classList.add('hidden');
        layoutMain.classList.remove('hidden');
        
        // Ir a la vista principal (Salas/Lobbies por defecto)
        views['lobbies-view'].classList.remove('hidden');
        
        // Conectar WebSocket
        conectarWS();
    });

    // Entrar a sala dinámico
    const lobbiesGridContainer = document.getElementById('lobbies-grid-container');
    if (lobbiesGridContainer) {
        lobbiesGridContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-join')) {
                const btn = e.target;
                currentIdSala = parseInt(btn.getAttribute('data-sala'));
                const roomName = btn.previousElementSibling.previousElementSibling.innerText;
                document.getElementById('game-room-name').innerText = roomName;
                
                if(ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        accion: "unirse_sala",
                        username: username,
                        id_sala: currentIdSala
                    }));
                }
            }
        });
    }

    // Actualización de Ranking
    const rankingBody = document.getElementById('ranking-body');
    function actualizarRanking(rankingData) {
        let html = '';
        rankingData.forEach(r => {
            html += `<tr>
                <td>${r.username}</td>
                <td class="pts">${r.puntos}</td>
                <td>${r.dulces}</td>
            </tr>`;
        });
        rankingBody.innerHTML = html;
    }

    // Lógica Global Ranking
    const searchInput = document.getElementById('search-ranking');
    searchInput.addEventListener('input', () => {
        renderGlobalRanking(globalRankingData);
    });

    function renderGlobalRanking(data) {
        const filter = searchInput.value.toLowerCase();
        const filtered = data.filter(r => r.username.toLowerCase().includes(filter));
        
        const podiumEl = document.getElementById('ranking-podium');
        const tableBody = document.getElementById('global-ranking-body');
        
        // Render Podio (solo los top 3 originales, independientemente del filtro, a menos que el filtro los excluya, 
        // pero usualmente el podio es fijo o filtrado. Lo haremos dinámico sobre el original para mantener el top 3)
        // Para simplificar: el podio muestra los top 3 del resultado filtrado
        
        let podiumHtml = '';
        if (filtered.length > 1) podiumHtml += `<div class="podium-box rank-2"><h3>${filtered[1].username}</h3><p>${filtered[1].puntos} pts</p></div>`;
        if (filtered.length > 0) podiumHtml += `<div class="podium-box rank-1"><h3>${filtered[0].username}</h3><p>${filtered[0].puntos} pts</p></div>`;
        if (filtered.length > 2) podiumHtml += `<div class="podium-box rank-3"><h3>${filtered[2].username}</h3><p>${filtered[2].puntos} pts</p></div>`;
        podiumEl.innerHTML = podiumHtml;
        
        // Render Tabla (4 en adelante del filtrado)
        let tableHtml = '';
        for (let i = 3; i < filtered.length; i++) {
            const r = filtered[i];
            // Encontrar la posición real original
            const originalIndex = data.findIndex(orig => orig.username === r.username) + 1;
            tableHtml += `<tr>
                <td>#${originalIndex}</td>
                <td>${r.username}</td>
                <td class="pts">${r.puntos}</td>
                <td>${r.dulces}</td>
            </tr>`;
        }
        tableBody.innerHTML = tableHtml;
    }

    // WebSocket Logic
    function conectarWS() {
        ws = new WebSocket('ws://' + window.location.hostname + ':8765');
        
        ws.onopen = () => {
            console.log("WebSocket Conectado a 8765");
            if (!views['lobbies-view'].classList.contains('hidden')) {
                ws.send(JSON.stringify({ accion: "obtener_salas" }));
            }
        };
        
        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            
            if (data.evento === "unirse_sala_ok") {
                currentIdJugador = data.id_jugador;
                Object.values(views).forEach(v => v.classList.add('hidden'));
                views['game-view'].classList.remove('hidden');
                
                if (!canvasView) {
                    canvasView = new CanvasView('game-canvas', (x, y) => {
                        if(ws && ws.readyState === WebSocket.OPEN && currentIdJugador) {
                            ws.send(JSON.stringify({
                                accion: "clic_mapa",
                                id_sala: currentIdSala,
                                id_jugador: currentIdJugador,
                                pos_x: x,
                                pos_y: y
                            }));
                        }
                    });
                }
            }
            else if (data.evento === "ranking_global") {
                globalRankingData = data.ranking;
                renderGlobalRanking(globalRankingData);
            }
            else if (data.evento === "telemetria") {
                telemetryView.actualizar(data);
            } 
            else if (data.evento === "lista_salas") {
                const container = document.getElementById('lobbies-grid-container');
                if (container) {
                    let html = '';
                    const bgs = ['bg-alpha', 'bg-beta', 'bg-gamma'];
                    data.salas.forEach((sala, index) => {
                        const bgClass = bgs[index % bgs.length];
                        const count = sala.cantidad_jugadores;
                        const full = count >= 5;
                        
                        let btnText = "Unirse a Sala";
                        let disabled = false;
                        
                        if (sala.estado === 'Sala Llena' || full) {
                            btnText = "Sala Llena";
                            disabled = true;
                        } else if (sala.estado === 'Cerrada') {
                            btnText = "Cerrada";
                            disabled = true;
                        }
                        
                        let usersTitle = sala.jugadores && sala.jugadores.length > 0 ? "Jugadores: " + sala.jugadores.join(", ") : "Sin jugadores";

                        html += `<div class="lobby-card">
                            <div class="lobby-image ${bgClass}">
                                <span class="badge" title="${usersTitle}">👥 ${count}/5</span>
                            </div>
                            <div class="lobby-info">
                                <h3>${sala.nombre_sala}</h3>
                                <span class="tag">Estado: ${sala.estado}</span>
                                <button class="btn-brown btn-join" data-sala="${sala.id_sala}" ${disabled ? 'disabled' : ''}>${btnText}</button>
                            </div>
                        </div>`;
                    });
                    container.innerHTML = html;
                }
            }
            else if (data.evento === "estado_sala") {
                if (canvasView && currentIdSala === data.id_sala) {
                    canvasView.actualizarEstado(data);
                    actualizarRanking(data.ranking);
                }
            }
            else if (data.evento === "notificacion") {
                if (data.id_jugador === currentIdJugador) {
                    alert(data.mensaje); 
                }
            }
        };
        
        ws.onclose = () => {
            console.log("WebSocket Desconectado. Reintentando en 3s...");
            setTimeout(conectarWS, 3000);
        };
    }

    // Ruta de Admin por URL
    if (window.location.hash === '#telemetria' || window.location.search.includes('admin')) {
        viewLogin.classList.add('hidden');
        layoutMain.classList.remove('hidden');
        
        // Ocultar salas y mostrar telemetría
        views['lobbies-view'].classList.add('hidden');
        views['telemetry-view'].classList.remove('hidden');
        
        // Desactivar items activos en sidebar
        navItems.forEach(n => n.classList.remove('active'));
        
        conectarWS();
    }
});
