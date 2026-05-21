import asyncio
import json
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select

from ..database import get_session, engine
from ..models import BriefJob, BriefThread
from ..schemas import BriefRequest, BriefJobResponse, BriefJobDetail
from ..agents.planner import run_planner
from ..agents.researcher import run_researcher
from ..agents.synthesiser import run_synthesiser

router = APIRouter(prefix="/brief", tags=["brief"])


def sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


# ── In-memory queue registry ──────────────────────────────────────────────────
_queues: dict[str, asyncio.Queue] = {}


# ── Pipeline ──────────────────────────────────────────────────────────────────

async def run_pipeline(job_id: str):
    queue = _queues.get(job_id)
    if queue is None:
        return

    async def push(event: str, data: dict):
        await queue.put((event, data))

    with Session(engine) as session:
        job = session.get(BriefJob, job_id)
        if not job:
            await push("error", {"message": "Job not found"})
            await queue.put(None)
            return

        try:
            # ── Stage 1: Plan ──────────────────────────────────────────────
            job.status = "planning"
            session.add(job)
            session.commit()

            threads = await run_planner(job.company, job.role, job.jd_text)
            plan_json = json.dumps(threads)
            job.plan_json = plan_json
            session.add(job)
            session.commit()

            thread_records = []
            for t in threads:
                tr = BriefThread(
                    job_id=job_id,
                    title=t["title"],
                    angle=t["angle"],
                )
                session.add(tr)
                thread_records.append((t, tr))
            session.commit()
            for _, tr in thread_records:
                session.refresh(tr)

            await push("plan", {
                "threads": [
                    {"id": tr.id, "title": t["title"], "angle": t["angle"]}
                    for t, tr in thread_records
                ]
            })

            # ── Stage 2: Research (parallel) ───────────────────────────────
            job.status = "researching"
            session.add(job)
            session.commit()

            for t, tr in thread_records:
                await push("thread_start", {"thread_id": tr.id, "title": t["title"]})

            async def research_one(t: dict, tr: BriefThread, delay: float = 0):
                if delay:
                    await asyncio.sleep(delay)
                result = await run_researcher(
                    t, job.company, job.role, job.jd_text, plan_json
                )
                result["thread_id"] = tr.id
                with Session(engine) as s2:
                    record = s2.get(BriefThread, tr.id)
                    if record:
                        record.sources_json = json.dumps(result["sources"])
                        record.status = "done"
                        s2.add(record)
                        s2.commit()
                return result

            # Stagger starts by 0.6s to avoid hitting Tavily's rate limit
            results = await asyncio.gather(
                *[research_one(t, tr, delay=i * 0.6) for i, (t, tr) in enumerate(thread_records)],
                return_exceptions=True,
            )

            thread_results = []
            for i, res in enumerate(results):
                t, tr = thread_records[i]
                if isinstance(res, Exception):
                    await push("thread_done", {
                        "thread_id": tr.id,
                        "error": str(res),
                        "sources": [],
                    })
                    with Session(engine) as s2:
                        record = s2.get(BriefThread, tr.id)
                        if record:
                            record.status = "error"
                            s2.add(record)
                            s2.commit()
                else:
                    await push("thread_done", {
                        "thread_id": tr.id,
                        "title": res["title"],
                        "findings": res["findings"],
                        "sources": res["sources"],
                    })
                    thread_results.append(res)

            if not thread_results:
                raise RuntimeError("All researcher agents failed.")

            # ── Stage 3: Synthesise ────────────────────────────────────────
            job.status = "synthesising"
            session.add(job)
            session.commit()

            await push("synthesis_start", {})

            report_chunks = []
            cached_tokens = 0
            total_tokens = 0

            async for item in run_synthesiser(
                job.company, job.role, job.jd_text, thread_results
            ):
                if isinstance(item, str):
                    report_chunks.append(item)
                    await push("token", {"text": item})
                elif isinstance(item, dict):
                    cached_tokens = item["cached_tokens"]
                    total_tokens = item["total_tokens"]

            job.report_markdown = "".join(report_chunks)
            job.cached_tokens = cached_tokens
            job.total_tokens = total_tokens
            job.status = "done"
            job.completed_at = datetime.utcnow()
            session.add(job)
            session.commit()

            await push("synthesis_done", {
                "job_id": job_id,
                "cached_tokens": cached_tokens,
                "total_tokens": total_tokens,
            })

        except Exception as e:
            job.status = "error"
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            session.add(job)
            session.commit()
            await push("error", {"message": str(e)})
        finally:
            await queue.put(None)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("", response_model=BriefJobResponse, status_code=202,
             summary="Start interview brief",
             description="Kicks off the research pipeline. Returns job_id immediately. "
                         "Open GET /brief/stream/{job_id} via EventSource for live updates.")
async def start_brief(
    body: BriefRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
):
    if not body.company.strip():
        raise HTTPException(status_code=422, detail="Company name is required.")
    if not body.role.strip():
        raise HTTPException(status_code=422, detail="Role title is required.")

    job = BriefJob(
        company=body.company.strip(),
        role=body.role.strip(),
        jd_text=body.jd_text,
    )
    session.add(job)
    session.commit()
    session.refresh(job)

    # Create the queue BEFORE starting the background task so run_pipeline
    # always finds it, even if the SSE stream hasn't connected yet.
    _queues[job.id] = asyncio.Queue()
    background_tasks.add_task(run_pipeline, job.id)

    return BriefJobResponse(
        job_id=job.id,
        status=job.status,
        company=job.company,
        role=job.role,
        created_at=job.created_at,
    )


@router.get("/stream/{job_id}",
            summary="SSE stream",
            description="Server-Sent Events stream of typed pipeline events.")
async def stream_brief(job_id: str, session: Session = Depends(get_session)):
    job = session.get(BriefJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Reuse the queue created in POST, or create one if reconnecting
    queue = _queues.get(job_id)
    if queue is None:
        queue = asyncio.Queue()
        _queues[job_id] = queue

    async def event_generator():
        try:
            while True:
                item = await asyncio.wait_for(queue.get(), timeout=120)
                if item is None:
                    break
                event, data = item
                yield sse(event, data)
        except asyncio.TimeoutError:
            yield sse("error", {"message": "Pipeline timed out after 120 seconds"})
        finally:
            _queues.pop(job_id, None)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.get("/{job_id}", response_model=BriefJobDetail,
            summary="Fetch brief",
            description="Returns the job record. report_markdown is populated when status is 'done'.")
def get_brief(job_id: str, session: Session = Depends(get_session)):
    job = session.get(BriefJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Brief not found")
    return BriefJobDetail(
        job_id=job.id,
        status=job.status,
        company=job.company,
        role=job.role,
        jd_text=job.jd_text,
        plan_json=job.plan_json,
        report_markdown=job.report_markdown,
        cached_tokens=job.cached_tokens,
        total_tokens=job.total_tokens,
        error_message=job.error_message,
        created_at=job.created_at,
        completed_at=job.completed_at,
    )


@router.get("", response_model=list[BriefJobResponse],
            summary="List saved briefs",
            description="Returns all completed briefs, newest first.")
def list_briefs(session: Session = Depends(get_session)):
    jobs = session.exec(
        select(BriefJob)
        .where(BriefJob.status == "done")
        .order_by(BriefJob.created_at.desc())
    ).all()
    return [
        BriefJobResponse(
            job_id=j.id,
            status=j.status,
            company=j.company,
            role=j.role,
            created_at=j.created_at,
        )
        for j in jobs
    ]
