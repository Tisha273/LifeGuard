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

print("\n======================================")
print("HEART DISEASE DATASET AUDIT")
print("======================================")

df = pd.read_csv(
    DATA_PATH,
    names=columns,
    na_values="?"
)


# ============================================================
# 4. BASIC INFORMATION
# ============================================================

print("\n--- BASIC INFORMATION ---")

print("Number of rows:", len(df))
print("Number of columns:", len(df.columns))

print("\nColumns:")
for column in df.columns:
    print("-", column)


# ============================================================
# 5. DATA TYPES
# ============================================================

print("\n--- DATA TYPES ---")

print(df.dtypes)


# ============================================================
# 6. MISSING VALUES
# ============================================================

print("\n--- MISSING VALUES ---")

missing = df.isnull().sum()

print(missing)

print("\nTotal missing values:", missing.sum())


# ============================================================
# 7. DUPLICATES
# ============================================================

print("\n--- DUPLICATES ---")

duplicates = df.duplicated().sum()

print("Duplicate rows:", duplicates)


# ============================================================
# 8. TARGET DISTRIBUTION
# ============================================================

print("\n--- TARGET DISTRIBUTION ---")

print(df["num"].value_counts().sort_index())


# ============================================================
# 9. TARGET PERCENTAGES
# ============================================================

print("\n--- TARGET PERCENTAGES ---")

target_percentage = (
    df["num"]
    .value_counts(normalize=True)
    .sort_index()
    * 100
)

print(target_percentage.round(2))


# ============================================================
# 10. NUMERICAL SUMMARY
# ============================================================

print("\n--- NUMERICAL SUMMARY ---")

print(df.describe())


# ============================================================
# 11. UNIQUE VALUES
# ============================================================

print("\n--- UNIQUE VALUES ---")

for column in df.columns:

    print(
        f"\n{column}:"
    )

    print(
        sorted(
            df[column]
            .dropna()
            .unique()
            .tolist()
        )
    )


# ============================================================
# 12. FINAL CHECK
# ============================================================

print("\n======================================")
print("AUDIT COMPLETE")
print("======================================")