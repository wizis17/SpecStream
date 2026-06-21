def process_pdf(pdf_path):
    """
    Run the full pipeline on a PDF and return the JSON hierarchy tree.
    Steps:
        1. Extract text items with bboxes
        2. Determine reading order using XY-cut
        3. Classify each item
        4. Build hierarchy
        5. Export JSON tree
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

    # Step 2: XY-cut to get reading order
    ordered_items = xycut(text_items)

    # Step 3: classification
    classified_items = classify_items(ordered_items)

    # Step 4: build hierarchy
    hierarchy_root = build_hierarchy(classified_items)

    # Step 5: export JSON
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