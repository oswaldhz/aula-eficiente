import os
import time
import json
import requests
from dotenv import load_dotenv
from flask import Flask, request, g, jsonify
from flask_cors import CORS
from routes.classrooms import bp as classrooms_bp
from routes.students import bp as students_bp
from routes.activities import bp as activities_bp
from routes.grades import bp as grades_bp
from routes.periods import bp as periods_bp
from models import Teacher
from database import SessionLocal
import jwt
from jwt.algorithms import RSAAlgorithm
from sqlalchemy import func
import hmac
import hashlib

# -----------------------------
# Config / env
# -----------------------------
load_dotenv()
CLERK_JWKS_URL = os.environ.get(
    "CLERK_JWKS_URL",
    "https://proper-mullet-33.clerk.accounts.dev/.well-known/jwks.json"
)
CLERK_CLIENT_ID = os.environ.get("CLERK_CLIENT_ID", os.environ.get("CLERK_FRONTEND_API", None))
JWT_ISSUER = os.environ.get("JWT_ISSUER", "https://proper-mullet-33.clerk.accounts.dev")
DEBUG_AUTH = os.environ.get("DEBUG_AUTH", "1") == "1"
CLERK_ALLOWED_AZP = [s.strip() for s in os.environ.get("CLERK_ALLOWED_AZP", "http://localhost:3000").split(",") if s.strip()]
CLERK_WEBHOOK_SECRET = os.environ.get("CLERK_WEBHOOK_SECRET")  # Clave secreta del webhook

# -----------------------------
# Flask app + CORS
# -----------------------------
app = Flask(__name__)
app.url_map.strict_slashes = False

CORS(
    app,
    resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)

# -----------------------------
# JWKS cache
# -----------------------------
_jwks_cache = {"keys": None, "fetched_at": 0}
JWKS_CACHE_DURATION = 300  # 5 min

def get_public_key_from_jwks(kid: str):
    if _jwks_cache["keys"] is None or (time.time() - _jwks_cache["fetched_at"]) > JWKS_CACHE_DURATION:
        resp = requests.get(CLERK_JWKS_URL, timeout=5)
        resp.raise_for_status()
        jwks = resp.json()
        _jwks_cache["keys"] = jwks.get("keys", [])
        _jwks_cache["fetched_at"] = time.time()

    for key in _jwks_cache["keys"]:
        if key.get("kid") == kid:
            return RSAAlgorithm.from_jwk(json.dumps(key))

    raise Exception("Public key not found for kid")

# -----------------------------
# Middleware de autenticación
# -----------------------------
@app.before_request
def verify_clerk_token():
    if request.method == "OPTIONS":
        g.current_teacher = None
        return None

    auth_header = request.headers.get("Authorization")
    if not auth_header:
        g.current_teacher = None
        return None

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        if DEBUG_AUTH:
            print("[AUTH DEBUG] Bad Authorization header format:", auth_header)
        return jsonify({"error": "Invalid Authorization header format"}), 401

    token = parts[1]

    try:
        unverified_header = jwt.get_unverified_header(token)
        unverified_payload = jwt.decode(token, options={"verify_signature": False})
    except Exception as e:
        if DEBUG_AUTH:
            print("[AUTH DEBUG] Cannot parse token:", str(e))
        return jsonify({"error": "Cannot read token"}), 401

    kid = unverified_header.get("kid")
    if not kid:
        return jsonify({"error": "Token header missing kid"}), 401

    try:
        public_key = get_public_key_from_jwks(kid)
    except Exception as e:
        return jsonify({"error": "Public key not found", "detail": str(e)}), 401

    try:
        decoded = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False, "verify_iat": False, "verify_nbf": False},
            issuer=JWT_ISSUER,
            leeway=10
        )
    except Exception as e:
        return jsonify({"error": "Token verification failed", "detail": str(e)}), 401

    user_email = decoded.get("email")
    if not user_email:
        return jsonify({"error":"Token missing email claim"}), 401

    session = SessionLocal()
    try:
        teacher = session.query(Teacher).filter(func.lower(Teacher.email) == user_email.lower()).first()
        if not teacher:
            teacher = Teacher(name=user_email.split("@")[0], email=user_email)
            session.add(teacher)
            session.commit()
            if DEBUG_AUTH:
                print(f"[AUTH DEBUG] Teacher created in DB: id={teacher.id}, email={teacher.email}")

        g.current_teacher = teacher
    finally:
        session.close()

    return None

# -----------------------------
# Endpoint de prueba
# -----------------------------
@app.route("/test-teacher", methods=["GET"])
def test_teacher():
    teacher = getattr(g, "current_teacher", None)
    if not teacher:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify({"message": "Usuario validado", "name": teacher.name, "id": teacher.id}), 200

# -----------------------------
# Webhook de Clerk
# -----------------------------
@app.route("/clerk-webhook/", methods=["POST"])
def clerk_webhook():
    payload = request.data
    if not payload:
        return jsonify({"error": "No payload"}), 400

    # Verificación de firma
    signature = request.headers.get("Clerk-Signature", "")
    computed_sig = hmac.new(
        key=CLERK_WEBHOOK_SECRET.encode("utf-8"), # type: ignore
        msg=payload,
        digestmod=hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature, computed_sig):
        return jsonify({"error": "Invalid webhook signature"}), 401

    # Parsear el JSON del webhook
    data = request.get_json()
    event_type = data.get("type")
    user_email = data.get("data", {}).get("email")

    if event_type == "user.created" and user_email:
        session = SessionLocal()
        try:
            # Crear Teacher si no existe
            teacher = session.query(Teacher).filter(func.lower(Teacher.email) == user_email.lower()).first()
            if not teacher:
                teacher = Teacher(name=user_email.split("@")[0], email=user_email)
                session.add(teacher)
                session.commit()
        finally:
            session.close()

    return jsonify({"status": "ok"}), 200
# -----------------------------
# Registramos blueprints
# -----------------------------
app.register_blueprint(classrooms_bp, url_prefix="/classrooms")
app.register_blueprint(students_bp, url_prefix="/students")
app.register_blueprint(activities_bp, url_prefix="/activities")
app.register_blueprint(grades_bp, url_prefix="/grades")
app.register_blueprint(periods_bp, url_prefix="/periods")

if __name__ == "__main__":
    app.run(debug=True)


