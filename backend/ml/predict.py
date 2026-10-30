import sys
import json
import joblib
import pandas as pd
import os


# ==============================
# LOAD MODEL
# ==============================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "heart_model.pkl"
)

model = joblib.load(MODEL_PATH)


# ==============================
# GET INPUT FROM NODE.JS
# ==============================

data = json.loads(sys.argv[1])


# ==============================
# FEATURE ORDER
# ==============================

features = [
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
    "thal"
]


# ==============================
# CREATE DATAFRAME
# ==============================

input_data = pd.DataFrame(
    [[data[feature] for feature in features]],
    columns=features
)


# ==============================
# PREDICTION
# ==============================

prediction = model.predict(input_data)[0]

probability = model.predict_proba(input_data)[0][1]


# ==============================
# RETURN RESULT
# ==============================

result = {
    "prediction": int(prediction),
    "probability": round(float(probability) * 100, 2)
}

print(json.dumps(result))