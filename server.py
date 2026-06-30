import http.server
import json
import mimetypes
import os
import sys
from urllib.parse import urlparse, parse_qs

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from specstream.pipeline import process_pdf

PORT = 8000
DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend', 'dist')
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend')
FRONTEND_INDEX = os.path.join(FRONTEND_DIR, 'index.html')
FRONTEND_APP = os.path.join(FRONTEND_DIR, 'app.html')

class SpecStreamRequestHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Override to clean up stdout logs, but feel free to print if needed
        sys.stderr.write("%s - - [%s] %s\n" %
                         (self.address_string(),
                          self.log_date_time_string(),
                          format%args))

    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path

        # Always serve test.pdf from root
        if path == '/test.pdf':
            self.serve_file('test.pdf', 'application/pdf')
            return

        # Try to serve from frontend/dist/ (production build)
        if os.path.isdir(DIST_DIR):
            rel = path.lstrip('/')
            candidate = os.path.join(DIST_DIR, rel)
            if os.path.isfile(candidate):
                mime, _ = mimetypes.guess_type(candidate)
                self.serve_file(candidate, mime or 'application/octet-stream')
                return
            # Route /app or /app.html to app.html
            if path in ('/app', '/app.html'):
                dist_app = os.path.join(DIST_DIR, 'app.html')
                if os.path.isfile(dist_app):
                    self.serve_file(dist_app, 'text/html')
                    return
            # Landing page fallback
            dist_index = os.path.join(DIST_DIR, 'index.html')
            if os.path.isfile(dist_index):
                self.serve_file(dist_index, 'text/html')
                return

        # Dev fallback: serve frontend source directly
        if path in ('/', '/index.html') and os.path.isfile(FRONTEND_INDEX):
            self.serve_file(FRONTEND_INDEX, 'text/html')
            return
        if path in ('/app', '/app.html') and os.path.isfile(FRONTEND_APP):
            self.serve_file(FRONTEND_APP, 'text/html')
            return

        self.send_error(404, "File not found")

    def do_POST(self):
        if urlparse(self.path).path == '/process':
            params = parse_qs(urlparse(self.path).query)
            mode = params.get('mode', ['xycut'])[0]
            if mode not in ('xycut', 'naive'):
                mode = 'xycut'

            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_error_response(400, "Empty request body")
                return

            try:
                pdf_bytes = self.rfile.read(content_length)
                json_tree, ordered_items = process_pdf(pdf_bytes, mode=mode)
                
                # Calculate metadata
                unique_pages = set(item.get('page', 0) for item in ordered_items)
                pages_processed = len(unique_pages) if unique_pages else 0
                
                response_data = {
                    "hierarchy": json_tree,
                    "metadata": {
                        "pages_processed": pages_processed,
                        "total_items": len(ordered_items)
                    }
                }
                
                # Send success response
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
            except Exception as e:
                self.send_error_response(500, f"Error processing PDF: {str(e)}")
        else:
            self.send_error(404, "Not found")

    def serve_file(self, filepath, content_type):
        if not os.path.exists(filepath):
            self.send_error(404, f"File {filepath} not found")
            return
        
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(os.path.getsize(filepath)))
        self.end_headers()
        
        with open(filepath, 'rb') as f:
            self.wfile.write(f.read())

    def send_error_response(self, code, message):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode('utf-8'))

def run_server():
    server_address = ('', PORT)
    httpd = http.server.HTTPServer(server_address, SpecStreamRequestHandler)
    print(f"SpecStream server running at http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
