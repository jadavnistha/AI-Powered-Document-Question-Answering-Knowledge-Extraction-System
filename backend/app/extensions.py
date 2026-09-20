"""
Shared Flask extension instances, created here (unbound) and initialized
against the app in the app factory. Keeping them in their own module
avoids circular imports between models.py and routes/*.py.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()
