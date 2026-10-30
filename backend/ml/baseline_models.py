import os
import pandas as pd

from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC


# ============================================================
# 1. FILE PATH
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "processed.cleveland.data"
)


# ============================================================
# 2. COLUMN NAMES
# ============================================================

columns = [
    "age",
    "sex",
    "cp",
    "trestbps",
    "chol",
    "fbs",
    "restecg",
    "thalach",
    "exang",
    "oldpeak",
    "slope",
    "ca",
    "thal",
    "num"
]


# ============================================================
# 3. LOAD DATA
# ============================================================

print("Loading dataset...")

df = pd.read_csv(
    DATA_PATH,
    names=columns,
    na_values="?"
)


# ============================================================
# 4. CONVERT DATA
# ============================================================

for column in columns:
    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    )


# ============================================================
# 5. CREATE BINARY TARGET
# ============================================================

df["target"] = (df["num"] > 0).astype(int)

df = df.drop(
    columns=["num"]
)


# ============================================================
# 6. FEATURES / TARGET
# ============================================================

X = df.drop(
    columns=["target"]
)

y = df["target"]


# ============================================================
# 7. FEATURE GROUPS
# ============================================================

numeric_features = [
    "age",
    "trestbps",
    "chol",
    "thalach",
    "oldpeak"
]

categorical_features = [
    "sex",
    "cp",
    "fbs",
    "restecg",
    "exang",
    "slope",
    "ca",
    "thal"
]


# ============================================================
# 8. PREPROCESSING
# ============================================================

numeric_transformer = Pipeline([
    (
        "imputer",
        SimpleImputer(strategy="median")
    ),
    (
        "scaler",
        StandardScaler()
    )
])


categorical_transformer = Pipeline([
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
        numeric_transformer,
        numeric_features
    ),
    (
        "categorical",
        categorical_transformer,
        categorical_features
    )
])


# ============================================================
# 9. MODELS
# ============================================================

models = {

    "Logistic Regression": LogisticRegression(
        max_iter=2000,
        class_weight="balanced",
        random_state=42
    ),

    "Random Forest": RandomForestClassifier(
        n_estimators=300,
        class_weight="balanced",
        random_state=42
    ),

    "SVM": SVC(
        probability=True,
        class_weight="balanced",
        random_state=42
    ),

    "Gradient Boosting": GradientBoostingClassifier(
        random_state=42
    )
}


# ============================================================
# 10. CROSS VALIDATION
# ============================================================

cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)


# ============================================================
# 11. EVALUATION METRICS
# ============================================================

scoring = {
    "accuracy": "accuracy",
    "precision": "precision",
    "recall": "recall",
    "f1": "f1",
    "roc_auc": "roc_auc"
}


# ============================================================
# 12. TRAIN + EVALUATE
# ============================================================

results = []


print("\n======================================")
print("5-FOLD CROSS-VALIDATION")
print("======================================")


for name, classifier in models.items():

    pipeline = Pipeline([
        (
            "preprocessor",
            preprocessor
        ),
        (
            "classifier",
            classifier
        )
    ])

    print(f"\nTraining: {name}")

    scores = cross_validate(
        pipeline,
        X,
        y,
        cv=cv,
        scoring=scoring,
        n_jobs=-1
    )

    results.append({
        "Model": name,
        "Accuracy Mean": scores["test_accuracy"].mean(),
        "Accuracy Std": scores["test_accuracy"].std(),
        "Precision Mean": scores["test_precision"].mean(),
        "Recall Mean": scores["test_recall"].mean(),
        "F1 Mean": scores["test_f1"].mean(),
        "ROC-AUC Mean": scores["test_roc_auc"].mean()
    })


# ============================================================
# 13. RESULTS TABLE
# ============================================================

results_df = pd.DataFrame(results)

numeric_columns = [
    "Accuracy Mean",
    "Accuracy Std",
    "Precision Mean",
    "Recall Mean",
    "F1 Mean",
    "ROC-AUC Mean"
]

results_df[numeric_columns] = (
    results_df[numeric_columns]
    .round(4)
)


# ============================================================
# 14. SORT BY ROC-AUC
# ============================================================

results_df = results_df.sort_values(
    by="ROC-AUC Mean",
    ascending=False
)


print("\n======================================")
print("MODEL COMPARISON")
print("======================================")

print(
    results_df.to_string(
        index=False
    )
)


# ============================================================
# 15. BEST MODEL
# ============================================================

best_model = results_df.iloc[0]

print("\n======================================")
print("BEST BASELINE MODEL")
print("======================================")

print(
    "Model:",
    best_model["Model"]
)

print(
    "ROC-AUC:",
    best_model["ROC-AUC Mean"]
)

print(
    "F1:",
    best_model["F1 Mean"]
)

print(
    "Recall:",
    best_model["Recall Mean"]
)

print(
    "Accuracy:",
    best_model["Accuracy Mean"]
)

print("\nBaseline comparison complete.")