"""Importable wrapper for the numbered phase 01 dataset-loading script."""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

_SCRIPT = Path(__file__).with_name("01_load_dataset.py")
_SPEC = spec_from_file_location("_phase01_load_dataset", _SCRIPT)
_MODULE = module_from_spec(_SPEC)
assert _SPEC and _SPEC.loader
_SPEC.loader.exec_module(_MODULE)

load_and_cache = _MODULE.load_and_cache
main = _MODULE.main

__all__ = ["load_and_cache", "main"]
