import sys
import os
from statistics import median

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'specstream'))

from extraction import extract_text_items
from xycut import xycut

def calculate_suggested_gaps(items):
    """
    Suggest appropriate h_gap and v_gap values based on document statistics.
    Uses median line height as the basis for gap thresholds.
    Args:
        items: list of text item dicts with 'bbox' (x0, y0, x1, y1)
    Returns:
        tuple (suggested_h_gap, suggested_v_gap)
    """
    if not items:
        return 10, 10  # defaults

    # Calculate heights of all text spans
    heights = [item['bbox'][3] - item['bbox'][1] for item in items]
    if not heights:
        return 10, 10

    # Use median line height as baseline
    line_height = median(heights)

    # Suggest gaps as fractions of line height
    # These values may need tuning - starting with 0.5 * line_height
    suggested_gap = max(1, int(0.5 * line_height))  # at least 1 pixel

    return suggested_gap, suggested_gap

def main():
    if len(sys.argv) < 2:
        print("Usage: python get_reading_order.py <pdf_path>")
        sys.exit(1)
    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        print(f"Error: File not found: {pdf_path}")
        sys.exit(1)
    items = extract_text_items(pdf_path)
    if not items:
        print("No text items extracted from PDF")
        return

    # Calculate suggested gap thresholds based on document statistics
    suggested_h_gap, suggested_v_gap = calculate_suggested_gaps(items)

    # Group items by page number
    pages = {}
    for item in items:
        page_num = item['page']
        if page_num not in pages:
            pages[page_num] = []
        pages[page_num].append(item)

    # For each page, determine reading order using XY-cut
    ordered_items = []
    # Process pages in order
    for page_num in sorted(pages.keys()):
        page_items = pages[page_num]
        # Apply XY-cut to get reading order within this page
        page_ordered = xycut(page_items, h_gap=suggested_h_gap, v_gap=suggested_v_gap)
        ordered_items.extend(page_ordered)

    print("Recovered reading order:")
    for i, item in enumerate(ordered_items, 1):
        print(f"{i}. {item['text']}")

if __name__ == "__main__":
    main()