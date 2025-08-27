from flask import Blueprint, request, jsonify
from models import Teacher
from database import SessionLocal

bp = Blueprint("teachers", __name__)

@bp.route("/", methods=["GET"])
def get_teachers():
    session = SessionLocal()
    try:
        teachers = session.query(Teacher).all()
        return jsonify([{"id": t.id, "name": t.name, "email": t.email} for t in teachers])
    finally:
        session.close()

@bp.route("/", methods=["POST"])
def create_teacher():
    data = request.json
    if not data.get("name") or not data.get("email"):
        return jsonify({"error": "Name and email are required"}), 400

    session = SessionLocal()
    try:
        teacher = Teacher(name=data["name"], email=data["email"])
        session.add(teacher)
        session.commit()
        session.refresh(teacher)  # Para asegurarnos de obtener el ID
        return jsonify({"id": teacher.id, "message": "Teacher created"}), 201
    finally:
        session.close()

# ==================== FUNCIONES CRUD ADICIONALES ====================

@bp.route("/<int:teacher_id>", methods=["GET"])
def get_teacher(teacher_id):
    session = SessionLocal()
    try:
        teacher = session.query(Teacher).get(teacher_id)
        if not teacher:
            return jsonify({"error": "Teacher not found"}), 404
        return jsonify({"id": teacher.id, "name": teacher.name, "email": teacher.email})
    finally:
        session.close()

@bp.route("/<int:teacher_id>", methods=["PUT"])
def update_teacher(teacher_id):
    data = request.json
    session = SessionLocal()
    try:
        teacher = session.query(Teacher).get(teacher_id)
        if not teacher:
            return jsonify({"error": "Teacher not found"}), 404
        if "name" in data:
            teacher.name = data["name"]
        if "email" in data:
            teacher.email = data["email"]
        session.commit()
        return jsonify({"id": teacher.id, "message": "Teacher updated"})
    finally:
        session.close()

@bp.route("/<int:teacher_id>", methods=["DELETE"])
def delete_teacher(teacher_id):
    session = SessionLocal()
    try:
        teacher = session.query(Teacher).get(teacher_id)
        if not teacher:
            return jsonify({"error": "Teacher not found"}), 404
        session.delete(teacher)
        session.commit()
        return jsonify({"id": teacher_id, "message": "Teacher deleted"})
    finally:
        session.close()
