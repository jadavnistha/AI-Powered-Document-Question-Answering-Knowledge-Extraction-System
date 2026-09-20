"""
PDF text extraction using PyMuPDF (fitz).

Extracts text page-by-page so every chunk built downstream can be
traced back to the exact page it came from -- this is what lets the
chat feature cite "(p. 14)" instead of hallucinating a page number.
"""
import fitz  # PyMuPDF

MIN_EXTRACTABLE_CHARS = 200


def extract_pages(pdf_path):
    """Return a list of {page: int, text: str} for every page in the PDF.

    Page numbers are 1-indexed to match how a human reader refers to them.
    """
    pages = []
    with fitz.open(pdf_path) as doc:
        for index, page in enumerate(doc):
            text = page.get_text("text").strip()
            pages.append({"page": index + 1, "text": text})
    return pages


def total_extracted_chars(pages):
    return sum(len(p["text"]) for p in pages)


def is_scanned_or_empty(pages):
    """Heuristic: PDFs with almost no extractable text are likely scanned
    images. OCR is out of scope for this project, so such files are
    rejected with a clear status instead of silently producing an empty
    knowledge base."""
    return total_extracted_chars(pages) < MIN_EXTRACTABLE_CHARS
