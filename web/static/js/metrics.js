// Inicializar Graficos de Chart.js
const cpuCtx = document.getElementById('cpuChart').getContext('2d');
const memCtx = document.getElementById('memChart').getContext('2d');

const chartOptions = {
    responsive: true,
    animation: false,
    scales: {
        y: { beginAtZero: true, suggestedMax: 100 }
    },
    plugins: {
        legend: { display: false }
    }
};

const cpuChart = new Chart(cpuCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'CPU Usage %',
            data: [],
            borderColor: '#4e6b52',
            tension: 0.1,
            fill: true,
            backgroundColor: 'rgba(78, 107, 82, 0.2)'
        }]
    },
    options: chartOptions
});

const memChart = new Chart(memCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'RAM Usage MB',
            data: [],
            borderColor: '#8B4513',
            tension: 0.1,
            fill: true,
            backgroundColor: 'rgba(139, 69, 19, 0.2)'
        }]
    },
    options: Object.assign({}, chartOptions, {
        scales: { y: { beginAtZero: true } } // Autoscale for memory
    })
});

const MAX_POINTS = 30;

function updateCharts(metrics) {
    const timeLabel = new Date().toLocaleTimeString();

    // CPU
    cpuChart.data.labels.push(timeLabel);
    cpuChart.data.datasets[0].data.push(metrics.cpu_percent);
    if (cpuChart.data.labels.length > MAX_POINTS) {
        cpuChart.data.labels.shift();
        cpuChart.data.datasets[0].data.shift();
    }
    cpuChart.update();

    // RAM
    memChart.data.labels.push(timeLabel);
    memChart.data.datasets[0].data.push(metrics.memory_mb);
    if (memChart.data.labels.length > MAX_POINTS) {
        memChart.data.labels.shift();
        memChart.data.datasets[0].data.shift();
    }
    memChart.update();

    // Threads
    document.getElementById('thread-count').innerText = metrics.active_threads;
    const threadList = document.getElementById('thread-list');
    threadList.innerHTML = '';
    metrics.thread_list.forEach(t => {
        const li = document.createElement('li');
        li.innerText = t;
        threadList.appendChild(li);
    });
}

// Socket.IO Connection
const socket = io();

socket.on('telemetry_update', (data) => {
    updateCharts(data);
});
