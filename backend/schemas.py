from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    age: Optional[int] = None
    occupation: Optional[str] = None
    country: Optional[str] = None
    age_bracket: Optional[str] = None
    placement_completed: bool = False

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    
class FinancialProfileBase(BaseModel):
    monthly_income_range: Optional[str] = None
    current_savings_range: Optional[str] = None
    financial_goal: Optional[str] = None
    risk_tolerance: Optional[str] = None
    estimated_monthly_spending: Optional[str] = None
    main_spending_categories: Optional[str] = None

class FinancialProfileCreate(FinancialProfileBase):
    pass

class FinancialProfile(FinancialProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# --- Learning System Schemas ---

class QuizQuestionBase(BaseModel):
    question_text: str
    options: str  # JSON encoded string
    correct_option_index: int
    explanation: Optional[str] = None

class QuizQuestionCreate(QuizQuestionBase):
    pass

class QuizQuestion(QuizQuestionBase):
    id: int
    quiz_id: int

    class Config:
        orm_mode = True

class QuizBase(BaseModel):
    title: str
    is_diagnostic: bool = False

class QuizCreate(QuizBase):
    module_id: Optional[int] = None
    course_id: Optional[int] = None

class Quiz(QuizBase):
    id: int
    module_id: Optional[int] = None
    course_id: Optional[int] = None
    questions: List[QuizQuestion] = []

    class Config:
        orm_mode = True

class ModuleBase(BaseModel):
    title: str
    content: Optional[str] = None
    examples: Optional[str] = None
    order: int = 1

class ModuleCreate(ModuleBase):
    course_id: int

class Module(ModuleBase):
    id: int
    course_id: int
    quizzes: List[Quiz] = []

    class Config:
        orm_mode = True

class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 1
    is_active: bool = True
    bracket: Optional[str] = None
    level_tier: Optional[str] = None
    is_placement_test: bool = False

class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    id: int
    modules: List[Module] = []

    class Config:
        orm_mode = True

class UserProgressBase(BaseModel):
    module_id: int
    is_completed: bool = False
    score_percentage: Optional[int] = None

class UserProgressCreate(UserProgressBase):
    pass

class UserProgress(UserProgressBase):
    id: int
    user_id: int
    completed_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class ExpenseBase(BaseModel):
    category: str
    amount: int
    description: Optional[str] = None
    date: Optional[datetime] = None

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    xp: int
    level: int
    prosperity_score: int
    financial_profile: Optional[FinancialProfile] = None
    user_progress: List[UserProgress] = []
    expenses: List[Expense] = []

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
