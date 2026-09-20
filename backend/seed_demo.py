"""Create a demo user for examiners/reviewers to log in with immediately.

Run once after the database exists:
    python seed_demo.py

Safe to re-run — skips creation if the demo account already exists.
"""
from app import create_app
from app.extensions import db
from app.models import User

DEMO_EMAIL = "demo@documind.ai"
DEMO_PASSWORD = "demo1234"
DEMO_NAME = "Demo User"

app = create_app()

with app.app_context():
    existing = User.query.filter_by(email=DEMO_EMAIL).first()
    if existing:
        print(f"Demo user already exists: {DEMO_EMAIL}")
    else:
        user = User(name=DEMO_NAME, email=DEMO_EMAIL)
        user.set_password(DEMO_PASSWORD)
        db.session.add(user)
        db.session.commit()
        print("Demo user created:")
        print(f"  email:    {DEMO_EMAIL}")
        print(f"  password: {DEMO_PASSWORD}")
