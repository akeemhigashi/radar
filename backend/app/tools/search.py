"""
Tavily search tool — wraps the Tavily API and exposes:
  - TOOL_SCHEMA: the Anthropic tool definition dict
  - run_search(query): async function, returns list of result dicts
"""
import httpx
from ..config import get_settings

settings = get_settings()

# ── Anthropic tool schema ──────────────────────────────────────────────────────

TOOL_SCHEMA = {
    "name": "web_search",
    "description": (
        "Search the web for current information. "
        "Returns a list of relevant results with title, URL, and content snippet. "
        "Use 2–3 targeted queries per research thread."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "The search query. Be specific — include named entities, dates, or technical terms.",
            }
        },
        "required": ["query"],
    },
}

# ── Tavily call ────────────────────────────────────────────────────────────────

TAVILY_URL = "https://api.tavily.com/search"


async def run_search(query: str, max_results: int = 5) -> list[dict]:
    """
    Call the Tavily search API.
    Returns a list of dicts: [{title, url, content, score}]
    Raises httpx.HTTPStatusError on API errors.
    """
    payload = {
        "api_key": settings.tavily_api_key,
        "query": query,
        "search_depth": "basic",
        "max_results": max_results,
        "include_answer": False,
        "include_raw_content": False,
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(TAVILY_URL, json=payload)
        response.raise_for_status()
        data = response.json()

    results = data.get("results", [])
    return [
        {
            "title": r.get("title", ""),
            "url": r.get("url", ""),
            "content": r.get("content", ""),
            "score": r.get("score", 0.0),
        }
        for r in results
    ]
