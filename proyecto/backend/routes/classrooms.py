# routes/classrooms.py
from flask import Blueprint, request, jsonify, g
from models import Classroom, Period
from database import SessionLocal

bp = Blueprint("classrooms", __name__)

# --------------------- GET por query param (compatible) ---------------------
# GET /classrooms?period_id=5
@bp.route("", methods=["GET"])
def get_classrooms_query():
    teacher = getattr(g, "current_teacher", None)
    period_id = request.args.get("period_id", type=int)

    session = SessionLocal()
    try:
        # Si el cliente pidió period_id directamente, validar su existencia
        if period_id is not None:
            period = session.query(Period).get(period_id)
            if not period:
                return jsonify({"error": "Periodo no encontrado"}), 404
            # Si hay usuario autenticado, asegurar que sea el owner
            if teacher and period.teacher_id != teacher.id:
                return jsonify({"error": "Forbidden: no access to this period"}), 403

            classrooms = session.query(Classroom).filter(Classroom.period_id == period_id).all()
            return jsonify([
                {
                    "id": c.id,
                    "name": c.name,
                    "description": c.description,
                    "teacher_id": c.teacher_id,
                    "period_id": c.period_id
                } for c in classrooms
            ])

        # Si no se indicó period_id: si el usuario está autenticado, devolver aulas
        # del último periodo del teacher (comportamiento "útil" por defecto).
        if not teacher:
            # Si no autenticado y no piden period_id -> no podemos devolver nada seguro
            return jsonify({"error": "period_id is required when unauthenticated"}), 401

        # Buscar el periodo más reciente del teacher
        period = session.query(Period).filter(Period.teacher_id == teacher.id).order_by(Period.id.desc()).first()
        if not period:
            return jsonify([])  # no hay periodos para este teacher -> lista vacía válida

        classrooms = session.query(Classroom).filter(Classroom.period_id == period.id).all()
        return jsonify([
            {
                "id": c.id,
                "name": c.name,
                "description": c.description,
                "teacher_id": c.teacher_id,
                "period_id": c.period_id
            } for c in classrooms
        ])
    finally:
        session.close()


# --------------------- GET ALL (clases del periodo, solo owner) ---------------------
# GET /classrooms/<periodId>/
@bp.route("/<int:periodId>/", methods=["GET"])
def get_classrooms(periodId):
    teacher = getattr(g, "current_teacher", None)
    if not teacher:
        return jsonify({"error": "Unauthorized: valid token required"}), 401

    session = SessionLocal()
    try:
        # Comprobar que el periodo exista y pertenezca al teacher
        period = session.query(Period).get(periodId)
        if not period:
            return jsonify({"error": "Periodo no encontrado"}), 404
        if period.teacher_id != teacher.id:
            return jsonify({"error": "Forbidden: no access to this period"}), 403

        classrooms = session.query(Classroom).filter(Classroom.period_id == periodId).all()
        return jsonify([
            {
                "id": c.id,
                "name": c.name,
                "description": c.description,
                "teacher_id": c.teacher_id,
                "period_id": c.period_id
            } for c in classrooms
        ])
    finally:
        session.close()


