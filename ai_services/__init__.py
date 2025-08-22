"""Compatibility shim: expose modules from the `ai-services` directory as the `ai_services` package
and register top-level aliases so existing imports like `import contamination_detection`
continue to work during tests without renaming the original directory.
"""
import importlib.util
import importlib.machinery
import sys
import os
from types import ModuleType

ROOT = os.path.dirname(__file__)
LEGACY_DIR = os.path.normpath(os.path.join(ROOT, '..', 'ai-services'))

_loaded = {}

if os.path.isdir(LEGACY_DIR):
    for fname in os.listdir(LEGACY_DIR):
        if not fname.endswith('.py'):
            continue
        if fname.startswith('__'):
            continue
        mod_name = fname[:-3]
        file_path = os.path.join(LEGACY_DIR, fname)
        try:
            spec = importlib.util.spec_from_file_location(f"ai_services.{mod_name}", file_path)
            module = importlib.util.module_from_spec(spec)
            # Ensure the module has correct package attribute so relative imports work
            module.__package__ = 'ai_services'
            sys.modules[f"ai_services.{mod_name}"] = module
            loader = spec.loader
            if loader and hasattr(loader, 'exec_module'):
                loader.exec_module(module)
            _loaded[mod_name] = module
            # Register top-level alias so tests importing module directly keep working
            sys.modules[mod_name] = module
        except Exception:
            # Ignore errors during eager load; they will surface when tests import
            pass

__all__ = list(_loaded.keys())
