"""Importable BiLSTM architecture used by training, evaluation, API, and Gradio."""
import random

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import Model, layers

from config import (
    DENSE_UNITS,
    DROPOUT_RATE,
    EMBEDDING_DIM,
    LEARNING_RATE,
    LSTM_UNITS,
    MAX_SEQ_LEN,
    NUM_CLASSES,
    SEED,
    VOCAB_SIZE,
)

random.seed(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)


class AttentionLayer(layers.Layer):
    """Additive attention over the BiLSTM output sequence."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.supports_masking = True

    def build(self, input_shape):
        hidden_dim = input_shape[-1]
        self.W = self.add_weight(
            name="attn_W",
            shape=(hidden_dim, hidden_dim),
            initializer="glorot_uniform",
            trainable=True,
        )
        self.b = self.add_weight(
            name="attn_b",
            shape=(hidden_dim,),
            initializer="zeros",
            trainable=True,
        )
        self.u = self.add_weight(
            name="attn_u",
            shape=(hidden_dim, 1),
            initializer="glorot_uniform",
            trainable=True,
        )
        super().build(input_shape)

    def call(self, hidden_states, mask=None, training=None):
        score = tf.nn.tanh(tf.tensordot(hidden_states, self.W, axes=1) + self.b)
        logits = tf.tensordot(score, self.u, axes=1)

        if mask is not None:
            mask = tf.cast(mask, logits.dtype)
            mask = tf.expand_dims(mask, axis=-1)
            logits = logits + ((1.0 - mask) * tf.cast(-1e9, logits.dtype))

        attention_weights = tf.nn.softmax(logits, axis=1)
        context_vector = tf.reduce_sum(hidden_states * attention_weights, axis=1)
        return context_vector, attention_weights

    def compute_mask(self, inputs, mask=None):
        return None

    def get_config(self):
        return super().get_config()


def build_bilstm(
    vocab_size: int = VOCAB_SIZE,
    embedding_dim: int = EMBEDDING_DIM,
    max_seq_len: int = MAX_SEQ_LEN,
    lstm_units: int = LSTM_UNITS,
    dense_units: int = DENSE_UNITS,
    dropout_rate: float = DROPOUT_RATE,
    num_classes: int = NUM_CLASSES,
    learning_rate: float = LEARNING_RATE,
) -> Model:
    inputs = keras.Input(shape=(max_seq_len,), name="token_ids")

    x = layers.Embedding(
        input_dim=vocab_size,
        output_dim=embedding_dim,
        mask_zero=True,
        name="embedding",
    )(inputs)

    x = layers.Bidirectional(
        layers.LSTM(
            lstm_units,
            return_sequences=True,
            dropout=0.2,
            recurrent_dropout=0.1,
        ),
        name="bilstm",
    )(x)

    context, _ = AttentionLayer(name="attention")(x)

    x = layers.Dense(dense_units, activation="relu", name="dense_hidden")(context)
    x = layers.Dropout(dropout_rate, name="dropout")(x)
    outputs = layers.Dense(num_classes, activation="softmax", name="output")(x)

    model = Model(inputs=inputs, outputs=outputs, name="BiLSTM_Sentiment")
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=learning_rate),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model
