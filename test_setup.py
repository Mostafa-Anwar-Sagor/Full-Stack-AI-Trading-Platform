#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Test script to verify Trading Platform installation"""

print("Testing Trading Platform Setup...")
print("-" * 50)

try:
    import numpy as np
    print("[OK] NumPy imported successfully:", np.__version__)
except Exception as e:
    print("[FAILED] NumPy import failed:", e)

try:
    import pandas as pd
    print("[OK] Pandas imported successfully:", pd.__version__)
except Exception as e:
    print("[FAILED] Pandas import failed:", e)

try:
    import tensorflow as tf
    print("[OK] TensorFlow imported successfully:", tf.__version__)
except Exception as e:
    print("[FAILED] TensorFlow import failed:", e)

try:
    import matplotlib
    print("[OK] Matplotlib imported successfully:", matplotlib.__version__)
except Exception as e:
    print("[FAILED] Matplotlib import failed:", e)

try:
    import gymnasium
    print("[OK] Gymnasium imported successfully:", gymnasium.__version__)
except Exception as e:
    print("[FAILED] Gymnasium import failed:", e)

print("-" * 50)
print("All core dependencies verified!")
print("\nNext steps:")
print("1. Navigate to examples/ directory")
print("2. Run: jupyter notebook")
print("3. Open train_and_evaluate.ipynb or other examples")
