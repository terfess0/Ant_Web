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
        self.get_todas_salas = None

    async def register(self, websocket):
        self.clientes.add(websocket)
        print(f"Connect: Nuevo cliente conectado. Total sockets activos: {len(self.clientes)}")

    async def unregister(self, websocket):
        if websocket in self.clientes:
            self.clientes.remove(websocket)
            print(f"Disconnect: Cliente desconectado. Total sockets activos: {len(self.clientes)}")

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

    async def remover_jugador_de_sala(self, id_sala, id_jugador):
        if not id_sala or not id_jugador:
            return
        sala = self.get_sala_por_id(id_sala)
        if sala and id_jugador in sala.jugadores:
            jugador = sala.jugadores.pop(id_jugador)
            for h in jugador.hormigas:
                h.stop()
            print(f"Jugador {jugador.username} abandonó la sala {id_sala}.")
            
            # Si la sala queda vacía, la reseteamos por completo para que sea reutilizable
            if len(sala.jugadores) == 0:
                sala.estado = "esperando"
                sala.tiempo_restante = config.DURACION_PARTIDA
                sala.dulces_centro = []
                Database.actualizar_estado_sala(id_sala, 1) # esperando
                print(f"Sala {id_sala} vacía. Reseteada a estado esperando.")
            else:
                # Si el juego no está lleno ahora, actualizar base de datos si corresponde
                if len(sala.jugadores) < 5:
                    nuevo_estado_db = 2 if sala.estado == "en_juego" else 1
                    Database.actualizar_estado_sala(id_sala, nuevo_estado_db)
                
            # Emitir actualización del estado de sala
            estado = sala.get_estado_global()
            estado["id_sala"] = sala.id_sala
            estado["tiempo_restante"] = sala.get_tiempo_formateado()
            await self.broadcast(json.dumps(estado))

    async def handler(self, websocket):
        await self.register(websocket)
        client_sala_id = None
        client_jugador_id = None
        try:
            async for message in websocket:
                data = json.loads(message)
                accion = data.get("accion")
                
                if accion == "obtener_ranking_global":
                    print("Action: Cliente consulto el Ranking Global.")
                    ranking = Database.obtener_ranking_global()
                    await websocket.send(json.dumps({
                        "evento": "ranking_global",
                        "ranking": ranking
                    }))
                    continue
                
                if accion == "obtener_salas":
                    salas_db = Database.obtener_salas_db()
                    salas_info = []
                    salas_activas = self.get_todas_salas() if self.get_todas_salas else []
                    salas_activas_dict = {s.id_sala: s for s in salas_activas}

                    for s_db in salas_db:
                        sala_memoria = salas_activas_dict.get(s_db['id_sala'])
                        jugadores_nombres = []
                        estado_actual = s_db['estado']
                        
                        if sala_memoria:
                            jugadores_nombres = [j.username for j in sala_memoria.jugadores.values()]
                            estado_actual = s_db['estado']
                        else:
                            estado_actual = s_db['estado']
                            
                        if estado_actual.lower() == 'esperando': estado_actual = 'En Espera'
                        elif estado_actual.lower() == 'en_juego': estado_actual = 'En Juego'
                        elif estado_actual.lower() == 'finalizada': estado_actual = 'Cerrada'
                        elif estado_actual.lower() == 'llena': estado_actual = 'Sala Llena'
                                
                        salas_info.append({
                            'id_sala': s_db['id_sala'],
                            'nombre_sala': s_db['nombre_sala'],
                            'estado': estado_actual,
                            'cantidad_jugadores': len(jugadores_nombres),
                            'jugadores': jugadores_nombres
                        })
                        
                    print(f"Action: Cliente consulto lista de salas ({len(salas_info)} salas obtenidas).")
                    await websocket.send(json.dumps({
                        "evento": "lista_salas",
                        "salas": salas_info
                    }))
                    continue
                    
                if accion == "limpiar_datos_db":
                    print("Action: Solicitud de LIMPIEZA DE BASE DE DATOS ejecutada por Administrador.")
                    Database.limpiar_datos()
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
                        spawn_index = len(sala.jugadores)
                        spawn_positions = [
                            (110, 110),   # Top-Left
                            (690, 110),   # Top-Right
                            (110, 490),   # Bottom-Left
                            (690, 490),   # Bottom-Right
                            (400, 90)     # Top-Center (away from the 400, 300 center)
                        ]
                        pos_x, pos_y = spawn_positions[spawn_index % len(spawn_positions)]
                        j = Jugador(id_jugador, username, pos_x, pos_y)
                        if sala.agregar_jugador(j):
                            nombre_sala = Database.obtener_nombre_sala(id_sala)
                            print(f"{username} conectado a sala {nombre_sala}.")
                            
                            # Si la sala estaba esperando, iniciar la partida con el primer jugador
                            if sala.estado == "esperando":
                                sala.iniciar_partida()
                                Database.actualizar_estado_sala(id_sala, 2) # en_juego
                                
                            if sala.estado == "en_juego" and not j.hormigas:
                                for i in range(5):
                                    h = Hormiga(id_hormiga=i, id_jugador=id_jugador, start_x=j.base_x, start_y=j.base_y)
                                    j.hormigas.append(h)
                                    h.start()
                                
                    client_sala_id = id_sala
                    client_jugador_id = id_jugador
                    
                    await websocket.send(json.dumps({
                        "evento": "unirse_sala_ok",
                        "id_jugador": id_jugador,
                        "id_sala": id_sala
                    }))
                    
                elif accion == "salir_sala":
                    await self.remover_jugador_de_sala(client_sala_id, client_jugador_id)
                    client_sala_id = None
                    client_jugador_id = None
                    continue
                    
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
            await self.remover_jugador_de_sala(client_sala_id, client_jugador_id)
            await self.unregister(websocket)

    async def game_loop_task(self, get_salas_activas_func):
        while True:
            salas = get_salas_activas_func()
            for sala in salas:
                if sala.estado == "en_juego":
                    just_finished, ganador_info = sala.tick()
                    if just_finished:
                        print(f"Partida finalizada en sala {sala.id_sala}. Ganador: {ganador_info['username']}")
                        # Mantenemos el estado de la base de datos intacto (en_juego)
                        await self.broadcast(json.dumps({
                            "evento": "fin_partida",
                            "id_sala": sala.id_sala,
                            "ganador": ganador_info['username'],
                            "puntos": ganador_info['puntos']
                        }))
                
                GameController.procesar_logica_juego(
                    sala, 
                    lambda id_jug, msg: self.notificar_jugador(sala, id_jug, msg)
                )
                
                estado = sala.get_estado_global()
                estado["id_sala"] = sala.id_sala
                estado["tiempo_restante"] = sala.get_tiempo_formateado()
                await self.broadcast(json.dumps(estado))
                
            await asyncio.sleep(0.1) # Transmisión regulada a 10 Hz

    async def start_server(self, get_salas_activas_func):
        self.loop = asyncio.get_running_loop()
        self.get_todas_salas = get_salas_activas_func
        
        asyncio.create_task(self.game_loop_task(get_salas_activas_func))
        
        async with websockets.serve(self.handler, "0.0.0.0", 8765):
            print("Servidor WebSocket asíncrono iniciado en ws://0.0.0.0:8765")
            await asyncio.Future()  # Correr para siempre
