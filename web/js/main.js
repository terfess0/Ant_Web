document.addEventListener('DOMContentLoaded', () => {
    // Referencias a vistas
    const viewLogin = document.getElementById('login-view');
    const layoutMain = document.getElementById('main-layout');
    
    const views = {
        'lobbies-view': document.getElementById('lobbies-view'),
        'game-view': document.getElementById('game-view'),
        'telemetry-view': document.getElementById('telemetry-view')
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
        });
    });

    // Controladores de Vistas
    let canvasView = null;
    let telemetryView = new TelemetryView();
    let ws = null;
    
    let currentIdJugador = 1; // Ajustado para testear con la sala de main.py
    let currentIdSala = null;
    let username = '';

    // Flujo de Login
    document.getElementById('btn-login').addEventListener('click', () => {
        const input = document.getElementById('username-input').value.trim();
        if(input.length === 0) return;
        username = input;
        
        viewLogin.classList.add('hidden');
        layoutMain.classList.remove('hidden');
        
        // Ir a la vista principal (Dashboard/Telemetry por defecto)
        views['telemetry-view'].classList.remove('hidden');
        
        // Conectar WebSocket
        conectarWS();
    });

    // Entrar a sala
    const joinBtns = document.querySelectorAll('.btn-join');
    joinBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentIdSala = parseInt(btn.getAttribute('data-sala'));
            document.getElementById('game-room-name').innerText = "Hormiguero Alfa (Sala 1 Test)"; // Hardcode por ahora
            
            // Navegación
            Object.values(views).forEach(v => v.classList.add('hidden'));
            views['game-view'].classList.remove('hidden');
            
            // Iniciar Canvas
            if (!canvasView) {
                canvasView = new CanvasView('game-canvas', (x, y) => {
                    if(ws && ws.readyState === WebSocket.OPEN) {
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
        });
    });

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

    // WebSocket Logic
    function conectarWS() {
        ws = new WebSocket('ws://' + window.location.hostname + ':8765');
        
        ws.onopen = () => {
            console.log("WebSocket Conectado a 8765");
        };
        
        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            
            if (data.evento === "telemetria") {
                telemetryView.actualizar(data);
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
});
