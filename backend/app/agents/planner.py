"""
Planner agent — decomposes company + role into 4 research threads.
Always returns exactly 4 threads (no depth toggle — interview prep always needs all 4).
"""
import json
from typing import Optional
import anthropic

from .prompts import PLANNER_SYSTEM
from ..config import get_settings

settings = get_settings()
client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

MODEL = "claude-haiku-4-5"


async def run_planner(company: str, role: str, jd_text: Optional[str] = None) -> list[dict]:
    """
    Returns exactly 4 thread dicts: [{id, title, angle}]
    Raises ValueError on parse failure, anthropic.APIError on upstream errors.
    """
    user_message = json.dumps({
        "company": company,
        "role": role,
        **({"jd_text": jd_text[:3000]} if jd_text else {}),
    })

    response = await client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=[
            {
                "type": "text",
                "text": PLANNER_SYSTEM,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user_message}],
    )

    raw = response.content[0].text.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        threads = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"Planner returned non-JSON: {raw[:200]}") from e

    if not isinstance(threads, list) or len(threads) != 4:
        raise ValueError(f"Planner must return exactly 4 threads, got: {len(threads) if isinstance(threads, list) else 'non-list'}")

    for t in threads:
        if not all(k in t for k in ("id", "title", "angle")):
            raise ValueError(f"Thread missing required keys: {t}")

    return threads
