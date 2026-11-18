
import pandas as pd
import numpy as np
from pmdarima import auto_arima


def forecast_arima(
    values: list[float],
    periods_ahead: int = 1,
    promo_history: list[int] = None,
    promo_future: list[int] = None
):
    series = pd.Series(values)
    n = len(series)

    if n < 3:
        raise ValueError("Insufficient enrollment history.")

    if periods_ahead < 1:
        raise ValueError("periods_ahead must be at least 1.")

    exog = None
    exog_future = None

    if promo_history is not None:

        if len(promo_history) != n:
            raise ValueError(
                "Promo history length must match enrollment history."
            )

        if promo_future is None:
            raise ValueError(
                "Future promotion schedule must be provided."
            )

        if len(promo_future) != periods_ahead:
            raise ValueError(
                "Promo future length must match forecast horizon."
            )

        if not all(v in (0, 1) for v in promo_history + promo_future):
            raise ValueError("Promotion values must be 0 or 1.")

        exog = pd.DataFrame({
            "had_promo": promo_history
        })

        exog_future = pd.DataFrame({
            "had_promo": promo_future
        })

    max_order = max(1, n // 5)
    max_p = min(3, max_order)
    max_q = min(3, max_order)
    max_d = 1 if n < 15 else 2

    model = auto_arima(
        series,
        X=exog,
        start_p=0,
        start_q=0,
        max_p=max_p,
        max_q=max_q,
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

    points = [
        max(0, round(float(v)))
        for v in forecast
    ]

    lows = [
        max(0, round(float(conf_int[i][0])))
        for i in range(len(conf_int))
    ]

    highs = [
        max(0, round(float(conf_int[i][1])))
        for i in range(len(conf_int))
    ]

    return {
        "point": points[0],
        "low": lows[0],
        "high": highs[0],
        "points": points,
        "lows": lows,
        "highs": highs,
        "model_used": "ARIMA" + (
            " + Promo" if exog is not None else ""
        ),
        "order": str(model.order),
    }
