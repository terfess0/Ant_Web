import psutil
import threading

class TelemetryTracker:
    @staticmethod
    def get_system_metrics():
        process = psutil.Process()
        return {
            "cpu_percent": psutil.cpu_percent(interval=None),
            "memory_mb": round(process.memory_info().rss / (1024 * 1024), 2),
            "active_threads": threading.active_count(),
            "thread_list": [t.name for t in threading.enumerate()]
        }
