import threading
import time
import math
import config

class Hormiga(threading.Thread):
    def __init__(self, id_hormiga, id_jugador, start_x, start_y):
        super().__init__(name=f"Hormiga_{id_jugador}_{id_hormiga}")
        self.id_hormiga = id_hormiga
        self.id_jugador = id_jugador
        self.x = start_x
        self.y = start_y
        self.base_x = start_x
        self.base_y = start_y
        
        self.objetivo_x = None
        self.objetivo_y = None
        
        # Tipo y Estado
        self.es_guardiana = (id_hormiga == 0)
        self.estado = "patrulla" # patrulla, moviendo, retorno, expulsada
        
        # Control de hilo
        self.running = True
        self.carga = 20 # Porcentaje inicial simulado de carga para el ecualizador
        
        # Tiempo para la guardiana
        self._tiempo_cambio_estado = time.time()
        self.estado_guardiana = "despierta" if self.es_guardiana else None

    def calcular_trayectoria(self):
        """Mueve la hormiga hacia el objetivo y retorna True si ha llegado"""
        if self.objetivo_x is None or self.objetivo_y is None:
            return True
            
        dx = self.objetivo_x - self.x
        dy = self.objetivo_y - self.y
        distancia = math.hypot(dx, dy)
        
        if distancia <= config.VELOCIDAD_MOVIMIENTO:
            self.x = self.objetivo_x
            self.y = self.objetivo_y
            return True
            
        self.x += (dx / distancia) * config.VELOCIDAD_MOVIMIENTO
        self.y += (dy / distancia) * config.VELOCIDAD_MOVIMIENTO
        return False

    def procesar_guardiana(self):
        """Alterna el estado de sueño de la guardiana"""
        ahora = time.time()
        tiempo_transcurrido = ahora - self._tiempo_cambio_estado
        
        if self.estado_guardiana == "despierta" and tiempo_transcurrido >= config.TIEMPO_GUARDIANA_DESPIERTA:
            self.estado_guardiana = "durmiendo"
            self._tiempo_cambio_estado = ahora
        elif self.estado_guardiana == "durmiendo" and tiempo_transcurrido >= config.TIEMPO_GUARDIANA_DORMIDA:
            self.estado_guardiana = "despierta"
            self._tiempo_cambio_estado = ahora

    def run(self):
        while self.running:
            if self.es_guardiana:
                self.carga = 15 # Menor carga por solo verificar tiempo
                self.procesar_guardiana()
            else:
                if self.estado == "moviendo":
                    self.carga = 85 # Mayor carga calculando trayectorias
                    llegado = self.calcular_trayectoria()
                    if llegado:
                        # Al llegar al objetivo, cambia automáticamente a retorno
                        self.estado = "retorno"
                        self.objetivo_x = self.base_x
                        self.objetivo_y = self.base_y
                
                elif self.estado == "retorno":
                    self.carga = 85
                    llegado = self.calcular_trayectoria()
                    if llegado:
                        self.estado = "patrulla"
                        self.objetivo_x = None
                        self.objetivo_y = None
                
                elif self.estado == "patrulla":
                    self.carga = 20
                
                elif self.estado == "expulsada":
                    self.carga = 95
                    # Teletransporte inmediato a base y volver a patrulla (simulado con breve delay)
                    self.x = self.base_x
                    self.y = self.base_y
                    time.sleep(0.5)
                    self.estado = "patrulla"

            # Tick rate de 20 Hz
            time.sleep(config.TICK_RATE_HORMIGA)

    def stop(self):
        self.running = False
        
    def to_dict(self):
        d = {
            "id": self.id_hormiga,
            "id_jugador": self.id_jugador,
            "x": round(self.x, 2),
            "y": round(self.y, 2),
            "estado": self.estado
        }
        if self.es_guardiana:
            d["estado_guardiana"] = self.estado_guardiana
        return d
