from __future__ import annotations
from pydantic import BaseModel, Field, constr
from typing import Optional, List, Dict


class PredictRequest(BaseModel):
    text: constr(strip_whitespace=True, min_length=1, max_length=2000)
    models: List[str] = ["all"]


class BatchPredictRequest(BaseModel):
    texts: List[constr(strip_whitespace=True, min_length=1, max_length=2000)] = Field(
        ...,
        min_length=1,
        max_length=200,
    )
    models: List[str] = ["all"]


class SentimentResult(BaseModel):
    label: str
    confidence: float
    scores: Dict[str, float]


class AttentionData(BaseModel):
    tokens: List[str]
    weights: List[float]


class PredictResponse(BaseModel):
    text: str
    vader:     Optional[SentimentResult] = None
    lr:        Optional[SentimentResult] = None
    rf:        Optional[SentimentResult] = None
    svm:       Optional[SentimentResult] = None
    bilstm:    Optional[SentimentResult] = None
    attention: Optional[AttentionData]  = None
    request_id: str


class MetricsResponse(BaseModel):
    benchmark: List[dict]
    updated_at: Optional[str] = None


class HistoryItem(BaseModel):
    request_id: str
    text: str
    vader:     Optional[SentimentResult] = None
    lr:        Optional[SentimentResult] = None
    rf:        Optional[SentimentResult] = None
    svm:       Optional[SentimentResult] = None
    bilstm:    Optional[SentimentResult] = None
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    version: str
    models_loaded: Dict[str, bool]
