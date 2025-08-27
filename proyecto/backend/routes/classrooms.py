from flask import Blueprint, request, jsonify
from models import Classroom
from database import SessionLocal

bp = Blueprint("classrooms", __name__)

# --------------------- GET ALL ---------------------
@bp.route("/", methods=["GET"])
def get_classrooms():
    session = SessionLocal()
    try:
        classrooms = session.query(Classroom).all()
        return jsonify([
            {
                "id": c.id,
                "name": c.name,
                "description": c.description,
                "teacher_id": c.teacher_id
            } for c in classrooms
        ])
    finally:
        session.close()

# --------------------- CREATE ---------------------
@bp.route("/", methods=["POST"])
def create_classroom():
    data = request.json
    if not data.get("name") or not data.get("teacher_id"):
        return jsonify({"error": "Name and teacher_id are required"}), 400

    session = SessionLocal()
    try:
        classroom = Classroom(
            name=data["name"],
            description=data.get("description"),
            teacher_id=data["teacher_id"]
        )
        session.add(classroom)
        session.commit()
        session.refresh(classroom)
        return jsonify({"id": classroom.id, "message": "Classroom created"}), 201
    finally:
        session.close()

# --------------------- UPDATE ---------------------
@bp.route("/<int:id>/", methods=["PUT"])
def update_classroom(id):
    data = request.json
    session = SessionLocal()
    try:
        classroom = session.query(Classroom).get(id)
        if not classroom:
            return jsonify({"error": "Classroom not found"}), 404

        classroom.name = data.get("name", classroom.name)
        classroom.description = data.get("description", classroom.description)
        classroom.teacher_id = data.get("teacher_id", classroom.teacher_id)

        session.commit()
        session.refresh(classroom)
        return jsonify({"message": "Classroom updated"})
    finally:
        session.close()

# --------------------- DELETE ---------------------
@bp.route("/<int:id>/", methods=["DELETE"])
def delete_classroom(id):
    session = SessionLocal()
    try:
        classroom = session.query(Classroom).get(id)
        if not classroom:
            return jsonify({"error": "Classroom not found"}), 404

        session.delete(classroom)
        session.commit()
        return jsonify({"message": "Classroom deleted"})
    finally:
        session.close()
