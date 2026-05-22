import os
import uuid
from flask import Blueprint, request, jsonify, g, send_from_directory
from models import Teacher
from database import SessionLocal

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

bp = Blueprint("teachers", __name__)

@bp.route("/profile", methods=["GET"])
def get_profile():
    teacher = getattr(g, "current_teacher", None)
    if not teacher:
        return jsonify({"error": "Not authenticated"}), 401
    session = SessionLocal()
    try:
        t = session.query(Teacher).get(teacher.id)
        if not t:
            return jsonify({"error": "Teacher not found"}), 404
        return jsonify({
            "id": t.id,
            "name": t.name,
            "email": t.email,
            "first_name": t.first_name or "",
            "last_name": t.last_name or "",
            "profile_image_url": t.profile_image_url or ""
        })
    finally:
        session.close()

@bp.route("/profile", methods=["PUT"])
def update_profile():
    teacher = getattr(g, "current_teacher", None)
    if not teacher:
        return jsonify({"error": "Not authenticated"}), 401
    data = request.json
    session = SessionLocal()
    try:
        t = session.query(Teacher).get(teacher.id)
        if not t:
            return jsonify({"error": "Teacher not found"}), 404
        if "first_name" in data:
            t.first_name = data["first_name"]
        if "last_name" in data:
            t.last_name = data["last_name"]
        if "name" in data:
            t.name = data["name"]
        if "profile_image_url" in data:
            t.profile_image_url = data["profile_image_url"]
        session.commit()
        session.refresh(t)
        return jsonify({
            "id": t.id,
            "name": t.name,
            "email": t.email,
            "first_name": t.first_name or "",
            "last_name": t.last_name or "",
            "profile_image_url": t.profile_image_url or ""
        })
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@bp.route("/profile/image", methods=["POST"])
def upload_profile_image():
    teacher = getattr(g, "current_teacher", None)
    if not teacher:
        return jsonify({"error": "Not authenticated"}), 401

    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files["image"]
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    allowed = {"jpg", "jpeg", "png", "gif", "webp"}
    if ext not in allowed:
        return jsonify({"error": f"Invalid file type: .{ext}. Allowed: {', '.join(allowed)}"}), 400

    filename = f"profile_{teacher.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    profile_url = f"/teachers/uploads/{filename}"

    session = SessionLocal()
    try:
        t = session.query(Teacher).get(teacher.id)
        if t:
            t.profile_image_url = profile_url
            session.commit()
        return jsonify({"profile_image_url": profile_url}), 200
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@bp.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)
