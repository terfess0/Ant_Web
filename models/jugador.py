import config

class Jugador:
    def __init__(self, id_jugador, username, base_x, base_y):
        self.id_jugador = id_jugador
        self.username = username
        self.base_x = base_x
        self.base_y = base_y
        
        self.puntos = 0
        self.dulces = 0
        self.hormigas = [] # Se poblará con instancias de Hormiga (índice 0 = guardiana)

    def to_dict(self):
        """Devuelve un diccionario serializable con el estado del jugador"""
        return {
            "id_jugador": self.id_jugador,
            "username": self.username,
            "puntos": self.puntos,
            "dulces": self.dulces,
            "base": {"x": self.base_x, "y": self.base_y}
        }
