from flask import Flask
from flask_cors import CORS
from routes.teachers import bp as teachers_bp
from routes.classrooms import bp as classrooms_bp
from routes.students import bp as students_bp
from routes.activities import bp as activities_bp
from routes.grades import bp as grades_bp

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

app.register_blueprint(teachers_bp, url_prefix="/teachers")
app.register_blueprint(classrooms_bp, url_prefix="/classrooms")
app.register_blueprint(students_bp, url_prefix="/students")
app.register_blueprint(activities_bp, url_prefix="/activities")
app.register_blueprint(grades_bp, url_prefix="/grades")

if __name__ == "__main__":
    app.run(debug=True)
