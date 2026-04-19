FROM node:18-alpine AS frontend-build
WORKDIR /frontend
COPY phase_05_react_ui/package.json phase_05_react_ui/package-lock.json* ./
RUN npm install
COPY phase_05_react_ui/ ./
RUN npm run build

FROM python:3.10-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
# Copy the built React App to the location FastAPI expects it
COPY --from=frontend-build /frontend/dist /app/phase_05_react_ui/dist

ENV PYTHONPATH=/app

# Expose the port Hugging Face Spaces uses mapped to our Backend
EXPOSE 7860

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
