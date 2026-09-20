"""Summary / keywords / study-notes generation, cached via the Artifact table
so re-opening a document tab does not re-call the LLM every time."""
import json

from flask import Blueprint
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models import Artifact, Document
from app.services import vector_store
from app.services.llm_service import (
    GroqModelError,
    generate_keywords,
    generate_notes,
    generate_summary,
)
from app.utils import fail, ok

tools_bp = Blueprint("tools", __name__, url_prefix="/api/tools")

GENERATORS = {
    "summary": generate_summary,
    "keywords": generate_keywords,
    "notes": generate_notes,
}


def _get_owned_document(document_id, user_id):
    return Document.query.filter_by(id=document_id, user_id=user_id).first()


def _handle(document_id, artifact_type):
    user_id = int(get_jwt_identity())
    document = _get_owned_document(document_id, user_id)
    if not document:
        return fail("document not found", 404)
    if document.status != "ready":
        return fail("document is not ready yet", 400)

    cached = Artifact.query.filter_by(
        document_id=document_id, type=artifact_type
    ).first()
    if cached:
        content = cached.content
        if artifact_type == "keywords":
            content = json.loads(content)
        return ok({"type": artifact_type, "content": content, "cached": True})

    chunks = vector_store.get_all_chunks(document_id)
    try:
        result = GENERATORS[artifact_type](chunks)
    except GroqModelError as exc:
        return fail(str(exc), 502)

    stored_content = json.dumps(result) if artifact_type == "keywords" else result
    artifact = Artifact(document_id=document_id, type=artifact_type, content=stored_content)
    db.session.add(artifact)
    db.session.commit()

    return ok({"type": artifact_type, "content": result, "cached": False})


@tools_bp.post("/<int:document_id>/summary")
@jwt_required()
def summary(document_id):
    return _handle(document_id, "summary")


@tools_bp.post("/<int:document_id>/keywords")
@jwt_required()
def keywords(document_id):
    return _handle(document_id, "keywords")


@tools_bp.post("/<int:document_id>/notes")
@jwt_required()
def notes(document_id):
    return _handle(document_id, "notes")
