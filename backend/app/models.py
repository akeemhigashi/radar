from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
import uuid


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class BriefJob(SQLModel, table=True):
    id: str = Field(default_factory=_uuid, primary_key=True)
    company: str
    role: str
    jd_text: Optional[str] = None       # pasted job description (optional but improves output)
    status: str = "pending"             # pending | planning | researching | synthesising | done | error
    plan_json: Optional[str] = None     # serialised list of thread dicts
    report_markdown: Optional[str] = None
    cached_tokens: int = 0
    total_tokens: int = 0
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=_now)
    completed_at: Optional[datetime] = None


class BriefThread(SQLModel, table=True):
    id: str = Field(default_factory=_uuid, primary_key=True)
    job_id: str = Field(index=True)
    title: str
    angle: str
    sources_json: Optional[str] = None
    status: str = "pending"             # pending | running | done | error
    created_at: datetime = Field(default_factory=_now)
