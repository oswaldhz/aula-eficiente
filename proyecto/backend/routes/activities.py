from flask import Blueprint, request, jsonify
from models import Activity, Classroom
from database import SessionLocal

bp = Blueprint("activities", __name__)

@bp.route("", methods=["GET"])
def get_activities():
    period_id = request.args.get("period_id", type=int)
    session = SessionLocal()
    try:
        query = session.query(Activity)
        if period_id:
            query = query.join(Classroom).filter(Classroom.period_id == period_id)
        activities = query.all()
        return jsonify([
            {
                "id": a.id,
                "title": a.title,
                "description": a.description,
                "due_date": a.due_date.isoformat(),
                "max_score": a.max_score,
                "classroom_id": a.classroom_id
            } for a in activities
        ])
    finally:
        session.close()

@bp.route("/", methods=["POST"])
def create_activity():
    data = request.json
    if not data.get("title") or not data.get("max_score") or not data.get("due_date"):
        return jsonify({"error": "Missing required fields"}), 400

    session = SessionLocal()
    try:
        activity = Activity(
            title=data["title"],
            description=data.get("description"),
            due_date=data["due_date"],
            max_score=data["max_score"],
            classroom_id=data.get("classroom_id")
        )
        session.add(activity)
        session.commit()
        session.refresh(activity)
        return jsonify({"id": activity.id, "message": "Activity created"}), 201
    finally:
        session.close()

# Update y Delete mantienen la lógica anterior


# ------------------ FUNCIONES CRUD NUEVAS ------------------

@bp.route("/<int:id>/", methods=["PUT"])
def update_activity(id):
    data = request.json
    session = SessionLocal()
    try:
        activity = session.query(Activity).get(id)
        if not activity:
            return jsonify({"error": "Activity not found"}), 404

        activity.title = data.get("title", activity.title)
        activity.description = data.get("description", activity.description)
        activity.due_date = data.get("due_date", activity.due_date)
        activity.max_score = data.get("max_score", activity.max_score)
        activity.classroom_id = data.get("classroom_id", activity.classroom_id)

        session.commit()
        session.refresh(activity)
        return jsonify({"id": activity.id, "message": "Activity updated"})
    finally:
        session.close()

@bp.route("/<int:id>/", methods=["DELETE"])
def delete_activity(id):
    session = SessionLocal()
    try:
        activity = session.query(Activity).get(id)
        if not activity:
            return jsonify({"error": "Activity not found"}), 404

        session.delete(activity)
        session.commit()
        return jsonify({"message": "Activity deleted"})
    finally:
        session.close()
