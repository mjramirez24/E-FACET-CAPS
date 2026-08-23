import pandas as pd
import numpy as np
from pmdarima import auto_arima

def forecast_arima(values: list[float], periods_ahead: int = 1,
                    promo_history: list[int] = None,
                    promo_future: list[int] = None):
    series = pd.Series(values)
    n = len(series)

    exog = None
    exog_future = None
    if promo_history is not None and len(promo_history) == n:
        exog = pd.DataFrame({"had_promo": promo_history})
        if promo_future is not None and len(promo_future) == periods_ahead:
            exog_future = pd.DataFrame({"had_promo": promo_future})
        else:
            exog_future = pd.DataFrame({"had_promo": [0] * periods_ahead})

    max_order = max(1, n // 5)
    max_p = min(3, max_order)
    max_q = min(3, max_order)
    max_d = 1 if n < 15 else 2

    model = auto_arima(
        series,
        X=exog,
        start_p=0, start_q=0,
        max_p=max_p, max_q=max_q,
        max_d=max_d,
        seasonal=False,
        stepwise=True,
        suppress_warnings=True,
        error_action="ignore",
        information_criterion="bic",
    )

    forecast, conf_int = model.predict(
        n_periods=periods_ahead,
        X=exog_future,
        return_conf_int=True,
    )

    forecast = np.asarray(forecast)
    conf_int = np.asarray(conf_int)

    # ✅ NEW: buong listahan ng forecast per period (buwan 1, 2, 3...),
    # hindi lang yung huling buwan — kailangan ito para sa totoong
    # multi-horizon projection (dati, basta minumultiply lang ang
    # single-month forecast, hindi totoong per-month prediction).
    points = [max(0, round(float(v))) for v in forecast]
    lows = [max(0, round(float(conf_int[i][0]))) for i in range(len(conf_int))]
    highs = [max(0, round(float(conf_int[i][1]))) for i in range(len(conf_int))]

    return {
        "point": points[0],
        "low": lows[0],
        "high": highs[0],
        "points": points,
        "lows": lows,
        "highs": highs,
        "model_used": "ARIMA" + (" + Promo" if exog is not None else ""),
        "order": str(model.order),
    }