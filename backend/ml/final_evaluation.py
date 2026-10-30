import os
import warnings

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

from sklearn.linear_model import LogisticRegression

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
    brier_score_loss,
    roc_curve
)

from sklearn.calibration import calibration_curve

warnings.filterwarnings("ignore")


# ============================================================
# 1. PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "heart_prepared.csv"
)

RESULTS_PATH = os.path.join(
    BASE_DIR,
    "data",
    "final_evaluation_results.csv"
)

ROC_PATH = os.path.join(
    BASE_DIR,
    "data",
    "final_roc_curve.png"
)

CALIBRATION_PATH = os.path.join(
    BASE_DIR,
    "data",
    "final_calibration_curve.png"
)


# ============================================================
# 2. LOAD DATA
# ============================================================

print("Loading prepared dataset...")

df = pd.read_csv(DATA_PATH)

print("Rows:", len(df))
print("Features:", len(df.columns) - 1)


# ============================================================
# 3. SEPARATE FEATURES AND TARGET
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
# 5. TRAIN / TEST SPLIT
# ============================================================

print("\n======================================")
print("FINAL TRAIN / TEST SPLIT")
print("======================================")

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    stratify=y,
    random_state=42
)

print("Training rows:", len(X_train))
print("Test rows:", len(X_test))

print("\nTraining target distribution:")
print(y_train.value_counts().sort_index())

print("\nTest target distribution:")
print(y_test.value_counts().sort_index())


# ============================================================
# 6. PREPROCESSING
# ============================================================

numeric_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="median")
        ),
        (
            "scaler",
            StandardScaler()
        )
    ]
)


binary_pipeline = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="most_frequent")
        )
    ]
)


categorical_pipeline = Pipeline(
    steps=[
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
    ]
)


preprocessor = ColumnTransformer(
    transformers=[
        (
            "numeric",
            numeric_pipeline,
            numeric_features
        ),
        (
            "binary",
            binary_pipeline,
            binary_features
        ),
        (
            "categorical",
            categorical_pipeline,
            categorical_features
        )
    ]
)


# ============================================================
# 7. FINAL MODEL
# ============================================================

# Selected from our hyperparameter tuning:
# Logistic Regression
# Best C = 0.1

model = LogisticRegression(
    C=0.1,
    max_iter=2000,
    random_state=42
)


# ============================================================
# 8. COMPLETE PIPELINE
# ============================================================

final_pipeline = Pipeline(
    steps=[
        (
            "preprocessor",
            preprocessor
        ),
        (
            "classifier",
            model
        )
    ]
)


# ============================================================
# 9. TRAIN MODEL
# ============================================================

print("\n======================================")
print("TRAINING FINAL MODEL")
print("======================================")

final_pipeline.fit(
    X_train,
    y_train
)

print("Final Logistic Regression trained.")


# ============================================================
# 10. PREDICTIONS
# ============================================================

y_pred = final_pipeline.predict(X_test)

y_probability = final_pipeline.predict_proba(
    X_test
)[:, 1]


# ============================================================
# 11. CONFUSION MATRIX
# ============================================================

cm = confusion_matrix(
    y_test,
    y_pred
)

tn, fp, fn, tp = cm.ravel()


# ============================================================
# 12. METRICS
# ============================================================

accuracy = accuracy_score(
    y_test,
    y_pred
)

precision = precision_score(
    y_test,
    y_pred,
    zero_division=0
)

recall = recall_score(
    y_test,
    y_pred,
    zero_division=0
)

specificity = tn / (tn + fp)

f1 = f1_score(
    y_test,
    y_pred,
    zero_division=0
)

roc_auc = roc_auc_score(
    y_test,
    y_probability
)

brier = brier_score_loss(
    y_test,
    y_probability
)


# ============================================================
# 13. PRINT RESULTS
# ============================================================

print("\n======================================")
print("FINAL TEST SET RESULTS")
print("======================================")

