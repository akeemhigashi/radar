"""
Researcher agent — executes one interview research thread via tool use.
Interview-prep focused: findings are evaluated for candidate usefulness.
"""
import json
from typing import Optional
import anthropic

from .prompts import RESEARCHER_SYSTEM
from ..tools.search import TOOL_SCHEMA, run_search
from ..config import get_settings

settings = get_settings()
client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

MODEL = "claude-haiku-4-5"
MAX_TOOL_CALLS = 3


async def run_researcher(
    thread: dict,
    company: str,
    role: str,
    jd_text: Optional[str],
    plan_json: str,
) -> dict:
    """
    Returns:
    {
        "thread_id": "t1",
        "title": "...",
        "findings": "...",
        "sources": [{"title", "url", "snippet"}]
    }
    """
    user_payload = json.dumps({
        "company": company,
        "role": role,
        "title": thread["title"],
        "angle": thread["angle"],
        **({"jd_text": jd_text[:2000]} if jd_text else {}),
    })

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": user_payload,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
        }
    ]

    tool_calls = 0

    while True:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=2048,
            system=[
                {
                    "type": "text",
                    "text": RESEARCHER_SYSTEM,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            tools=[TOOL_SCHEMA],
            messages=messages,
        )

        tool_use_blocks = [b for b in response.content if b.type == "tool_use"]

        if tool_use_blocks and tool_calls < MAX_TOOL_CALLS:
            messages.append({"role": "assistant", "content": response.content})

            tool_results = []
            for block in tool_use_blocks:
                tool_calls += 1
                query = block.input.get("query", "")
                try:
                    results = await run_search(query)
                    result_text = json.dumps(results)
                except Exception as e:
                    result_text = json.dumps({"error": str(e)})

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result_text,
                })

            messages.append({"role": "user", "content": tool_results})
            continue

        # Model wants more searches but ceiling is hit — force it to write findings now
        if tool_use_blocks and tool_calls >= MAX_TOOL_CALLS:
            messages.append({"role": "assistant", "content": response.content})
            tool_results = [
                {
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": "Search limit reached.",
                }
                for block in tool_use_blocks
            ]
            messages.append({
                "role": "user",
                "content": tool_results + [
                    {
                        "type": "text",
                        "text": (
                            "You have reached the search limit. "
                            "Write your final findings now using only what you have found. "
                            'Return ONLY valid JSON: {"findings": "...", "sources": [{"title": "...", "url": "...", "snippet": "..."}]}'
                        ),
                    }
                ],
            })
            continue

        text_blocks = [b for b in response.content if b.type == "text"]
        if not text_blocks:
            raise ValueError(f"Researcher returned no text for thread {thread['id']}")

        raw = text_blocks[-1].text.strip()

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        try:
            result = json.loads(raw)
        except json.JSONDecodeError as e:
            raise ValueError(f"Researcher (thread {thread['id']}) returned non-JSON: {raw[:200]}") from e

        if "findings" not in result or "sources" not in result:
            raise ValueError(f"Researcher (thread {thread['id']}) missing required keys")

        return {
            "thread_id": thread["id"],
            "title": thread["title"],
            "findings": result["findings"],
            "sources": result.get("sources", []),
        }
