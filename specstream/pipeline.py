from statistics import median

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


def process_pdf(pdf_path):
    """
    Run the full pipeline on a PDF and return the JSON hierarchy tree.
    Steps:
        1. Extract text items with bboxes (from all pages)
        2. Group items by page number
        3. For each page, determine reading order using XY-cut with
           dynamically calculated gap thresholds
        4. Concatenate ordered items from all pages (in page order)
        5. Classify each item
        6. Build hierarchy
        7. Export JSON tree
    Returns:
        json_tree: list of top-level nodes (as per export_json_tree)
        ordered_items: the items in reading order (after XY-cut) for debugging
    """
    from .extraction import extract_text_items
    from .xycut import xycut
    from .classification import classify_items
    from .hierarchy import build_hierarchy, export_json_tree

    # Step 1: extraction
    text_items = extract_text_items(pdf_path)
    if not text_items:
        raise ValueError("No text items extracted from PDF")

    # Calculate suggested gap thresholds based on document statistics
    suggested_h_gap, suggested_v_gap = calculate_suggested_gaps(text_items)

    # Step 2: Group items by page number
    pages = {}
    for item in text_items:
        page_num = item['page']
        if page_num not in pages:
            pages[page_num] = []
        pages[page_num].append(item)

    # Step 3: For each page, determine reading order using XY-cut
    ordered_items = []
    # Process pages in order
    for page_num in sorted(pages.keys()):
        page_items = pages[page_num]
        # Apply XY-cut to get reading order within this page
        # Use dynamically calculated gap thresholds
        page_ordered = xycut(page_items, h_gap=suggested_h_gap, v_gap=suggested_v_gap)
        ordered_items.extend(page_ordered)

    # Step 4: (already done above - concatenated ordered items from all pages)

    # Step 5: classification
    classified_items = classify_items(ordered_items)

    # Step 6: build hierarchy
    hierarchy_root = build_hierarchy(classified_items)

    # Step 7: export JSON
    json_tree = export_json_tree(hierarchy_root)

    return json_tree, ordered_items

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python -m specstream.pipeline <pdf_path>")
        sys.exit(1)
    json_tree, ordered = process_pdf(sys.argv[1])
    print("JSON Hierarchy Tree:")
    import json
    print(json.dumps(json_tree, indent=2))
    print("\nReading Order (text only):")
    for item in ordered:
        print(f"  {item['text']}")