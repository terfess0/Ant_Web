# 📘 GUÍA DE EXPOSICIÓN TÉCNICA - PROYECTO: ANT KINGDOM

Esta guía está diseñada específicamente para que la leas, estudies y tengas todo el dominio técnico al momento de presentar el proyecto ante los jurados o docentes.

---

## 1. 🎯 RESUMEN GENERAL DEL PROYECTO
**Ant Kingdom** es una aplicación distribuida en tiempo real desarrollada para demostrar conceptos avanzados de **Sistemas Operativos, Programación Concurrente y Programación Distribuida**.

El juego simula salas donde compiten hasta 5 jugadores. Cada jugador controla una colonia compuesta por **1 hormiga guardiana** (que protege el hormiguero y duerme/despierta por ciclos) y **4 hormigas obreras** (que van al centro a recolectar dulces o roban dulces de hormigueros rivales).

---

## 2. 🏗️ ARQUITECTURA TÉCNICA (STACK & PATRÓN MVC)

El sistema utiliza el patrón **Model-View-Controller (MVC)** adaptado a un entorno concurrente e híbrido (HTTP + WebSockets):

### 🐍 Backend (Python)
- **`models/hormiga.py`**: **EL CORAZÓN DEL MULTIHILO.** Cada hormiga hereda de `threading.Thread`. Esto significa que cada hormiga en el mapa es un hilo nativo del sistema operativo ejecutándose de forma independiente.
- **`models/sala.py`**: Administra la partida, el temporizador (1 minuto), el estado de los dulces y el ranking interno.
- **`models/database.py`**: Maneja la persistencia en **MySQL** utilizando un **Pool de Conexiones (`mysql.connector.pooling`)**, optimizando la reutilización de conexiones y evitando cuellos de botella al escribir puntajes.
- **`controllers/game_controller.py`**: Procesa la física de juego, detección de colisiones, robos y la patada de las guardianas.
- **`controllers/websocket_controller.py`**: Utiliza `asyncio` y `websockets` (puerto 8765) para transmitir el estado del juego a 10 Hz (cada 100ms) a todos los clientes.
- **`controllers/telemetry_controller.py`**: Hilo independiente que consulta métricas del servidor mediante `psutil` (CPU, Memoria RAM y consumo de hilos).
- **`controllers/http_controller.py`**: Servidor web nativo (`http.server`) en el puerto 8080 que sirve los archivos estáticos HTML/CSS/JS y enruta la URL `/admin`.

### 🌐 Frontend (Web)
- **HTML5 & Vanilla CSS**: Sin frameworks pesados (React/Angular) para garantizar velocidad máxima de carga y diseño visual limpio.
- **Canvas 2D API (`canvas_view.js`)**: Dibuja a 60 FPS con `requestAnimationFrame`. Aplica interpolación fluida, rotación y desfasamiento de sprites (para ver cuando una hormiga carga un dulce o sale volando con la patada).
- **Web Audio API (`SoundFX`)**: Generador de efectos de sonido **sintetizados en vivo mediante osciladores matemáticos** sin usar ningún archivo `.mp3` o `.wav` externo.

---

## 3. 🧠 CONCURRENCIA, MULTIHILO E INTERBLOQUEO (DEADLOCKS)

### ¿Cómo funcionan los hilos de las hormigas?
1. Cada jugador en una sala tiene 5 hormigas (1 guardiana + 4 obreras). Si hay 4 jugadores, hay **20 hilos nativos de Python corriendo en paralelo**.
2. Cada hilo ejecuta un bucle continuo regulado a 20 Hz (`time.sleep(0.05)`).
3. **Manejo de Carga Simulada:** 
   - En patrulla/reposo la hormiga consume 20% de carga.
   - En movimiento/trayectoria consume 85% de carga calculando vectores.
   - En estado `expulsada` (patada) consume 95% de carga mientras vuela a base a 32 px/tick.

