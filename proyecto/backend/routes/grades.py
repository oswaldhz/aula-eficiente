from flask import Blueprint, request, jsonify
from models import Grade
from database import SessionLocal

bp = Blueprint("grades", __name__)

@bp.route("/", methods=["GET"])
def get_grades():
    session = SessionLocal()
    try:
        grades = session.query(Grade).all()
        return jsonify([
            {
                "id": g.id,
                "score": g.score,
                "student_id": g.student_id,
                "activity_id": g.activity_id
            } for g in grades
        ])
    finally:
        session.close()


@bp.route("/", methods=["POST"])
def create_grade():
    data = request.json
    session = SessionLocal()
    try:
        if not data:
            return jsonify({"error": "No input data"}), 400

        grade = Grade(
            score=data["score"],
            student_id=data["student_id"],
            activity_id=data["activity_id"]
        )
        session.add(grade)
        session.commit()
        session.refresh(grade)
        return jsonify({
            "id": grade.id,
            "score": grade.score,
            "student_id": grade.student_id,
            "activity_id": grade.activity_id,
            "message": "Grade created"
        }), 201
    finally:
        session.close()


@bp.route("/<int:id>", methods=["PUT"])
def update_grade(id):
    data = request.json
    session = SessionLocal()
    try:
        grade = session.get(Grade, id)   # ✅ forma recomendada
        if not grade:
            return jsonify({"error": "Grade not found"}), 404

        if not data:
            return jsonify({"error": "No input data"}), 400

        # actualizar solo lo que venga en el request
        grade.score = data.get("score", grade.score)
        grade.student_id = data.get("student_id", grade.student_id)
        grade.activity_id = data.get("activity_id", grade.activity_id)

        session.commit()
        return jsonify({
            "id": grade.id,
            "score": grade.score,
            "student_id": grade.student_id,
            "activity_id": grade.activity_id,
            "message": "Grade updated"
        })
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@bp.route("/<int:id>", methods=["DELETE"])
def delete_grade(id):
    session = SessionLocal()
    try:
        grade = session.get(Grade, id)   # ✅ igual aquí
        if not grade:
            return jsonify({"error": "Grade not found"}), 404

        session.delete(grade)
        session.commit()
        return jsonify({"message": "Grade deleted"})
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
