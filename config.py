# config.py

# ==========================================
# CONFIGURACIÓN GENERAL DEL SISTEMA
# ==========================================

# Reglas de Puntuación
PUNTOS_RECOLECCION = 10
PUNTOS_ROBO = 5

# Tiempos (en segundos)
DURACION_PARTIDA = 60.0  # 1 minuto por partida
TICK_RATE_HORMIGA = 0.05
TIEMPO_GUARDIANA_DESPIERTA = 10
TIEMPO_GUARDIANA_DORMIDA = 5

# Capacidad y Límites
MAX_SALAS = 3
MAX_JUGADORES_SALA = 5
RADIO_DEFENSA_GUARDIANA = 30
VELOCIDAD_MOVIMIENTO = 2  # px por ciclo

# Área del Canvas (Dimensiones)
CANVAS_WIDTH = 800
CANVAS_HEIGHT = 600

# Área central de recursos (Generación de dulces)
RADIO_CENTRO = 100
CENTRO_X = CANVAS_WIDTH // 2
CENTRO_Y = CANVAS_HEIGHT // 2

# ==========================================
# CREDENCIALES DE BASE DE DATOS
# ==========================================
DB_HOST = "localhost"
DB_PORT = 3306
DB_USER = "ant"
DB_PASSWORD = ""
DB_NAME = "exis_ant"
