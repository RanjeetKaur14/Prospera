from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from typing import List
import models, schemas, auth, database
from database import engine, get_db
import pandas as pd
import matplotlib
matplotlib.use('Agg') # Set backend before importing pyplot
import matplotlib.pyplot as plt
import io
import os
from fastapi.staticfiles import StaticFiles


app = FastAPI(title="Prospera API")

@app.on_event("startup")
def startup_event():
    try:
        models.Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Database creation error: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Ensure static directory exists
if not os.path.exists("static"):
    os.makedirs("static")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={"Access-Control-Allow-Origin": "http://localhost:3000"}
    )

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

@app.get("/")
def read_root():
    return {"message": "Welcome to Prospera API"}

@app.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        age=user.age,
        occupation=user.occupation,
        country=user.country
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Initial bracket assignment if age is known
    if new_user.age:
        if new_user.age <= 15: new_user.age_bracket = "Child"
        elif new_user.age <= 25: new_user.age_bracket = "Young Professional"
        else: new_user.age_bracket = "Adult"
        db.commit()
        
    return new_user

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/users/me/prosperity-score")
def get_prosperity_score(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Simple logic: XP + (Savings Rate * 10) + Completed Modules * 5
    savings_rate = 50 # Mock for now
    completed_modules = len(current_user.user_progress)
    score = (current_user.xp // 10) + completed_modules * 10 + savings_rate
    current_user.prosperity_score = min(score, 1000)
    db.commit()
    return {"score": current_user.prosperity_score}
@app.put("/users/me", response_model=schemas.User)
def update_user_me(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    update_data = user_update.dict(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = auth.get_password_hash(update_data.pop("password"))
    for key, value in update_data.items():
        setattr(current_user, key, value)
    
    # Assign age bracket if age is updated
    if "age" in update_data:
        age = update_data["age"]
        if age <= 15:
            current_user.age_bracket = "Child"
        elif age <= 25:
            current_user.age_bracket = "Young Professional"
        else:
            current_user.age_bracket = "Adult"
            
    db.commit()
    db.refresh(current_user)
    return current_user

@app.post("/users/me/financial-profile", response_model=schemas.FinancialProfile)
def create_financial_profile(
    profile: schemas.FinancialProfileCreate, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    db_profile = db.query(models.FinancialProfile).filter(models.FinancialProfile.user_id == current_user.id).first()
    
    if db_profile:
        # Update existing profile
        for key, value in profile.dict(exclude_unset=True).items():
            setattr(db_profile, key, value)
    else:
        # Create new profile
        db_profile = models.FinancialProfile(**profile.dict(), user_id=current_user.id)
        db.add(db_profile)
        
    db.commit()
    db.refresh(db_profile)
    return db_profile

# --- Learning System Endpoints ---

@app.get("/courses") 
def list_courses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    courses = db.query(models.Course).filter(models.Course.is_active == True).order_by(models.Course.order).all()
    
    # Map user progress by module_id
    progress_map = {p.module_id: p for p in current_user.user_progress}

    def module_cleared(module):
        """A module is cleared if user passed its quiz with 80%+ OR marked it as completed."""
        p = progress_map.get(module.id)
        if not p:
            return False
        return p.is_completed or (p.score_percentage is not None and p.score_percentage >= 80)

    def course_cleared(course):
        """A course is cleared if every module in it is cleared."""
        if not course.modules:
            return False
        return all(module_cleared(m) for m in course.modules)

    def bracket_cleared(bracket):
        """All courses in a bracket are cleared."""
        bracket_courses = [c for c in courses if c.bracket == bracket]
        if not bracket_courses:
            return True  # No courses in bracket = assume cleared
        return all(course_cleared(c) for c in bracket_courses)

    child_cleared = bracket_cleared("Bracket 1")
    yp_cleared = bracket_cleared("Bracket 2")

    result = []
    previous_course_cleared = True  # First course is always unlocked

    for course in courses:
        # Bracket gate: higher brackets require preceding bracket to be fully cleared
        is_bracket_locked = False
        if course.bracket == "Bracket 2" and not child_cleared:
            is_bracket_locked = True
        elif course.bracket == "Bracket 3" and not (child_cleared and yp_cleared):
            is_bracket_locked = True

        modules_with_progress = []
        this_course_cleared = True
        for m in sorted(course.modules, key=lambda x: x.order):
            p = progress_map.get(m.id)
            cleared = module_cleared(m)
            if not cleared:
                this_course_cleared = False

            # Find first quiz attached to this module for "Skip to Quiz" shortcut
            first_quiz = m.quizzes[0] if m.quizzes else None

            modules_with_progress.append({
                "id": m.id,
                "title": m.title,
                "is_completed": cleared,
                "score_percentage": p.score_percentage if p else None,
                "first_quiz_id": first_quiz.id if first_quiz else None,
            })

        result.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "bracket": course.bracket,
            "level_tier": course.level_tier,
            "is_placement_test": course.is_placement_test,
            "is_locked": is_bracket_locked or not previous_course_cleared,
            "is_cleared": this_course_cleared,
            "modules": modules_with_progress
        })

        previous_course_cleared = this_course_cleared

    return result

@app.get("/courses/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Map user progress
    progress_map = {p.module_id: p for p in current_user.user_progress}
    
    modules_with_progress = []
    for m in sorted(course.modules, key=lambda x: x.order):
        p = progress_map.get(m.id)
        # Serialize quizzes with full question data
        quizzes_data = []
        for q in m.quizzes:
            quizzes_data.append({
                "id": q.id,
                "title": q.title,
                "is_diagnostic": q.is_diagnostic,
                "questions": [
                    {
                        "id": qq.id,
                        "question_text": qq.question_text,
                        "options": qq.options,
                        "correct_option_index": qq.correct_option_index,
                        "explanation": qq.explanation,
                    }
                    for qq in q.questions
                ]
            })
        modules_with_progress.append({
            "id": m.id,
            "title": m.title,
            "content": m.content,
            "examples": m.examples,
            "order": m.order,
            "is_completed": p.is_completed if p else False,
            "score_percentage": p.score_percentage if p else None,
            "quizzes": quizzes_data,
        })

    # Also include any course-level quizzes (placement tests)
    course_quizzes = []
    for q in (course.quizzes if hasattr(course, 'quizzes') else []):
        if q.course_id == course.id and q.module_id is None:
            course_quizzes.append({
                "id": q.id,
                "title": q.title,
                "is_diagnostic": q.is_diagnostic,
                "questions": [
                    {
                        "id": qq.id,
                        "question_text": qq.question_text,
                        "options": qq.options,
                        "correct_option_index": qq.correct_option_index,
                        "explanation": qq.explanation,
                    }
                    for qq in q.questions
                ]
            })
        
    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "bracket": course.bracket,
        "level_tier": course.level_tier,
        "is_placement_test": course.is_placement_test,
        "course_quizzes": course_quizzes,
        "modules": modules_with_progress,
    }

@app.get("/quiz/{quiz_id}")
def get_quiz(quiz_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Fetch a single quiz with all its questions."""
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return {
        "id": quiz.id,
        "title": quiz.title,
        "is_diagnostic": quiz.is_diagnostic,
        "module_id": quiz.module_id,
        "course_id": quiz.course_id,
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "options": q.options,
                "correct_option_index": q.correct_option_index,
                "explanation": q.explanation,
            }
            for q in quiz.questions
        ]
    }


@app.post("/courses/quiz/{quiz_id}/submit")
def submit_quiz(
    quiz_id: int, 
    answers: List[int], # List of correct_option_index provided by user
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    questions = quiz.questions
    if len(answers) != len(questions):
        raise HTTPException(status_code=400, detail="Incorrect number of answers")
    
    correct_count = 0
    for i, question in enumerate(questions):
        if answers[i] == question.correct_option_index:
            correct_count += 1
    
    score_percentage = (correct_count / len(questions)) * 100 if questions else 100
    
    # Update progress if it's a module quiz
    if quiz.module_id:
        passed = score_percentage >= 80
        progress = db.query(models.UserProgress).filter(
            models.UserProgress.user_id == current_user.id,
            models.UserProgress.module_id == quiz.module_id
        ).first()

        if not progress:
            progress = models.UserProgress(
                user_id=current_user.id,
                module_id=quiz.module_id,
                is_completed=passed,          # Only mark complete if 80%+
                score_percentage=int(score_percentage)
            )
            db.add(progress)
        else:
            # Always store the best score, but only unlock once they pass
            progress.score_percentage = max(progress.score_percentage or 0, int(score_percentage))
            if passed:
                progress.is_completed = True  # Only unlock on pass

        # Grant XP only on pass
        if passed:
            current_user.xp += 50
        
    # Handle Diagnostic Quiz (Skip Logic)
    if quiz.is_diagnostic and score_percentage >= 80:
        # Mark all modules in this course and potentially unlock next
        course = db.query(models.Course).filter(models.Course.id == quiz.course_id).first()
        for module in course.modules:
            existing_prog = db.query(models.UserProgress).filter(
                models.UserProgress.user_id == current_user.id,
                models.UserProgress.module_id == module.id
            ).first()
            if not existing_prog:
                db.add(models.UserProgress(user_id=current_user.id, module_id=module.id, is_completed=True))
        
        current_user.xp += 200 # Big bonus for skipping
        
    # Handle Placement Test Logic
    course = db.query(models.Course).filter(models.Course.id == quiz.course_id).first()
    if course and course.is_placement_test:
        current_user.placement_completed = True
        if score_percentage >= 80 or (current_user.age_bracket == "Child" and score_percentage > 0):
            # Unlock next level or skip beginner courses in this bracket
            # For now, let's mark all "Beginner" courses in their bracket as completed
            beginner_courses = db.query(models.Course).filter(
                models.Course.bracket == course.bracket,
                models.Course.level_tier == "Beginner"
            ).all()
            for bc in beginner_courses:
                for module in bc.modules:
                    existing_prog = db.query(models.UserProgress).filter(
                        models.UserProgress.user_id == current_user.id,
                        models.UserProgress.module_id == module.id
                    ).first()
                    if not existing_prog:
                        db.add(models.UserProgress(user_id=current_user.id, module_id=module.id, is_completed=True))
            current_user.xp += 500 # Placement bonus
    
    db.commit()
    return {"score": score_percentage, "passed": score_percentage >= 80}

@app.get("/leaderboard", response_model=List[schemas.User])
def get_leaderboard(db: Session = Depends(get_db)):
    return db.query(models.User).order_by(models.User.xp.desc()).limit(10).all()

# --- Expense Tracking Endpoints ---

@app.post("/expenses", response_model=schemas.Expense)
def create_expense(expense: schemas.ExpenseCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_expense = models.Expense(**expense.dict(), user_id=current_user.id)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.get("/expenses", response_model=List[schemas.Expense])
def list_expenses(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return current_user.expenses

@app.post("/expenses/predict")
def predict_expenses(current_user: models.User = Depends(get_current_user)):
    # This would load the model and predict
    # For now, let's look at how to implement this using the provided .pkl
    import pickle, numpy as np
    try:
        with open("model/expense_model.pkl", "rb") as f:
            model = pickle.load(f)
        # Placeholder input based on features from .ipynb
        # In a real app, we'd extract this from user's history
        prediction = model.predict([[1000, 200, 50, 10]]) # Mock input
        return {"predicted_next_month": float(prediction[0])}
    except Exception as e:
        return {"error": str(e)}

@app.get("/analysis")
def get_analysis(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    expenses = db.query(models.Expense).filter(models.Expense.user_id == current_user.id).all()
    
    if not expenses:
        return {"message": "No expenses found for analysis"}

    # Convert to DataFrame
    df = pd.DataFrame([
        {"Date": e.date, "Category": e.category, "Amount": e.amount}
        for e in expenses
    ])
    
    # Ensure Date is datetime
    df["Date"] = pd.to_datetime(df["Date"])
    df["Month"] = df["Date"].dt.to_period("M").astype(str)

    # 1. Monthly Spending Trend
    monthly_spending = df.groupby("Month")["Amount"].sum()
    plt.figure(figsize=(8,5))
    plt.style.use('dark_background')
    monthly_spending.plot(kind="line", marker="o", color="#00f3ff")
    plt.title("Monthly Spending Trend", color="white")
    plt.xlabel("Month", color="white")
    plt.ylabel("Total Spending ($)", color="white")
    plt.grid(True, alpha=0.1)
    plt.tight_layout()
    
    monthly_filename = f"static/monthly_{current_user.id}.png"
    plt.savefig(monthly_filename, transparent=True)
    plt.close()

    # 2. Spending by Category
    category_spending = df.groupby("Category")["Amount"].sum()
    plt.figure(figsize=(8,5))
    plt.style.use('dark_background')
    category_spending.plot(kind="bar", color="#7000ff")
    plt.title("Spending by Category", color="white")
    plt.xlabel("Category", color="white")
    plt.ylabel("Total Amount ($)", color="white")
    plt.tight_layout()
    
    category_filename = f"static/category_{current_user.id}.png"
    plt.savefig(category_filename, transparent=True)
    plt.close()

    highest_category = category_spending.idxmax()

    return {
        "highest_spending_category": highest_category,
        "monthly_spending_graph": f"http://localhost:8000/{monthly_filename}",
        "category_spending_graph": f"http://localhost:8000/{category_filename}"
    }

# --- AI Chatbot Endpoints (GROQ) ---

import os
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "your_groq_key_here")

@app.post("/chat/module")
async def chat_module(
    module_id: int, 
    user_query: str, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Simple RAG: Include module content in system prompt
    system_prompt = f"You are Long, the Wise Dragon Guardian of Prosperity. Answer the user's question ONLY based on this mission's content: {module.content}. Use a wise, mentor-like tone. If the answer isn't there, say that even a dragon's wisdom is limited to what is written here."
    
    import requests
    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
        json={
            "model": "mixtral-8x7b-32768",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query}
            ]
        }
    )
    return response.json()

@app.post("/chat/personal")
async def chat_personal(
    user_query: str, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    expenses = current_user.expenses
    expense_data = ", ".join([f"{e.category}: ${e.amount}" for e in expenses])
    
    system_prompt = f"You are Long, the Wise Dragon Guardian of Prosperity. Analyze these coins (expenses) for the traveler: {expense_data}. Provide concise, wise advice on how to protect their treasure and manage their gold."
    
    import requests
    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
        json={
            "model": "mixtral-8x7b-32768",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query}
            ]
        }
    )
    return response.json()

@app.post("/seed-data")
def seed_data(force: bool = False, db: Session = Depends(get_db)):
    if not force and db.query(models.Course).first():
        return {"message": "Data already seeded. Use ?force=true to re-seed."}
    
    if force:
        # Clear existing learning data
        db.query(models.UserProgress).delete()
        db.query(models.QuizQuestion).delete()
        db.query(models.Quiz).delete()
        db.query(models.Module).delete()
        db.query(models.Course).delete()
        db.commit()
    
    # helper for fast creation
    def add_course_full(title, desc, bracket, level, order=1, is_test=False, modules_data=[]):
        c = models.Course(title=title, description=desc, bracket=bracket, level_tier=level, order=order, is_placement_test=is_test)
        db.add(c)
        db.flush()
        if is_test:
            q = models.Quiz(course_id=c.id, title="Placement Test", is_diagnostic=True)
            db.add(q)
            db.flush()
            db.add(models.QuizQuestion(quiz_id=q.id, question_text=f"Expert check for {bracket}?", options='["Yes", "No"]', correct_option_index=0))
        
        for m_data in modules_data:
            m = models.Module(course_id=c.id, title=m_data['title'], content=m_data['content'], order=1)
            db.add(m)
            db.flush()
            if 'quiz' in m_data:
                q = models.Quiz(module_id=m.id, title=f"{m_data['title']} Quiz")
                db.add(q)
                db.flush()
                db.add(models.QuizQuestion(quiz_id=q.id, **m_data['quiz']))
        return c

    # Bracket 2: Young Professional (The core focus)
    # --- Budget Island ---
    c1 = add_course_full("🏝 Budget Island", "Begin your journey as an Apprentice Saver. Protect your gold from the bandits of waste.", "Bracket 2", "Beginner", 1, False, [
        {"title": "Level 1 – What is Money", "content": "🐉 Long: Young investor, gold flows like rivers. But wisdom decides where it goes. Money is the energy of your labor.", "quiz": {"question_text": "Is money just paper, or the energy of labor?", "options": '["Just Paper", "Energy of Labor"]', "correct_option_index": 1}},
        {"title": "Level 2 – Needs vs Wants", "content": "🐉 Long: You just received 1000 gold coins from the emperor. Bandits (expenses) are everywhere. Shelter is a need; silk robes are a desire.", "quiz": {"question_text": "Is rent a vital need or a desire?", "options": '["Vital Need", "Desire"]', "correct_option_index": 0}},
        {"title": "Level 3 – Budget Battle", "content": "Mission: Protect Your First Salary. Drag your coins into Rent, Food, and Savings. Defeat the waste monsters!", "quiz": {"question_text": "Should you pay yourself (savings) first?", "options": '["Yes", "No"]', "correct_option_index": 0}},
        {"title": "Boss Level – First Salary Challenge", "content": "Boss: The Debt Demon. You have 1000 gold. The bandits demand 800 for rent and food. How much do you keep for your future?", "quiz": {"question_text": "Keep 200 for your future?", "options": '["Yes", "No"]', "correct_option_index": 0}}
    ])

    # --- Savings Valley ---
    c2 = add_course_full("🏦 Savings Valley", "Master the flow of your gold. Build your fortress of security.", "Bracket 2", "Intermediate", 2, False, [
        {"title": "Level 4 – Emergency Funds", "content": "🐉 Long: Every dragon needs a hidden cave for the winter. These coins are for when the rains fall.", "quiz": {"question_text": "How many months of coins for an emergency?", "options": '["1 month", "3-6 months", "1 year"]', "correct_option_index": 1}},
        {"title": "Level 5 – Saving Strategies", "content": "Automating your hoard ensures it grows while you sleep.", "quiz": {"question_text": "Is automation wise for a dragon?", "options": '["Very Wise", "No"]', "correct_option_index": 0}},
        {"title": "Boss Level – Savings Simulator", "content": "A sudden storm hits! Your cave collapses. Do you have the emergency coins to rebuild?", "quiz": {"question_text": "Is your emergency fund ready?", "options": '["Ready", "Not Ready"]', "correct_option_index": 0}}
    ])

    # --- Investment City ---
    c3 = add_course_full("📈 Investment City", "Finalize your mastery. Let your gold multiply in the gardens of equity.", "Bracket 2", "Advanced", 3, False, [
        {"title": "Level 6 – Investing Basics", "content": "🐉 Long: Planting a seed leads to a tree of gold. Investing is planting for tomorrow.", "quiz": {"question_text": "Is investing for gambling or growth?", "options": '["Gambling", "Growth"]', "correct_option_index": 1}},
        {"title": "Level 7 – ETFs vs Stocks", "content": "A bundle of sticks (ETF) is harder to break than a single stick (Stock).", "quiz": {"question_text": "Is an ETF safer than one single stock?", "options": '["Yes", "No"]', "correct_option_index": 0}},
        {"title": "Boss Level – Investment Challenge", "content": "The market dragon is restless! Will your diversified portfolio survive the flames?", "quiz": {"question_text": "Is diversification your shield?", "options": '["Yes", "No"]', "correct_option_index": 0}}
    ])

    # Placement Tests & Other Brackets (Simplified to keep focus)
    add_course_full("🐉 Guardian's Entrance", "Prove your readiness to enter the Dragon Academy.", "Bracket 2", "Beginner", 0, True)
    
    add_course_full("Trial of the Young Dragon", "For the younger travelers.", "Bracket 1", "Beginner", 0, True)
    add_course_full("Dragon Coins 101", "Learning currency.", "Bracket 1", "Beginner", 1)

    add_course_full("The Alpha Hoard", "For the elder dragons.", "Bracket 3", "Beginner", 1)

    db.commit()
    return {"message": "Master Dragon Academy Curriculum seeded successfully!"}
