"""Small helpers shared across route modules."""
from flask import jsonify


def ok(data=None, status=200):
    return jsonify({"success": True, "data": data, "error": None}), status


def fail(message, status=400):
    return jsonify({"success": False, "data": None, "error": message}), status
