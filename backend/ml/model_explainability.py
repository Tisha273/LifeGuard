
import os
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder


# --------------------------------------------------
# 1. Paths and configuration
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "heart_prepared.csv")
OUTPUT_DIR = os.path.join(BASE_DIR, "data")

os.makedirs(OUTPUT_DIR, exist_ok=True)


# --------------------------------------------------
# 2. Load the prepared dataset
# --------------------------------------------------

print("Loading prepared heart disease dataset...")

df = pd.read_csv(DATA_PATH)

target_column = "target"

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

X = df[feature_columns]
y = df[target_column]

print(f"Dataset rows: {len(df)}")
print(f"Features: {len(feature_columns)}")


# --------------------------------------------------
# 3. Build preprocessing pipeline
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

model = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", LogisticRegression(
        C=0.1,
        max_iter=2000,
        random_state=42,
    )),
])


# --------------------------------------------------
# 4. Train the model for interpretation
# --------------------------------------------------

print("\nTraining Logistic Regression model...")

model.fit(X, y)

print("Model trained successfully.")


# --------------------------------------------------
# 5. Extract feature names and coefficients
# --------------------------------------------------

fitted_preprocessor = model.named_steps["preprocessor"]
classifier = model.named_steps["classifier"]

transformed_feature_names = (
    fitted_preprocessor.get_feature_names_out()
)

coefficients = classifier.coef_[0]

results = pd.DataFrame({
    "feature": transformed_feature_names,
    "coefficient": coefficients,
})

results["absolute_coefficient"] = (
    results["coefficient"].abs()
)

results["direction"] = results["coefficient"].apply(
    lambda value: (
        "Higher model score for disease class"
        if value > 0
        else "Lower model score for disease class"
        if value < 0
        else "No linear effect"
    )
)

results = results.sort_values(
    "absolute_coefficient",
    ascending=False,
)

csv_path = os.path.join(
    OUTPUT_DIR,
    "model_coefficients.csv",
)

results.to_csv(csv_path, index=False)


# --------------------------------------------------
# 6. Display the most influential coefficients
# --------------------------------------------------

print("\nTop 15 coefficients by absolute magnitude:")
print(
    results[
        ["feature", "coefficient", "direction"]
    ].head(15).to_string(index=False)
)

print(f"\nCoefficient results saved to: {csv_path}")


# --------------------------------------------------
# 7. Plot the strongest coefficients
# --------------------------------------------------

top_results = results.head(15).sort_values(
    "coefficient",
    ascending=True,
)

plt.figure(figsize=(11, 7))

plt.barh(
    top_results["feature"],
    top_results["coefficient"],
)

plt.axvline(0, linewidth=1)
plt.xlabel("Logistic Regression coefficient")
plt.ylabel("Encoded feature")
plt.title("Heart Disease Model: Strongest Coefficients")
plt.tight_layout()

plot_path = os.path.join(
    OUTPUT_DIR,
    "model_coefficients.png",
)

plt.savefig(plot_path, dpi=300, bbox_inches="tight")

print(f"Coefficient graph saved to: {plot_path}")

plt.show()

print("\nModel explainability analysis completed.")
