from pydantic import BaseModel, Field, constr
from typing import Optional


class PredictRequest(BaseModel):
    text: constr(strip_whitespace=True, min_length=1, max_length=2000)
    models: list[str] = ["all"]


class BatchPredictRequest(BaseModel):
    texts: list[constr(strip_whitespace=True, min_length=1, max_length=2000)] = Field(
        ...,
        min_length=1,
        max_length=200,
    )
    models: list[str] = ["all"]


class SentimentResult(BaseModel):
    label: str
    confidence: float
    scores: dict[str, float]


class AttentionData(BaseModel):
    tokens: list[str]
    weights: list[float]


class PredictResponse(BaseModel):
    text: str
    calibrated: Optional[SentimentResult] = None
    vader:     Optional[SentimentResult] = None
    lr:        Optional[SentimentResult] = None
    rf:        Optional[SentimentResult] = None
    svm:       Optional[SentimentResult] = None
    bilstm:    Optional[SentimentResult] = None
    attention: Optional[AttentionData]  = None
    request_id: str


class MetricsResponse(BaseModel):
    benchmark: list[dict]
    updated_at: Optional[str] = None


class HistoryItem(BaseModel):
    request_id: str
    text: str
    calibrated: Optional[SentimentResult] = None
    vader:     Optional[SentimentResult] = None
    lr:        Optional[SentimentResult] = None
    rf:        Optional[SentimentResult] = None
    svm:       Optional[SentimentResult] = None
    bilstm:    Optional[SentimentResult] = None
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    version: str
    models_loaded: dict[str, bool]
