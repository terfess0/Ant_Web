# 🐜 Proyecto: Ant Kingdom (Hormigueros Multihilo en Tiempo Real)

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python)
![WebSockets](https://img.shields.io/badge/WebSockets-Asyncio-orange?style=for-the-badge&logo=websocket)
![Canvas2D](https://img.shields.io/badge/HTML5-Canvas%202D-red?style=for-the-badge&logo=html5)
![MySQL](https://img.shields.io/badge/MySQL-Connector-blue?style=for-the-badge&logo=mysql)

**Ant Kingdom** es un sistema distribuido en tiempo real que simula el comportamiento concurrente de colonias de hormigas compitiendo por recursos (dulces). Diseñado con una arquitectura multihilo nativa en Python, comunicación mediante WebSockets asíncronos y un cliente web interactivo desarrollado en Vanilla JavaScript y HTML5 Canvas.

---

## 🌟 Características Principales

- 🐜 **Simulación Multihilo Concurrente:** Cada hormiga en el mapa es alimentada por un hilo nativo e independiente (`threading.Thread`) en el servidor.
- ⏱️ **Partidas Rápidas en Tiempo Real:** Temporizador configurado a 1 minuto por partida con respawn dinámico de dulces y detección de guardianas.
- 💥 **Físicas y Animaciones de Patada:** Cuando una hormiga guardiana despierta detecta a un invasor, la hormiga sale disparada a ultra velocidad de regreso a su hormiguero con efectos visuales dinámicos.
- 🔊 **Sintetizador de Audio Integrado (Web Audio API):** Generación de efectos de sonido retro en tiempo real (patadas, recolección y aparición de dulces) sin depender de archivos de audio externos.
- 📊 **Telemetry Deck & Modo Espectador (`/admin`):** Panel completo de diagnósticos en tiempo real que monitorea el uso de CPU, Memoria RAM y cargas del procesador mediante un ecualizador visual de hilos, junto con un visor de partidas para espectar salas activas.
- 🏆 **Ranking Global Histórico:** Registro persistente en MySQL con podio visual que refleja los mejores comandantes, puntos totales y caramelos recolectados.

---

## 🛠️ Tecnologías Utilizadas

### Backend (Servidor Python)
- **Python 3.10+** (Núcleo del sistema)
- **`threading.Thread`**: Manejo de concurrencia y simulación independiente por hormiga.
- **`asyncio` + `websockets`**: Motor de difusión de eventos en tiempo real.
- **`mysql-connector-python`**: Pool de conexiones a base de datos relacional.
- **`psutil`**: Extracción de métricas de telemetría de hardware (CPU, RAM, hilos).

### Frontend (Cliente Web)
- **HTML5 & Vanilla CSS**: Interfaz moderna, responsive y sin librerías pesadas.
- **Canvas 2D API**: Renderizado fluido a 60 FPS con animación de caminata, texto flotante y sprites personalizados.
- **Web Audio API**: Síntesis de ondas sonoras (`sawtooth`, `sine`, `triangle`) mediante osciladores.

---

## 📁 Estructura del Proyecto

```text
exis/
├── config.py                 # Parámetros del sistema (Tiempos, Puntos, DB)
├── main.py                   # Punto de entrada principal e inicialización de hilos
├── controllers/
│   ├── game_controller.py     # Lógica de juego, colisiones, robos y recolección
│   ├── http_controller.py     # Servidor estático HTTP (puerto 8080)
│   ├── telemetry_controller.py# Monitoreo de recursos del servidor
│   └── websocket_controller.py# Servidor WS (puerto 8765) y difusión de salas
├── models/
│   ├── database.py           # Gestor de conexiones MySQL y consultas
│   ├── hormiga.py            # Clase que representa el hilo individual de cada hormiga
│   ├── jugador.py            # Modelo del jugador y su puntuación
│   └── sala.py               # Gestión del estado de las salas y partidas
├── util/
│   ├── exis_ant.sql          # Estructura e inserciones iniciales de la base de datos
│   └── ESPECIFICACION_SISTEMA.md
└── web/
    ├── admin.html            # Panel de Administración (/admin)
    ├── index.html            # Cliente de juego principal (Jugadores)
    ├── css/
    │   └── style.css         # Estilos globales y diseño visual
    ├── assets/               # Sprites de hormigas, dulces y QR
    └── js/
        ├── admin.js          # Controlador JS para /admin (Espectador + Telemetría)
        ├── main.js           # Controlador JS para el cliente de juego
        └── views/
            ├── canvas_view.js# Motor de renderizado en Canvas y Web Audio API
            └── telemetry_view.js # Renderizado de métricas y ecualizador de hilos
```

---

## 🚀 Instalación y Ejecución

### 1. Requisitos Previos
- Python 3.10 o superior
- Servidor MySQL (XAMPP, WAMP o nativo)

### 2. Base de Datos
Importa el archivo SQL ubicado en `util/exis_ant.sql` en tu servidor MySQL:
```sql
CREATE DATABASE exis_ant;
-- Importar util/exis_ant.sql
```

### 3. Instalación de Dependencias
Instala los paquetes necesarios de Python:
```bash
pip install mysql-connector-python psutil websockets
```

### 4. Iniciar el Servidor
Ejecuta el script principal:
```bash
python main.py
```

- **Cliente de Jugador:** Abre en tu navegador `http://localhost:8080`
- **Panel de Administración:** Abre en tu navegador `http://localhost:8080/admin`

---

## 📜 Licencia

Este proyecto ha sido desarrollado para la asignatura de Sistemas Operativos / Programación Concurrente y Distribuida en **Unitrópico**.
