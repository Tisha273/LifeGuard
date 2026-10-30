import os
import pandas as pd

from sklearn.model_selection import (
    train_test_split,
    StratifiedKFold,
    GridSearchCV
)

from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)


# ============================================================
# 1. PATH
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "heart_prepared.csv"
)


# ============================================================
# 2. LOAD DATA
# ============================================================

print("Loading prepared dataset...")

df = pd.read_csv(DATA_PATH)

X = df.drop(columns=["target"])
y = df["target"]

print("Rows:", len(df))
print("Features:", X.shape[1])


# ============================================================
# 3. TRAIN / TEST SPLIT
# ============================================================
#
# IMPORTANT:
# Keep the final test set completely untouched.
#
# 80% -> model tuning
# 20% -> final evaluation later
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


# ============================================================
# 4. CROSS VALIDATION
# ============================================================

cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)


# ============================================================
# 5. LOGISTIC REGRESSION
# ============================================================

logistic_pipeline = Pipeline([
    (
        "imputer",
        SimpleImputer(strategy="median")
    ),

    (
        "scaler",
        StandardScaler()
    ),

    (
        "classifier",
        LogisticRegression(
            max_iter=5000
        )
    )
])


logistic_params = {
    "classifier__C": [
        0.01,
        0.1,
        1,
        10,
        100
    ]
}


# ============================================================
# 6. RANDOM FOREST
# ============================================================

rf_pipeline = Pipeline([
    (
        "imputer",
        SimpleImputer(strategy="median")
    ),

    (
        "classifier",
        RandomForestClassifier(
            random_state=42,
            class_weight="balanced"
        )
    )
])


rf_params = {
    "classifier__n_estimators": [
        100,
        200,
        300
    ],

    "classifier__max_depth": [
        None,
        3,
        5,
        7
    ],

    "classifier__min_samples_split": [
        2,
        5,
        10
    ],

    "classifier__min_samples_leaf": [
        1,
        2,
        4
    ]
}


# ============================================================
# 7. SVM
# ============================================================

svm_pipeline = Pipeline([
    (
        "imputer",
        SimpleImputer(strategy="median")
    ),

    (
        "scaler",
        StandardScaler()
    ),

    (
        "classifier",
        SVC(
            probability=True,
            class_weight="balanced"
        )
    )
])


svm_params = {
    "classifier__C": [
        0.1,
        1,
        10,
        100
    ],

    "classifier__gamma": [
        "scale",
        "auto"
    ],

    "classifier__kernel": [
        "rbf",
        "linear"
    ]
}


# ============================================================
# 8. MODELS
# ============================================================

models = {

    "Logistic Regression": (
        logistic_pipeline,
        logistic_params
    ),

    "Random Forest": (
        rf_pipeline,
        rf_params
    ),

    "SVM": (
        svm_pipeline,
        svm_params
    )
}


# ============================================================
# 9. HYPERPARAMETER TUNING
# ============================================================

results = []

best_models = {}


for name, (pipeline, params) in models.items():

    print("\n======================================")
    print("TUNING:", name)
    print("======================================")

    grid = GridSearchCV(
        estimator=pipeline,
        param_grid=params,
        scoring="roc_auc",
        cv=cv,
        n_jobs=-1,
        refit=True
    )

    grid.fit(X_train, y_train)

    best_model = grid.best_estimator_

    best_models[name] = best_model

    print("\nBest parameters:")
    print(grid.best_params_)

    print(
        "Best CV ROC-AUC:",
        round(grid.best_score_, 4)
    )


    # ========================================================
    # Evaluate on training split
    # ========================================================

    predictions = best_model.predict(X_train)

    probabilities = best_model.predict_proba(X_train)[:, 1]


    results.append({
        "Model": name,

        "CV ROC-AUC":
            round(grid.best_score_, 4),

        "Train Accuracy":
            round(
                accuracy_score(
                    y_train,
                    predictions
                ),
                4
            ),

        "Train Precision":
            round(
                precision_score(
                    y_train,
                    predictions
                ),
                4
            ),

        "Train Recall":
            round(
                recall_score(
                    y_train,
                    predictions
                ),
                4
            ),

        "Train F1":
            round(
                f1_score(
                    y_train,
                    predictions
                ),
                4
            ),

        "Train ROC-AUC":
            round(
                roc_auc_score(
                    y_train,
                    probabilities
                ),
                4
            )
    })


# ============================================================
# 10. RESULTS
# ============================================================

results_df = pd.DataFrame(results)

print("\n\n======================================")
print("TUNED MODEL RESULTS")
print("======================================")

print(
    results_df.to_string(
        index=False
    )
)


# ============================================================
# 11. FINAL TEST SET CHECK
# ============================================================
#
# This is ONLY for comparison.
# We will perform the official final evaluation
# in evaluate_final.py later.
# ============================================================

print("\n\n======================================")
print("HELD-OUT TEST SET")
print("======================================")


test_results = []


for name, model in best_models.items():

    predictions = model.predict(X_test)

    probabilities = model.predict_proba(
        X_test
    )[:, 1]

    test_results.append({

        "Model": name,

        "Accuracy":
            round(
                accuracy_score(
                    y_test,
                    predictions
                ),
                4
            ),

        "Precision":
            round(
                precision_score(
                    y_test,
                    predictions
                ),
                4
            ),

        "Recall":
            round(
                recall_score(
                    y_test,
                    predictions
                ),
                4
            ),

        "F1":
            round(
                f1_score(
                    y_test,
                    predictions
                ),
                4
            ),

        "ROC-AUC":
            round(
                roc_auc_score(
                    y_test,
                    probabilities
                ),
                4
            )
    })


test_df = pd.DataFrame(test_results)

print(
    test_df.to_string(
        index=False
    )
)


print("\n======================================")
print("HYPERPARAMETER TUNING COMPLETE")
print("======================================")