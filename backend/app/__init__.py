"""Application factory for QueryDoc AI."""
import os

from flask import Flask
from werkzeug.exceptions import HTTPException

from app.config import Config, validate
from app.extensions import cors, db, jwt
from app.utils import fail


def create_app():
    validate()  # fail fast if required secrets are missing from .env

    app = Flask(__name__)
    app.config.from_object(Config)

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    from app.routes.auth import auth_bp
    from app.routes.chat import chat_bp
    from app.routes.documents import documents_bp
    from app.routes.tools import tools_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(documents_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(tools_bp)

    register_error_handlers(app)

    with app.app_context():
        db.create_all()

    return app


def register_error_handlers(app):
    """Ensure every error path returns consistent JSON, never an HTML stack trace."""

    @app.errorhandler(HTTPException)
    def handle_http_exception(err):
        return fail(err.description or err.name, err.code)

    @app.errorhandler(Exception)
    def handle_uncaught_exception(err):
        app.logger.exception("Unhandled exception")
        return fail("Internal server error", 500)

    @app.errorhandler(404)
    def handle_404(err):
        return fail("Resource not found", 404)
