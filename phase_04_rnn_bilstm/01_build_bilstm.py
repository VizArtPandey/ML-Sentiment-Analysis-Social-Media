"""Define and print the BiLSTM model architecture with custom Attention."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from phase_04_rnn_bilstm.build_bilstm import AttentionLayer, build_bilstm

__all__ = ["AttentionLayer", "build_bilstm"]


if __name__ == "__main__":
    model = build_bilstm()
    model.summary()
    print(f"\nTrainable params: {model.count_params():,}")
