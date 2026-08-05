from core.game_state import GameState
from web.web_server import start_web_server

# Instancia Global con laberinto compacto 15x15 para Autos Chocones con Esferas
game_state = GameState(size=15)

if __name__ == "__main__":
    print("[*] Iniciando servidor AntMaze Bumper Arcade (Autos Chocones con Esferas)")
    print("[*] Accede al panel web en http://localhost:5000")
    start_web_server(game_state)
