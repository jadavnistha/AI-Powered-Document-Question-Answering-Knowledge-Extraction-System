"""
Word-based chunker.

Each page's text is split independently -- chunks never cross a page
boundary -- so every chunk keeps a single, unambiguous page number in
its metadata. That page number is what the RAG pipeline cites back to
the user, so it must never be approximate.

Target size: ~250 words per chunk with a 50-word overlap between
consecutive chunks *within the same page*, which gives the retriever
enough surrounding context to avoid truncating a sentence right at a
chunk edge.
"""

CHUNK_SIZE_WORDS = 250
CHUNK_OVERLAP_WORDS = 50


def chunk_pages(pages, document_id):
    """Turn [{page, text}, ...] into a flat list of chunk dicts:
    {id, document_id, page, chunk_index, text}
    """
    chunks = []
    global_index = 0

    for page in pages:
        words = page["text"].split()
        if not words:
            continue

        start = 0
        while start < len(words):
            end = min(start + CHUNK_SIZE_WORDS, len(words))
            chunk_text = " ".join(words[start:end])

            chunks.append(
                {
                    "id": f"doc{document_id}-p{page['page']}-c{global_index}",
                    "document_id": document_id,
                    "page": page["page"],
                    "chunk_index": global_index,
                    "text": chunk_text,
                }
            )
            global_index += 1

            if end == len(words):
                break
            start = end - CHUNK_OVERLAP_WORDS

    return chunks
