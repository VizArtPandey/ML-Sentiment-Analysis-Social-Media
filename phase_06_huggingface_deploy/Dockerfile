FROM python:3.10-slim

WORKDIR /app

# install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl && \
    rm -rf /var/lib/apt/lists/*

# copy project
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# HuggingFace Spaces exposes port 7860
EXPOSE 7860

ENV PYTHONPATH=/app

CMD ["python", "phase_06_huggingface_deploy/app.py"]
