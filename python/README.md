# Student Dashboard ML Prediction API

This is a FastAPI-based machine learning service that predicts course completion dates using Linear Regression.

## Setup

1. **Create virtual environment (if not exists):**
   ```bash
   python -m venv venv
   ```

2. **Activate virtual environment:**
   ```bash
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Running the API

```bash
uvicorn api:app --reload --port 8000
```

The API will be available at: `http://127.0.0.1:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## Endpoint

### POST `/predict`

Predicts completion date based on study sessions and remaining work.

**Request Body:**
```json
{
  "sessions": [
    {"date": "2026-02-10", "hours": 2.5},
    {"date": "2026-02-11", "hours": 3.0},
    {"date": "2026-02-12", "hours": 1.5}
  ],
  "remaining_hours": 24.0
}
```

**Response (Success):**
```json
{
  "status": "success",
  "predicted_date": "2026-03-15",
  "velocity_hours_per_day": 2.3
}
```

**Response (Insufficient Data):**
```json
{
  "status": "insufficient_data",
  "message": "Need at least 3 study sessions to predict."
}
```

**Response (Stalled):**
```json
{
  "status": "stalled",
  "message": "Velocity is zero or negative."
}
```

## Algorithm

Uses **Linear Regression** to:
1. Calculate study velocity (hours per day)
2. Project when remaining hours will be completed
3. Return predicted completion date

## CORS Configuration

Configured to allow requests from:
- `http://localhost:3000` (Next.js dev server)
- `http://127.0.0.1:3000`
