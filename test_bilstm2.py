from backend.model_manager import _try_load_bilstm
import sys, logging
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
m, t = _try_load_bilstm()
print("Model loaded ok:", m is not None)
