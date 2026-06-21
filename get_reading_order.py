import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'specstream'))

from extraction import extract_text_items
from xycut import xycut

def main():
    if len(sys.argv) < 2:
        print("Usage: python get_reading_order.py <pdf_path>")
        sys.exit(1)
    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        print(f"Error: File not found: {pdf_path}")
        sys.exit(1)
    items = extract_text_items(pdf_path)
    ordered = xycut(items)
    print("Recovered reading order:")
    for i, item in enumerate(ordered, 1):
        print(f"{i}. {item['text']}")

if __name__ == "__main__":
    main()