
import os
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "final_model.joblib")

print("Loading saved model package...")

package = joblib.load(MODEL_PATH)
model = package["model"]
feature_columns = package["feature_columns"]

print("Model loaded successfully.")

# Example input using the Cleveland dataset's feature encoding.
sample = {
    "age": 63,
    "sex": 1,
    "cp": 1,
    "trestbps": 145,
    "chol": 233,
    "fbs": 1,
    "restecg": 0,
    "thalach": 150,
    "exang": 0,
    "oldpeak": 2.3,
    "slope": 3,
    "ca": 0,
    "thal": 6,
}

input_data = pd.DataFrame([sample], columns=feature_columns)

print("\nRunning prediction...")
prediction = int(model.predict(input_data)[0])
probabilities = model.predict_proba(input_data)[0]

print("\nPrediction test completed.")
print(f"Predicted class: {prediction}")
print(f"Probability for class 0: {probabilities[0]:.4f}")
print(f"Probability for class 1: {probabilities[1]:.4f}")

print("\nInterpretation:")
if prediction == 1:
    print("The model assigned this input to the disease class.")
else:
    print("The model assigned this input to the no-disease class.")

print(
    "\nNote: This is a software test using example data, "
    "not a medical diagnosis or validated patient risk assessment."
)
