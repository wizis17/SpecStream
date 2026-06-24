import http.server
import json
import os
import sys

# Add the parent directory to the path so we can import the specstream module
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from specstream.pipeline import process_pdf

PORT = 8000

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
        # Serve frontend and files
        path = self.path
        if path == '/' or path == '/index.html' or path == '/specstream-demo.html':
            self.serve_file('index.html', 'text/html')
        elif path == '/test.pdf':
            self.serve_file('test.pdf', 'application/pdf')
        elif path == '/frontend/public/Mint.jpg' or path == '/Mint.jpg':
            self.serve_file('frontend/public/Mint.jpg', 'image/jpeg')
        else:
            self.send_error(404, "File not found")

    def do_POST(self):
        if self.path.startswith('/process'):
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_error_response(400, "Empty request body")
                return

            try:
                # Read the raw PDF bytes directly from the request
                pdf_bytes = self.rfile.read(content_length)
                
                # Execute pipeline on bytes directly
                json_tree, ordered_items = process_pdf(pdf_bytes)
                
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
