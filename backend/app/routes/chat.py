"""RAG chat endpoints: ask a question, fetch history."""
import json

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models import ChatSession, Document, Message
from app.services import vector_store
from app.services.llm_service import GroqModelError, answer_question
from app.utils import fail, ok

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")


def _get_owned_document(document_id, user_id):
    return Document.query.filter_by(id=document_id, user_id=user_id).first()


def _get_or_create_session(document_id):
    session = ChatSession.query.filter_by(document_id=document_id).first()
    if not session:
        session = ChatSession(document_id=document_id, title="Chat")
        db.session.add(session)
        db.session.commit()
    return session


@chat_bp.post("/<int:document_id>/ask")
@jwt_required()
def ask(document_id):
    user_id = int(get_jwt_identity())
    document = _get_owned_document(document_id, user_id)
    if not document:
        return fail("document not found", 404)
    if document.status != "ready":
        return fail("document is not ready yet", 400)

    body = request.get_json(silent=True) or {}
    question = (body.get("question") or "").strip()
    if not question:
        return fail("question is required", 400)

    session = _get_or_create_session(document_id)

    # last 4 messages give the model conversation context for follow-ups
    history = (
        Message.query.filter_by(session_id=session.id)
        .order_by(Message.created_at.desc())
        .limit(4)
        .all()
    )
    history_messages = [
        {"role": m.role, "content": m.content} for m in reversed(history)
    ]

    context_chunks = vector_store.query_document(document_id, question, n_results=5)

    try:
        result = answer_question(question, context_chunks, history_messages)
    except GroqModelError as exc:
        return fail(str(exc), 502)

    user_message = Message(session_id=session.id, role="user", content=question)
    assistant_message = Message(
        session_id=session.id,
        role="assistant",
        content=result["answer"],
        sources=json.dumps(result["sources"]),
    )
    db.session.add_all([user_message, assistant_message])
    db.session.commit()

    return ok(
        {
            "answer": result["answer"],
            "sources": result["sources"],
            "message_id": assistant_message.id,
        }
    )


@chat_bp.get("/<int:document_id>/history")
@jwt_required()
def history(document_id):
    user_id = int(get_jwt_identity())
    document = _get_owned_document(document_id, user_id)
    if not document:
        return fail("document not found", 404)

    session = ChatSession.query.filter_by(document_id=document_id).first()
    if not session:
        return ok({"messages": []})

    messages = (
        Message.query.filter_by(session_id=session.id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return ok({"messages": [m.to_dict() for m in messages]})
