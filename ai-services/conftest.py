import sys
import os

# Ensure ai-services package is importable as top-level module during pytest runs
ROOT = os.path.dirname(__file__)
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
