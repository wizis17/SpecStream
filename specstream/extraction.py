import fitz  # PyMuPDF

def extract_text_items(pdf_path):
    """
    Extract text items with bounding boxes from a PDF page.
    Returns a list of dictionaries, each containing:
        - 'text': the text string
        - 'bbox': tuple (x0, y0, x1, y1) of the bounding box
        - 'font_size': the font size of the text
    Note: This function processes the first page only for simplicity.
    For multi-page, we would need to iterate over pages.
    """
    doc = fitz.open(pdf_path)
    # We'll process the first page for now
    page = doc.load_page(0)  # page 0
    text_items = []

    # Extract text as blocks (each block is a paragraph or line)
    blocks = page.get_text("dict")["blocks"]
    for block in blocks:
        if block["type"] == 0:  # text block
            for line in block["lines"]:
                for span in line["spans"]:
                    text = span["text"].strip()
                    if not text:
                        continue
                    bbox = span["bbox"]  # (x0, y0, x1, y1)
                    font_size = span["size"]
                    text_items.append({
                        "text": text,
                        "bbox": bbox,
                        "font_size": font_size,
                        # We can also store the original span if needed
                    })
    doc.close()
    return text_items

if __name__ == "__main__":
    # For testing
    import sys
    if len(sys.argv) < 2:
        print("Usage: python extraction.py <pdf_path>")
        sys.exit(1)
    items = extract_text_items(sys.argv[1])
    for item in items:
        print(item)