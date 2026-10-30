import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression

from sklearn.calibration import calibration_curve
from sklearn.metrics import (
    roc_auc_score,
    brier_score_loss
)


# ============================================================
# 1. PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "heart_prepared.csv"
)

RESULT_PATH = os.path.join(
    BASE_DIR,
    "data",
    "calibration_results.csv"
)


# ============================================================
# 2. LOAD DATA
# ============================================================

print("Loading prepared dataset...")

df = pd.read_csv(DATA_PATH)

print("Rows:", len(df))
print("Features:", len(df.columns) - 1)


# ============================================================
# 3. FEATURES / TARGET
# ============================================================

X = df.drop(columns=["target"])
y = df["target"]


# ============================================================
# 4. FEATURE GROUPS
# ============================================================

numeric_features = [
    "age",
    "trestbps",
    "chol",
    "thalach",
    "oldpeak"
]

binary_features = [
    "sex",
    "fbs",
    "exang"
]

categorical_features = [
    "cp",
    "restecg",
    "slope",
    "ca",
    "thal"
]


# ============================================================
# 5. PREPROCESSING
# ============================================================

numeric_pipeline = Pipeline([
    (
        "imputer",
        SimpleImputer(strategy="median")
    ),
    (
        "scaler",
        StandardScaler()
    )
])


categorical_pipeline = Pipeline([
    (
        "imputer",
        SimpleImputer(strategy="most_frequent")
    ),
    (
        "onehot",
        OneHotEncoder(handle_unknown="ignore")
    )
])


preprocessor = ColumnTransformer([
    (
        "numeric",
        numeric_pipeline,
        numeric_features
    ),
    (
        "binary",
        SimpleImputer(strategy="most_frequent"),
        binary_features
    ),
    (
        "categorical",
        categorical_pipeline,
        categorical_features
    )
])


# ============================================================
# 6. LOGISTIC REGRESSION
# ============================================================

model = Pipeline([
    (
        "preprocessor",
        preprocessor
    ),
    (
        "classifier",
        LogisticRegression(
            C=0.1,
            max_iter=2000,
            random_state=42
        )
    )
])


# ============================================================
# 7. OUT-OF-FOLD PREDICTIONS
# ============================================================

print("\nGenerating out-of-fold probabilities...")

cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)


probabilities = cross_val_predict(
    model,
    X,
    y,
    cv=cv,
    method="predict_proba"
)[:, 1]


print("Probability generation complete.")


# ============================================================
# 8. EVALUATE CALIBRATION
# ============================================================

roc_auc = roc_auc_score(
    y,
    probabilities
)

brier = brier_score_loss(
    y,
    probabilities
)


print("\n======================================")
print("CALIBRATION METRICS")
print("======================================")

print(
    "ROC-AUC:",
    round(roc_auc, 4)
)

print(
    "Brier Score:",
    round(brier, 4)
)


# ============================================================
# 9. CALIBRATION CURVE
# ============================================================

fraction_positive, mean_predicted = calibration_curve(
    y,
    probabilities,
    n_bins=8,
    strategy="quantile"
)


calibration_results = pd.DataFrame({
    "mean_predicted_probability": mean_predicted,
    "fraction_actual_positive": fraction_positive
})


print("\n======================================")
print("CALIBRATION CURVE DATA")
print("======================================")

print(
    calibration_results.round(4).to_string(index=False)
)


# ============================================================
# 10. SAVE RESULTS
# ============================================================

calibration_results.to_csv(
    RESULT_PATH,
    index=False
)


# ============================================================
# 11. CREATE CALIBRATION PLOT
# ============================================================

plt.figure(figsize=(7, 7))

plt.plot(
    [0, 1],
    [0, 1],
    linestyle="--",
    label="Perfect Calibration"
)

plt.plot(
    mean_predicted,
    fraction_positive,
    marker="o",
    label="Logistic Regression"
)

plt.xlabel("Mean Predicted Probability")
plt.ylabel("Fraction of Positive Cases")

plt.title("Heart Disease Model Calibration")

plt.legend()
plt.grid(True)

plt.tight_layout()

plot_path = os.path.join(
    BASE_DIR,
    "data",
    "calibration_curve.png"
)

plt.savefig(
    plot_path,
    dpi=150
)

plt.show()


# ============================================================
# 12. COMPLETE
# ============================================================

print("\n======================================")
print("CALIBRATION ANALYSIS COMPLETE")
print("======================================")

print("\nResults saved to:")
print(RESULT_PATH)

print("\nCalibration plot saved to:")
print(plot_path)