"""Authentication endpoints: register, login, me."""
from flask import Blueprint, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from app.extensions import db
from app.models import User
from app.utils import fail, ok

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not name or not email or not password:
        return fail("name, email and password are required", 400)
    if len(password) < 6:
        return fail("password must be at least 6 characters", 400)

    if User.query.filter_by(email=email).first():
        return fail("an account with this email already exists", 409)

    user = User(name=name, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return ok({"token": token, "user": user.to_dict()}, 201)


@auth_bp.post("/login")
def login():
    body = request.get_json(silent=True) or {}
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return fail("invalid email or password", 401)

    token = create_access_token(identity=str(user.id))
    return ok({"token": token, "user": user.to_dict()})


@auth_bp.get("/me")
@jwt_required()
def me():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return fail("user not found", 404)
    return ok({"user": user.to_dict()})
