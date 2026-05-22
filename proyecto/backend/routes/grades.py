from flask import Blueprint, request, jsonify
from models import Grade, Activity, Classroom
from database import SessionLocal

bp = Blueprint("grades", __name__)

# -----------------------------
# GET todas las notas
# -----------------------------
@bp.route("", methods=["GET"])
def get_grades():
    period_id = request.args.get("period_id", type=int)  # <-- filtrado por periodo
    session = SessionLocal()
    try:
        query = session.query(Grade)
        if period_id:
            # Hacemos join con Activity y Classroom para filtrar por periodo
            query = query.join(Activity).join(Classroom).filter(Classroom.period_id == period_id)

        grades = query.all()
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

# -----------------------------
# POST (crear o actualizar si ya existe)
# -----------------------------
@bp.route("/", methods=["POST"])
def create_or_update_grade():
    data = request.json
    session = SessionLocal()
    try:
        if not data:
            return jsonify({"error": "No input data"}), 400

        activity = session.get(Activity, data["activity_id"])
        if not activity:
            return jsonify({"error": "Activity not found"}), 404

        if float(data["score"]) > float(activity.max_score):
            return jsonify({"error": f"Score cannot exceed {activity.max_score}"}), 400

        existing_grade = session.query(Grade).filter_by(
            student_id=data["student_id"],
            activity_id=data["activity_id"]
        ).first()

        if existing_grade:
            existing_grade.score = data["score"]
            session.commit()
            session.refresh(existing_grade)
            return jsonify({
                "id": existing_grade.id,
                "score": existing_grade.score,
                "student_id": existing_grade.student_id,
                "activity_id": existing_grade.activity_id,
                "message": "Grade updated (was existing)"
            }), 200
        else:
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

# -----------------------------
# PUT actualizar nota por id
# -----------------------------
@bp.route("/<int:id>", methods=["PUT"])
def update_grade(id):
    data = request.json
    session = SessionLocal()
    try:
        grade = session.get(Grade, id)
        if not grade:
            return jsonify({"error": "Grade not found"}), 404
        if not data:
            return jsonify({"error": "No input data"}), 400

        activity_id = data.get("activity_id", grade.activity_id)
        activity = session.get(Activity, activity_id)
        if not activity:
            return jsonify({"error": "Activity not found"}), 404

        new_score = data.get("score", grade.score)
        if float(new_score) > float(activity.max_score):
            return jsonify({"error": f"Score cannot exceed {activity.max_score}"}), 400

        grade.score = new_score
        grade.student_id = data.get("student_id", grade.student_id)
        grade.activity_id = activity_id

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

# -----------------------------
# DELETE nota por id
# -----------------------------
@bp.route("/<int:id>", methods=["DELETE"])
def delete_grade(id):
    session = SessionLocal()
    try:
        grade = session.get(Grade, id)
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
