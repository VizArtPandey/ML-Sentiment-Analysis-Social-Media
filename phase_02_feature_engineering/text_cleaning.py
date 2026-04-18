from __future__ import annotations
"""Importable wrapper for the numbered phase 02 text-cleaning script."""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

_SCRIPT = Path(__file__).with_name("01_text_cleaning.py")
_SPEC = spec_from_file_location("_phase02_text_cleaning", _SCRIPT)
_MODULE = module_from_spec(_SPEC)
assert _SPEC and _SPEC.loader
_SPEC.loader.exec_module(_MODULE)

clean_text = _MODULE.clean_text
main = _MODULE.main

__all__ = ["clean_text", "main"]