# --------------------- CREATE ---------------------
@bp.route("/", methods=["POST"])
def create_classroom():
    # Validar JSON
    if not request.is_json:
        return jsonify({"error": "Request must be application/json"}), 400

    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Invalid or empty JSON body"}), 400

    name = data.get("name")
    description = data.get("description")
    period_id = data.get("period_id")  # opcional
    teacher = getattr(g, "current_teacher", None)

    if not name or not str(name).strip():
        return jsonify({"error": "Name is required"}), 400

    session = SessionLocal()
    try:
        # Si no viene period_id: usar último periodo del teacher autenticado
        if period_id is None:
            if not teacher:
                return jsonify({"error": "period_id is required when not authenticated"}), 401
            period = session.query(Period).filter(Period.teacher_id == teacher.id).order_by(Period.id.desc()).first()
            if not period:
                return jsonify({"error": "No period found for this teacher. Please provide period_id"}), 400
            period_id = period.id
        else:
            # validar formato
            try:
                period_id = int(period_id)
            except (ValueError, TypeError):
                return jsonify({"error": "period_id must be an integer"}), 400
            period = session.query(Period).get(period_id)
            if not period:
                return jsonify({"error": "Periodo no encontrado"}), 404
            # si está autenticado, validar ownership
            if teacher and period.teacher_id != teacher.id:
                return jsonify({"error": "Forbidden: cannot create classroom in a period owned by another teacher"}), 403

        # determinar teacher_id: preferir el teacher autenticado
        if teacher:
            teacher_id = teacher.id
        else:
            # si no autenticado, requerir teacher_id en el body
            try:
                teacher_id = int(data.get("teacher_id"))
            except (ValueError, TypeError):
                return jsonify({"error": "teacher_id is required when not authenticated and must be integer"}), 401
            if period.teacher_id != teacher_id:
                return jsonify({"error": "Forbidden: teacher_id does not own the period"}), 403

        # Crear classroom
        classroom = Classroom(
            name=name,
            description=description,
            teacher_id=teacher_id,
            period_id=period_id
        )
        session.add(classroom)
        session.commit()
        session.refresh(classroom)

        return jsonify({
            "id": classroom.id,
            "name": classroom.name,
            "description": classroom.description,
            "teacher_id": classroom.teacher_id,
            "period_id": classroom.period_id,
            "message": "Classroom created"
        }), 201

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


# --------------------- UPDATE ---------------------
@bp.route("/<int:id>/", methods=["PUT"])
def update_classroom(id):
    if not request.is_json:
        return jsonify({"error": "Request must be application/json"}), 400

    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Invalid or empty JSON body"}), 400

    teacher = getattr(g, "current_teacher", None)
    if not teacher:
        return jsonify({"error": "Unauthorized: valid token required"}), 401

    session = SessionLocal()
    try:
        classroom = session.query(Classroom).get(id)
        if not classroom:
            return jsonify({"error": "Classroom not found"}), 404

        # Solo el owner (teacher) puede actualizar
        if classroom.teacher_id != teacher.id:
            return jsonify({"error": "Forbidden: cannot update this classroom"}), 403

        # Actualizar campos permitidos
        if "name" in data:
            if not data.get("name") or not str(data.get("name")).strip():
                return jsonify({"error": "name cannot be empty"}), 400
            classroom.name = data.get("name")

        if "description" in data:
            classroom.description = data.get("description")

        if "period_id" in data:
            try:
                new_period_id = int(data.get("period_id"))
            except (ValueError, TypeError):
                return jsonify({"error": "period_id must be an integer"}), 400
            period = session.query(Period).get(new_period_id)
            if not period:
                return jsonify({"error": "Periodo no encontrado"}), 404
            if period.teacher_id != teacher.id:
                return jsonify({"error": "Forbidden: cannot move classroom to a period of another teacher"}), 403
            classroom.period_id = new_period_id

        session.commit()
        session.refresh(classroom)
        return jsonify({
            "id": classroom.id,
            "name": classroom.name,
            "description": classroom.description,
            "teacher_id": classroom.teacher_id,
            "period_id": classroom.period_id,
            "message": "Classroom updated"
        })
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


# --------------------- DELETE ---------------------
@bp.route("/<int:id>/", methods=["DELETE"])
def delete_classroom(id):
    teacher = getattr(g, "current_teacher", None)
    if not teacher:
        return jsonify({"error": "Unauthorized: valid token required"}), 401

    session = SessionLocal()
    try:
        classroom = session.query(Classroom).get(id)
        if not classroom:
            return jsonify({"error": "Classroom not found"}), 404

        # Solo el owner puede eliminar
        if classroom.teacher_id != teacher.id:
            return jsonify({"error": "Forbidden: cannot delete this classroom"}), 403

        session.delete(classroom)
        session.commit()
        return jsonify({"id": id, "message": "Classroom deleted"})
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
