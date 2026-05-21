import { Fragment } from 'react'
import ThreadCard from './ThreadCard'

const STAGES = [
  { key: 'planning',    label: 'Plan',     icon: '①' },
  { key: 'researching', label: 'Research', icon: '②' },
  { key: 'synthesising',label: 'Write',    icon: '③' },
]
const ORDER = ['idle', 'planning', 'researching', 'synthesising', 'done']

export default function PipelineVisualiser({ stage, threads = [], errorMsg }) {
  if (stage === 'idle') return null

  return (
    <div style={S.wrap}>
      {/* Stage track */}
      <div style={S.stages}>
        {STAGES.map(({ key, label, icon }, idx) => {
          const active = stage === key
          const done = ORDER.indexOf(stage) > ORDER.indexOf(key)
          return (
            <Fragment key={key}>
              <div style={S.stageItem}>
                <div style={{
                  ...S.circle,
                  background: done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--surface-raised)',
                  borderColor: done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--border)',
                  color: done || active ? '#000' : 'var(--muted)',
                  boxShadow: active ? '0 0 14px var(--accent)' : 'none',
                }}>
                  {done ? '✓' : icon}
                </div>
                <span style={{
                  ...S.stageLabel,
                  color: done ? 'var(--green)' : active ? 'var(--text)' : 'var(--muted)',
                  fontWeight: active ? 600 : 400,
                }}>
                  {label}
                </span>
              </div>

              {idx < STAGES.length - 1 && (
                <div style={{
                  flex: 1,
                  height: 2,
                  background: done ? 'var(--green)' : 'var(--border)',
                  alignSelf: 'flex-start',
                  marginTop: 17,
                  borderRadius: 2,
                  transition: 'background 0.6s ease',
                }} />
              )}
            </Fragment>
          )
        })}
      </div>

      {stage === 'planning' && (
        <p style={S.hint}>Breaking the research into threads…</p>
      )}

      {threads.length > 0 && (
        <div style={S.threads}>
          {threads.map((t, idx) => (
            <ThreadCard
              key={t.id}
              animIdx={idx}
              title={t.title}
              angle={t.angle}
              status={t.status}
              findings={t.findings}
              sources={t.sources || []}
              error={t.error}
            />
          ))}
        </div>
      )}

      {stage === 'synthesising' && (
        <div style={S.synthRow}>
          <div style={S.synthTrack}>
            <div style={S.synthCursor} />
          </div>
          <span style={S.synthLabel}>Writing brief…</span>
        </div>
      )}

      {stage === 'error' && errorMsg && (
        <div style={S.error}>{errorMsg}</div>
      )}
    </div>
  )
}

const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16 },

  stages: { display: 'flex', alignItems: 'flex-start' },
  stageItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 6, flexShrink: 0, width: 72,
  },
  circle: {
    width: 36, height: 36, borderRadius: '50%',
    border: '2px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700,
    transition: 'all 0.3s',
  },
  stageLabel: {
    fontSize: 10, fontFamily: 'var(--mono)',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    transition: 'color 0.3s',
  },

  threads: { display: 'flex', flexDirection: 'column', gap: 8 },
  hint: { fontSize: 12, color: 'var(--muted)', textAlign: 'center', fontFamily: 'var(--mono)' },

  synthRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 14px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
  },
  synthTrack: {
    flex: 1, height: 3,
    background: 'var(--surface-raised)',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  synthCursor: {
    position: 'absolute',
    top: 0, left: 0,
    height: '100%',
    width: '35%',
    background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
    animation: 'scan 1.8s ease-in-out infinite',
    borderRadius: 2,
  },
  synthLabel: {
    fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--accent)',
    flexShrink: 0, animation: 'pulse 2s ease-in-out infinite',
  },

  error: {
    background: 'rgba(248,113,113,0.08)',
    border: '1px solid rgba(248,113,113,0.3)',
    borderRadius: 'var(--radius)',
    padding: '12px 16px',
    color: 'var(--red)', fontSize: 13,
  },
}
