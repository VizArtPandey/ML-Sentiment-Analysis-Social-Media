import h5py
import json

file_path = "phase_04_rnn_bilstm/saved_models/bilstm_best.h5"

with h5py.File(file_path, "a") as f:
    config_str = f.attrs.get("model_config")
    if config_str:
        config = json.loads(config_str)
        # Fix the InputLayer issue
        for layer in config.get("config", {}).get("layers", []):
            if layer["class_name"] == "InputLayer":
                if "batch_shape" in layer["config"]:
                    shape = layer["config"].pop("batch_shape")
                    layer["config"]["batch_input_shape"] = shape
        
        # Save back
        new_config_str = json.dumps(config).encode('utf-8')
        f.attrs.modify("model_config", new_config_str)
        print("Patched batch_shape to batch_input_shape in .h5 model metadata.")
    else:
        print("model_config not found in .h5 attributes.")

