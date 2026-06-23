import re

def classify_block(text, font_size, body_font_size=None):
    """
    Classify a text block into one of: heading, warning, footnote, table, spec.
    Returns a dict with keys: 'type', and optionally 'heading_depth' if type is heading.
    """
    text_stripped = text.strip()
    # Warning: keyword match
    warning_keywords = ['WARNING', 'CAUTION', 'NOTE:', '⚠']
    if any(keyword in text_stripped.upper() for keyword in warning_keywords):
        return {'type': 'warning'}

    # Footnote: small font size relative to body text
    # If body_font_size is provided and font_size is significantly smaller, consider footnote
    if body_font_size is not None and font_size < body_font_size * 0.8:  # arbitrary threshold
        return {'type': 'footnote'}

    # Heading: leading numbering pattern
    # Match patterns like: 1., 1.1, 1.1.1, etc. at the start of the string
    heading_match = re.match(r'^(\d+(?:\.\d+)*\.?)\s+', text_stripped)
    if heading_match:
        # Get the numbering string, strip any trailing dot
        num_str = heading_match.group(1).rstrip('.')
        # Depth is the number of dot-separated groups
        depth = num_str.count('.') + 1
        return {'type': 'heading', 'heading_depth': depth}

    # Table row: pipe-delimited or otherwise column-aligned text
    # We'll check if the text contains at least two pipes and some text between them
    if '|' in text:
        parts = [part.strip() for part in text.split('|')]
        if len(parts) >= 3 and all(parts):  # at least three columns and non-empty
            return {'type': 'table'}
        # Also consider if it's aligned by whitespace? We'll skip for now.

    # Fallback: spec/body line
    return {'type': 'spec'}

def compute_body_font_size(items):
    """
    Compute the most common font size among items that are not classified as heading, warning, footnote, table.
    We'll use the font size of the spec blocks as the body font size.
    """
    # We'll classify each item as spec if it's not anything else, but we don't want to classify twice.
    # Let's do a simple heuristic: the font size that appears most frequently.
    if not items:
        return None
    font_sizes = [item['font_size'] for item in items]
    # Find the most common font size
    from collections import Counter
    font_size_counts = Counter(font_sizes)
    most_common = font_size_counts.most_common(1)[0][0]
    return most_common

def classify_items(items):
    """
    Classify a list of text items (from extraction) and return a list of dicts with added classification.
    Each item will have: 'text', 'bbox', 'font_size', 'type', and optionally 'heading_depth'.
    """
    # First, compute body font size for footnote detection
    body_font_size = compute_body_font_size(items)
    classified = []
    for item in items:
        classification = classify_block(item['text'], item['font_size'], body_font_size)
        new_item = item.copy()
        new_item.update(classification)
        classified.append(new_item)
    return classified

if __name__ == "__main__":
    import sys
    sys.path.append('.')
    from extraction import extract_text_items
    if len(sys.argv) < 2:
        print("Usage: python classification.py <pdf_path>")
        sys.exit(1)
    items = extract_text_items(sys.argv[1])
    classified = classify_items(items)
    for item in classified:
        print(item)