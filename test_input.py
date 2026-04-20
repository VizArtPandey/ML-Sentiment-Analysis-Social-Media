import tensorflow as tf

try:
    print("input_shape:")
    tf.keras.layers.InputLayer(input_shape=(64,))
    print("OK")
except Exception as e:
    print("FAIL:", e)

try:
    print("batch_input_shape:")
    tf.keras.layers.InputLayer(batch_input_shape=(None, 64))
    print("OK")
except Exception as e:
    print("FAIL:", e)

try:
    print("batch_shape:")
    tf.keras.layers.InputLayer(batch_shape=(None, 64))
    print("OK")
except Exception as e:
    print("FAIL:", e)
