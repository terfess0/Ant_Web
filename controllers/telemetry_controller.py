import psutil
import threading
import time
import asyncio
import json
import sys

class TelemetryController(threading.Thread):
    def __init__(self, websocket_controller, get_salas_activas_func):
        super().__init__(name="Telemetry_Thread")
        self.ws_controller = websocket_controller
        self.get_salas_activas_func = get_salas_activas_func
        self.running = True
        
    def run(self):
        while self.running:
            try:
                # CPU
                cpu = psutil.cpu_percent(interval=None)
                
                # RAM
                mem = psutil.virtual_memory()
                ram_mb = mem.used // (1024 * 1024)
                
                # Hilos activos nativos
                hilos_activos = threading.active_count()
                
                # Cargas individuales de hormigas
                cargas = []
                salas = self.get_salas_activas_func()
                for sala in salas:
                    for jugador in sala.jugadores.values():
                        for h in jugador.hormigas:
                            cargas.append(h.carga)
                            
                # Sockets activos
                ws_clients = len(self.ws_controller.clientes) if self.ws_controller else 0

                telemetria_data = {
                    "evento": "telemetria",
                    "cpu": cpu,
                    "ram_mb": ram_mb,
                    "hilos_activos": hilos_activos,
                    "hilos_hormiga_cargas": cargas,
                    "ws_clients": ws_clients
                }
                
                # Imprimir en consola constantemente para monitoreo
                print(f"Telemetria - CPU: {cpu:.1f}% | RAM: {ram_mb}MB | Hilos: {hilos_activos} | WS Clientes: {ws_clients}")
                
                # Broadcast vía Websocket
                if self.ws_controller and self.ws_controller.loop:
                    asyncio.run_coroutine_threadsafe(
                        self.ws_controller.broadcast(json.dumps(telemetria_data)), 
                        self.ws_controller.loop
                    )
            except Exception as e:
                print(f"\nError en telemetría: {e}")
                
            time.sleep(1.0)
            
    def stop(self):
        self.running = False
