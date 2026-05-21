from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class BriefRequest(BaseModel):
    company: str
    role: str
    jd_text: Optional[str] = None


class BriefJobResponse(BaseModel):
    job_id: str
    status: str
    company: str
    role: str
    created_at: datetime


class BriefJobDetail(BriefJobResponse):
    jd_text: Optional[str] = None
    plan_json: Optional[str] = None
    report_markdown: Optional[str] = None
    cached_tokens: int = 0
    total_tokens: int = 0
    error_message: Optional[str] = None
    completed_at: Optional[datetime] = None
