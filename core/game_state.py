import threading
import time
import math
import random
from core.maze_generator import generate_maze, get_spawns

ANT_COLORS = [
    "#5C4033", "#8B4513", "#A0522D", "#D2691E",
    "#CD853F", "#654321", "#4A2E16", "#3E2723"
]

SPAWN_KEYS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
CELL_SIZE = 60.0
PLAYER_RADIUS = 20.0
ACCEL = 550.0
FRICTION = 0.88
MAX_SPEED = 220.0
RESTITUTION = 1.4
MAX_ROUND_SECONDS = 40.0

class GameState:
    def __init__(self, size=15):
        self.size = size
        self.cell_size = CELL_SIZE
        self.radius = PLAYER_RADIUS
        self.lock = threading.Lock()
        self.maze = generate_maze(self.size)
        self.center_cell = self.size // 2
        self.candy_pos = (self.center_cell, self.center_cell)
        self.goal_x = (self.center_cell + 0.5) * CELL_SIZE
        self.goal_y = (self.center_cell + 0.5) * CELL_SIZE
        self.ants = {}
        self.ranking = {}
        self.round_active = True
        self.winner = None
        self.color_idx = 0
        self.spawn_idx = 0
        self.round_start_time = time.time()
        self.pending_bumps = []
        self.add_bots()

    def add_bots(self):
        for i in range(1, 4):
            bot_id = f"bot_{i}"
            alias = f"BOT_{i}"
            if bot_id not in self.ants:
                self.register_player(bot_id, alias, "AUTO")
                with self.lock:
                    self.ants[bot_id]["is_bot"] = True
                    self.ants[bot_id]["last_ai"] = time.time()

    def get_spawn_world_pos(self, spawn_pref):
        spawns = get_spawns(self.size)
        if spawn_pref in spawns:
            col, row = spawns[spawn_pref]
        else:
            key = SPAWN_KEYS[self.spawn_idx % len(SPAWN_KEYS)]
            self.spawn_idx += 1
            col, row = spawns[key]

        x = (col + 0.5) * CELL_SIZE
        y = (row + 0.5) * CELL_SIZE
        return x, y

    def register_player(self, player_id, alias, spawn_pref="AUTO"):
        with self.lock:
            # Formatear alias a 3 letras mayúsculas si es humano
            alias = alias.strip().upper()[:3] if alias else "AAA"

            x, y = self.get_spawn_world_pos(spawn_pref)
            color = ANT_COLORS[self.color_idx % len(ANT_COLORS)]
            self.color_idx += 1

            score = self.ranking.get(alias, 0)
            if alias not in self.ranking:
                self.ranking[alias] = 0

            self.ants[player_id] = {
                "alias": alias,
                "x": x,
                "y": y,
                "vx": 0.0,
                "vy": 0.0,
                "angle": 0.0,
                "input_dx": 0.0,
                "input_dy": 0.0,
                "stun_until": 0.0,
                "color": color,
                "score": score,
                "is_bot": False
            }

            return {
                "player_id": player_id,
                "alias": alias,
                "color": color,
                "maze_grid": self.maze,
                "cell_size": CELL_SIZE,
                "candy_pos": [self.center_cell, self.center_cell],
                "start_pos": [x, y]
            }

    def process_input(self, player_id, dx, dy):
        with self.lock:
            if player_id not in self.ants:
                return
            mag = math.hypot(dx, dy)
            if mag > 1.0:
                dx /= mag
                dy /= mag
            self.ants[player_id]["input_dx"] = dx
            self.ants[player_id]["input_dy"] = dy

    def update_physics(self, dt=0.05):
        now = time.time()
        with self.lock:
            if not self.round_active:
                return

            # 1. Actualización de Bots AI
            for pid, ant in self.ants.items():
                if not ant.get("is_bot"): continue
                if now - ant.get("last_ai", 0) > 0.1:
                    ant["last_ai"] = now
                    ax, ay = ant["x"], ant["y"]

                    target_x, target_y = self.goal_x, self.goal_y
                    for opid, other in self.ants.items():
                        if opid != pid and not other.get("is_bot"):
                            if math.hypot(other["x"] - ax, other["y"] - ay) < 140.0:
                                target_x, target_y = other["x"], other["y"]
                                break

                    dir_x = target_x - ax
                    dir_y = target_y - ay
                    mag = math.hypot(dir_x, dir_y)
                    if mag > 0:
                        ant["input_dx"] = (dir_x / mag) + random.uniform(-0.15, 0.15)
                        ant["input_dy"] = (dir_y / mag) + random.uniform(-0.15, 0.15)

            # 2. Movimiento, aceleración y fricción
            for pid, ant in self.ants.items():
                is_stunned = (now < ant.get("stun_until", 0))
                idx = 0.0 if is_stunned else ant.get("input_dx", 0.0)
                idy = 0.0 if is_stunned else ant.get("input_dy", 0.0)

                if idx != 0.0 or idy != 0.0:
                    ant["vx"] += idx * ACCEL * dt
                    ant["vy"] += idy * ACCEL * dt
                    ant["angle"] = math.atan2(idy, idx)

                ant["vx"] *= FRICTION
                ant["vy"] *= FRICTION

                spd = math.hypot(ant["vx"], ant["vy"])
                if spd > MAX_SPEED:
                    ant["vx"] = (ant["vx"] / spd) * MAX_SPEED
                    ant["vy"] = (ant["vy"] / spd) * MAX_SPEED

                ant["x"] += ant["vx"] * dt
                ant["y"] += ant["vy"] * dt

            # 3. Colisión Jugador vs Jugador (Bumper Effect & Puntuación +50 / -20)
            pids = list(self.ants.keys())
            n = len(pids)
            min_dist = 2 * PLAYER_RADIUS

            for i in range(n):
                for j in range(i + 1, n):
                    pidA, pidB = pids[i], pids[j]
                    antA, antB = self.ants[pidA], self.ants[pidB]

                    dx = antB["x"] - antA["x"]
                    dy = antB["y"] - antA["y"]
                    dist = math.hypot(dx, dy)

                    if dist < min_dist:
                        if dist == 0:
                            nx, ny = 1.0, 0.0
                            dist = 0.001
                        else:
                            nx = dx / dist
                            ny = dy / dist

                        overlap = min_dist - dist
                        antA["x"] -= nx * (overlap / 2.0)
                        antA["y"] -= ny * (overlap / 2.0)
                        antB["x"] += nx * (overlap / 2.0)
                        antB["y"] += ny * (overlap / 2.0)

                        rvx = antB["vx"] - antA["vx"]
                        rvy = antB["vy"] - antA["vy"]
                        vel_along_normal = rvx * nx + rvy * ny

                        if vel_along_normal < 0:
                            impulse_scalar = -(1.0 + RESTITUTION) * vel_along_normal / 2.0
                            impulse_x = impulse_scalar * nx
                            impulse_y = impulse_scalar * ny

                            antA["vx"] -= impulse_x
                            antA["vy"] -= impulse_y
                            antB["vx"] += impulse_x
                            antB["vy"] += impulse_y

                            antA["stun_until"] = now + 0.3
                            antB["stun_until"] = now + 0.3

                            # Determinar Embestidor vs Víctima según proyección de velocidad
                            vA_proj = antA["vx"] * nx + antA["vy"] * ny
                            vB_proj = antB["vx"] * nx + antB["vy"] * ny

                            if vA_proj > vB_proj:
                                rammer, victim = antA, antB
                            else:
                                rammer, victim = antB, antA

                            rammer["score"] += 50
                            victim["score"] = max(0, victim["score"] - 20)
                            self.ranking[rammer["alias"]] = rammer["score"]
                            self.ranking[victim["alias"]] = victim["score"]

                            bx = round((antA["x"] + antB["x"]) / 2, 1)
                            by = round((antA["y"] + antB["y"]) / 2, 1)

                            self.pending_bumps.append({
                                "x": bx,
                                "y": by,
                                "rammer": rammer["alias"],
                                "victim": victim["alias"]
                            })

            # 4. Colisión Jugador vs Muros (AABB)
            for pid, ant in self.ants.items():
                col_min = max(0, int((ant["x"] - PLAYER_RADIUS) / CELL_SIZE))
                col_max = min(self.size - 1, int((ant["x"] + PLAYER_RADIUS) / CELL_SIZE))
                row_min = max(0, int((ant["y"] - PLAYER_RADIUS) / CELL_SIZE))
                row_max = min(self.size - 1, int((ant["y"] + PLAYER_RADIUS) / CELL_SIZE))

                for gy in range(row_min, row_max + 1):
                    for gx in range(col_min, col_max + 1):
                        if self.maze[gy][gx] == 1:
                            w_xmin = gx * CELL_SIZE
                            w_xmax = (gx + 1) * CELL_SIZE
                            w_ymin = gy * CELL_SIZE
                            w_ymax = (gy + 1) * CELL_SIZE

                            cx = max(w_xmin, min(ant["x"], w_xmax))
                            cy = max(w_ymin, min(ant["y"], w_ymax))

                            w_dx = ant["x"] - cx
                            w_dy = ant["y"] - cy
                            w_dist = math.hypot(w_dx, w_dy)

                            if w_dist < PLAYER_RADIUS:
                                if w_dist == 0:
                                    wnx, wny = 1.0, 0.0
                                    w_dist = 0.001
                                else:
                                    wnx = w_dx / w_dist
                                    wny = w_dy / w_dist

                                w_overlap = PLAYER_RADIUS - w_dist
                                ant["x"] += wnx * w_overlap
                                ant["y"] += wny * w_overlap

                                vn = ant["vx"] * wnx + ant["vy"] * wny
                                if vn < 0:
                                    ant["vx"] -= 1.4 * vn * wnx
                                    ant["vy"] -= 1.4 * vn * wny

            # 5. Condición de Victoria (Altar Central) + Bonus de Tiempo
            r_goal = CELL_SIZE * 0.45
            for pid, ant in self.ants.items():
                d_goal = math.hypot(ant["x"] - self.goal_x, ant["y"] - self.goal_y)
                if d_goal < PLAYER_RADIUS + r_goal:
                    self.trigger_win(pid)
                    break

    def trigger_win(self, player_id):
        self.round_active = False
        ant = self.ants[player_id]

        elapsed = time.time() - self.round_start_time
        time_left = max(0, int(MAX_ROUND_SECONDS - elapsed))
        time_bonus = time_left * 10

        ant["score"] += 1000 + time_bonus
        self.ranking[ant["alias"]] = ant["score"]

        self.winner = {
            "player_id": player_id,
            "alias": ant["alias"],
            "bonus_points": time_bonus,
            "time_left": time_left,
            "final_score": ant["score"]
        }

    def clear_players_and_ranking(self):
        with self.lock:
            self.ants.clear()
            self.ranking.clear()
            self.winner = None
            self.round_active = True
            self.round_start_time = time.time()
            self.maze = generate_maze(self.size)
            self.pending_bumps = []
            print("[!] Todos los jugadores y ranking han sido limpiados y restablecidos.")
        self.add_bots()

    def reset_round(self):
        with self.lock:
            self.maze = generate_maze(self.size)
            self.round_active = True
            self.round_start_time = time.time()
            self.winner = None
            self.pending_bumps = []

            for pid, ant in self.ants.items():
                x, y = self.get_spawn_world_pos("AUTO")
                ant["x"] = x
                ant["y"] = y
                ant["vx"] = 0.0
                ant["vy"] = 0.0
                ant["angle"] = 0.0
                ant["input_dx"] = 0.0
                ant["input_dy"] = 0.0
                ant["stun_until"] = 0.0

    def get_state_snapshot(self):
        with self.lock:
            now = time.time()
            ants_snapshot = {}
            for pid, ant in self.ants.items():
                ants_snapshot[pid] = {
                    "alias": ant["alias"],
                    "x": round(ant["x"], 1),
                    "y": round(ant["y"], 1),
                    "angle": round(ant["angle"], 3),
                    "color": ant["color"],
                    "score": ant["score"],
                    "is_stunned": now < ant.get("stun_until", 0)
                }

            bumps = self.pending_bumps[:]
            self.pending_bumps = []

            return {
                "ants": ants_snapshot,
                "candy_pos": [self.center_cell, self.center_cell],
                "cell_size": CELL_SIZE,
                "maze_grid": [row[:] for row in self.maze],
                "round_active": self.round_active,
                "winner": self.winner,
                "bumps": bumps,
                "ranking": sorted([{"alias": k, "score": v} for k, v in self.ranking.items()], key=lambda x: x["score"], reverse=True)
            }
