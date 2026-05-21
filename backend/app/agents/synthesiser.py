"""
Synthesiser agent — streams the structured 5-section interview brief.
Model: claude-sonnet-4-5 (report quality matters; candidate reads this before their interview)
"""
import json
from typing import Optional
import anthropic

from .prompts import SYNTHESISER_SYSTEM
from ..config import get_settings

settings = get_settings()
client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

MODEL = "claude-sonnet-4-5"


async def run_synthesiser(
    company: str,
    role: str,
    jd_text: Optional[str],
    thread_results: list[dict],
):
    """
    AsyncGenerator yielding:
      - str  → streamed text chunk
      - dict → {"cached_tokens": int, "total_tokens": int}  (final item)
    """
    context = json.dumps(
        {
            "company": company,
            "role": role,
            **({"jd_text": jd_text[:3000]} if jd_text else {}),
            "threads": thread_results,
        },
        indent=2,
    )

    cached_tokens = 0
    total_tokens = 0

    async with client.messages.stream(
        model=MODEL,
        max_tokens=2048,
        system=[
            {
                "type": "text",
                "text": SYNTHESISER_SYSTEM,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": context,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
            }
        ],
    ) as stream:
        async for chunk in stream.text_stream:
            yield chunk

        final_message = await stream.get_final_message()
        usage = final_message.usage
        cached_tokens = getattr(usage, "cache_read_input_tokens", 0) or 0
        total_tokens = (usage.input_tokens or 0) + (usage.output_tokens or 0)

    yield {"cached_tokens": cached_tokens, "total_tokens": total_tokens}
