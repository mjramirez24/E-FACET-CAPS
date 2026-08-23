# evaluate_model.py
"""
Standalone script para sa Chapter 4 - Model Training/Evaluation Report.
Hindi ito bahagi ng live system; isang beses lang patakbuhin, kunin ang
mga resulta (table + chart) para sa documentation.
"""

import sys
import os
import numpy as np
import mysql.connector
from datetime import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from models.lstm_forecaster import forecast_lstm
from models.arima_forecaster import forecast_arima

MIN_POINTS_FOR_LSTM = 24

# ✅ Palitan ng tama mong DB credentials (parehong laman ng backend .env mo)
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "efacet",
}


def fetch_monthly_data():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT
            DATE_FORMAT(sr.created_at, '%Y-%m') AS month,
            c.course_name,
            COUNT(*) AS total
        FROM schedule_reservations sr
        LEFT JOIN courses c ON c.id = sr.course_id
        WHERE sr.created_at >= '2025-01-01'
        GROUP BY month, sr.course_id, c.course_name
        ORDER BY month ASC
    """)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    course_map = {}
    for r in rows:
        course = r["course_name"] or "Unspecified"
        course_map.setdefault(course, {})[r["month"]] = int(r["total"])

    result = {}
    for course, monthly in course_map.items():
        months = sorted(monthly.keys())
        result[course] = [monthly[m] for m in months]

    return result


def walk_forward_evaluate(values, min_train_size=6):
    """
    Sinusubukan ang model sa BAWAT posibleng cutoff point (hindi lang isa),
    para makuha ang mas matatag/maaasahang accuracy metrics.
    Halimbawa: kung 20 buwan meron, susubukan ang forecast sa buwan 7, 8, 9... 20,
    gamit lang ang data bago ang bawat buwan bilang training set.
    """
    actuals, predicteds, models_used = [], [], []

    for i in range(min_train_size, len(values)):
        train = values[:i]
        actual = values[i]

        try:
            if len(train) >= MIN_POINTS_FOR_LSTM:
                result = forecast_lstm(train, 1)
            else:
                result = forecast_arima(train, 1)
            predicted = result["point"]
            model_used = result["model_used"]
        except Exception as e:
            predicted = round(sum(train) / len(train))
            model_used = "Fallback Average"

        actuals.append(actual)
        predicteds.append(predicted)
        models_used.append(model_used)

    return actuals, predicteds, models_used


def compute_metrics(actuals, predicteds):
    actuals = np.array(actuals, dtype=float)
    predicteds = np.array(predicteds, dtype=float)

    errors = actuals - predicteds
    abs_errors = np.abs(errors)

    mae = np.mean(abs_errors)
    rmse = np.sqrt(np.mean(errors ** 2))

    nonzero_mask = actuals > 0
    mape = (
        np.mean(abs_errors[nonzero_mask] / actuals[nonzero_mask]) * 100
        if nonzero_mask.any() else 0
    )

    ss_res = np.sum(errors ** 2)
    ss_tot = np.sum((actuals - np.mean(actuals)) ** 2)
    r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0

    return {
        "MAE": round(mae, 2),
        "RMSE": round(rmse, 2),
        "MAPE": round(mape, 1),
        "R2": round(r2, 3),
        "n_predictions": len(actuals),
    }


def main():
    print("=" * 70)
    print("E-FACET ENROLLMENT FORECAST — MODEL TRAINING/EVALUATION REPORT")
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    course_data = fetch_monthly_data()

    all_actuals, all_predicteds = [], []
    per_course_results = []

    for course, values in course_data.items():
        if len(values) < 7:
            print(f"\n⚠️  Skipping '{course}' — only {len(values)} months, need at least 7.")
            continue

        actuals, predicteds, models_used = walk_forward_evaluate(values, min_train_size=8)
        metrics = compute_metrics(actuals, predicteds)

        model_summary = models_used[-1] if models_used else "N/A"

        per_course_results.append({
            "course": course,
            "data_points": len(values),
            "predictions_tested": metrics.pop("n_predictions"),
            "model_used_latest": model_summary,
            **metrics,
        })

        all_actuals.extend(actuals)
        all_predicteds.extend(predicteds)

    # ---- Per-course table ----
    print("\n\nPER-COURSE MODEL EVALUATION")
    print("-" * 100)
    print(f"{'Course':<35}{'Data Pts':<10}{'Tested':<10}{'MAE':<8}{'RMSE':<8}{'MAPE':<10}{'R2':<8}{'Model':<15}")
    print("-" * 100)
    for r in per_course_results:
        print(f"{r['course']:<35}{r['data_points']:<10}{r['predictions_tested']:<10}"
              f"{r['MAE']:<8}{r['RMSE']:<8}{r['MAPE']:<9}%{r['R2']:<8}{r['model_used_latest']:<15}")

    # ---- Overall summary ----
    overall = compute_metrics(all_actuals, all_predicteds)
    print("\n\nOVERALL MODEL ACCURACY (ALL COURSES COMBINED)")
    print("-" * 50)
    print(f"Total predictions tested : {overall['n_predictions']}")
    print(f"Mean Absolute Error (MAE): {overall['MAE']} students")
    print(f"Root Mean Squared Error  : {overall['RMSE']} students")
    print(f"Mean Absolute % Error    : {overall['MAPE']}%")
    print(f"R-squared (R2)           : {overall['R2']}")
    print("=" * 70)

    # ---- Save to CSV for easy pasting into Word/Excel ----
    import csv
    with open("model_evaluation_report.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "course", "data_points", "predictions_tested",
            "MAE", "RMSE", "MAPE", "R2", "model_used_latest"
        ])
        writer.writeheader()
        writer.writerows(per_course_results)

    print("\n✅ Saved detailed results to model_evaluation_report.csv")


if __name__ == "__main__":
    main()