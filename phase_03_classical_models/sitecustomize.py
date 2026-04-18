"""Matplotlib cache location for scripts executed from this phase directory."""
from pathlib import Path
import os

_mpl_dir = Path(os.getenv("MPLCONFIGDIR", "/tmp/sentiment_social_media_matplotlib"))
_mpl_dir.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", str(_mpl_dir))