print(f"Accuracy:     {accuracy:.4f}")
print(f"Precision:    {precision:.4f}")
print(f"Recall:       {recall:.4f}")
print(f"Specificity:  {specificity:.4f}")
print(f"F1 Score:     {f1:.4f}")
print(f"ROC-AUC:      {roc_auc:.4f}")
print(f"Brier Score:  {brier:.4f}")


# ============================================================
# 14. CONFUSION MATRIX
# ============================================================

print("\n======================================")
print("CONFUSION MATRIX")
print("======================================")

print("                 Predicted")
print("              No Disease  Disease")
print(
    f"Actual No     {tn:5d}       {fp:5d}"
)
print(
    f"Actual Yes    {fn:5d}       {tp:5d}"
)


# ============================================================
# 15. CLASSIFICATION REPORT
# ============================================================

print("\n======================================")
print("CLASSIFICATION REPORT")
print("======================================")

print(
    classification_report(
        y_test,
        y_pred,
        target_names=[
            "No Heart Disease",
            "Heart Disease"
        ],
        zero_division=0
    )
)


# ============================================================
# 16. ROC CURVE
# ============================================================

fpr, tpr, thresholds = roc_curve(
    y_test,
    y_probability
)

plt.figure(figsize=(8, 6))

plt.plot(
    fpr,
    tpr,
    label=f"Logistic Regression (AUC = {roc_auc:.3f})"
)

plt.plot(
    [0, 1],
    [0, 1],
    linestyle="--",
    label="Random Classifier"
)

plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")

plt.title(
    "Final Heart Disease Model - ROC Curve"
)

plt.legend()

plt.grid(True)

plt.tight_layout()

plt.savefig(
    ROC_PATH,
    dpi=150
)

plt.show()


# ============================================================
# 17. CALIBRATION CURVE
# ============================================================

prob_true, prob_pred = calibration_curve(
    y_test,
    y_probability,
    n_bins=8,
    strategy="uniform"
)

plt.figure(figsize=(8, 6))

plt.plot(
    [0, 1],
    [0, 1],
    linestyle="--",
    label="Perfect Calibration"
)

plt.plot(
    prob_pred,
    prob_true,
    marker="o",
    label="Logistic Regression"
)

plt.xlabel(
    "Mean Predicted Probability"
)

plt.ylabel(
    "Fraction of Positive Cases"
)

plt.title(
    "Final Heart Disease Model - Calibration Curve"
)

plt.legend()

plt.grid(True)

plt.tight_layout()

plt.savefig(
    CALIBRATION_PATH,
    dpi=150
)

plt.show()


# ============================================================
# 18. SAVE RESULTS
# ============================================================

results = pd.DataFrame(
    {
        "Model": [
            "Logistic Regression"
        ],
        "Test Size": [
            len(X_test)
        ],
        "Accuracy": [
            accuracy
        ],
        "Precision": [
            precision
        ],
        "Recall": [
            recall
        ],
        "Specificity": [
            specificity
        ],
        "F1": [
            f1
        ],
        "ROC-AUC": [
            roc_auc
        ],
        "Brier Score": [
            brier
        ],
        "True Negative": [
            tn
        ],
        "False Positive": [
            fp
        ],
        "False Negative": [
            fn
        ],
        "True Positive": [
            tp
        ]
    }
)

results.to_csv(
    RESULTS_PATH,
    index=False
)


# ============================================================
# 19. FINAL SUMMARY
# ============================================================

print("\n======================================")
print("FINAL EVALUATION COMPLETE")
print("======================================")

print("\nModel: Logistic Regression")
print("Hyperparameter: C = 0.1")

print("\nTest ROC-AUC:", round(roc_auc, 4))
print("Test Recall:", round(recall, 4))
print("Test Specificity:", round(specificity, 4))
print("Test F1:", round(f1, 4))
print("Brier Score:", round(brier, 4))

print("\nResults saved to:")
print(RESULTS_PATH)

print("\nROC curve saved to:")
print(ROC_PATH)

print("\nCalibration curve saved to:")
print(CALIBRATION_PATH)