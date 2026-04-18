"""Gradio UI wrapping the social sentiment inference pipelines."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import gradio as gr
import pandas as pd

from phase_06_huggingface_deploy.inference import predict

EMOJI = {
    "positive": "Positive",
    "negative": "Negative",
    "neutral": "Neutral",
    "mixed": "Mixed",
}

EXAMPLES = [
    ["I absolutely love this new product, it's incredible!"],
    ["The service was terrible and I'm never coming back."],
    ["It was okay, nothing extraordinary."],
    ["Oh great, the app crashed again right before I clicked save."],
    ["I cannot say the team delivered anything less than impressive work."],
    ["I hated how stressful the project was, but I loved what we built."],
    ["The app is different now, not better or worse, just different."],
]


def analyze(text: str):
    if not text or not text.strip():
        return None, "Please enter some text."

    results = predict(text, model_name="all")

    rows = []
    for model_key, model_name in [
        ("calibrated", "Calibrated Output"),
        ("vader", "VADER"),
        ("lr", "Logistic Regression"),
        ("rf", "Random Forest"),
        ("svm", "SVM"),
        ("bilstm", "BiLSTM"),
    ]:
        res = results.get(model_key)
        if res:
            scores = res.get("scores", {})
            rows.append({
                "Model": model_name,
                "Prediction": EMOJI.get(res["label"], res["label"]),
                "Confidence": f"{res['confidence']:.1%}",
                "Positive": f"{scores.get('positive', 0.0):.1%}",
                "Neutral": f"{scores.get('neutral', 0.0):.1%}",
                "Negative": f"{scores.get('negative', 0.0):.1%}",
                "Mixed": f"{scores.get('mixed', 0.0):.1%}",
            })
    table = pd.DataFrame(rows) if rows else pd.DataFrame([{
        "Model": "No trained models found",
        "Prediction": "-",
        "Confidence": "-",
        "Positive": "-",
        "Neutral": "-",
        "Negative": "-",
        "Mixed": "-",
    }])

    best = results.get("calibrated")
    if best:
        summary = f"Final calibrated output: {EMOJI.get(best['label'], best['label'])} ({best['confidence']:.1%})"
    else:
        summary = f"Top available pipeline output: {rows[0]['Prediction']}" if rows else "No model loaded"
    return table, summary


with gr.Blocks(title="Sentiment Analysis — Social Media", theme=gr.themes.Soft()) as demo:
    gr.Markdown("""
    # Social Media Sentiment Analysis
    Multi-model pipeline with a **calibrated ambiguity layer** for sarcasm, contrast, litotes, and mixed polarity.
    """)

    with gr.Row():
        text_input = gr.Textbox(
            label="Enter tweet or post",
            placeholder="I absolutely love this product!",
            lines=3,
            max_lines=5,
        )

    with gr.Row():
        analyze_btn = gr.Button("Analyze Sentiment", variant="primary", scale=1)
        clear_btn   = gr.Button("Clear", scale=0)

    table_out = gr.Dataframe(
        headers=["Model", "Prediction", "Confidence", "Positive", "Neutral", "Negative", "Mixed"],
        label="Side-by-Side Model Comparison",
        interactive=False,
    )
    summary_out = gr.Textbox(label="Summary", interactive=False)

    gr.Examples(examples=EXAMPLES, inputs=text_input, label="Try these examples")

    analyze_btn.click(
        fn=analyze,
        inputs=[text_input],
        outputs=[table_out, summary_out],
    )
    clear_btn.click(
        fn=lambda: ("", None, ""),
        outputs=[text_input, table_out, summary_out],
    )
    text_input.submit(
        fn=analyze,
        inputs=[text_input],
        outputs=[table_out, summary_out],
    )

    gr.Markdown("""
    ---
    **Dataset:** bdstar/twitter-sentiment-analysis fallback plus advanced ambiguity stress data · **Seed:** 42 · **Stack:** sklearn · FastAPI · React 18 · Gradio
    """)


if __name__ == "__main__":
    demo.launch(share=False, server_port=7860)
