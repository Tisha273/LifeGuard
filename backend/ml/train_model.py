import os
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report


# ============================================================
# 1. FILE PATH
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "processed.cleveland.data"
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "heart_model.pkl"
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
# 3. LOAD DATASET
# ============================================================

print("Loading heart disease dataset...")

df = pd.read_csv(
    DATA_PATH,
    names=columns,
    na_values="?"
)

print("Dataset loaded successfully!")
print("Rows:", len(df))
print("Columns:", len(df))


# ============================================================
# 4. CONVERT COLUMNS TO NUMERIC
# ============================================================

for column in columns:
    df[column] = pd.to_numeric(df[column], errors="coerce")


# ============================================================
# 5. CREATE BINARY TARGET
# ============================================================
#
# Original UCI target:
#
# 0 = no heart disease
# 1,2,3,4 = heart disease
#
# We convert it to:
#
# 0 = No heart disease
# 1 = Heart disease
# ============================================================

df["target"] = (df["num"] > 0).astype(int)

df = df.drop(columns=["num"])


# ============================================================
# 6. SEPARATE FEATURES AND TARGET
# ============================================================

X = df.drop(columns=["target"])
y = df["target"]


print("\nTarget distribution:")
print(y.value_counts())


# ============================================================
# 7. TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


# ============================================================
# 8. CREATE ML PIPELINE
# ============================================================

model = Pipeline([
    (
        "imputer",
        SimpleImputer(strategy="median")
    ),

    (
        "classifier",
        RandomForestClassifier(
            n_estimators=200,
            random_state=42,
            class_weight="balanced"
        )
    )
])


# ============================================================
# 9. TRAIN MODEL
# ============================================================

print("\nTraining model...")

model.fit(X_train, y_train)

print("Model training completed!")


# ============================================================
# 10. TEST MODEL
# ============================================================

predictions = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    predictions
)

print("\n==============================")
print("MODEL RESULTS")
print("==============================")

print("Accuracy:", round(accuracy * 100, 2), "%")

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        predictions,
        target_names=[
            "No Heart Disease",
            "Heart Disease"
        ]
    )
)


# ============================================================
# 11. SAVE MODEL
# ============================================================

joblib.dump(
    model,
    MODEL_PATH
)

print("==============================")
print("MODEL SAVED SUCCESSFULLY")
print("==============================")

print("Saved to:")
print(MODEL_PATH)