import { useState, useCallback } from 'react'
import BriefForm from '../components/BriefForm'
import PipelineVisualiser from '../components/PipelineVisualiser'
import BriefReport from '../components/BriefReport'
import { startBrief, streamBrief } from '../utils'

const INIT = {
  stage: 'idle',
  threads: [],
  reportText: '',
  streaming: false,
  cachedTokens: 0,
  totalTokens: 0,
  errorMsg: '',
  company: '',
  role: '',
}

const ACTIVE_STAGES = new Set(['planning', 'researching', 'synthesising'])

export default function NewBriefPage() {
  const [state, setState] = useState(INIT)
  const [loading, setLoading] = useState(false)

  const patch = useCallback(p => setState(prev => ({ ...prev, ...p })), [])

  const handleSubmit = async (company, role, jdText) => {
    setState({ ...INIT, stage: 'planning', company, role })
    setLoading(true)

    let jobId
    try {
      const job = await startBrief(company, role, jdText)
      jobId = job.job_id
    } catch (err) {
      patch({ stage: 'error', errorMsg: err.message })
      setLoading(false)
      return
    }

    streamBrief(jobId, {
      onPlan: ({ threads }) => {
        patch({
          stage: 'researching',
          threads: threads.map(t => ({ ...t, status: 'pending', sources: [], findings: null })),
        })
      },
      onThreadStart: ({ thread_id }) => {
        setState(prev => ({
          ...prev,
          threads: prev.threads.map(t =>
            t.id === thread_id ? { ...t, status: 'running' } : t
          ),
        }))
      },
      onThreadDone: ({ thread_id, findings, sources = [], error }) => {
        setState(prev => ({
          ...prev,
          threads: prev.threads.map(t =>
            t.id === thread_id
              ? { ...t, status: error ? 'error' : 'done', findings: findings || null, sources, error }
              : t
          ),
        }))
      },
      onSynthesisStart: () => {
        patch({ stage: 'synthesising', streaming: true })
        setLoading(false)
      },
      onToken: text => {
        setState(prev => ({ ...prev, reportText: prev.reportText + text }))
      },
      onDone: ({ cached_tokens, total_tokens }) => {
        patch({ stage: 'done', streaming: false, cachedTokens: cached_tokens, totalTokens: total_tokens })
      },
      onError: msg => {
        patch({ stage: 'error', errorMsg: msg, streaming: false })
        setLoading(false)
      },
    })
  }

  const reset = () => { setState(INIT); setLoading(false) }

  const isActive = ACTIVE_STAGES.has(state.stage)

  return (
    <div style={S.page}>
      {state.stage === 'idle' && (
        <div style={S.formWrap}>
          <BriefForm onSubmit={handleSubmit} loading={loading} />
        </div>
      )}

      {state.stage !== 'idle' && (
        <div style={S.results}>
          {/* Compact company/role header */}
          <div style={S.jobHeader}>
            <span style={S.jobCompany}>{state.company}</span>
            <span style={S.jobSep}>·</span>
            <span style={S.jobRole}>{state.role}</span>
            <div style={S.headerActions}>
              {isActive && (
                <span style={S.stagePill}>
                  {state.stage === 'planning' ? 'Planning…'
                   : state.stage === 'researching' ? 'Researching…'
                   : 'Writing…'}
                </span>
              )}
              {(state.stage === 'done' || state.stage === 'error') && (
                <button onClick={reset} style={S.actionBtn}>← New brief</button>
              )}
              {isActive && (
                <button onClick={reset} style={{ ...S.actionBtn, ...S.cancelBtn }}>✕ Cancel</button>
              )}
            </div>
          </div>

          <PipelineVisualiser
            stage={state.stage}
            threads={state.threads}
            errorMsg={state.errorMsg}
          />

          <BriefReport
            text={state.reportText}
            streaming={state.streaming}
            cachedTokens={state.cachedTokens}
            totalTokens={state.totalTokens}
            threads={state.threads}
          />
        </div>
      )}
    </div>
  )
}

const S = {
  page: { display: 'flex', flexDirection: 'column', gap: 24 },
  formWrap: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '24px',
  },
  results: { display: 'flex', flexDirection: 'column', gap: 16 },
  jobHeader: {
    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    padding: '10px 16px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
  },
  jobCompany: { fontWeight: 700, fontSize: 14, color: 'var(--accent)' },
  jobSep: { color: 'var(--muted)', fontSize: 14 },
  jobRole: { fontSize: 13, color: 'var(--text-dim)', flex: 1 },
  headerActions: { display: 'flex', alignItems: 'center', gap: 8 },
  stagePill: {
    fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--accent)',
    background: 'var(--accent-dim)', border: '1px solid var(--border)',
    borderRadius: 20, padding: '3px 10px',
    animation: 'pulse 2s ease-in-out infinite',
  },
  actionBtn: {
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '5px 12px',
    color: 'var(--text-dim)',
    fontSize: 11,
    fontFamily: 'var(--mono)',
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
  },
  cancelBtn: {
    color: 'var(--red)',
    borderColor: 'rgba(248,113,113,0.3)',
  },
}
