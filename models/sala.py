import random
import math
import config
from models.database import Database
from models.hormiga import Hormiga

class Sala:
    def __init__(self, id_sala):
        self.id_sala = id_sala
        self.estado = "esperando" # esperando, en_juego, finalizada
        self.jugadores = {} # dict id_jugador -> objeto Jugador
        self.dulces_centro = [] # lista de dicts {'id': int, 'x': float, 'y': float}
        self._contador_dulces = 0
        
    def agregar_jugador(self, jugador):
        if len(self.jugadores) >= config.MAX_JUGADORES_SALA:
            return False
        if jugador.id_jugador in self.jugadores:
            return False
        self.jugadores[jugador.id_jugador] = jugador
        return True
        
    def iniciar_partida(self):
        if self.estado != "esperando":
            return False
            
        self.estado = "en_juego"
        # Inicializar 3 dulces en el centro
        for _ in range(3):
            self._generar_dulce()
            
        # Inicializar y arrancar hilos de hormigas para cada jugador
        for j_id, jugador in self.jugadores.items():
            for i in range(5):
                h = Hormiga(id_hormiga=i, id_jugador=j_id, start_x=jugador.base_x, start_y=jugador.base_y)
                jugador.hormigas.append(h)
                h.start()
                
        return True
        
    def _generar_dulce(self):
        """Genera un dulce en una posición aleatoria dentro del radio central"""
        self._contador_dulces += 1
        angulo = random.uniform(0, 2 * math.pi)
        radio = random.uniform(0, config.RADIO_CENTRO)
        x = config.CENTRO_X + radio * math.cos(angulo)
        y = config.CENTRO_Y + radio * math.sin(angulo)
        self.dulces_centro.append({"id": self._contador_dulces, "x": x, "y": y})

    def reponer_dulces(self):
        """Asegura que siempre haya 3 dulces en el centro. Debe llamarse cuando un dulce es recolectado."""
        while len(self.dulces_centro) < 3:
            self._generar_dulce()
            
    def detener_partida(self):
        self.estado = "finalizada"
        for jugador in self.jugadores.values():
            for h in jugador.hormigas:
                h.stop()

    def get_estado_global(self):
        todas_hormigas = []
        ranking = []
        for j in self.jugadores.values():
            ranking.append({"username": j.username, "puntos": j.puntos, "dulces": j.dulces})
            for h in j.hormigas:
                todas_hormigas.append(h.to_dict())
                
        # Ordenar ranking por puntos desc
        ranking.sort(key=lambda x: x["puntos"], reverse=True)
                
        return {
            "evento": "estado_sala",
            "dulces": self.dulces_centro,
            "hormigas": todas_hormigas,
            "ranking": ranking
        }

