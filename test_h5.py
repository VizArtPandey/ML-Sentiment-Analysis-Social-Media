import h5py
import json
with h5py.File("phase_04_rnn_bilstm/saved_models/bilstm_best.h5", "r") as f:
    print(f.attrs.get("model_config"))
