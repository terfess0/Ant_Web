# 🐜 DOCUMENTO DE ESPECIFICACIÓN Y ANÁLISIS DE SISTEMA: "HORMIGUEROS COMPETITIVOS" (V6 - ARQUITECTURA MVC)

---

## 1. STACK TECNOLÓGICO, ENTORNO SERVIDOR Y PATRÓN MVC

### 1.1. Entorno de Despliegue y Stack
*   **Sistema Operativo Servidor:** Linux Lite (basado en Ubuntu/Debian). Consumo base de RAM: ~300 MB - 400 MB en reposo.
*   **Backend (Python 3.x):** 
    *   `asyncio` + `websockets` (v12.0+) para el servidor de sockets asíncrono en puerto 8765.
    *   `http.server` / `threading` para servir estáticos en puerto 8080.
    *   `psutil` (v5.9+) para telemetría de hardware (CPU, RAM, Red).
    *   `mysql-connector-python` (v8.2+) con pool de conexiones.
*   **Base de Datos:** MySQL 8.0 / MariaDB 10.x con codificación `utf8mb4_unicode_ci`.
*   **Frontend Web:** HTML5 Canvas (animación e interpolación a 60 FPS), CSS3 nativo (CSS Grid / Flexbox matching UI mockups), JavaScript ES6+ asíncrono (WebSockets API nativa).

---

### 1.2. Mapeo de Arquitectura MVC (Model-View-Controller)

El backend y frontend se organizan bajo una separación estricta de responsabilidades:

┌──────────────────────────────────────────┐
              │          PETICIONES / EVENTOS            │
              └────────────────────┬─────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CONTROLLERS (Control)                            │
│  • websocket_controller.py  : Parsea JSONs WS y enruta a la lógica de sala  │
│  • game_controller.py       : Valida clics, movimientos, robos y colisiones │
│  • telemetry_controller.py  : Muestrea psutil y emite paquetes de métricas  │
│  • http_controller.py       : Sirve archivos estáticos (HTML/CSS/JS/PNG)    │
└──────────────────────┬──────────────────────────────┬───────────────────────┘
│                              │
Actualiza Estado / Lee Datos           Emiten Estado / JSON
│                              │
▼                              ▼
┌──────────────────────────────────────┐     ┌────────────────────────────────┐
│           MODELS (Modelo)            │     │         VIEWS (Vista)          │
│ • hormiga.py (Threading.Thread)      │     │ • web/index.html (Estructura)  │
│ • jugador.py (Objeto Jugador)        │ ──► │ • web/css/style.css (Estilos)  │
│ • sala.py (Gestor de Hilos y Dulces) │     │ • canvas_view.js (Sprite PNG)  │
│ • database.py (Consultas 3NF SQL)    │     │ • telemetry_view.js (Deck)     │
└──────────────────────────────────────┘     └────────────────────────────────┘

1.  **MODEL (Modelos de Datos y Estado):**
    *   `models/hormiga.py`: Modela el hilo individual de cada hormiga (`threading.Thread`), ejecutando un bucle con `time.sleep(0.05)`, cálculo de físicas/trayectorias y actualización de su estado (`patrulla`, `moviendo`, `retorno`, `expulsada`).
    *   `models/jugador.py`: Entidad de jugador (ID, username, posición de base, conteo de puntos y dulces).
    *   `models/sala.py`: Mantiene la colección de jugadores, la lista de hilos de hormigas, las coordenadas de los 3 dulces centrales y el estado de la partida.
    *   `models/database.py`: Abstrae las consultas SQL (CRUD, actualización de rankings, historiales en 3NF).
2.  **VIEW (Vistas y Presentación):**
    *   `web/index.html`: Estructura semántica de tres pantallas principales (Acceso, Lobby de Salas, Mapa de Juego multipanel).
    *   `web/css/style.css`: Estilo visual con paleta cromática profesional.
    *   `web/js/views/canvas_view.js`: Dibuja el mapa sobre HTML5 Canvas procesando exclusivamente sprites `.png` (reemplaza figuras geométricas vectoriales).
    *   `web/js/views/telemetry_view.js`: Renderiza las 4 tarjetas del Telemetry Deck y el ecualizador de barras verticales dinámicas por cada hilo.
