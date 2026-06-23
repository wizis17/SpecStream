import fitz  # PyMuPDF

def extract_text_items(pdf_path_or_stream):
    """
    Extract text items with bounding boxes from all pages of a PDF.
    Returns a list of dictionaries, each containing:
        - 'text': the text string
        - 'bbox': tuple (x0, y0, x1, y1) of the bounding box (page-relative)
        - 'font_size': the font size of the text
        - 'page': the page number (0-indexed)
    """
    if isinstance(pdf_path_or_stream, bytes):
        doc = fitz.open(stream=pdf_path_or_stream, filetype="pdf")
    else:
        doc = fitz.open(pdf_path_or_stream)
    text_items = []

    # Process each page
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)

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
                            "page": page_num
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