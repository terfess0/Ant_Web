import mysql.connector
from mysql.connector import pooling
import config

class Database:
    _pool = None

    @classmethod
    def get_pool(cls):
        if cls._pool is None:
            try:
                cls._pool = mysql.connector.pooling.MySQLConnectionPool(
                    pool_name="hormigueros_pool",
                    pool_size=5,
                    pool_reset_session=True,
                    host=config.DB_HOST,
                    port=config.DB_PORT,
                    user=config.DB_USER,
                    password=config.DB_PASSWORD,
                    database=config.DB_NAME
                )
                print("Conexión al pool de base de datos exitosa.")
            except mysql.connector.Error as err:
                print(f"Error conectando al pool MySQL: {err}")
                return None
        return cls._pool

    @classmethod
    def get_connection(cls):
        pool = cls.get_pool()
        if pool:
            return pool.get_connection()
        return None

    @classmethod
    def registrar_jugador(cls, username):
        conn = cls.get_connection()
        if not conn: return None
        try:
            cursor = conn.cursor(dictionary=True)
            # Insertar solo si no existe
            cursor.execute("INSERT IGNORE INTO jugadores (nombre_usuario) VALUES (%s)", (username,))
            conn.commit()
            
            # Obtener el ID del jugador
            cursor.execute("SELECT id_jugador FROM jugadores WHERE nombre_usuario = %s", (username,))
            result = cursor.fetchone()
            
            # Asegurar fila en estadisticas_jugador
            if result:
                cursor.execute("INSERT IGNORE INTO estadisticas_jugador (id_jugador) VALUES (%s)", (result['id_jugador'],))
                conn.commit()
                return result['id_jugador']
            return None
        except mysql.connector.Error as err:
            print(f"Error al registrar jugador: {err}")
        finally:
            cursor.close()
            conn.close()

    @classmethod
    def crear_sala(cls, nombre_sala):
        conn = cls.get_connection()
        if not conn: return None
        try:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO salas (nombre_sala, id_estado_sala) VALUES (%s, 1)", (nombre_sala,))
            conn.commit()
            return cursor.lastrowid
        except mysql.connector.Error as err:
            print(f"Error al crear sala: {err}")
        finally:
            cursor.close()
            conn.close()

    @classmethod
    def obtener_ranking_global(cls):
        conn = cls.get_connection()
        if not conn: return []
        try:
            cursor = conn.cursor(dictionary=True)
            query = """
                SELECT j.nombre_usuario as username, 
                       e.puntos_totales as puntos, 
                       e.dulces_totales as dulces
                FROM estadisticas_jugador e
                JOIN jugadores j ON e.id_jugador = j.id_jugador
                ORDER BY e.puntos_totales DESC, e.dulces_totales DESC
                LIMIT 50
            """
            cursor.execute(query)
            return cursor.fetchall()
        except mysql.connector.Error as err:
            print(f"Error al obtener ranking: {err}")
            return []
        finally:
            cursor.close()
            conn.close()
