from flask import Blueprint, request, jsonify
from models import Student, Classroom
from database import SessionLocal
import re

bp = Blueprint("students", __name__)

@bp.route("", methods=["GET"])
def get_students():
    period_id = request.args.get("period_id", type=int)
    session = SessionLocal()
    try:
        query = session.query(Student)
        if period_id:
            query = query.join(Classroom).filter(Classroom.period_id == period_id)
        students = query.all()
        return jsonify([
            {"id": s.id, "name": s.name, "identifier": s.identifier, "classroom_id": s.classroom_id}
            for s in students
        ])
    finally:
        session.close()

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

# --------------------- BULK IMPORT ---------------------
@bp.route("/bulk", methods=["POST"])
def bulk_create_students():
    data = request.json
    students_data = data.get("students", [])
    classroom_id = data.get("classroom_id")
    if not students_data:
        return jsonify({"error": "No students provided"}), 400
    session = SessionLocal()
    created = []
    errors = []
    try:
        for i, s in enumerate(students_data):
            name = (s.get("name") or "").strip()
            identifier = (s.get("identifier") or "").strip()
            if not name or not identifier:
                errors.append({"row": i + 1, "error": "Name and identifier are required"})
                continue
            existing = session.query(Student).filter(Student.identifier == identifier).first()
            if existing:
                errors.append({"row": i + 1, "error": f"Duplicate identifier '{identifier}'"})
                continue
            student = Student(name=name, identifier=identifier, classroom_id=classroom_id)
            session.add(student)
            created.append({"name": name, "identifier": identifier})
        session.commit()
        return jsonify({"created": len(created), "errors": errors}), 201
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

# Update y Delete mantienen la lógica anterior


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
