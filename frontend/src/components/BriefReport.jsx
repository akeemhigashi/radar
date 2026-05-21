import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

const getDomain = url => {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return url }
}

export default function BriefReport({ text, streaming, cachedTokens = 0, totalTokens = 0, threads = [] }) {
  const [hoveredSource, setHoveredSource] = useState(null)

  if (!text) return null

  // Aggregate unique sources from completed researcher threads
  const allSources = []
  const seen = new Set()
  threads.forEach(t => {
    if (t.sources && t.sources.length > 0) {
      t.sources.forEach(s => {
        if (s.url && !seen.has(s.url)) {
          seen.add(s.url)
          allSources.push({ ...s, threadTitle: t.title })
        }
      })
    }
  })

  return (
    <div style={S.wrap}>
      {/* Token stats */}
      {!streaming && totalTokens > 0 && (
        <div style={S.stats}>
          <span style={S.stat}>
            <span style={S.statDot} />
            {totalTokens.toLocaleString()} tokens
          </span>
          {cachedTokens > 0 && (
            <span style={{ ...S.stat, ...S.cached }}>
              ⚡ {cachedTokens.toLocaleString()} served from cache
            </span>
          )}
        </div>
      )}

      {/* Brief body */}
      <div
        className="radar-body"
        style={{
          ...S.report,
          borderColor: streaming ? 'var(--border-bright)' : 'var(--border)',
          boxShadow: streaming ? '0 0 0 1px var(--border-bright)' : 'none',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}
      >
        <ReactMarkdown>{text + (streaming ? '▋' : '')}</ReactMarkdown>
      </div>

      {/* Sources panel — shown once synthesis is done */}
      {!streaming && allSources.length > 0 && (
        <div style={S.sourcesWrap}>
          <p style={S.sourcesLabel}>SOURCES  ·  {allSources.length}</p>
          <div style={S.sourcesList}>
            {allSources.map((s, i) => {
              const hovered = hoveredSource === i
              return (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    ...S.sourceItem,
                    borderColor: hovered ? 'var(--border-bright)' : 'var(--border)',
                    background: hovered ? 'var(--surface-raised)' : 'var(--surface)',
                    transform: hovered ? 'translateX(2px)' : 'translateX(0)',
                  }}
                  onMouseEnter={() => setHoveredSource(i)}
                  onMouseLeave={() => setHoveredSource(null)}
                >
                  <div style={S.sourceTop}>
                    <span style={S.sourceNum}>{String(i + 1).padStart(2, '0')}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={S.sourceTitleRow}>
                        <span style={S.sourceTitle}>{s.title || getDomain(s.url)}</span>
                        <span style={S.sourceArrow}>↗</span>
                      </div>
                      <span style={S.sourceDomain}>{getDomain(s.url)}</span>
                    </div>
                  </div>
                  {s.snippet && (
                    <p style={S.sourceSnippet}>{s.snippet}</p>
                  )}
                  <span style={S.sourceThread}>{s.threadTitle}</span>
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 12 },
  stats: {
    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    padding: '7px 13px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
  },
  stat: {
    fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)',
    display: 'inline-flex', alignItems: 'center', gap: 6,
  },
  statDot: {
    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
    background: 'var(--accent)',
  },
  cached: {
    color: 'var(--green)',
    background: 'rgba(74,222,128,0.08)',
    border: '1px solid rgba(74,222,128,0.25)',
    borderRadius: 20, padding: '2px 10px',
  },
  report: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '28px 32px',
  },
  sourcesWrap: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '18px 20px',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  sourcesLabel: {
    fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)',
    letterSpacing: '0.12em',
  },
  sourcesList: { display: 'flex', flexDirection: 'column', gap: 6 },
  sourceItem: {
    display: 'flex', flexDirection: 'column', gap: 4,
    padding: '10px 14px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    textDecoration: 'none',
    transition: 'border-color 0.15s, background 0.15s, transform 0.12s',
  },
  sourceTop: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  sourceNum: {
    fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)',
    flexShrink: 0, marginTop: 2, width: 18,
  },
  sourceTitleRow: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6,
  },
  sourceTitle: {
    fontSize: 13, fontWeight: 600, color: 'var(--accent-hover)',
    lineHeight: 1.4, flex: 1,
  },
  sourceArrow: {
    fontSize: 11, color: 'var(--muted)', flexShrink: 0, marginTop: 1,
  },
  sourceDomain: {
    fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)',
    marginTop: 2,
  },
  sourceSnippet: {
    fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.55,
    paddingLeft: 28,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  sourceThread: {
    fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)',
    paddingLeft: 28,
  },
}
