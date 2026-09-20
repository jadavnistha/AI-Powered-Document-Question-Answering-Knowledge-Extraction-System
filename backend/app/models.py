"""SQLAlchemy models for QueryDoc AI."""
from datetime import datetime, timezone

from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    documents = db.relationship(
        "Document", backref="user", lazy=True, cascade="all, delete-orphan"
    )

    def set_password(self, raw_password):
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password):
        return check_password_hash(self.password_hash, raw_password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at.isoformat(),
        }


class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    page_count = db.Column(db.Integer, default=0)
    chunk_count = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default="processing", nullable=False)
    error_message = db.Column(db.Text, nullable=True)
    collection_name = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    chat_sessions = db.relationship(
        "ChatSession", backref="document", lazy=True, cascade="all, delete-orphan"
    )
    artifacts = db.relationship(
        "Artifact", backref="document", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "original_filename": self.original_filename,
            "file_size": self.file_size,
            "page_count": self.page_count,
            "chunk_count": self.chunk_count,
            "status": self.status,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat(),
        }


class ChatSession(db.Model):
    __tablename__ = "chat_sessions"

    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey("documents.id"), nullable=False)
    title = db.Column(db.String(255), default="New chat")
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    messages = db.relationship(
        "Message", backref="session", lazy=True, cascade="all, delete-orphan"
    )


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("chat_sessions.id"), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'user' | 'assistant'
    content = db.Column(db.Text, nullable=False)
    sources = db.Column(db.Text, nullable=True)  # JSON string of [{page, snippet}]
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    def to_dict(self):
        import json

        return {
            "id": self.id,
            "role": self.role,
            "content": self.content,
            "sources": json.loads(self.sources) if self.sources else [],
            "created_at": self.created_at.isoformat(),
        }


class Artifact(db.Model):
    __tablename__ = "artifacts"

    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey("documents.id"), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'summary' | 'keywords' | 'notes'
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("document_id", "type", name="uq_artifact_doc_type"),
    )
