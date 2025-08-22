import os
import sys
import importlib

# Ensure the parent workspace root + ml-models folder are on sys.path so the module can be imported
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ML_MODELS_DIR = os.path.join(ROOT, 'ml-models')
if ML_MODELS_DIR not in sys.path:
    sys.path.insert(0, ML_MODELS_DIR)

try:
    import pandas as pd
    from waste_prediction import WastePredictionModel, generate_training_data
except Exception as e:
    import pytest

    # Allow skipping at module import time when dependencies aren't available
    pytest.skip(f"Skipping ML test due to missing dependency: {e}", allow_module_level=True)


def test_train_save_load_predict(tmp_path):
    # Generate small dataset
    df = generate_training_data().sample(n=100, random_state=1)

    model = WastePredictionModel()
    perf = model.train(df)
    assert perf['mae'] >= 0

    model_path = tmp_path / "waste_model.pkl"
    model.save_model(str(model_path))
    assert os.path.exists(model_path)

    # Load and predict
    loaded = WastePredictionModel()
    loaded.load_model(str(model_path))

    sample = df.sample(n=5, random_state=2)
    preds = loaded.predict(sample)
    assert len(preds) == 5
