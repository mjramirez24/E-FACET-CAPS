
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

WINDOW_SIZE = 3

def build_sequences(values, window=WINDOW_SIZE):
    X, y = [], []

    for i in range(len(values) - window):
        X.append(values[i:i + window])
        y.append(values[i + window])

    return np.array(X), np.array(y)


def forecast_lstm(values: list[float], periods_ahead: int = 1):

    values = np.asarray(values, dtype=float)

    if values.ndim != 1 or not np.all(np.isfinite(values)):
        raise ValueError("Enrollment values must be finite numbers.")

    if len(values) <= WINDOW_SIZE:
        raise ValueError("Insufficient data for LSTM forecasting.")

    if periods_ahead < 1:
        raise ValueError("periods_ahead must be at least 1.")

    # Normalize using training data only
    mean = values.mean()
    std = values.std()

    if std == 0:
        std = 1.0

    norm = (values - mean) / std

    X, y = build_sequences(norm)

    X = X.reshape((X.shape[0], WINDOW_SIZE, 1))

    # Reproducibility
    np.random.seed(42)
    tf.random.set_seed(42)

    model = keras.Sequential([
        layers.Input(shape=(WINDOW_SIZE, 1)),
        layers.LSTM(8, activation="tanh"),
        layers.Dense(4, activation="relu"),
        layers.Dense(1)
    ])

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss="mse"
    )

    early_stopping = keras.callbacks.EarlyStopping(
        monitor="val_loss",
        patience=10,
        restore_best_weights=True
    )

    model.fit(
        X,
        y,
        epochs=100,
        batch_size=4,
        validation_split=0.2,
        shuffle=False,
        callbacks=[early_stopping],
        verbose=0
    )

    # Recursive multi-period forecasting
    window = list(norm[-WINDOW_SIZE:])
    predictions = []

    for _ in range(periods_ahead):

        x_input = np.asarray(
            window[-WINDOW_SIZE:],
            dtype=np.float32
        ).reshape(1, WINDOW_SIZE, 1)

        # Direct inference instead of model.predict()
        pred_norm = float(
            model(x_input, training=False).numpy()[0][0]
        )

        predictions.append(pred_norm)
        window.append(pred_norm)

    # Convert predictions back to original scale
    predictions_real = [
        p * std + mean for p in predictions
    ]

    points = [
        max(0, round(p))
        for p in predictions_real
    ]

    # Heuristic uncertainty range.
    # This is not a statistically calibrated prediction interval.
    base_spread = max(1, round(std * 0.8))

    spreads = [
        max(1, round(base_spread * np.sqrt(i + 1)))
        for i in range(len(points))
    ]

    lows = [
        max(0, points[i] - spreads[i])
        for i in range(len(points))
    ]

    highs = [
        points[i] + spreads[i]
        for i in range(len(points))
    ]

    return {
        "point": points[0],
        "low": lows[0],
        "high": highs[0],
        "points": points,
        "lows": lows,
        "highs": highs,
        "model_used": "LSTM"
    }
