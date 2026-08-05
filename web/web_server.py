import time
import json
from flask import Flask, render_template, request, make_response
from flask_socketio import SocketIO
from core.telemetry import TelemetryTracker

app = Flask(__name__)
app.config['SECRET_KEY'] = 'antmaze-secret'
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

_game_state_ref = None

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

def tick_engine():
    """
    Bucle principal del juego a 20 TPS.
    """
    tps = 20
    delay = 1.0 / tps
    
    while True:
        start_time = time.time()
        
        if _game_state_ref:
            _game_state_ref.update_physics(delay)
            snapshot = _game_state_ref.get_state_snapshot()
            
            state_msg = {
                "ants": snapshot["ants"],
                "candy_pos": snapshot["candy_pos"],
                "cell_size": snapshot["cell_size"],
                "round_active": snapshot["round_active"],
                "maze_grid": snapshot["maze_grid"],
                "bumps": snapshot.get("bumps", []),
                "ranking": snapshot["ranking"]
            }
            socketio.emit('state_update', state_msg)
            
            if not snapshot["round_active"] and snapshot["winner"]:
                win_msg = {
                    "winner_id": snapshot["winner"]["player_id"],
                    "winner_alias": snapshot["winner"]["alias"],
                    "final_score": snapshot["winner"].get("final_score", 1000),
                    "bonus_points": snapshot["winner"].get("bonus_points", 0),
                    "time_left": snapshot["winner"].get("time_left", 0),
                    "global_ranking": snapshot["ranking"],
                    "next_round_in_sec": 10
                }
                socketio.emit('round_over', win_msg)
                
                print(f"[!] Ronda Terminada. Ganador: {snapshot['winner']['alias']} | Score Final: {win_msg['final_score']}")
                time.sleep(10)
                _game_state_ref.reset_round()
                print(f"[*] Nueva ronda iniciada.")
                
        elapsed = time.time() - start_time
        sleep_time = max(0, delay - elapsed)
        time.sleep(sleep_time)

def telemetry_engine():
    """ Envia telemetría a 1Hz """
    while True:
        metrics_data = TelemetryTracker.get_system_metrics()
        socketio.emit('telemetry_update', metrics_data)
        time.sleep(1.0)

def start_web_server(game_state):
    global _game_state_ref
    _game_state_ref = game_state
    
    socketio.start_background_task(tick_engine)
    socketio.start_background_task(telemetry_engine)
    
    socketio.run(app, host='0.0.0.0', port=5000, debug=False, use_reloader=False, allow_unsafe_werkzeug=True)

# ---- RUTAS HTTP ----
@app.route('/')
@app.route('/spectator')
def spectator():
    v = int(time.time() * 1000)
    return render_template('spectator.html', version=v)

@app.route('/metrics')
def metrics():
    v = int(time.time() * 1000)
    return render_template('metrics.html', version=v)

@app.route('/player')
def player():
    v = int(time.time() * 1000)
    return render_template('player.html', version=v)

# ---- EVENTOS SOCKET.IO ----
@socketio.on('join')
def on_join(data):
    if not _game_state_ref: return
    
    player_id = request.sid
    alias = data.get("alias", f"AAA")
    spawn_pref = data.get("spawn_preference", "AUTO")
    
    welcome_data = _game_state_ref.register_player(player_id, alias, spawn_pref)
    
    socketio.emit('welcome', welcome_data, to=player_id)
    print(f"[+] Jugador {alias} ({player_id}) conectado.")

@socketio.on('input_move')
def on_input_move(data):
    if not _game_state_ref: return
    player_id = request.sid
    try:
        dx = float(data.get("dx", 0.0))
        dy = float(data.get("dy", 0.0))
    except (ValueError, TypeError):
        dx, dy = 0.0, 0.0
    _game_state_ref.process_input(player_id, dx, dy)

@socketio.on('reset_ranking')
def on_reset_ranking(data=None):
    if not _game_state_ref: return
    socketio.emit('kicked_out', {"reason": "El administrador ha reiniciado la sesión."})
    _game_state_ref.clear_players_and_ranking()
    snapshot = _game_state_ref.get_state_snapshot()
    socketio.emit('state_update', snapshot)

@socketio.on('disconnect')
def on_disconnect():
    if not _game_state_ref: return
    player_id = request.sid
    with _game_state_ref.lock:
        if player_id in _game_state_ref.ants:
            alias = _game_state_ref.ants[player_id]["alias"]
            del _game_state_ref.ants[player_id]
            print(f"[-] Jugador {alias} ({player_id}) desconectado.")
