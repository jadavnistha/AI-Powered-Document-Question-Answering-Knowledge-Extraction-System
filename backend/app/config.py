"""
Central configuration loaded from environment variables (.env).

No secret is ever hardcoded here. Every value comes from os.getenv().
Required secrets that the app cannot function without are validated
eagerly in `validate()`, which is called once from the app factory so
a missing key fails fast with a clear message instead of surfacing as
a confusing error deep inside a request.
"""
import os

from dotenv import load_dotenv

load_dotenv()

# Vars the app cannot start without. Anything with a sensible default
# (DATABASE_URL, UPLOAD_FOLDER, MAX_UPLOAD_MB, GROQ_MODEL) is excluded.
REQUIRED_ENV_VARS = [
    "SECRET_KEY",
    "JWT_SECRET_KEY",
    "CHROMA_API_KEY",
    "CHROMA_TENANT",
    "CHROMA_DATABASE",
    "GROQ_API_KEY",
]


class Config:
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///documind.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
    MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "20"))
    MAX_CONTENT_LENGTH = MAX_UPLOAD_MB * 1024 * 1024

    CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
    CHROMA_TENANT = os.getenv("CHROMA_TENANT")
    CHROMA_DATABASE = os.getenv("CHROMA_DATABASE")

    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    JWT_ACCESS_TOKEN_EXPIRES = 60 * 60 * 24 * 7  # 7 days, fine for a demo project


def validate():
    """Fail fast with a readable message if required secrets are missing."""
    missing = [name for name in REQUIRED_ENV_VARS if not os.getenv(name)]
    if missing:
        raise RuntimeError(
            "Missing required environment variable(s): "
            + ", ".join(missing)
            + ". Copy backend/.env.example to backend/.env and fill in the values."
        )
