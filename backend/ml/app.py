
import os
import joblib
import pandas as pd

from flask import Flask, request, jsonify

app = Flask(__name__)

# Load the saved model once when the service starts.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "final_model.joblib")

package = joblib.load(MODEL_PATH)
model = package["model"]
FEATURE_COLUMNS = package["feature_columns"]

# Valid values based on the Cleveland dataset encoding.
VALID_VALUES = {
    "sex": {0, 1},
    "cp": {1, 2, 3, 4},
    "fbs": {0, 1},
    "restecg": {0, 1, 2},
    "exang": {0, 1},
    "slope": {1, 2, 3},
    "ca": {0, 1, 2, 3},
    "thal": {3, 6, 7},
}

NUMERIC_RANGES = {
    "age": (1, 120),
    "trestbps": (40, 300),
    "chol": (50, 800),
    "thalach": (30, 250),
    "oldpeak": (-10, 15),
}


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "running",
        "service": "LifeGuard Heart Disease Prediction API"
    })


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({
                "error": "Send a valid JSON object."
            }), 400

        missing = [
            feature for feature in FEATURE_COLUMNS
            if feature not in data
        ]

        if missing:
            return jsonify({
                "error": "Required input fields are missing.",
                "missing_fields": missing
            }), 400

        cleaned = {}

        # Validate all 13 required inputs.
        for feature in FEATURE_COLUMNS:
            value = data[feature]

            if isinstance(value, bool):
                return jsonify({
                    "error": f"{feature} must be a numeric value."
                }), 400

            try:
                number = float(value)
            except (TypeError, ValueError):
                return jsonify({
                    "error": f"{feature} must be a numeric value."
                }), 400

            if not pd.notna(number):
                return jsonify({
                    "error": f"{feature} must be finite."
                }), 400

            if feature in VALID_VALUES:
                if number not in VALID_VALUES[feature]:
                    return jsonify({
                        "error": f"Invalid value for {feature}.",
                        "allowed_values": sorted(
                            VALID_VALUES[feature]
                        )
                    }), 400

            if feature in NUMERIC_RANGES:
                minimum, maximum = NUMERIC_RANGES[feature]

                if not minimum <= number <= maximum:
                    return jsonify({
                        "error": f"{feature} is outside the accepted range.",
                        "accepted_range": [minimum, maximum]
                    }), 400

            cleaned[feature] = number

        input_df = pd.DataFrame(
            [cleaned],
            columns=FEATURE_COLUMNS
        )

        prediction = int(model.predict(input_df)[0])
        probabilities = model.predict_proba(input_df)[0]

        return jsonify({
            "prediction": prediction,
            "class_label": (
                "disease_class"
                if prediction == 1
                else "no_disease_class"
            ),
            "class_probabilities": {
                "0": round(float(probabilities[0]), 4),
                "1": round(float(probabilities[1]), 4)
            },
            "disclaimer": (
                "This experimental model is not a diagnosis "
                "and must not replace professional medical advice."
            )
        }), 200

    except Exception:
        app.logger.exception("Prediction failed")
        return jsonify({
            "error": "Prediction failed due to a server error."
        }), 500


if __name__ == "__main__":
    print("LifeGuard prediction API starting...")
    print("Model loaded successfully.")
    app.run(host="127.0.0.1", port=5001, debug=False)
