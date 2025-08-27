from flask import Blueprint, request, jsonify
from models import Student
from database import SessionLocal

bp = Blueprint("students", __name__)

# --------------------- GET ALL ---------------------
@bp.route("/", methods=["GET"])
def get_students():
    session = SessionLocal()
    try:
        students = session.query(Student).all()
        return jsonify([
            {
                "id": s.id,
                "name": s.name,
                "identifier": s.identifier,
                "classroom_id": s.classroom_id
            } for s in students
        ])
    finally:
        session.close()

# --------------------- CREATE ---------------------
@bp.route("/", methods=["POST"])
def create_student():
    data = request.json
    if not data.get("name") or not data.get("identifier"):
        return jsonify({"error": "Name and identifier are required"}), 400

    session = SessionLocal()
    try:
        student = Student(
            name=data["name"],
            identifier=data["identifier"],
            classroom_id=data.get("classroom_id")
        )
        session.add(student)
        session.commit()
        session.refresh(student)
        return jsonify({"id": student.id, "message": "Student created"}), 201
    finally:
        session.close()

# --------------------- UPDATE ---------------------
@bp.route("/<int:id>/", methods=["PUT"])
def update_student(id):
    data = request.json
    session = SessionLocal()
    try:
        student = session.query(Student).get(id)
        if not student:
            return jsonify({"error": "Student not found"}), 404

        student.name = data.get("name", student.name)
        student.identifier = data.get("identifier", student.identifier)
        student.classroom_id = data.get("classroom_id", student.classroom_id)

        session.commit()
        session.refresh(student)
        return jsonify({"message": "Student updated"})
    finally:
        session.close()

# --------------------- DELETE ---------------------
@bp.route("/<int:id>/", methods=["DELETE"])
def delete_student(id):
    session = SessionLocal()
    try:
        student = session.query(Student).get(id)
        if not student:
            return jsonify({"error": "Student not found"}), 404

        session.delete(student)
        session.commit()
        return jsonify({"message": "Student deleted"})
    finally:
        session.close()
