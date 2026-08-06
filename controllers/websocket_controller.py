import asyncio
import json
import websockets
from controllers.game_controller import GameController
from models.database import Database
from models.jugador import Jugador
from models.hormiga import Hormiga
import random

class WebsocketController:
    def __init__(self, get_sala_por_id_func):
        self.get_sala_por_id = get_sala_por_id_func
        self.clientes = set()
        self.loop = None

    async def register(self, websocket):
        self.clientes.add(websocket)

    async def unregister(self, websocket):
        self.clientes.remove(websocket)

    async def broadcast(self, message):
        if self.clientes:
            # Enviar mensaje a todos (retorna excepciones si algún cliente cerró repentinamente)
            await asyncio.gather(
                *[client.send(message) for client in self.clientes],
                return_exceptions=True
            )

    def notificar_jugador(self, sala, id_jugador, mensaje):
        if self.loop:
            notif = {
                "evento": "notificacion",
                "id_jugador": id_jugador,
                "mensaje": mensaje
            }
            asyncio.run_coroutine_threadsafe(
                self.broadcast(json.dumps(notif)),
                self.loop
            )

    async def handler(self, websocket):
        await self.register(websocket)
        try:
            async for message in websocket:
                data = json.loads(message)
                accion = data.get("accion")
                
                if accion == "obtener_ranking_global":
                    ranking = Database.obtener_ranking_global()
                    await websocket.send(json.dumps({
                        "evento": "ranking_global",
                        "ranking": ranking
                    }))
                    continue
                
                # Asumimos que el cliente envía en qué sala está
                id_sala = data.get("id_sala", 1)
                sala = self.get_sala_por_id(id_sala)
                
                if sala is None:
                    continue
                    
                if accion == "unirse_sala":
                    username = data.get("username")
                    if not username: username = "Anónimo"
                    
                    # Registrar o mockear ID
                    id_jugador = Database.registrar_jugador(username) 
                    if not id_jugador:
                        id_jugador = hash(username) % 10000
                        
                    if id_jugador not in sala.jugadores:
                        j = Jugador(id_jugador, username, random.randint(100, 700), random.randint(100, 500))
                        if sala.agregar_jugador(j) and sala.estado == "en_juego":
                            for i in range(5):
                                h = Hormiga(id_hormiga=i, id_jugador=id_jugador, start_x=j.base_x, start_y=j.base_y)
                                j.hormigas.append(h)
                                h.start()
                                
                    await websocket.send(json.dumps({
                        "evento": "unirse_sala_ok",
                        "id_jugador": id_jugador,
                        "id_sala": id_sala
                    }))
                    
                elif accion == "clic_mapa":
                    id_jugador = data.get("id_jugador")
                    x = data.get("pos_x")
                    y = data.get("pos_y")
                    GameController.procesar_clic_mapa(sala, id_jugador, x, y)
                    
        except websockets.exceptions.ConnectionClosed:
            pass
        except Exception as e:
            print(f"Error en websocket handler: {e}")
        finally:
            await self.unregister(websocket)

    async def game_loop_task(self, get_salas_activas_func):
        while True:
            salas = get_salas_activas_func()
            for sala in salas:
                GameController.procesar_logica_juego(
                    sala, 
                    lambda id_jug, msg: self.notificar_jugador(sala, id_jug, msg)
                )
                
                estado = sala.get_estado_global()
                estado["id_sala"] = sala.id_sala
                await self.broadcast(json.dumps(estado))
                
            await asyncio.sleep(0.1) # Transmisión regulada a 10 Hz

    async def start_server(self, get_salas_activas_func):
        self.loop = asyncio.get_running_loop()
        
        asyncio.create_task(self.game_loop_task(get_salas_activas_func))
        
        async with websockets.serve(self.handler, "0.0.0.0", 8765):
            print("Servidor WebSocket asíncrono iniciado en ws://0.0.0.0:8765")
            await asyncio.Future()  # Correr para siempre