3.  **CONTROLLER (Controladores de Lógica y Red):**
    *   `controllers/websocket_controller.py`: Recibe mensajes WS del cliente, valida la estructura JSON y delega la ejecución al `game_controller.py`.
    *   `controllers/game_controller.py`: Procesa las reglas de negocio (asignar la hormiga más cercana desocupada, validar robo en bases enemigas, gestionar expulsión por la guardiana).
    *   `controllers/telemetry_controller.py`: Hilo secundario que recolecta métricas de `psutil` y emite actualizaciones periódicas a los clientes del dashboard.

---

## 2. REGLAS DE NEGOCIO, MECÁNICAS Y VALIDACIONES ESTRICTAS

### 2.1. Salas y Capacidad
*   **Límite de Salas:** Máximo **3 salas activas simultáneas** (`id_sala`: 1, 2, 3) para garantizar bajo consumo en Linux Lite.
*   **Capacidad de Jugadores:** Máximo **5 jugadores por sala**.
*   **Asignación de Bases:** Cada jugador ocupa una posición fija en los bordes del mapa (disposición pentagonal/perimetral).
*   **Dotación:** Cada jugador dispone de 5 hormigas (1 Guardiana en base + 4 Obreras recolectoras/atacantes).

### 2.2. Sistema Dual de Puntaje y Rankings
El servidor procesa dos acumuladores independientes por usuario:
*   **Dulces (Cantidad Neta):** Incrementa en +1 al recolectar del centro o al robar exitosamente de un rival.
*   **Puntos de Experiencia (Pts):**
    *   `+10 PUNTOS`: Otorgados al recolectar 1 dulce del área central.
    *   `+5 PUNTOS`: Otorgados al robar 1 dulce del hormiguero de un oponente.
*   **Formato Único de Filas en Rankings:** Tanto en el Ranking Local (dentro de la sala) como en el Ranking Global (sumatoria de todas las partidas), la fila del usuario debe formatearse como:  
    `username | 000 pts | 000 dulces`

### 2.3. Movimiento Autónomo (Ida y Vuelta Obligatoria)
*   **Regla de Oro:** **Las hormigas NUNCA se quedan estáticas en la coordenada del clic.**
*   **Flujo:**
    1.  El jugador hace clic en el mapa (`x, y`).
    2.  El `game_controller.py` busca la hormiga desocupada (estado `patrulla`) más cercana a ese clic.
    3.  La hormiga cambia a estado `moviendo` y calcula vector de velocidad en línea recta a 2 píxeles por ciclo (20 Hz).
    4.  Al llegar a la coordenada destino (tomar dulce, intentar robo o tocar punto libre), la hormiga cambia **inmediatamente a estado `retorno`**.
    5.  La hormiga calcula la ruta inversa en línea recta hacia su hormiguero base.
    6.  Al tocar el radio de su base, deposita el dulce (si llevaba uno), incrementa contadores y vuelve a estado `patrulla`.

### 2.4. Control de Recursos (3 Dulces Continuos)
*   En el centro del mapa se mantiene una cuota exacta de **3 dulces activos**.
*   Cuando una hormiga llega a la posición de un dulce y lo toma, el dulce desaparece del mapa y el conteo baja a 2.
*   El hilo de la sala detecta la disminución e **inmediatamente genera un nuevo dulce** en una coordenada aleatoria dentro del radio central, manteniendo siempre la cantidad fija de 3 dulces.

