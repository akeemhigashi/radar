const BASE = import.meta.env.VITE_API_BASE ?? '/api'

export async function startBrief(company, role, jdText = '') {
  const res = await fetch(`${BASE}/brief`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company, role, jd_text: jdText || undefined }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to start brief: ${text}`)
  }
  return res.json()
}

export function streamBrief(jobId, handlers) {
  const es = new EventSource(`${BASE}/brief/stream/${jobId}`)

  es.addEventListener('plan', e => handlers.onPlan?.(JSON.parse(e.data)))
  es.addEventListener('thread_start', e => handlers.onThreadStart?.(JSON.parse(e.data)))
  es.addEventListener('thread_done', e => handlers.onThreadDone?.(JSON.parse(e.data)))
  es.addEventListener('synthesis_start', () => handlers.onSynthesisStart?.())
  es.addEventListener('token', e => handlers.onToken?.(JSON.parse(e.data).text))
  es.addEventListener('synthesis_done', e => {
    handlers.onDone?.(JSON.parse(e.data))
    es.close()
  })
  es.addEventListener('error', e => {
    const data = e.data ? JSON.parse(e.data) : { message: 'Stream error' }
    handlers.onError?.(data.message)
    es.close()
  })

  return () => es.close()
}

export async function listBriefs() {
  const res = await fetch(`${BASE}/brief`)
  if (!res.ok) throw new Error('Failed to load briefs')
  return res.json()
}

export async function getBrief(jobId) {
  const res = await fetch(`${BASE}/brief/${jobId}`)
  if (!res.ok) throw new Error('Radar not found')
  return res.json()
}
