import math
import config
from models.database import Database

class GameController:
    @staticmethod
    def procesar_clic_mapa(sala, id_jugador, x, y):
        # Ignorar clics fuera del canvas
        if not (0 <= x <= config.CANVAS_WIDTH and 0 <= y <= config.CANVAS_HEIGHT):
            return

        jugador = sala.jugadores.get(id_jugador)
        if not jugador:
            return

        # Buscar la hormiga en estado 'patrulla' más cercana al clic
        mejor_hormiga = None
        menor_distancia = float('inf')
        
        for h in jugador.hormigas:
            if not h.es_guardiana and h.estado == 'patrulla':
                dist = math.hypot(x - h.x, y - h.y)
                if dist < menor_distancia:
                    menor_distancia = dist
                    mejor_hormiga = h
                    
        if mejor_hormiga:
            mejor_hormiga.objetivo_x = x
            mejor_hormiga.objetivo_y = y
            mejor_hormiga.ultimo_destino_x = x
            mejor_hormiga.ultimo_destino_y = y
            mejor_hormiga.estado = 'moviendo'
            
    @staticmethod
    def procesar_logica_juego(sala, notificar_callback=None):
        """
        Debe llamarse periódicamente (ej: 10Hz) por el servidor para verificar 
        si las hormigas alcanzaron sus destinos y validar recolección/robos.
        """
        if sala.estado != "en_juego":
            return
            
        for j_id, jugador in sala.jugadores.items():
            for h in jugador.hormigas:
                if h.es_guardiana:
                    continue
                    
                # Cuando la hormiga recién pasa a retorno, evaluamos qué pasó en su destino
                if h.estado == 'retorno' and not getattr(h, 'accion_procesada', False):
                    h.accion_procesada = True
                    dest_x = getattr(h, 'ultimo_destino_x', h.x)
                    dest_y = getattr(h, 'ultimo_destino_y', h.y)
                    
                    # 1. Comprobar recolección de dulce
                    dulce_recolectado = None
                    for dulce in sala.dulces_centro:
                        if math.hypot(dest_x - dulce['x'], dest_y - dulce['y']) < 20: # Radio de colisión
                            dulce_recolectado = dulce
                            break
                    
                    if dulce_recolectado:
                        sala.dulces_centro.remove(dulce_recolectado)
                        jugador.dulces += 1
                        jugador.puntos += config.PUNTOS_RECOLECCION
                        h.lleva_dulce = True
                        sala.reponer_dulces()
                        print(f"{jugador.username} ganó un dulce.")
                        Database.incrementar_estadisticas_jugador(jugador.id_jugador, config.PUNTOS_RECOLECCION, 1)
                        continue
                        
                    # 2. Comprobar intento de robo
                    for rival_id, rival in sala.jugadores.items():
                        if rival_id == j_id:
                            continue
                        
                        dist_a_base_rival = math.hypot(dest_x - rival.base_x, dest_y - rival.base_y)
                        if dist_a_base_rival < config.RADIO_DEFENSA_GUARDIANA:
                            guardiana_rival = rival.hormigas[0]
                            if guardiana_rival.estado_guardiana == "despierta":
                                # Detectado por la guardiana
                                h.estado = "expulsada" # El hilo de la hormiga saldrá volando hacia su base
                                h.objetivo_x = h.base_x
                                h.objetivo_y = h.base_y
                                print(f"guardiana de {rival.username} expulsó a hormiga de {jugador.username}.")
                                if notificar_callback:
                                    notificar_callback(j_id, f"💥 ¡Guardiana de {rival.username} expulsó a tu hormiga!")
                            elif guardiana_rival.estado_guardiana == "durmiendo" and rival.dulces > 0:
                                # Robo exitoso
                                rival.dulces -= 1
                                jugador.dulces += 1
                                jugador.puntos += config.PUNTOS_ROBO
                                h.lleva_dulce = True
                                print(f"{jugador.username} robó un dulce a {rival.username}.")
                                Database.incrementar_estadisticas_jugador(jugador.id_jugador, config.PUNTOS_ROBO, 1)
                                
                # Resetear la bandera cuando vuelve a patrulla
                if h.estado == 'patrulla' and getattr(h, 'accion_procesada', False):
                    h.accion_procesada = False
                    h.lleva_dulce = False
