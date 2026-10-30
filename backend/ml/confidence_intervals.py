import os
import numpy as np
import pandas as pd

from scipy.stats import beta


# ============================================================
# 1. HELPER: EXACT BINOMIAL CONFIDENCE INTERVAL
# ============================================================

def binomial_ci(successes, total, confidence=0.95):
    """
    Clopper-Pearson exact binomial confidence interval.
    """
    if total == 0:
        return np.nan, np.nan

    alpha = 1 - confidence

    lower = (
        0.0 if successes == 0
        else beta.ppf(
            alpha / 2,
            successes,
            total - successes + 1
        )
    )

    upper = (
        1.0 if successes == total
        else beta.ppf(
            1 - alpha / 2,
            successes + 1,
            total - successes
        )
    )

    return lower, upper


# ============================================================
# 2. HELD-OUT CONFUSION MATRIX
# ============================================================

# Values from final_evaluation.py
# Rows = actual, columns = predicted

tn = 29
fp = 4
fn = 2
tp = 26


# ============================================================
# 3. METRIC COUNTS
# ============================================================

metrics = {
    "Accuracy": (tn + tp, tn + fp + fn + tp),
    "Precision": (tp, tp + fp),
    "Recall / Sensitivity": (tp, tp + fn),
    "Specificity": (tn, tn + fp),
}


# ============================================================
# 4. CALCULATE INTERVALS
# ============================================================

results = []

print("=" * 55)
print("95% CONFIDENCE INTERVALS")
print("=" * 55)

for name, (successes, total) in metrics.items():

    estimate = successes / total

    lower, upper = binomial_ci(
        successes,
        total
    )

    results.append({
        "Metric": name,
        "Successes": successes,
        "Total": total,
        "Estimate": estimate,
        "CI Lower": lower,
        "CI Upper": upper
    })

    print(f"\n{name}")
    print(f"Estimate: {estimate:.4f}")
    print(
        f"95% CI:   [{lower:.4f}, {upper:.4f}]"
    )


# ============================================================
# 5. SAVE RESULTS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

OUTPUT_PATH = os.path.join(
    BASE_DIR,
    "data",
    "confidence_intervals.csv"
)

os.makedirs(
    os.path.dirname(OUTPUT_PATH),
    exist_ok=True
)

pd.DataFrame(results).to_csv(
    OUTPUT_PATH,
    index=False
)

print("\n" + "=" * 55)
print("CONFIDENCE INTERVAL ANALYSIS COMPLETE")
print("=" * 55)

print("\nResults saved to:")
print(OUTPUT_PATH)
