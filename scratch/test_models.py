import sys
import os
import time

# Agregar la raíz del proyecto al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.database import Database
from models.jugador import Jugador
from models.sala import Sala

def run_tests():
    print("Iniciando pruebas del modelo...")
    
    # Prueba de Base de Datos
    print("\n--- 1. Prueba de DB ---")
    try:
        pool = Database.get_pool()
        if pool:
            print("OK: Pool de conexión creado.")
            conn = pool.get_connection()
            if conn:
                print("OK: Conexión obtenida del pool.")
                conn.close()
            else:
                print("FAIL: No se pudo obtener conexión del pool.")
        else:
            print("FAIL: No se pudo crear el pool de conexión. Verifica que MySQL esté corriendo.")
    except Exception as e:
        print(f"ERROR: {e}")

    # Prueba de Lógica de Juego
    print("\n--- 2. Prueba de Sala, Jugadores y Hormigas ---")
    sala = Sala(id_sala=1)
    
    j1 = Jugador(id_jugador=101, username="test_player_1", base_x=100, base_y=100)
    j2 = Jugador(id_jugador=102, username="test_player_2", base_x=700, base_y=100)
    
    print("Agregando jugadores...")
    sala.agregar_jugador(j1)
    sala.agregar_jugador(j2)
    print(f"OK: Jugadores en sala: {len(sala.jugadores)}")
    
    print("Iniciando partida (creando hilos de hormigas y generando dulces)...")
    sala.iniciar_partida()
    
    print(f"Estado de la sala: {sala.estado}")
    print(f"Dulces en el centro: {len(sala.dulces_centro)}")
    print(f"Hilos de hormigas para jugador 1: {len(j1.hormigas)}")
    
    print("\nEstado inicial (Muestra de get_estado_global):")
    estado_global = sala.get_estado_global()
    print(f"Dulces: {estado_global['dulces']}")
    print(f"Hormigas (primeras 3): {estado_global['hormigas'][:3]}")
    
    # Asignar objetivo a una obrera
    print("\nAsignando objetivo (centro) a la hormiga obrera 1 del jugador 1...")
    obrera = j1.hormigas[1]
    obrera.objetivo_x = 400
    obrera.objetivo_y = 300
    obrera.estado = "moviendo"
    
    # Esperar y ver cómo se mueve
    for i in range(3):
        time.sleep(0.5)
        print(f"Tick {i+1} - Posición Hormiga 1: ({obrera.x:.2f}, {obrera.y:.2f}) - Estado: {obrera.estado} - Carga: {obrera.carga}%")
    
    print("\nDeteniendo hilos...")
    sala.detener_partida()
    print("OK: Partida detenida.")

if __name__ == "__main__":
    run_tests()
