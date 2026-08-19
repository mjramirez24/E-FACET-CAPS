# main.py
from fastapi import FastAPI
from pydantic import BaseModel
from models.lstm_forecaster import forecast_lstm
from models.arima_forecaster import forecast_arima

app = FastAPI()

class ForecastRequest(BaseModel):
    course: str
    values: list[float]     # chronological, oldest -> newest
    periods_ahead: int = 1

MIN_POINTS_FOR_LSTM = 18

@app.post("/forecast")
def forecast(req: ForecastRequest):
    values = req.values

    if len(values) < 4:
        avg = sum(values) / len(values) if values else 0
        return {
            "point": round(avg), "low": round(avg * 0.7), "high": round(avg * 1.3),
            "model_used": "Average (insufficient data)",
        }

    if len(values) >= MIN_POINTS_FOR_LSTM:
        result = forecast_lstm(values, req.periods_ahead)
    else:
        result = forecast_arima(values, req.periods_ahead)

    result["course"] = req.course
    result["data_points"] = len(values)
    return result