import os
import numpy as np
import pandas as pd

from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)


# ============================================================
# 1. FILE PATH
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "heart_prepared.csv"
)

OUTPUT_PATH = os.path.join(
    BASE_DIR,
    "data",
    "threshold_analysis_results.csv"
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
        OneHotEncoder(
            handle_unknown="ignore"
        )
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
# 6. LOGISTIC REGRESSION MODEL
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
# 7. OUT-OF-FOLD PROBABILITIES
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

print(
    "\nOverall ROC-AUC:",
    round(
        roc_auc_score(y, probabilities),
        4
    )
)


# ============================================================
# 8. THRESHOLD ANALYSIS
# ============================================================

thresholds = np.arange(
    0.20,
    0.81,
    0.05
)


results = []


print("\n======================================")
print("THRESHOLD ANALYSIS")
print("======================================")

for threshold in thresholds:

    predictions = (
        probabilities >= threshold
    ).astype(int)

    tn, fp, fn, tp = confusion_matrix(
        y,
        predictions
    ).ravel()

    accuracy = accuracy_score(
        y,
        predictions
    )

    precision = precision_score(
        y,
        predictions,
        zero_division=0
    )

    recall = recall_score(
        y,
        predictions,
        zero_division=0
    )

    specificity = tn / (tn + fp)

    f1 = f1_score(
        y,
        predictions,
        zero_division=0
    )

    results.append({
        "threshold": round(threshold, 2),
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "specificity": specificity,
        "f1": f1,
        "true_positive": tp,
        "true_negative": tn,
        "false_positive": fp,
        "false_negative": fn
    })


results_df = pd.DataFrame(results)


# ============================================================
# 9. DISPLAY RESULTS
# ============================================================

display_columns = [
    "threshold",
    "accuracy",
    "precision",
    "recall",
    "specificity",
    "f1",
    "false_positive",
    "false_negative"
]

print(
    results_df[
        display_columns
    ].round(4).to_string(index=False)
)


# ============================================================
# 10. FIND BEST THRESHOLDS
# ============================================================

best_f1 = results_df.loc[
    results_df["f1"].idxmax()
]

best_recall = results_df.loc[
    results_df["recall"].idxmax()
]

best_balanced = results_df.loc[
    (
        results_df["recall"] +
        results_df["specificity"]
    ).idxmax()
]


print("\n======================================")
print("BEST THRESHOLDS")
print("======================================")


print("\nBest F1 threshold:")
print(
    "Threshold:",
    best_f1["threshold"]
)

print(
    "F1:",
    round(best_f1["f1"], 4)
)

print(
    "Recall:",
    round(best_f1["recall"], 4)
)

print(
    "Specificity:",
    round(best_f1["specificity"], 4)
)


print("\nBest Recall threshold:")
print(
    "Threshold:",
    best_recall["threshold"]
)

print(
    "Recall:",
    round(best_recall["recall"], 4)
)

print(
    "Specificity:",
    round(best_recall["specificity"], 4)
)


print("\nBest balanced threshold:")
print(
    "Threshold:",
    best_balanced["threshold"]
)

print(
    "Recall:",
    round(best_balanced["recall"], 4)
)

print(
    "Specificity:",
    round(best_balanced["specificity"], 4)
)


# ============================================================
# 11. SAVE RESULTS
# ============================================================

results_df.to_csv(
    OUTPUT_PATH,
    index=False
)


print("\n======================================")
print("THRESHOLD ANALYSIS COMPLETE")
print("======================================")

print(
    "Results saved to:"
)

print(OUTPUT_PATH)