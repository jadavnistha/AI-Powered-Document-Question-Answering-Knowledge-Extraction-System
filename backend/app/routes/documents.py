"""Document upload, listing, retrieval and deletion."""
import os
import threading
import uuid

from flask import Blueprint, current_app, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import Document
from app.services import vector_store
from app.services.ingestion import ingest_document
from app.utils import fail, ok

documents_bp = Blueprint("documents", __name__, url_prefix="/api/documents")


def _user_upload_dir(user_id):
    path = os.path.join(current_app.config["UPLOAD_FOLDER"], str(user_id))
    os.makedirs(path, exist_ok=True)
    return path


@documents_bp.post("/upload")
@jwt_required()
def upload():
    user_id = int(get_jwt_identity())

    if "file" not in request.files:
        return fail("no file provided", 400)

    file = request.files["file"]
    if not file.filename:
        return fail("no file selected", 400)
    if not file.filename.lower().endswith(".pdf"):
        return fail("only PDF files are supported", 400)

    stored_filename = f"{uuid.uuid4().hex}.pdf"
    dest_path = os.path.join(_user_upload_dir(user_id), stored_filename)
    file.save(dest_path)

    file_size = os.path.getsize(dest_path)
    max_bytes = current_app.config["MAX_CONTENT_LENGTH"]
    if file_size > max_bytes:
        os.remove(dest_path)
        return fail(f"file exceeds the {current_app.config['MAX_UPLOAD_MB']}MB limit", 400)

    document = Document(
        user_id=user_id,
        original_filename=secure_filename(file.filename),
        stored_filename=stored_filename,
        file_size=file_size,
        status="processing",
    )
    db.session.add(document)
    db.session.commit()

    app = current_app._get_current_object()
    thread = threading.Thread(
        target=ingest_document, args=(app, document.id, dest_path), daemon=True
    )
    thread.start()

    return ok({"document": document.to_dict()}, 201)


@documents_bp.get("")
@jwt_required()
def list_documents():
    user_id = int(get_jwt_identity())
    documents = (
        Document.query.filter_by(user_id=user_id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return ok({"documents": [d.to_dict() for d in documents]})


@documents_bp.get("/<int:document_id>")
@jwt_required()
def get_document(document_id):
    user_id = int(get_jwt_identity())
    document = Document.query.filter_by(id=document_id, user_id=user_id).first()
    if not document:
        return fail("document not found", 404)
    return ok({"document": document.to_dict()})


@documents_bp.delete("/<int:document_id>")
@jwt_required()
def delete_document(document_id):
    user_id = int(get_jwt_identity())
    document = Document.query.filter_by(id=document_id, user_id=user_id).first()
    if not document:
        return fail("document not found", 404)

    vector_store.delete_collection(document.id)

    file_path = os.path.join(
        current_app.config["UPLOAD_FOLDER"], str(user_id), document.stored_filename
    )
    if os.path.exists(file_path):
        os.remove(file_path)

    db.session.delete(document)
    db.session.commit()
    return ok({"deleted": True})
