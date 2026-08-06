class TelemetryView {
    constructor() {
        this.elCpu = document.getElementById('metric-cpu');
        this.barCpu = document.getElementById('bar-cpu');
        
        this.elRam = document.getElementById('metric-ram');
        this.barRam = document.getElementById('bar-ram');
        this.badgeRam = document.getElementById('badge-ram');
        
        this.elWs = document.getElementById('metric-ws');
        
        this.elThreads = document.getElementById('metric-threads');
        this.elAntThreads = document.getElementById('metric-ant-threads');
        
        this.equalizerContainer = document.getElementById('thread-equalizer');
    }
    
    actualizar(data) {
        // CPU
        this.elCpu.innerText = data.cpu.toFixed(1);
        this.barCpu.style.width = `${data.cpu}%`;
        
        // RAM (Asumiendo 2GB máximo para el porcentaje visual)
        this.elRam.innerText = data.ram_mb;
        let ramPorcentaje = (data.ram_mb / 2048) * 100;
        if (ramPorcentaje > 100) ramPorcentaje = 100;
        this.barRam.style.width = `${ramPorcentaje}%`;
        this.badgeRam.innerText = `${ramPorcentaje.toFixed(1)}%`;
        
        // WS
        this.elWs.innerText = data.ws_clients || "1";
        
        // Hilos
        this.elThreads.innerText = data.hilos_activos;
        this.elAntThreads.innerText = `${data.hilos_hormiga_cargas.length} Hilos (Total)`;
        
        // Ecualizador dinámico
        this.renderEqualizer(data.hilos_hormiga_cargas);
    }
    
    renderEqualizer(cargas) {
        // Re-crear barras
        this.equalizerContainer.innerHTML = '';
        cargas.forEach(carga => {
            const bar = document.createElement('div');
            bar.className = 'eq-bar';
            bar.style.height = `${carga}%`;
            
            if (carga > 90) {
                bar.style.backgroundColor = '#ef4444'; // Rojo (Expulsada)
            } else if (carga > 50) {
                bar.style.backgroundColor = '#f59e0b'; // Naranja (Calculando)
            } else {
                bar.style.backgroundColor = 'var(--brown-primary)'; // Patrulla / Normal
            }
            
            this.equalizerContainer.appendChild(bar);
        });
    }
}
