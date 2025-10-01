#!/usr/bin/env python3
"""
Servidor simples para o frontend Hotwire
"""
import http.server
import socketserver
import os
import webbrowser
from threading import Timer

PORT = 3000

class BreathingAppHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Headers para evitar cache durante desenvolvimento
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        
        # CORS para development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def open_browser():
    webbrowser.open(f'http://localhost:{PORT}')

if __name__ == "__main__":
    # Mudar para diretório do script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print(f"🌬️ Breathing App Frontend")
    print(f"📱 Servidor rodando em http://localhost:{PORT}")
    print(f"🔧 Backend necessário em http://localhost:8000")
    print("Pressione Ctrl+C para parar")
    print("-" * 50)
    
    with socketserver.TCPServer(("", PORT), BreathingAppHandler) as httpd:
        # Abrir navegador após 1 segundo
        Timer(1, open_browser).start()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Servidor parado.")
            httpd.shutdown()
