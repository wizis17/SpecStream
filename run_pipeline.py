import sys
import os

# Add the specstream directory to the path so we can import the module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'specstream'))

from pipeline import process_pdf

def main():
    if len(sys.argv) < 2:
        print("Usage: python run_pipeline.py <pdf_path>")
        print("Example: python run_pipeline.py sample.pdf")
        sys.exit(1)
    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        print(f"Error: File not found: {pdf_path}")
        sys.exit(1)
    try:
        json_tree, ordered_items = process_pdf(pdf_path)
        print("=== JSON Hierarchy Tree ===")
        import json
        print(json.dumps(json_tree, indent=2))
        print("\n=== Reading Order (text) ===")
        for item in ordered_items:
            print(f"- {item['text']}")
    except Exception as e:
        print(f"Error processing PDF: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()