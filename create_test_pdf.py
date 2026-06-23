import fitz  # PyMuPDF

def create_test_pdf(output_path="test.pdf"):
    # Create a new PDF with 2 pages
    doc = fitz.open()

    # Page 1: Two-column layout like before
    page1 = doc.new_page(width=612, height=792)  # letter size

    # Left column on page 1
    left_lines = [
        "This is the left column on page 1.",
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
        page1.insert_text((50, y), line, fontsize=12)
        y += 15  # line spacing

    # Right column on page 1
    right_lines = [
        "This is the right column on page 1.",
        "It also has multiple lines.",
        "And a warning:",
        "WARNING: This is a warning.",
        "Note: This is a note.",
        "Footnote-like text (smaller font size will be set via font, but we just make it smaller by rendering with smaller size)."
    ]
    y = 50
    for line in right_lines:
        page1.insert_text((350, y), line, fontsize=12)
        y += 15

    # Add a footnote with smaller font at the bottom of page 1
    page1.insert_text((50, 750), "This is a footnote with small font on page 1.", fontsize=8)

    # Page 2: Simple single-column content
    page2 = doc.new_page(width=612, height=792)

    page2_content = [
        "This is page 2 of the test document.",
        "It has simple single-column content.",
        "We want to verify that multi-page processing works correctly.",
        "The XY-cut algorithm should process each page independently.",
        "Then the results should be concatenated in page order.",
        "So all content from page 1 should appear before any content from page 2.",
        "",
        "Section 1: Introduction",
        "This is the first section on page 2.",
        "",
        "Section 2: Details",
        "This is the second section on page 2.",
        "It contains more detailed information.",
        "",
        "Conclusion",
        "This concludes the test document."
    ]
    y = 50
    for line in page2_content:
        page2.insert_text((50, y), line, fontsize=12)
        y += 15

    # Save the PDF
    doc.save(output_path)
    doc.close()
    print(f"Test PDF created at {output_path}")

if __name__ == "__main__":
    create_test_pdf()