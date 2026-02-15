from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
import numpy as np
from sklearn.linear_model import LinearRegression

app = FastAPI()

# Configure CORS to allow requests from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class StudySession(BaseModel):
    date: str  # Format: "YYYY-MM-DD"
    hours: float

class PredictionRequest(BaseModel):
    sessions: list[StudySession]
    remaining_hours: float

@app.post("/predict")
def predict_completion(data: PredictionRequest):
    if len(data.sessions) < 3:
        return {"status": "insufficient_data", "message": "Need at least 3 study sessions to predict."}

    # 1. Prepare Data for Linear Regression
    # X = Days since start, Y = Cumulative Hours
    dates = [datetime.strptime(s.date, "%Y-%m-%d") for s in data.sessions]
    start_date = min(dates)
    days_since_start = np.array([(d - start_date).days for d in dates]).reshape(-1, 1)
    
    # Cumulative sum of hours
    hours = [s.hours for s in data.sessions]
    cumulative_hours = np.cumsum(hours)
    
    # 2. Train Model
    model = LinearRegression()
    model.fit(days_since_start, cumulative_hours)
    
    # 3. Predict Future
    # We need to reach (Current Total + Remaining Hours)
    current_total = cumulative_hours[-1]
    target_total = current_total + data.remaining_hours
    
    # Logic: velocity = slope (hours per day)
    velocity = model.coef_[0]
    
    if velocity <= 0:
        return {"status": "stalled", "message": "Velocity is zero or negative."}
        
    days_needed = (target_total - model.intercept_) / velocity
    
    # 4. Result
    finish_date = start_date + timedelta(days=int(days_needed))
    
    return {
        "status": "success",
        "predicted_date": finish_date.strftime("%Y-%m-%d"),
        "velocity_hours_per_day": round(velocity, 2)
    }

# To run: uvicorn api:app --reload --port 8000