import asyncio
import signal
import sys
import platform
from models.database import Database
from models.sala import Sala
from models.jugador import Jugador
from controllers.http_controller import HttpController
from controllers.telemetry_controller import TelemetryController
from controllers.websocket_controller import WebsocketController

# Diccionario global para mantener las salas activas en memoria
salas_activas = {}

def get_sala_por_id(id_sala):
    return salas_activas.get(id_sala)

def get_todas_salas():
    return list(salas_activas.values())

async def main():
    print("--- Inicializando Servidor Hormigueros ---")
    
    # 1. Validar conexión al pool de DB
    db_pool = Database.get_pool()
    if not db_pool:
        print("Advertencia: No se pudo conectar a la DB local. Se continuará con objetos en memoria.")
        
    # 2. Levantar Servidor HTTP para archivos estáticos (Puerto 8080)
    http_server = HttpController(port=8080)
    http_server.start()
    
    # 3. (OPCIONAL/TEST) Crear una sala inicial para comprobar métricas
    sala_test = Sala(id_sala=1)
    j1 = Jugador(1, "Jugador1", 100, 100)
    sala_test.agregar_jugador(j1)
    sala_test.iniciar_partida()
    salas_activas[1] = sala_test
    
    # 4. Inicializar WebSocket Controller
    ws_controller = WebsocketController(get_sala_por_id)
    
    # 5. Iniciar Hilo de Telemetría
    telemetry = TelemetryController(ws_controller, get_todas_salas)
    telemetry.start()
    
    # 6. Manejar apagado (Graceful Shutdown)
    def graceful_shutdown():
        print("\nApagando servidor...")
        http_server.stop()
        telemetry.stop()
        for sala in salas_activas.values():
            sala.detener_partida()
        sys.exit(0)
        
    if platform.system() != "Windows":
        loop = asyncio.get_running_loop()
        try:
            loop.add_signal_handler(signal.SIGINT, graceful_shutdown)
            loop.add_signal_handler(signal.SIGTERM, graceful_shutdown)
        except NotImplementedError:
            pass

    try:
        # Iniciar servidor WebSocket asíncrono (Puerto 8765)
        await ws_controller.start_server(get_todas_salas)
    except KeyboardInterrupt:
        graceful_shutdown()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServidor detenido.")
        sys.exit(0)