### 2.5. Hormiga Guardiana y Ciclos de Sueño
*   La hormiga de índice 0 (#0) es la **Guardiana** y no sale de la base.
*   **Ciclo de Sueño Defensivo:**
    *   `DESPIERTA (10 segundos)` $\rightarrow$ Defiende su hormiguero.
    *   `DURMIENDO (5 segundos)` $\rightarrow$ Inactiva, defensas caídas.
*   **Mecánica de Expulsión:** Si la guardiana está `DESPIERTA` y una hormiga enemiga entra en su radio de defensa (30 píxeles):
    1.  La hormiga enemiga es detectada.
    2.  Si la hormiga enemiga llevaba un dulce robado de esa base, el dulce se restaura a la víctima.
    3.  La hormiga enemiga cambia a estado `expulsada` y es teletransportada de vuelta a su base.
    4.  El servidor emite un evento de notificación: `"¡Guardiana de [Base] te ha detectado y expulsado!"`.

### 2.6. Validaciones de Negocio y Errores
*   **Validación de Robo:** Una hormiga solo puede robar si la víctima tiene `dulces > 0` **Y** la guardiana de la víctima está `DURMIENDO`. Si tiene 0 dulces, la hormiga rebota de vuelta sin robar nada.
*   **Validación de Unicidad de Nombre:** No se permiten nombres vacíos, duplicados o superiores a 20 caracteres.
*   **Validación de Límites de Sala:** Se deniega el ingreso si la sala cuenta con 5 jugadores o si la partida está finalizada.
*   **Validación de Coordenadas:** Los clics fuera del área del Canvas ($800 \times 600$ px) son descartados por el controlador.

---

## 3. MÓDULO TELEMETRY DECK, DASHBOARD Y ECUALIZADOR DE HILOS

### 3.1. Métricas de Hardware (Servidor Linux Lite)
El hilo `telemetry_controller.py` muestrea el sistema cada 1 segundo mediante `psutil`:
*   **Consumo CPU (%):** Porcentaje global del procesador (`psutil.cpu_percent()`).
*   **Memoria RAM (MB y %):** Memoria utilizada por el proceso y Kernel frente al total (`psutil.virtual_memory()`).
*   **Tráfico de Red (MB):** Megabytes recibidos y enviados acumulados (`psutil.net_io_counters()`).

### 3.2. Desglose de Hilos Nativos POSIX
Monitoreo en vivo de los Threads en el Kernel de Linux mediante `threading.active_count()`:
*   `1 Hilo Principal` (Socket Server).
*   `1 Hilo HTTP` (Servidor de estáticos).
*   `1 Hilo Monitor` (Telemetry Deck).
*   `3 Hilos Generadores de Dulces` (1 por cada sala).
*   `N Hilos de Hormigas` (5 hilos por jugador conectado. Ej: 15 jugadores = 75 hilos de hormigas).

### 3.3. Ecualizador de Carga por Hilo (Barras Verticales Dinámicas)
Ubicado en el sub-panel de la tarjeta de **Hilos Nativos Activos** en el frontend:
*   **Visualización:** Una serie de barras verticales alineadas horizontalmente (una barra por cada hilo de hormiga activo).
*   **Respuesta Dinámica a la Concurrencia:**
    *   **Estado Patrulla / Reposo:** Carga reducida (barra al 15% - 25% de altura en color verde/marrón neutro).
    *   **Estado Moviendo / Retorno:** Carga activa en bucle (la barra se eleva al 70% - 95% cambiando a color naranja/activo mientras ejecuta cálculos de trayectoria).
    *   **Estado Expulsada:** Parpadeo rojo de alerta.
*   **Utilidad Pedagógica:** Permite demostrar al jurado cómo los clics de los usuarios incrementan físicamente la carga de trabajo de los hilos en tiempo real.

### 3.4. Terminal Dashboard (Consola Servidor)
La terminal del equipo Linux desplegará un panel limpio en modo ASCII actualizado cada 1 segundo.

---

## 4. MODELO DE BASE DE DATOS RELACIONAL (SCRIPT SQL EN 3NF)

Cumple con la Tercera Forma Normal (3NF). Nomenclatura en minúsculas `snake_case`, llaves primarias `id_x`, sin tipos `ENUM` (sustituidos por tablas catálogo).

```sql
create database if not exists hormigueros_db character set utf8mb4 collate utf8mb4_unicode_ci;
use hormigueros_db;

-- 1. Tablas Catálogo (Sustitutos de ENUM)
create table estado_guardiana (
    id_estado_guardiana int auto_increment primary key,
    descripcion varchar(30) not null unique
);

create table estado_sala (
    id_estado_sala int auto_increment primary key,
    descripcion varchar(30) not null unique
);

create table estado_hormiga (
    id_estado_hormiga int auto_increment primary key,
    descripcion varchar(30) not null unique
);

-- Poblamiento de Catálogos
insert into estado_guardiana (descripcion) values ('despierta'), ('durmiendo');
insert into estado_sala (descripcion) values ('esperando'), ('en_juego'), ('finalizada');
insert into estado_hormiga (descripcion) values ('patrulla'), ('moviendo'), ('retorno'), ('expulsada');

-- 2. Tabla Maestra de Jugadores
create table jugadores (
    id_jugador int auto_increment primary key,
    nombre_usuario varchar(50) not null unique,
    fecha_registro datetime default current_timestamp
);

-- 3. Estadísticas Acumuladas Globales (1:1 con jugadores)
create table estadisticas_jugador (
    id_jugador int primary key,
    puntos_totales int default 0,
    dulces_totales int default 0,
    partidas_jugadas int default 0,
    partidas_ganadas int default 0,
    fecha_ultima_partida datetime default current_timestamp on update current_timestamp,
    foreign key (id_jugador) references jugadores(id_jugador) on delete cascade
);

-- 4. Registro de Salas
create table salas (
    id_sala int auto_increment primary key,
    nombre_sala varchar(50) not null,
    id_estado_sala int not null default 1,
    fecha_creacion datetime default current_timestamp,
    foreign key (id_estado_sala) references estado_sala(id_estado_sala)
);

-- 5. Partidas
create table partidas (
    id_partida int auto_increment primary key,
    id_sala int not null,
    fecha_inicio datetime default current_timestamp,
    fecha_fin datetime null,
    foreign key (id_sala) references salas(id_sala)
);

-- 6. Participaciones en Partidas (Junction Table 3NF N:M)
create table participaciones_partida (
    id_participacion int auto_increment primary key,
    id_partida int not null,
    id_jugador int not null,
    puntos_partida int default 0,
    dulces_obtenidos int default 0,
    posicion_final int null,
    foreign key (id_partida) references partidas(id_partida) on delete cascade,
    foreign key (id_jugador) references jugadores(id_jugador) on delete cascade,
    constraint uq_partida_jugador unique (id_partida, id_jugador)
);

5. ESPECIFICACIÓN DEL PROTOCOLO WEBSOCKET (JSON SCHEMA)5.1. Mensajes Cliente $\rightarrow$ ServidorUnirse a Sala: {"accion": "unirse", "nombre_usuario": "Juan", "id_sala": 1}Clic en Mapa: {"accion": "clic_mapa", "pos_x": 350, "pos_y": 220}Clic en Hormiguero Rival: {"accion": "clic_hormiguero", "id_jugador_objetivo": 3}5.2. Mensajes Servidor $\rightarrow$ ClienteEstado Global de Sala: {"evento": "estado_sala", "dulces": [{"id": 1, "x": 400, "y": 300}], "hormigas": [{"id": 0, "id_jugador": 1, "x": 100, "y": 100, "estado": "moviendo"}], "ranking": [{"username": "Juan", "puntos": 40, "dulces": 4}]}Telemetría del Servidor: {"evento": "telemetria", "cpu": 18.4, "ram_mb": 348, "hilos_activos": 53, "hilos_hormiga_cargas": [20, 85, 90, 15]}Notificación: {"evento": "notificacion", "mensaje": "¡Guardiana de Alfa te ha detectado!"}6. CONSIDERACIONES DE RENDIMIENTO EN LINUX LITERegulación de Ciclos (Tick Rate):Cada hilo de hormiga duerme time.sleep(0.05) (20 ciclos/segundo), reduciendo el consumo de CPU al mínimo.Transmisión Regulada por WebSockets:El servidor difunde paquetes de estado del juego cada 100 ms (10 Hz). El cliente interpola el movimiento de los sprites .png a 60 FPS mediante requestAnimationFrame.Manejo de Memoria RAM:Las variables de posición y estado de juego residen en memoria RAM. MySQL solo ejecuta escrituras INSERT/UPDATE al inicio y cierre de cada partida.7. ESTRUCTURA COMPLETA DE ARCHIVOS DEL PROYECTO (MVC)Plaintexthormiguero_linux/
├── config.py                     # Constantes (puertos, puntos +10/+5, tiempos)
├── main.py                       # Punto de arranque general
├── models/                       # MODELO (Lógica de Datos y Estado)
│   ├── __init__.py
│   ├── database.py               # Pool MySQL y consultas SQL en 3NF
│   ├── hormiga.py                # Clase Hormiga (threading.Thread)
│   ├── jugador.py                # Clase Jugador (puntos, dulces, hormigas)
│   └── sala.py                   # Clase Sala (gestor de dulces y hilos)
├── controllers/                  # CONTROLADOR (Lógica de Red y Eventos)
│   ├── __init__.py
│   ├── game_controller.py        # Validaciones de robos, clics y colisiones
│   ├── websocket_controller.py   # Handler de sockets asíncronos y JSON
│   ├── telemetry_controller.py   # Muestreo psutil y contador de hilos
│   └── http_controller.py        # Servidor web HTTP para archivos estáticos
├── util/                         # Capturas de referencia de interfaz (Mockups UI)
│   ├── 1.png                     # Pantalla 1: Acceso / Login
│   ├── 2.png                     # Pantalla 2: Lobby de Salas
│   ├── 3.png                     # Pantalla 3: Vista de Juego Canvas
│   └── 4.png                     # Pantalla 4: Dashboard Telemetry Deck
└── web/                          # VISTA (Presentación Web)
    ├── index.html                # HTML5 semántico
    ├── css/
    │   └── style.css             # Estilos CSS Flexbox/Grid
    ├── js/
    │   ├── views/
    │   │   ├── canvas_view.js    # Renderizado de sprites PNG sobre Canvas
    │   │   └── telemetry_view.js # Renderizado de métricas y barras de hilos
    │   └── main.js               # Conexión WebSocket cliente y eventos UI
    └── assets/                   # Sprites PNG del juego
        ├── hormiguero.png
        ├── hormiga.png
        ├── guardiana_despierta.png
        ├── guardiana_dormida.png
        └── dulce.png

        ---

## 📋 INSTRUCCIONES DE RECURSOS Y PROMPTS MODULARES

### 1. Instrucción sobre Capturas de Interfaz (`util/`)
Para que Antigravity IDE tenga la referencia visual exacta del diseño gráfico al programar las vistas, debes colocar tus imágenes de maquetación/capturas dentro de una carpeta llamada **`util/`** ubicada directamente en la raíz del proyecto, nombradas secuencialmente:
*   `util/1.png` (Pantalla de Acceso / ID Comandante)
*   `util/2.png` (Lobby de Salas Activas)
*   `util/3.png` (Vista de Juego Canvas)
*   `util/4.png` (Dashboard Telemetry Deck)

### 2. Ruta y Nombres Estrictos para Sprites PNG (`web/assets/`)
Los elementos gráficos del juego no se dibujan por código; se renderizan a partir de imágenes estáticas que deben estar ubicadas en la ruta `web/assets/` con los nombres exactos:
*   `web/assets/hormiguero.png`: Imagen base del hormiguero.
*   `web/assets/hormiga.png`: Sprite para las hormigas obreras.
*   `web/assets/guardiana_despierta.png`: Indicador visual de guardiana activa.
*   `web/assets/guardiana_dormida.png`: Indicador visual de guardiana en reposo.
*   `web/assets/dulce.png`: Sprite del dulce 