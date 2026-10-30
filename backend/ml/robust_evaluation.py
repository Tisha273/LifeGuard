import os
import numpy as np
import pandas as pd

from sklearn.model_selection import RepeatedStratifiedKFold, cross_validate
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier


# ============================================================
# 1. FILE PATH
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "heart_prepared.csv"
)


# ============================================================
# 2. LOAD DATASET
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

# Numeric:
# Missing values -> median
# Scaling -> required for Logistic Regression

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


# Binary:
# Missing values -> most frequent

binary_pipeline = Pipeline([
    (
        "imputer",
        SimpleImputer(strategy="most_frequent")
    )
])


# Categorical:
# Missing values -> most frequent
# One-hot encoding

categorical_pipeline = Pipeline([
    (
        "imputer",
        SimpleImputer(strategy="most_frequent")
    ),
    (
        "onehot",
        OneHotEncoder(
            handle_unknown="ignore",
            sparse_output=False
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
        binary_pipeline,
        binary_features
    ),
    (
        "categorical",
        categorical_pipeline,
        categorical_features
    )
])


# ============================================================
# 6. MODELS
# ============================================================

models = {

    "Logistic Regression": Pipeline([
        (
            "preprocessor",
            preprocessor
        ),
        (
            "classifier",
            LogisticRegression(
                C=0.1,
                max_iter=5000,
                class_weight="balanced",
                random_state=42
            )
        )
    ]),

    "Random Forest": Pipeline([
        (
            "preprocessor",
            preprocessor
        ),
        (
            "classifier",
            RandomForestClassifier(
                n_estimators=300,
                max_depth=7,
                min_samples_leaf=4,
                min_samples_split=10,
                class_weight="balanced",
                random_state=42,
                n_jobs=-1
            )
        )
    ])
}


# ============================================================
# 7. SPECIFICITY SCORING
# ============================================================

from sklearn.metrics import make_scorer
from sklearn.metrics import confusion_matrix


def specificity_score(y_true, y_pred):

    tn, fp, fn, tp = confusion_matrix(
        y_true,
        y_pred,
        labels=[0, 1]
    ).ravel()

    if (tn + fp) == 0:
        return 0.0

    return tn / (tn + fp)


# ============================================================
# 8. SCORING METRICS
# ============================================================

scoring = {

    "accuracy": "accuracy",

    "precision": "precision",

    "recall": "recall",

    "f1": "f1",

    "roc_auc": "roc_auc",

    "specificity": make_scorer(
        specificity_score
    )
}


# ============================================================
# 9. REPEATED STRATIFIED CROSS VALIDATION
# ============================================================

cv = RepeatedStratifiedKFold(
    n_splits=5,
    n_repeats=5,
    random_state=42
)


# ============================================================
# 10. RUN EVALUATION
# ============================================================

results = []


print("\n======================================")
print("ROBUST MODEL EVALUATION")
print("======================================")

print("\nValidation strategy:")
print("5-fold Stratified Cross-Validation")
print("Repeated 5 times")
print("Total validation folds: 25")


for model_name, model in models.items():

    print("\n--------------------------------------")
    print("Evaluating:", model_name)
    print("--------------------------------------")

    scores = cross_validate(
        model,
        X,
        y,
        cv=cv,
        scoring=scoring,
        return_train_score=True,
        n_jobs=-1
    )

    result = {

        "Model": model_name,

        "Accuracy Mean":
            scores["test_accuracy"].mean(),

        "Accuracy Std":
            scores["test_accuracy"].std(),

        "Precision Mean":
            scores["test_precision"].mean(),

        "Precision Std":
            scores["test_precision"].std(),

        "Recall Mean":
            scores["test_recall"].mean(),

        "Recall Std":
            scores["test_recall"].std(),

        "Specificity Mean":
            scores["test_specificity"].mean(),

        "Specificity Std":
            scores["test_specificity"].std(),

        "F1 Mean":
            scores["test_f1"].mean(),

        "F1 Std":
            scores["test_f1"].std(),

        "ROC-AUC Mean":
            scores["test_roc_auc"].mean(),

        "ROC-AUC Std":
            scores["test_roc_auc"].std(),

        "Train ROC-AUC Mean":
            scores["train_roc_auc"].mean()
    }

    results.append(result)


# ============================================================
# 11. CREATE RESULTS TABLE
# ============================================================

results_df = pd.DataFrame(results)


# ============================================================
# 12. DISPLAY RESULTS
# ============================================================

print("\n======================================")
print("ROBUST EVALUATION RESULTS")
print("======================================")

display_columns = [
    "Model",
    "Accuracy Mean",
    "Accuracy Std",
    "Precision Mean",
    "Recall Mean",
    "Specificity Mean",
    "F1 Mean",
    "ROC-AUC Mean",
    "ROC-AUC Std",
    "Train ROC-AUC Mean"
]

print(
    results_df[display_columns].to_string(
        index=False
    )
)


# ============================================================
# 13. OVERFITTING CHECK
# ============================================================

print("\n======================================")
print("OVERFITTING CHECK")
print("======================================")

for _, row in results_df.iterrows():

    gap = (
        row["Train ROC-AUC Mean"]
        - row["ROC-AUC Mean"]
    )

    print(
        f"{row['Model']}: "
        f"Train ROC-AUC = {row['Train ROC-AUC Mean']:.4f}, "
        f"Validation ROC-AUC = {row['ROC-AUC Mean']:.4f}, "
        f"Gap = {gap:.4f}"
    )


# ============================================================
# 14. BEST MODEL
# ============================================================

best_index = results_df[
    "ROC-AUC Mean"
].idxmax()

best_model = results_df.loc[
    best_index,
    "Model"
]

best_auc = results_df.loc[
    best_index,
    "ROC-AUC Mean"
]


print("\n======================================")
print("BEST MODEL BY MEAN ROC-AUC")
print("======================================")

print("Model:", best_model)
print(
    "Mean ROC-AUC:",
    round(best_auc, 4)
)


# ============================================================
# 15. SAVE RESULTS
# ============================================================

OUTPUT_PATH = os.path.join(
    BASE_DIR,
    "robust_evaluation_results.csv"
)

results_df.to_csv(
    OUTPUT_PATH,
    index=False
)

print("\nResults saved to:")
print(OUTPUT_PATH)

print("\n======================================")
print("ROBUST EVALUATION COMPLETE")
print("======================================")