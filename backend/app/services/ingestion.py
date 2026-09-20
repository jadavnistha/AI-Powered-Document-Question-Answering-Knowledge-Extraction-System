"""
Background ingestion pipeline: extract -> chunk -> embed & store.

Runs in a plain `threading.Thread` (no Celery/Redis -- out of scope for
this project) so the upload request can return immediately with status
'processing'. The frontend polls GET /api/documents/<id> every 2s until
the status flips to 'ready' or 'failed'.

Because this runs outside the request context, it must push its own
Flask application context to touch the database.
"""
from app.extensions import db
from app.models import Document
from app.services import pdf_service, vector_store
from app.services.chunker import chunk_pages


def ingest_document(app, document_id, pdf_path):
    with app.app_context():
        document = Document.query.get(document_id)
        if not document:
            return

        try:
            pages = pdf_service.extract_pages(pdf_path)

            if pdf_service.is_scanned_or_empty(pages):
                document.status = "failed"
                document.error_message = (
                    "This PDF appears to be scanned or image-based. "
                    "Text extraction is not supported."
                )
                db.session.commit()
                return

            chunks = chunk_pages(pages, document_id)
            vector_store.add_chunks(document_id, chunks)

            document.page_count = len(pages)
            document.chunk_count = len(chunks)
            document.collection_name = vector_store.collection_name_for(document_id)
            document.status = "ready"
            db.session.commit()
        except Exception as exc:  # noqa: BLE001 - background thread, must not crash silently
            db.session.rollback()
            document = Document.query.get(document_id)
            document.status = "failed"
            document.error_message = f"Ingestion failed: {exc}"
            db.session.commit()
