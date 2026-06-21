import fitz  # PyMuPDF

def create_test_pdf(output_path="test.pdf"):
    # Create a new PDF
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)  # letter size

    # Left column
    left_lines = [
        "This is the left column.",
        "It has multiple lines.",
        "We want to test that the XY-cut algorithm",
        "reads the left column fully before moving to the right.",
        "Numbered list:",
        "1. First item",
        "2. Second item",
        "   a. Sub-item",
        "   b. Another sub-item",
        "3. Third item"
    ]
    y = 50
    for line in left_lines:
        page.insert_text((50, y), line, fontsize=12)
        y += 15  # line spacing

    # Right column
    right_lines = [
        "This is the right column.",
        "It also has multiple lines.",
        "And a warning:",
        "WARNING: This is a warning.",
        "Note: This is a note.",
        "Footnote-like text (smaller font size will be set via font, but we just make it smaller by rendering with smaller size)."
    ]
    y = 50
    for line in right_lines:
        page.insert_text((350, y), line, fontsize=12)
        y += 15

    # Add a footnote with smaller font at the bottom
    page.insert_text((50, 750), "This is a footnote with small font.", fontsize=8)

    # Save the PDF
    doc.save(output_path)
    doc.close()
    print(f"Test PDF created at {output_path}")

if __name__ == "__main__":
    create_test_pdf()