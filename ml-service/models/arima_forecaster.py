# models/arima_forecaster.py
import pandas as pd
import numpy as np
from pmdarima import auto_arima

def forecast_arima(values: list[float], periods_ahead: int = 1):
    series = pd.Series(values)

    model = auto_arima(
        series,
        start_p=0, start_q=0, max_p=3, max_q=3,
        seasonal=False,
        stepwise=True,
        suppress_warnings=True,
        error_action="ignore",
    )

    forecast, conf_int = model.predict(n_periods=periods_ahead, return_conf_int=True)

    # ✅ FIX: i-convert muna sa numpy array para positional ang indexing
    forecast = np.asarray(forecast)
    conf_int = np.asarray(conf_int)

    point = max(0, round(float(forecast[-1])))
    low = max(0, round(float(conf_int[-1][0])))
    high = max(0, round(float(conf_int[-1][1])))

    return {
        "point": point,
        "low": low,
        "high": high,
        "model_used": "ARIMA",
        "order": str(model.order),
    }