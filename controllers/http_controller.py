import http.server
import socketserver
import threading
import os

class HttpController(threading.Thread):
    def __init__(self, port=8080):
        super().__init__(name="HTTP_Thread")
        self.port = port
        self.httpd = None
        self.daemon = True # Terminar cuando el main termine

    def run(self):
        # Servir desde la carpeta 'web'
        web_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "web")
        
        if not os.path.exists(web_dir):
            os.makedirs(web_dir)
            
        os.chdir(web_dir)
        
        class QuietHandler(http.server.SimpleHTTPRequestHandler):
            def log_message(self, format, *args):
                # Silenciar logs para no saturar consola
                pass
                
        try:
            # Permitir reusar dirección
            socketserver.TCPServer.allow_reuse_address = True
            self.httpd = socketserver.TCPServer(("", self.port), QuietHandler)
            print(f"Servidor HTTP (Estáticos) iniciado en http://localhost:{self.port}")
            self.httpd.serve_forever()
        except OSError as e:
            print(f"Error iniciando HTTP en puerto {self.port}: {e}")

    def stop(self):
        if self.httpd:
            self.httpd.shutdown()
            self.httpd.server_close()
