
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from models.lstm_forecaster import forecast_lstm
from models.arima_forecaster import forecast_arima

app = FastAPI()

class ForecastRequest(BaseModel):
    course: str
    values: list[float]  # chronological, oldest -> newest
    periods_ahead: int = Field(default=1, ge=1)
    promo_history: list[int] | None = None
    promo_future: list[int] | None = None


MIN_POINTS_FOR_LSTM = 24


@app.post("/forecast")
def forecast(req: ForecastRequest):
    values = req.values

    if not values:
        raise HTTPException(
            status_code=422,
            detail="Enrollment values cannot be empty."
        )

    if any(v < 0 for v in values):
        raise HTTPException(
            status_code=422,
            detail="Enrollment values cannot be negative."
        )

    # Validate promotion inputs
    if req.promo_history is not None:

        if len(req.promo_history) != len(values):
            raise HTTPException(
                status_code=422,
                detail="Promo history must match enrollment history."
            )

        if req.promo_future is None:
            raise HTTPException(
                status_code=422,
                detail="Future promotion schedule is required."
            )

        if len(req.promo_future) != req.periods_ahead:
            raise HTTPException(
                status_code=422,
                detail="Promo future must match forecast horizon."
            )

        if not all(v in (0, 1) for v in req.promo_history):
            raise HTTPException(
                status_code=422,
                detail="Promo history values must be 0 or 1."
            )

        if not all(v in (0, 1) for v in req.promo_future):
            raise HTTPException(
                status_code=422,
                detail="Promo future values must be 0 or 1."
            )

    # Insufficient historical data
    if len(values) < 4:
        avg = sum(values) / len(values)

        return {
            "point": round(avg),
            "low": round(avg * 0.7),
            "high": round(avg * 1.3),
            "points": [round(avg)] * req.periods_ahead,
            "lows": [round(avg * 0.7)] * req.periods_ahead,
            "highs": [round(avg * 1.3)] * req.periods_ahead,
            "model_used": "Average (insufficient data)",
            "course": req.course,
            "data_points": len(values),
        }

    has_promo_data = req.promo_history is not None

    try:

        if has_promo_data:
            result = forecast_arima(
                values,
                periods_ahead=req.periods_ahead,
                promo_history=req.promo_history,
                promo_future=req.promo_future,
            )

        elif len(values) >= MIN_POINTS_FOR_LSTM:
            result = forecast_lstm(
                values,
                req.periods_ahead
            )

        else:
            result = forecast_arima(
                values,
                req.periods_ahead
            )

        result["course"] = req.course
        result["data_points"] = len(values)

        return result

    except Exception as err:
        print(f"Forecast failed for {req.course}: {err}")

        raise HTTPException(
            status_code=500,
            detail="Unable to generate enrollment forecast."
        )


@app.post("/backtest")
def backtest(req: ForecastRequest):
    values = req.values

    if not values:
        raise HTTPException(
            status_code=422,
            detail="Enrollment values cannot be empty."
        )

    if any(v < 0 for v in values):
        raise HTTPException(
            status_code=422,
            detail="Enrollment values cannot be negative."
        )

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
