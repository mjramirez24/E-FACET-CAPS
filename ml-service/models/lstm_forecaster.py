# models/lstm_forecaster.py
import numpy as np
from tensorflow import keras
from tensorflow.keras import layers

WINDOW_SIZE = 3  # gumagamit ng past 3 periods para i-predict ang next

def build_sequences(values, window=WINDOW_SIZE):
    X, y = [], []
    for i in range(len(values) - window):
        X.append(values[i:i+window])
        y.append(values[i+window])
    return np.array(X), np.array(y)

def forecast_lstm(values: list[float], periods_ahead: int = 1):
    values = np.array(values, dtype=float)

    # normalize (importante sa neural networks)
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

    # rolling forecast for N periods ahead
    window = list(norm[-WINDOW_SIZE:])
    preds = []
    for _ in range(periods_ahead):
        x_input = np.array(window[-WINDOW_SIZE:]).reshape(1, WINDOW_SIZE, 1)
        pred_norm = model.predict(x_input, verbose=0)[0][0]
        preds.append(pred_norm)
        window.append(pred_norm)

    preds_real = [p * std + mean for p in preds]
    point = max(0, round(preds_real[-1]))
    spread = max(1, round(std * 0.8))

    return {
        "point": point,
        "low": max(0, point - spread),
        "high": point + spread,
        "model_used": "LSTM",
    }