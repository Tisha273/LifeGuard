import os
import pandas as pd
import matplotlib.pyplot as plt


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

df = pd.read_csv(
    DATA_PATH,
    names=columns,
    na_values="?"
)

for column in columns:
    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    )


# ============================================================
# 4. CREATE BINARY TARGET
# ============================================================

df["target"] = (df["num"] > 0).astype(int)

df = df.drop(columns=["num"])


# ============================================================
# 5. BASIC STATISTICS BY TARGET
# ============================================================

print("\n======================================")
print("FEATURE STATISTICS BY TARGET")
print("======================================")

numeric_features = [
    "age",
    "trestbps",
    "chol",
    "thalach",
    "oldpeak"
]

for feature in numeric_features:

    print(f"\n--- {feature} ---")

    print(
        df.groupby("target")[feature]
        .agg(["mean", "median", "std", "min", "max"])
        .round(2)
    )


# ============================================================
# 6. CATEGORICAL FEATURE DISTRIBUTIONS
# ============================================================

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

print("\n======================================")
print("CATEGORICAL FEATURE DISTRIBUTIONS")
print("======================================")

for feature in categorical_features:

    print(f"\n--- {feature} ---")

    table = pd.crosstab(
        df[feature],
        df["target"],
        normalize="index"
    ) * 100

    print(
        table.round(2)
    )


# ============================================================
# 7. CORRELATION
# ============================================================

print("\n======================================")
print("CORRELATION WITH TARGET")
print("======================================")

correlations = (
    df.corr(numeric_only=True)["target"]
    .drop("target")
    .sort_values(
        ascending=False
    )
)

print(
    correlations.round(3)
)


# ============================================================
# 8. PLOT NUMERICAL FEATURES
# ============================================================

for feature in numeric_features:

    plt.figure(figsize=(7, 5))

    df.boxplot(
        column=feature,
        by="target"
    )

    plt.title(
        f"{feature} vs Heart Disease"
    )

    plt.suptitle("")

    plt.xlabel(
        "Heart Disease (0 = No, 1 = Yes)"
    )

    plt.ylabel(feature)

    plt.tight_layout()

    plt.show()


# ============================================================
# 9. TARGET DISTRIBUTION
# ============================================================

plt.figure(figsize=(6, 5))

df["target"].value_counts().sort_index().plot(
    kind="bar"
)

plt.title(
    "Heart Disease Distribution"
)

plt.xlabel(
    "Target (0 = No Disease, 1 = Disease)"
)

plt.ylabel(
    "Number of Patients"
)

plt.xticks(
    [0, 1],
    ["No Disease", "Disease"],
    rotation=0
)

plt.tight_layout()

plt.show()


print("\n======================================")
print("EDA COMPLETE")
print("======================================")