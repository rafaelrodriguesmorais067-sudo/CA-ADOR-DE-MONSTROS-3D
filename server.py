
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

HOST = "127.0.0.1"
PORT = 8000

servidor = ThreadingHTTPServer(
    (HOST, PORT),
    SimpleHTTPRequestHandler
)

print("CAÇADOR DE MONSTROS 3D")
print(f"Jogo disponível em: http://{HOST}:{PORT}")
print("Para encerrar, pressione CTRL + C no terminal.")

try:
    servidor.serve_forever()
except KeyboardInterrupt:
    print("\nServidor encerrado.")
finally:
    servidor.server_close()