### ¿Cómo se evitan los Interbloqueos (Deadlocks)?
- **Aislamiento de Estado:** Las hormigas no bloquean recursos globales mediante cerrojos pesados (`Lock.acquire()`), ya que eso causaría congelamiento o *deadlock*.
- **Sincronización por Mensajería Asíncrona:** El hilo del WebSocket (`game_loop_task`) actúa como lector de estado pasivo. Lee la posición `(x, y)` de cada objeto `Hormiga` que es actualizada atómicamente por su propio hilo.

---

## 4. 🎵 SÍNTESIS DE AUDIO (WEB AUDIO API)
En lugar de cargar archivos de audio pesados que pueden fallar al desplegar en Linux, el proyecto genera los sonidos con el procesador de audio del navegador:
- **Patada:** Onda diente de sierra (`sawtooth`) con frecuencia descendente (200Hz ➔ 40Hz).
- **Aparición de dulce:** Onda senoidal (`sine`) con frecuencia ascendente rápida (523Hz ➔ 659Hz).
- **Recolección de dulce:** Onda triangular (`triangle`) estilo moneda arcade (440Hz ➔ 880Hz).

---

## 5. 📊 TELEMETRY DECK Y MODO ESPECTADOR (`/admin`)

- Al entrar a `http://localhost:8080/admin`:
  1. Muestra el **Telemetry Deck** en tiempo real consumiendo los datos de `psutil` (CPU%, RAM MB, Clientes WS).
  2. **Ecualizador de Hilos:** Dibuja barras verticales de colores que representan el porcentaje de cálculo de cada hilo de hormiga activo.
  3. **Espectador de Salas:** El administrador puede presionar "Espectar 👀" en cualquier sala (incluso si está llena o iniciada) para ver el juego en vivo sin crear un hormiguero propio ni alterar la lógica.
  4. **🔥 Limpiar Datos:** Ejecuta `TRUNCATE TABLE` con `SET FOREIGN_KEY_CHECKS = 0` en MySQL para reiniciar usuarios y puntuaciones a 0 de forma segura.

---

## 6. ❓ PREGUNTAS CLAVE PARA RESPONDER EN LA EXPOSICIÓN

| Pregunta del Profesor / Jurado | Respuesta Técnica Recomendada |
| :--- | :--- |
| **¿Por qué usaron WebSockets en vez de HTTP REST?** | "REST requiere peticiones HTTP constantes (polling) que crean sobrecarga. WebSockets mantiene un tubo bidireccional abierto en TCP donde el servidor empuja las posiciones a 10 Hz con latencia menor a 5ms." |
| **¿Cómo manejan la concurrencia en Python con el GIL?** | "Cada hormiga corre en su propio `threading.Thread`. Aunque el GIL conmuta entre hilos de I/O, el `time.sleep(0.05)` libera el GIL en cada iteración, permitiendo que decenas de hilos compartan el CPU de forma equitativa sin bloquearse." |
| **¿Dónde se guardan los datos?** | "Las posiciones y física del juego ocurren 100% en memoria RAM para velocidad. MySQL se utiliza mediante un Pool de Conexiones para persistir estadísticas al finalizar cada ronda de 1 minuto." |
| **¿Cómo generaron los sonidos sin archivos MP3?** | "Utilizamos la Web Audio API de HTML5. Mediante código JS creamos osciladores que generan ondas senoidales y de sierra en tiempo real, evitando dependencias externas." |
| **¿Qué hace la vista `/admin`?** | "Es un centro de mando. Permite medir la telemetría del servidor en tiempo real (CPU, RAM, hilos activos) y espectar cualquier sala en curso sin interferir como jugador." |

---

## 🚀 PASOS RÁPIDOS PARA INICIAR LA DEMOSTRACIÓN

1. Inicia MySQL (XAMPP o servicio).
2. En la terminal ejecuta: `python main.py`
3. Abre 2 pestañas en el navegador:
   - Tab 1 (Jugador): `http://localhost:8080` (Ingresa con un nombre y entra a una sala).
   - Tab 2 (Admin): `http://localhost:8080/admin` (Muestra la telemetría y especta la sala del Tab 1).
