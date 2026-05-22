from flask import Blueprint, request, jsonify, g
from models import Period
from database import SessionLocal

bp = Blueprint("periods", __name__)

# ===================== GET TODOS LOS PERIODOS DEL TEACHER AUTENTICADO =====================
@bp.route("", methods=["GET"])
def get_periods():
    teacher = getattr(g, "current_teacher", None)
    if not teacher:
        return jsonify({"error": "Unauthorized: valid token required"}), 401

    session = SessionLocal()
    try:
        periods = session.query(Period).filter_by(teacher_id=teacher.id).all()
        return jsonify([
            {
                "id": p.id,
                "name": p.name,
                "year": p.year,
                "teacher_id": p.teacher_id
            } for p in periods
        ])
    finally:
        session.close()

# ===================== CREAR NUEVO PERIODO (PROTEGIDO) =====================
@bp.route("/", methods=["POST"])
def create_period():
    # Este endpoint requiere autenticación: debe existir g.current_teacher
    teacher = getattr(g, "current_teacher", None)
    if not teacher:
        return jsonify({"error": "Unauthorized: valid token and teacher required"}), 401

    data = request.json
    if data is None or not data.get("name") or not data.get("year"):
        return jsonify({"error": "Name and year are required"}), 400

    # Validar year como entero
    try:
        year = int(data.get("year"))
    except (ValueError, TypeError):
        return jsonify({"error": "year must be an integer"}), 400

    session = SessionLocal()
    try:
        # Usamos el teacher.id que obtuvimos del token -> email -> BD
        period = Period(
            name=data["name"],
            year=year,
            teacher_id=teacher.id
        )
        session.add(period)
        session.commit()
        session.refresh(period)
        return jsonify({"id": period.id, "message": "Periodo creado"}), 201
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

# ===================== GET UN PERIODO (SOLO PROPIETARIO) =====================
@bp.route("/<int:period_id>", methods=["GET"])
def get_period(period_id):
    teacher = getattr(g, "current_teacher", None)
    if not teacher:
        return jsonify({"error": "Unauthorized: valid token required"}), 401

    session = SessionLocal()
    try:
        period = session.query(Period).get(period_id)
        if not period:
            return jsonify({"error": "Periodo no encontrado"}), 404

        # Restricción: solo el teacher propietario puede verlo
        if period.teacher_id != teacher.id:
            return jsonify({"error": "Forbidden: no access to this period"}), 403

        return jsonify({
            "id": period.id,
            "name": period.name,
            "year": period.year,
            "teacher_id": period.teacher_id
        })
    finally:
        session.close()

# ===================== ACTUALIZAR PERIODO (SOLO PROPIETARIO) =====================
@bp.route("/<int:period_id>", methods=["PUT"])
def update_period(period_id):
    teacher = getattr(g, "current_teacher", None)
    if not teacher:
        return jsonify({"error": "Unauthorized: valid token required"}), 401

    data = request.json
    session = SessionLocal()
    try:
        period = session.query(Period).get(period_id)
        if not period:
            return jsonify({"error": "Periodo no encontrado"}), 404

        # Solo el owner puede actualizar
        if period.teacher_id != teacher.id:
            return jsonify({"error": "Forbidden: cannot update this period"}), 403

        # Validación de cambios (mantén tu lógica)
        if "name" in data:
            period.name = data["name"]
        if "year" in data:
            try:
                period.year = int(data["year"])
            except (ValueError, TypeError):
                return jsonify({"error": "year must be an integer"}), 400

        # No permitimos cambiar el teacher_id a otro distinto del actual
        if "teacher_id" in data:
            try:
                new_teacher_id = int(data["teacher_id"])
            except (ValueError, TypeError):
                return jsonify({"error": "teacher_id must be an integer"}), 400
            if new_teacher_id != teacher.id:
                return jsonify({"error": "Forbidden: cannot change teacher_id"},), 403

        session.commit()
        return jsonify({"id": period.id, "message": "Periodo actualizado"})
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

# ===================== ELIMINAR PERIODO (SOLO PROPIETARIO) =====================
@bp.route("/<int:period_id>", methods=["DELETE"])
def delete_period(period_id):
    teacher = getattr(g, "current_teacher", None)
    if not teacher:
        return jsonify({"error": "Unauthorized: valid token required"}), 401

    session = SessionLocal()
    try:
        period = session.query(Period).get(period_id)
        if not period:
            return jsonify({"error": "Periodo no encontrado"}), 404

        # Solo el owner puede eliminar
        if period.teacher_id != teacher.id:
            return jsonify({"error": "Forbidden: cannot delete this period"}), 403

        session.delete(period)
        session.commit()
        return jsonify({"id": period_id, "message": "Periodo eliminado"})
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
