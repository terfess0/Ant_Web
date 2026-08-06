document.addEventListener('DOMContentLoaded', () => {
    // Controladores de Vistas y Variables de Estado
    let ws = null;
    let canvasView = null;
    let telemetryView = new TelemetryView();
    let currentIdJugador = null;
    let currentIdSala = null;
    let username = '';
    let globalRankingData = [];
    let connectionLostAlerted = false;

    // Referencias a vistas
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
    
    let currentIdJugador = null;
    let currentIdSala = null;
    let username = '';
    
    let globalRankingData = [];



    // Espectar sala
    const lobbiesGridContainer = document.getElementById('lobbies-grid-container');
    if (lobbiesGridContainer) {
        lobbiesGridContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-join')) {
                const btn = e.target;
                currentIdSala = parseInt(btn.getAttribute('data-sala'));
                const roomName = btn.previousElementSibling.previousElementSibling.innerText;
                document.getElementById('game-room-name').innerText = roomName + ' (ESPECTADOR)';
                
                Object.values(views).forEach(v => v.classList.add('hidden'));
                views['game-view'].classList.remove('hidden');
                
                if (!canvasView) {
                    canvasView = new CanvasView('game-canvas', (x, y) => {
                        // Espectador no hace clic
                    });
                }
            }
        });
    }

    // Botón Abandonar Sala
    const btnLeaveRoom = document.getElementById('btn-leave-room');
    if (btnLeaveRoom) {
        btnLeaveRoom.addEventListener('click', () => {
            currentIdSala = null;
            Object.values(views).forEach(v => v.classList.add('hidden'));
            views['lobbies-view'].classList.remove('hidden');
            
            navItems.forEach(n => n.classList.remove('active'));
            const navSalas = Array.from(navItems).find(n => n.getAttribute('data-target') === 'lobbies-view');
            if (navSalas) navSalas.classList.add('active');
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ accion: 'obtener_salas' }));
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
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderGlobalRanking(globalRankingData);
        });
    }

    // Botón Limpiar Datos
    const btnLimpiar = document.getElementById('btn-limpiar-datos');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
            if (confirm("¿Estás seguro de que deseas limpiar todos los jugadores y clasificaciones? Las salas NO se borrarán.")) {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ accion: "limpiar_datos_db" }));
                    alert("Se ha enviado la orden para limpiar los datos.");
                }
            }
        });
    }

    function renderGlobalRanking(data) {
        const filter = searchInput.value.toLowerCase();
        const filtered = data.filter(r => r.username.toLowerCase().includes(filter));
        
        const podiumEl = document.getElementById('ranking-podium');
        const tableBody = document.getElementById('global-ranking-body');
        
        // Render Podio (Top 3)
        let podiumHtml = '';
        if (filtered.length > 1) {
            const r2 = filtered[1];
            podiumHtml += `<div class="podium-box rank-2"><h3>${r2.username}</h3><p>${r2.puntos} pts | 🍬 ${r2.dulces}</p><span style="font-size: 0.7rem; color: #6b7280; margin-top: 5px;">${r2.ultima_sala || 'Sin sala'}</span></div>`;
        }
        if (filtered.length > 0) {
            const r1 = filtered[0];
            podiumHtml += `<div class="podium-box rank-1">
                <h3>${r1.username}</h3><p>${r1.puntos} pts | 🍬 ${r1.dulces}</p><span style="font-size: 0.7rem; color: #6b7280; margin-top: 5px;">${r1.ultima_sala || 'Sin sala'}</span></div>`;
        }
        if (filtered.length > 2) {
            const r3 = filtered[2];
            podiumHtml += `<div class="podium-box rank-3"><h3>${r3.username}</h3><p>${r3.puntos} pts | 🍬 ${r3.dulces}</p><span style="font-size: 0.7rem; color: #6b7280; margin-top: 5px;">${r3.ultima_sala || 'Sin sala'}</span></div>`;
        }
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

    let connectionLostAlerted = false;

    // WebSocket Logic
    function conectarWS() {
        ws = new WebSocket('ws://' + window.location.hostname + ':8765');
        
        ws.onopen = () => {
            console.log("WebSocket Conectado a 8765");
            if (connectionLostAlerted) {
                connectionLostAlerted = false;
                console.log("Reconectado exitosamente con el servidor.");
            }
            if (!views['lobbies-view'].classList.contains('hidden')) {
                ws.send(JSON.stringify({ accion: "obtener_salas" }));
            }
        };
        
        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            
            if (data.evento === "ranking_global") {
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
                        let usersTitle = sala.jugadores && sala.jugadores.length > 0 ? "Jugadores: " + sala.jugadores.join(", ") : "Sin jugadores";

                        html += `<div class="lobby-card">
                            <div class="lobby-image" style="background-image: url('assets/fondo.png'); background-size: cover; background-position: center; position: relative;">
                                <span class="badge" title="${usersTitle}">👥 ${count}/5</span>
                            </div>
                            <div class="lobby-info">
                                <h3>${sala.nombre_sala}</h3>
                                <span class="tag">Estado: ${sala.estado}</span>
                                <button class="btn-brown btn-join" data-sala="${sala.id_sala}">Espectar 👀</button>
                            </div>
                        </div>`;
                    });
                    container.innerHTML = html;
                }
            }
            else if (data.evento === "fin_partida") {
                if (currentIdSala === data.id_sala) {
                    alert("¡Partida Finalizada!\nGanador: " + data.ganador + " con " + data.puntos + " puntos.");
                    currentIdSala = null;
                    Object.values(views).forEach(v => v.classList.add('hidden'));
                    views['lobbies-view'].classList.remove('hidden');
                    
                    navItems.forEach(n => n.classList.remove('active'));
                    const navSalas = Array.from(navItems).find(n => n.getAttribute('data-target') === 'lobbies-view');
                    if (navSalas) navSalas.classList.add('active');
                    
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ accion: "obtener_salas" }));
                    }
                }
            }
            else if (data.evento === "estado_sala") {
                if (canvasView && currentIdSala === data.id_sala) {
                    canvasView.actualizarEstado(data);
                    actualizarRanking(data.ranking);
                    if (data.tiempo_restante) {
                        document.getElementById('game-timer').innerText = data.tiempo_restante;
                    }
                }
            }
            else if (data.evento === "notificacion") {
                if (data.id_jugador === currentIdJugador) {
                    alert(data.mensaje); 
                }
            }
        };
        
        ws.onclose = () => {
            if (!connectionLostAlerted) {
                connectionLostAlerted = true;
                alert("⚠️ Se ha perdido la conexión con el servidor. Intentando reconectar automáticamente...");
            }
            console.log("WebSocket Desconectado. Reintentando en 3s...");
            setTimeout(conectarWS, 3000);
        };
    }

    // Iniciar conexión WebSocket
    conectarWS();
});
