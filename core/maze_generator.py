import random

def get_spawns(size=15):
    """
    Retorna un diccionario con las coordenadas de celda (x, y) de los 8 puntos de spawn
    despejados en el perímetro del laberinto.
    """
    if size % 2 == 0:
        size += 1
    center = size // 2
    max_idx = size - 2

    return {
        "NW": [1, 1],
        "N":  [center, 1],
        "NE": [max_idx, 1],
        "E":  [max_idx, center],
        "SE": [max_idx, max_idx],
        "S":  [center, max_idx],
        "SW": [1, max_idx],
        "W":  [1, center]
    }

def generate_maze(size=15):
    """
    Genera un laberinto compacto NxN usando Recursive Backtracking.
    0 = Pasillo, 1 = Pared, 2 = Altar Central.
    """
    if size % 2 == 0:
        size += 1

    center = size // 2
    maze = [[1 for _ in range(size)] for _ in range(size)]

    def carve_passages_from(cx, cy):
        directions = [(0, -2), (0, 2), (-2, 0), (2, 0)]
        random.shuffle(directions)

        for dx, dy in directions:
            nx, ny = cx + dx, cy + dy
            if 1 <= nx < size - 1 and 1 <= ny < size - 1 and maze[ny][nx] == 1:
                maze[cy + dy // 2][cx + dx // 2] = 0
                maze[ny][nx] = 0
                carve_passages_from(nx, ny)

    maze[1][1] = 0
    carve_passages_from(1, 1)

    # Despejar y conectar los 8 puntos de spawn en el perímetro
    spawns = get_spawns(size)
    for code, (sx, sy) in spawns.items():
        maze[sy][sx] = 0
        for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
            nx, ny = sx + dx, sy + dy
            if 1 <= nx < size - 1 and 1 <= ny < size - 1:
                if maze[ny][nx] == 0:
                    break
        else:
            step_x = 1 if sx < center else (-1 if sx > center else 0)
            step_y = 1 if sy < center else (-1 if sy > center else 0)
            if 1 <= sy + step_y < size - 1 and 1 <= sx + step_x < size - 1:
                maze[sy + step_y][sx + step_x] = 0

    # Ubicar el Altar Central en el centro exacto
    maze[center][center] = 2
    for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
        if 0 <= center + dy < size and 0 <= center + dx < size:
            maze[center + dy][center + dx] = 0

    return maze
