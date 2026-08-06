class CanvasView {
    constructor(canvasId, onClickCallback) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.onClickCallback = onClickCallback;

        this.estado = {
            hormigas: [],
            dulces: []
        };

        // Cargar sprites
        this.sprites = {
            hormiguero: new Image(),
            hormiguero_current: new Image(),
            hormiga: new Image(),
            hormiga2: new Image(),
            guardiana_despierta: new Image(),
            guardiana_dormida: new Image(),
            dulce: new Image(),
            dulce1: new Image(),
            dulce2: new Image(),
            fondo: new Image()
        };

        this.sprites.hormiguero.src = 'assets/hormiguero.png';
        this.sprites.hormiguero_current.src = 'assets/hormiguero-current.png';
        this.sprites.hormiga.src = 'assets/hormiga.png';
        this.sprites.hormiga2.src = 'assets/hormiga-2.png';
        this.sprites.guardiana_despierta.src = 'assets/guardiana_despierta.png';
        this.sprites.guardiana_dormida.src = 'assets/guardiana_dormida.png';
        this.sprites.dulce.src = 'assets/dulce.png';
        this.sprites.dulce1.src = 'assets/dulce1.png';
        this.sprites.dulce2.src = 'assets/dulce2.png';
        this.sprites.fondo.src = 'assets/fondo.png';
        
        this.floatingTexts = [];
        this.prevSweets = {};

        // Event listener de clics
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Calcular escala real vs tamaño CSS
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            if (this.onClickCallback) {
                this.onClickCallback(x, y);
            }
        });

        requestAnimationFrame(this.render.bind(this));
    }

    actualizarEstado(nuevoEstado) {
        this.estado.dulces = nuevoEstado.dulces || [];
        this.estado.hormigas = nuevoEstado.hormigas || [];
        this.estado.jugadores = nuevoEstado.jugadores || {};
    }

    dibujarSprite(img, x, y, size, fallbackColor) {
        if (img.complete && img.naturalWidth !== 0) {
            this.ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
        } else {
            this.ctx.fillStyle = fallbackColor;
            this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
            this.ctx.strokeStyle = '#333';
            this.ctx.strokeRect(x - size / 2, y - size / 2, size, size);
        }
    }

    render() {
        // Dibujar fondo
        if (this.sprites.fondo.complete && this.sprites.fondo.naturalWidth !== 0) {
            this.ctx.drawImage(this.sprites.fondo, 0, 0, this.width, this.height);
        } else {
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#EED9C4'; // Fallback arena
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // Centro (área de dulces)
        this.ctx.fillStyle = 'rgba(74, 222, 128, 0.1)';
        this.ctx.beginPath();
        this.ctx.arc(this.width / 2, this.height / 2, 100, 0, 2 * Math.PI);
        this.ctx.fill();

        // Dibujar bases (deducidas de las guardianas)
        this.estado.hormigas.forEach(h => {
            if (h.estado_guardiana) {
                const bx = h.base_x !== undefined ? h.base_x : h.x;
                const by = h.base_y !== undefined ? h.base_y : h.y;
                
                const isCurrentPlayer = (window.currentIdJugador === h.id_jugador);
                const spriteBase = isCurrentPlayer ? this.sprites.hormiguero_current : this.sprites.hormiguero;
                
                this.dibujarSprite(spriteBase, bx, by, 180, '#8D6238');
                
                // Mostrar dulces y procesar floating texts
                if (this.estado.jugadores && this.estado.jugadores[h.id_jugador]) {
                    const player = this.estado.jugadores[h.id_jugador];
                    const prevCount = this.prevSweets[h.id_jugador] || 0;
                    
                    if (player.dulces > prevCount) {
                        this.floatingTexts.push({text: '+1', x: bx, y: by - 10, alpha: 1.0, color: '74, 222, 128'});
                    } else if (player.dulces < prevCount) {
                        this.floatingTexts.push({text: '-1', x: bx, y: by - 10, alpha: 1.0, color: '239, 68, 68'});
                    }
                    this.prevSweets[h.id_jugador] = player.dulces;
                    
                    // Texto del contador
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = 'bold 22px Arial';
                    this.ctx.textAlign = 'center';
                    // Sombra del texto
                    this.ctx.shadowColor = 'black';
                    this.ctx.shadowBlur = 4;
                    this.ctx.fillText(`🍬 ${player.dulces}`, bx, by + 45);
                    this.ctx.shadowBlur = 0; // Reset
                }
            }
        });

        // Dibujar hormigas
        this.estado.hormigas.forEach(h => {
            if (h.estado_guardiana) {
                const img = h.estado_guardiana === 'despierta' ? this.sprites.guardiana_despierta : this.sprites.guardiana_dormida;
                const color = h.estado_guardiana === 'despierta' ? '#EF4444' : '#9CA3AF';
                this.dibujarSprite(img, h.x, h.y, 85, color);
            } else {
                const color = h.estado === 'moviendo' ? '#3b82f6' : (h.estado === 'retorno' ? '#f59e0b' : '#1f2937');
                // Alternar sprites de hormiga para animación de caminata
                const offset = (h.id_hormiga || 0) * 100;
                const walkCycle = Math.floor((Date.now() + offset) / 150) % 2;
                const antImg = walkCycle === 0 ? this.sprites.hormiga : this.sprites.hormiga2;
                this.dibujarSprite(antImg, h.x, h.y, 35, color);
            }
        });

        // Dibujar dulces en el centro
        this.estado.dulces.forEach(d => {
            const size = 30;
            const spriteIndex = d.id % 3;
            const sprite = spriteIndex === 0 ? this.sprites.dulce : spriteIndex === 1 ? this.sprites.dulce1 : this.sprites.dulce2;
            this.dibujarSprite(sprite, d.x, d.y, size, '#FCA5A5');
        });
        
        // Dibujar y animar textos flotantes
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y -= 1.5; // sube
            ft.alpha -= 0.02; // se desvanece
            if (ft.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
            } else {
                this.ctx.fillStyle = `rgba(${ft.color}, ${ft.alpha})`;
                this.ctx.font = 'bold 30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.shadowColor = 'black';
                this.ctx.shadowBlur = 3;
                this.ctx.fillText(ft.text, ft.x, ft.y);
                this.ctx.shadowBlur = 0;
            }
        }

        requestAnimationFrame(this.render.bind(this));
    }
}
