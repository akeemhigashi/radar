import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { listBriefs, getBrief } from '../utils'

export default function SavedBriefsPage() {
  const [briefs, setBriefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [fetching, setFetching] = useState(false)
  const [hoveredCard, setHoveredCard] = useState(null)

  useEffect(() => {
    listBriefs()
      .then(setBriefs)
      .catch(() => setBriefs([]))
      .finally(() => setLoading(false))
  }, [])

  const open = async brief => {
    setFetching(true)
    try {
      const detail = await getBrief(brief.job_id)
      setSelected(detail)
    } catch {
      // silently fail — list still shows
    } finally {
      setFetching(false)
    }
  }

  if (selected) {
    return (
      <div style={S.page}>
        <button onClick={() => setSelected(null)} style={S.back}>← Back to saved briefs</button>
        <div style={S.detailHeader}>
          <span style={S.company}>{selected.company}</span>
          <span style={S.sep}>·</span>
          <span style={S.role}>{selected.role}</span>
          <span style={S.date}>
            {new Date(selected.created_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
          </span>
        </div>
        <div className="radar-body" style={S.report}>
          <ReactMarkdown>{selected.report_markdown}</ReactMarkdown>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      {loading && <p style={S.hint}>Loading…</p>}

      {!loading && briefs.length === 0 && (
        <div style={S.empty}>
          <div style={S.emptyIcon}>◎</div>
          <p style={S.emptyTitle}>No saved briefs yet</p>
          <p style={S.emptyText}>
            Run your first Radar on the New Radar tab. Completed briefs are saved automatically.
          </p>
        </div>
      )}

      {briefs.length > 0 && (
        <div style={S.list}>
          {briefs.map(b => (
            <button
              key={b.job_id}
              onClick={() => open(b)}
              onMouseEnter={() => setHoveredCard(b.job_id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                ...S.card,
                borderColor: hoveredCard === b.job_id ? 'var(--border-bright)' : 'var(--border)',
                background: hoveredCard === b.job_id ? 'var(--surface-raised)' : 'var(--surface)',
              }}
              disabled={fetching}
            >
              <div style={S.cardLeft}>
                <span style={S.cardCompany}>{b.company}</span>
                <span style={S.cardRole}>{b.role}</span>
              </div>
              <div style={S.cardRight}>
                <span style={S.cardDate}>
                  {new Date(b.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short'
                  })}
                </span>
                <span style={{
                  ...S.cardArrow,
                  color: hoveredCard === b.job_id ? 'var(--accent)' : 'var(--muted)',
                }}>→</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const S = {
  page: { display: 'flex', flexDirection: 'column', gap: 16 },
  back: {
    background: 'none', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '7px 14px',
    color: 'var(--text-dim)', fontSize: 12, fontFamily: 'var(--mono)',
    alignSelf: 'flex-start', cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
  },
  detailHeader: {
    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    padding: '12px 16px',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  },
  company: { fontWeight: 700, fontSize: 15, color: 'var(--accent)' },
  sep: { color: 'var(--muted)' },
  role: { fontSize: 14, color: 'var(--text-dim)', flex: 1 },
  date: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' },
  report: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '28px 32px',
  },
  hint: { color: 'var(--muted)', fontSize: 13, fontStyle: 'italic', fontFamily: 'var(--mono)' },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '60px 24px', gap: 10,
    border: '1px dashed var(--border)', borderRadius: 'var(--radius)',
  },
  emptyIcon: {
    fontSize: 28, color: 'var(--muted)', lineHeight: 1,
  },
  emptyTitle: { fontSize: 15, fontWeight: 600, color: 'var(--text-dim)' },
  emptyText: { fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, textAlign: 'center', maxWidth: 320 },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  card: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    padding: '14px 18px', textAlign: 'left',
    transition: 'border-color 0.15s, background 0.15s',
    cursor: 'pointer',
  },
  cardLeft: { display: 'flex', flexDirection: 'column', gap: 3 },
  cardCompany: { fontSize: 14, fontWeight: 700, color: 'var(--accent)' },
  cardRole: { fontSize: 12, color: 'var(--text-dim)' },
  cardRight: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  cardDate: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' },
  cardArrow: { fontSize: 14, transition: 'color 0.15s' },
}
