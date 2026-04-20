from backend.model_manager import BILSTM_MODEL_PATH
import tensorflow as tf
from phase_04_rnn_bilstm.build_bilstm import AttentionLayer

for ext in [".keras", ".h5"]:
    path = BILSTM_MODEL_PATH.with_suffix(ext)
    if not path.exists(): continue
    try:
        model = tf.keras.models.load_model(str(path), custom_objects={"AttentionLayer": AttentionLayer})
        print(f"Loaded {ext} successfully!")
    except Exception as e:
        print(f"Failed {ext}: {e}")
