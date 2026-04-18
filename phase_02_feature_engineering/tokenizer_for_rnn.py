"""Importable wrapper for the numbered phase 02 tokenizer script."""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

_SCRIPT = Path(__file__).with_name("04_tokenizer_for_rnn.py")
_SPEC = spec_from_file_location("_phase02_tokenizer_for_rnn", _SCRIPT)
_MODULE = module_from_spec(_SPEC)
assert _SPEC and _SPEC.loader
_SPEC.loader.exec_module(_MODULE)

load_train_texts = _MODULE.load_train_texts
main = _MODULE.main

__all__ = ["load_train_texts", "main"]
