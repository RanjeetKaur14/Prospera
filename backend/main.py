from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials, auth
import os
from typing import List, Optional
from collections import defaultdict

# Attempt to import groq, but don't fail if not installed
try:
    import groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    groq = None

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Firebase Admin SDK
cred = credentials.Certificate("firebase-adminsdk.json")
firebase_admin.initialize_app(cred)

# Load ML model and feature columns
model = joblib.load("model/expense_model.pkl")
feature_columns = joblib.load("model/expense_model_features.pkl")

# In-memory expense storage (for demo; replace with database in production)
expenses_db = defaultdict(list)

# Initialize Groq client only if key is set and package is available
groq_client = None
if GROQ_AVAILABLE:
    api_key = os.environ.get("GROQ_API_KEY")
    if api_key:
        try:
            groq_client = groq.Groq(api_key=api_key)
            print("Groq client initialized successfully.")
        except Exception as e:
            print(f"Failed to initialize Groq client: {e}")
    else:
        print("GROQ_API_KEY environment variable not set. AI suggestions will be disabled.")
else:
    print("groq package not installed. AI suggestions will be disabled.")

# Models
class Expense(BaseModel):
    category: str
    amount: float
    description: str = ""

class PredictionInput(BaseModel):
    food: float = 0
    entertainment: float = 0
    health: float = 0
    rent: float = 0
    shopping: float = 0
    travel: float = 0
    utilities: float = 0
    salary: float = 0

class AISuggestionsRequest(BaseModel):
    query: str = ""

# Dependency to get current user
async def get_current_user(authorization: str = Header(...)):
    token = authorization.split(" ").pop()
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# -------------------- Expense Endpoints --------------------
@app.post("/expenses")
async def add_expense(expense: Expense, user=Depends(get_current_user)):
    expense_dict = expense.dict()
    expense_dict["date"] = datetime.now().isoformat()
    expense_dict["id"] = len(expenses_db[user["uid"]]) + 1
    expenses_db[user["uid"]].append(expense_dict)
    return {"message": "Expense added", "id": expense_dict["id"]}

@app.get("/expenses")
async def get_expenses(user=Depends(get_current_user)):
    return expenses_db[user["uid"]]

@app.get("/expenses/monthly")
async def monthly_spending(user=Depends(get_current_user)):
    user_expenses = expenses_db[user["uid"]]
    monthly = defaultdict(float)
    for e in user_expenses:
        month = datetime.fromisoformat(e["date"]).strftime("%Y-%m")
        monthly[month] += e["amount"]
    result = [{"month": k, "total": v} for k, v in sorted(monthly.items())]
    return result

@app.get("/expenses/categories")
async def category_breakdown(user=Depends(get_current_user)):
    user_expenses = expenses_db[user["uid"]]
    categories = defaultdict(float)
    for e in user_expenses:
        categories[e["category"]] += e["amount"]
    result = [{"name": k, "value": v} for k, v in categories.items()]
    return result

@app.get("/expenses/projection")
async def spending_projection(months: int = 12, user=Depends(get_current_user)):
    user_expenses = expenses_db[user["uid"]]
    if not user_expenses:
        return []
    current_month = datetime.now().strftime("%Y-%m")
    current_total = sum(e["amount"] for e in user_expenses if datetime.fromisoformat(e["date"]).strftime("%Y-%m") == current_month)
    projection = []
    for i in range(1, months+1):
        month_date = datetime.now() + timedelta(days=30*i)
        month_str = month_date.strftime("%Y-%m")
        predicted = current_total * (1 + 0.05 * i)  # dummy growth
        projection.append({"month": month_str, "predicted": round(predicted, 2)})
    return projection

@app.get("/expenses/health-score")
async def health_score(user=Depends(get_current_user)):
    user_expenses = expenses_db[user["uid"]]
    if not user_expenses:
        return {"score": 50}
    monthly_totals = defaultdict(float)
    for e in user_expenses:
        month = datetime.fromisoformat(e["date"]).strftime("%Y-%m")
        monthly_totals[month] += e["amount"]
    if len(monthly_totals) < 2:
        return {"score": 60}
    values = list(monthly_totals.values())
    avg = np.mean(values)
    std = np.std(values)
    cv = std / avg if avg > 0 else 0
    score = max(0, min(100, int(100 - cv * 50)))
    return {"score": score}

@app.post("/expenses/predict")
async def predict_expenses(input_data: PredictionInput, user=Depends(get_current_user)):
    features = {col: 0 for col in feature_columns}
    mapping = {
        "food": "Food & Drink",
        "entertainment": "Entertainment",
        "health": "Health & Fitness",
        "rent": "Rent",
        "shopping": "Shopping",
        "travel": "Travel",
        "utilities": "Utilities",
    }
    for key, val in input_data.dict().items():
        if val > 0 and key in mapping:
            feat_name = mapping[key]
            if feat_name in features:
                features[feat_name] = val
    features["total_spending"] = sum(input_data.dict().values())
    features["prev_month_spending"] = 0
    features["avg_spending_last_3_months"] = 0
    features["spending_growth_rate"] = 0
    features["month_number"] = datetime.now().month
    input_array = np.array([features[col] for col in feature_columns]).reshape(1, -1)
    prediction = model.predict(input_array)[0]
    return {"predicted_next_month_spending": float(prediction)}

@app.post("/expenses/ai-suggestions")
async def ai_suggestions(request: AISuggestionsRequest, user=Depends(get_current_user)):
    if groq_client is None:
        return {"suggestions": "AI suggestions are currently unavailable. Please set the GROQ_API_KEY environment variable and restart the server."}
    
    user_expenses = expenses_db[user["uid"]]
    total_spent = sum(e["amount"] for e in user_expenses)
    categories = defaultdict(float)
    for e in user_expenses:
        categories[e["category"]] += e["amount"]
    top_category = max(categories.items(), key=lambda x: x[1])[0] if categories else "None"
    
    prompt = f"""You are a financial advisor. The user has spent a total of ₹{total_spent:.2f} across categories: {dict(categories)}.
The highest spending category is {top_category}.
Based on this, provide personalized financial advice. If the user asks a specific question, answer it. User query: "{request.query}"
Keep advice concise, practical, and encouraging."""
    
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a helpful financial coach."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        suggestions = response.choices[0].message.content
    except Exception as e:
        suggestions = f"AI service temporarily unavailable: {str(e)}"
    
    return {"suggestions": suggestions}