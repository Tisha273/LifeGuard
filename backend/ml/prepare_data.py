import os
import pandas as pd


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
# 4. CONVERT TO NUMERIC
# ============================================================

for column in columns:
    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    )


# ============================================================
# 5. CREATE BINARY TARGET
# ============================================================

# 0 = No heart disease
# 1,2,3,4 = Heart disease

df["target"] = (df["num"] > 0).astype(int)

df = df.drop(
    columns=["num"]
)


# ============================================================
# 6. REMOVE DUPLICATES
# ============================================================

before = len(df)

df = df.drop_duplicates()

after = len(df)

print("Duplicates removed:", before - after)


# ============================================================
# 7. DISPLAY MISSING VALUES
# ============================================================

print("\nMissing values before preprocessing:")

print(
    df.isnull().sum()
)


# ============================================================
# 8. DISPLAY FINAL TARGET
# ============================================================

print("\nFinal target distribution:")

print(
    df["target"].value_counts()
    .sort_index()
)


# ============================================================
# 9. DISPLAY FEATURE GROUPS
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


print("\nNumeric features:")
print(numeric_features)

print("\nBinary features:")
print(binary_features)

print("\nCategorical features:")
print(categorical_features)


# ============================================================
# 10. FINAL DATASET SUMMARY
# ============================================================

print("\n======================================")
print("DATA PREPARATION AUDIT COMPLETE")
print("======================================")

print("Rows:", len(df))
print("Features:", len(df.columns) - 1)
print("Target:", "target")

print("\nDataset is ready for ML preprocessing.")


# ============================================================
# SAVE PREPARED DATASET
# ============================================================

OUTPUT_PATH = os.path.join(
    BASE_DIR,
    "data",
    "heart_prepared.csv"
)

df.to_csv(
    OUTPUT_PATH,
    index=False
)

print("\nPrepared dataset saved to:")
print(OUTPUT_PATH)