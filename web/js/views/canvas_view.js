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
            hormiga: new Image(),
            guardiana_despierta: new Image(),
            guardiana_dormida: new Image(),
            dulce: new Image()
        };
        
        this.sprites.hormiguero.src = 'assets/hormiguero.png';
        this.sprites.hormiga.src = 'assets/hormiga.png';
        this.sprites.guardiana_despierta.src = 'assets/guardiana_despierta.png';
        this.sprites.guardiana_dormida.src = 'assets/guardiana_dormida.png';
        this.sprites.dulce.src = 'assets/dulce.png';
        
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
        this.estado.dulces = nuevoEstado.dulces;
        this.estado.hormigas = nuevoEstado.hormigas;
    }
    
    dibujarSprite(img, x, y, size, fallbackColor) {
        if (img.complete && img.naturalWidth !== 0) {
            this.ctx.drawImage(img, x - size/2, y - size/2, size, size);
        } else {
            this.ctx.fillStyle = fallbackColor;
            this.ctx.fillRect(x - size/2, y - size/2, size, size);
            this.ctx.strokeStyle = '#333';
            this.ctx.strokeRect(x - size/2, y - size/2, size, size);
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Centro (área de dulces)
        this.ctx.fillStyle = 'rgba(74, 222, 128, 0.05)';
        this.ctx.beginPath();
        this.ctx.arc(this.width/2, this.height/2, 100, 0, 2*Math.PI);
        this.ctx.fill();
        
        // Dibujar bases (deducidas de las guardianas)
        this.estado.hormigas.forEach(h => {
            if (h.estado_guardiana) {
                this.dibujarSprite(this.sprites.hormiguero, h.x, h.y, 70, '#8D6238');
            }
        });
        
        // Dibujar hormigas
        this.estado.hormigas.forEach(h => {
            if (h.estado_guardiana) {
                const img = h.estado_guardiana === 'despierta' ? this.sprites.guardiana_despierta : this.sprites.guardiana_dormida;
                const color = h.estado_guardiana === 'despierta' ? '#EF4444' : '#9CA3AF';
                this.dibujarSprite(img, h.x, h.y, 20, color);
            } else {
                const color = h.estado === 'moviendo' ? '#3b82f6' : (h.estado === 'retorno' ? '#f59e0b' : '#1f2937');
                this.dibujarSprite(this.sprites.hormiga, h.x, h.y, 12, color);
            }
        });
        
        // Dibujar dulces
        this.estado.dulces.forEach(d => {
            this.dibujarSprite(this.sprites.dulce, d.x, d.y, 15, '#10B981');
        });
        
        requestAnimationFrame(this.render.bind(this));
    }
}
