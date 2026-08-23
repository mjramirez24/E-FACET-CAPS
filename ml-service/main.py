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
    # ✅ NEW: optional promo exogenous data (galing sa admin toggle)
    promo_history: list[int] | None = None   # 0/1 per month, same length as `values`
    promo_future: list[int] | None = None    # 0/1 per forecasted period

MIN_POINTS_FOR_LSTM = 24

@app.post("/forecast")
def forecast(req: ForecastRequest):
    values = req.values

    if len(values) < 4:
        avg = sum(values) / len(values) if values else 0
        return {
            "point": round(avg), "low": round(avg * 0.7), "high": round(avg * 1.3),
            "model_used": "Average (insufficient data)",
        }

    # ✅ Kung may promo data na ipinasa (may laman ang list at tugma ang haba),
    # gamitin ang ARIMA+Promo — hindi LSTM, dahil wala pang exogenous support
    # ang LSTM natin ngayon. Mas mahalaga ang alam na "may promo" kaysa sa
    # pure sequence-pattern na kaya lang ng LSTM.
    has_promo_data = (
        req.promo_history is not None
        and len(req.promo_history) == len(values)
    )

    if has_promo_data:
        result = forecast_arima(
            values,
            req.periods_ahead,
            promo_history=req.promo_history,
            promo_future=req.promo_future,
        )
    elif len(values) >= MIN_POINTS_FOR_LSTM:
        result = forecast_lstm(values, req.periods_ahead)
    else:
        result = forecast_arima(values, req.periods_ahead)

    result["course"] = req.course
    result["data_points"] = len(values)
    return result

@app.post("/backtest")
def backtest(req: ForecastRequest):
    values = [float(v) for v in req.values]

    if len(values) < 5:
        return {
            "course": req.course,
            "actual": values[-1] if values else 0,
            "predicted": 0,
            "absolute_error": 0,
            "percent_error": 0,
            "model_used": "Not Enough Data",
        }

    actual = values[-1]
    train_values = values[:-1]

    try:
        if len(train_values) >= MIN_POINTS_FOR_LSTM:
            result = forecast_lstm(train_values, 1)
        else:
            result = forecast_arima(train_values, 1)

        predicted = float(result["point"])
        model_used = result.get("model_used", "ARIMA")

    except Exception as err:
        print(f"Backtest failed for {req.course}: {err}")

        predicted = round(
            sum(train_values) / len(train_values)
        )

        model_used = "Fallback Average"

    predicted = round(predicted)

    error = abs(actual - predicted)

    pct_error = (
        round((error / actual) * 100, 1)
        if actual > 0
        else 0
    )

    return {
        "course": req.course,
        "actual": round(actual),
        "predicted": predicted,
        "model_used": model_used,
        "absolute_error": round(error),
        "percent_error": pct_error,
    }