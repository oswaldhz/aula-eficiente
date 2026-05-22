from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    
    classrooms = relationship(
        "Classroom",
        back_populates="teacher",
        cascade="all, delete-orphan"
    )
    periods = relationship(
        "Period",
        back_populates="teacher",
        cascade="all, delete-orphan"
    )

class Period(Base):
    __tablename__ = "periods"
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"))
    teacher = relationship("Teacher", back_populates="periods")

    classrooms = relationship(
        "Classroom",
        back_populates="period",
        cascade="all, delete-orphan"
    )

class Classroom(Base):
    __tablename__ = "classrooms"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"))
    period_id = Column(Integer, ForeignKey("periods.id", ondelete="CASCADE"))
    
    teacher = relationship("Teacher", back_populates="classrooms")
    period = relationship("Period", back_populates="classrooms")
    
    students = relationship(
        "Student",
        back_populates="classroom",
        cascade="all, delete-orphan"
    )
    activities = relationship(
        "Activity",
        back_populates="classroom",
        cascade="all, delete-orphan"
    )

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    identifier = Column(String, unique=True, nullable=False)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"))
    
    classroom = relationship("Classroom", back_populates="students")
    grades = relationship(
        "Grade",
        back_populates="student",
        cascade="all, delete-orphan"
    )

class Activity(Base):
    __tablename__ = "activities"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(String)
    due_date = Column(Date, nullable=False)
    max_score = Column(Float, nullable=False)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"))
    
    classroom = relationship("Classroom", back_populates="activities")
    grades = relationship(
        "Grade",
        back_populates="activity",
        cascade="all, delete-orphan"
    )

class Grade(Base):
    __tablename__ = "grades"
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"))
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="CASCADE"))
    score = Column(Float)
    submission_date = Column(Date)
    
    student = relationship("Student", back_populates="grades")
    activity = relationship("Activity", back_populates="grades")
