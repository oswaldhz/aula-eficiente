from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    classrooms = relationship("Classroom", back_populates="teacher")

class Classroom(Base):
    __tablename__ = "classrooms"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String)
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    teacher = relationship("Teacher", back_populates="classrooms")
    students = relationship("Student", back_populates="classroom")
    activities = relationship("Activity", back_populates="classroom")

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    identifier = Column(String, unique=True, nullable=False)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    classroom = relationship("Classroom", back_populates="students")
    grades = relationship("Grade", back_populates="student")

class Activity(Base):
    __tablename__ = "activities"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(String)
    due_date = Column(Date, nullable=False)
    max_score = Column(Float, nullable=False)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    classroom = relationship("Classroom", back_populates="activities")
    grades = relationship("Grade", back_populates="activity")

class Grade(Base):
    __tablename__ = "grades"
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    activity_id = Column(Integer, ForeignKey("activities.id"))
    score = Column(Float)
    submission_date = Column(Date)
    student = relationship("Student", back_populates="grades")
    activity = relationship("Activity", back_populates="grades")
