from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    age = Column(Integer, nullable=True)
    occupation = Column(String, nullable=True)
    country = Column(String, nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Gamification stats
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    prosperity_score = Column(Integer, default=0)
    
    # New fields for structured learning
    age_bracket = Column(String, nullable=True) # Child, Young Professional, Adult
    placement_completed = Column(Boolean, default=False)

    # Relationships
    financial_profile = relationship("FinancialProfile", back_populates="user", uselist=False)
    user_progress = relationship("UserProgress", back_populates="user")
    expenses = relationship("Expense", back_populates="user")

class FinancialProfile(Base):
    __tablename__ = "financial_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    monthly_income_range = Column(String, nullable=True)
    current_savings_range = Column(String, nullable=True)
    financial_goal = Column(String, nullable=True)
    risk_tolerance = Column(String, nullable=True)
    estimated_monthly_spending = Column(String, nullable=True)
    main_spending_categories = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="financial_profile")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String)
    order = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    
    # Grouping fields
    bracket = Column(String, index=True) # Bracket 1, 2, 3
    level_tier = Column(String, index=True) # Beginner, Intermediate, Advanced
    is_placement_test = Column(Boolean, default=False)

    modules = relationship("Module", back_populates="course", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="course", cascade="all, delete-orphan", foreign_keys="Quiz.course_id")

class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(String) # markdown or rich text
    examples = Column(String)
    order = Column(Integer, default=1)

    course = relationship("Course", back_populates="modules")
    quizzes = relationship("Quiz", back_populates="module", cascade="all, delete-orphan")
    progress = relationship("UserProgress", back_populates="module")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=True) # If null, it's a course diagnostic quiz
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True) # Needed for diagnostic
    title = Column(String, nullable=False)
    is_diagnostic = Column(Boolean, default=False)
    
    module = relationship("Module", back_populates="quizzes")
    course = relationship("Course", back_populates="quizzes", foreign_keys=[course_id])
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_text = Column(String, nullable=False)
    options = Column(String, nullable=False) # JSON encoded string: ["A", "B", "C"]
    correct_option_index = Column(Integer, nullable=False) # 0, 1, 2 etc.
    explanation = Column(String)

    quiz = relationship("Quiz", back_populates="questions")

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    
    is_completed = Column(Boolean, default=False)
    score_percentage = Column(Integer, nullable=True)
    
    completed_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="user_progress")
    module = relationship("Module", back_populates="progress")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String, nullable=False) # Food, Transport, Rent, etc.
    amount = Column(Integer, nullable=False)
    description = Column(String, nullable=True)
    date = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="expenses")
