# models/lstm_forecaster.py
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

np.random.seed(42)
tf.random.set_seed(42)

WINDOW_SIZE = 3

def build_sequences(values, window=WINDOW_SIZE):
    X, y = [], []
    for i in range(len(values) - window):
        X.append(values[i:i+window])
        y.append(values[i+window])
    return np.array(X), np.array(y)

def forecast_lstm(values: list[float], periods_ahead: int = 1):
    values = np.array(values, dtype=float)
    mean, std = values.mean(), values.std() or 1
    norm = (values - mean) / std

    X, y = build_sequences(norm)
    X = X.reshape((X.shape[0], X.shape[1], 1))

    model = keras.Sequential([
        layers.Input(shape=(WINDOW_SIZE, 1)),
        layers.LSTM(16, activation="tanh"),
        layers.Dense(8, activation="relu"),
        layers.Dense(1),
    ])
    model.compile(optimizer="adam", loss="mse")
    model.fit(X, y, epochs=100, verbose=0)

    window = list(norm[-WINDOW_SIZE:])
    preds = []
    for _ in range(periods_ahead):
        x_input = np.array(window[-WINDOW_SIZE:]).reshape(1, WINDOW_SIZE, 1)
        pred_norm = model.predict(x_input, verbose=0)[0][0]
        preds.append(pred_norm)
        window.append(pred_norm)

    preds_real = [p * std + mean for p in preds]

    # ✅ NEW: per-period na listahan (buwan 1, 2, 3...), hindi lang huling
    # buwan. Palawak nang palawak ang spread/uncertainty range habang
    # papalayo ang horizon — makatuwiran ito dahil mas hindi tiyak ang
    # prediction sa mas malayong hinaharap.
    points = [max(0, round(p)) for p in preds_real]
    base_spread = max(1, round(std * 0.8))
    spreads = [max(1, round(base_spread * np.sqrt(i + 1))) for i in range(len(points))]
    lows = [max(0, points[i] - spreads[i]) for i in range(len(points))]
    highs = [points[i] + spreads[i] for i in range(len(points))]

    return {
        "point": points[0],
        "low": lows[0],
        "high": highs[0],
        "points": points,
        "lows": lows,
        "highs": highs,
        "model_used": "LSTM",
    }