
import os
import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder


# --------------------------------------------------
# 1. Configure paths
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "heart_prepared.csv")
MODEL_PATH = os.path.join(BASE_DIR, "final_model.joblib")

# --------------------------------------------------
# 2. Define model features
# --------------------------------------------------

numeric_features = [
    "age",
    "trestbps",
    "chol",
    "thalach",
    "oldpeak",
]

binary_features = [
    "sex",
    "fbs",
    "exang",
]

categorical_features = [
    "cp",
    "restecg",
    "slope",
    "ca",
    "thal",
]

feature_columns = (
    numeric_features
    + binary_features
    + categorical_features
)

# --------------------------------------------------
# 3. Load and validate dataset
# --------------------------------------------------

print("Loading prepared dataset...")

df = pd.read_csv(DATA_PATH)

if "target" not in df.columns:
    raise ValueError("Dataset must contain a 'target' column.")

missing_columns = [
    column for column in feature_columns
    if column not in df.columns
]

if missing_columns:
    raise ValueError(
        f"Missing required features: {missing_columns}"
    )

if df["target"].isna().any():
    raise ValueError("Target column contains missing values.")

X = df[feature_columns]
y = df["target"].astype(int)

if not set(y.unique()).issubset({0, 1}):
    raise ValueError("Target must contain only 0 and 1.")

print(f"Dataset rows: {len(df)}")
print(f"Number of input features: {len(feature_columns)}")

# --------------------------------------------------
# 4. Create preprocessing pipeline
# --------------------------------------------------

numeric_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
])

binary_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
])

categorical_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore")),
])

preprocessor = ColumnTransformer([
    ("numeric", numeric_pipeline, numeric_features),
    ("binary", binary_pipeline, binary_features),
    ("categorical", categorical_pipeline, categorical_features),
])

# --------------------------------------------------
# 5. Train the final pipeline
# --------------------------------------------------

print("\nTraining final Logistic Regression pipeline...")

final_model = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", LogisticRegression(
        C=0.1,
        max_iter=2000,
        random_state=42,
    )),
])

final_model.fit(X, y)

print("Training completed.")

# --------------------------------------------------
# 6. Save model and metadata together
# --------------------------------------------------

model_package = {
    "model": final_model,
    "feature_columns": feature_columns,
    "numeric_features": numeric_features,
    "binary_features": binary_features,
    "categorical_features": categorical_features,
    "target_mapping": {
        0: "No heart disease indicated by the dataset label",
        1: "Heart disease indicated by the dataset label",
    },
    "model_type": "LogisticRegression",
    "model_version": "1.0",
    "dataset": "UCI Cleveland Heart Disease dataset",
}

joblib.dump(model_package, MODEL_PATH)

print(f"\nModel package saved to:\n{MODEL_PATH}")
print("\nPackage contents:")
print("- Trained preprocessing and prediction pipeline")
print("- Required feature names")
print("- Feature groups")
print("- Target label mapping")
print("\nPackaging completed successfully.")
