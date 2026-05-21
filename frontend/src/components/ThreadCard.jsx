const getDomain = url => {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return url }
}

export default function ThreadCard({
  title, angle, status, findings, sources = [], error, animIdx = 0
}) {
  const dot = status === 'done' ? 'var(--green)'
    : status === 'running' ? 'var(--accent)'
    : status === 'error' ? 'var(--red)'
    : 'var(--surface-raised)'

  const label = status === 'done' ? 'Done'
    : status === 'running' ? 'Searching…'
    : status === 'error' ? 'Error'
    : 'Queued'

  return (
    <div style={{
      ...S.card,
      animation: `fadeInUp 0.25s ease both`,
      animationDelay: `${animIdx * 0.07}s`,
    }}>
      <div style={S.header}>
        <span style={{
          ...S.dot,
          background: dot,
          boxShadow: status === 'running' ? `0 0 8px var(--accent)` : 'none',
        }} />
        <span style={S.title}>{title}</span>
        <span style={{ ...S.badge, color: dot, borderColor: dot }}>
          {label}
        </span>
      </div>

      {/* Pending: show the research angle */}
      {angle && status === 'pending' && (
        <p style={S.angle}>{angle}</p>
      )}

      {/* Running: animated scan bar */}
      {status === 'running' && (
        <div style={S.scanTrack}>
          <div style={S.scanCursor} />
        </div>
      )}

      {/* Done: show findings excerpt */}
      {status === 'done' && findings && (
        <p style={S.findings}>
          {findings.length > 140 ? findings.slice(0, 140) + '…' : findings}
        </p>
      )}

      {/* Error */}
      {status === 'error' && error && (
        <p style={S.errorMsg}>{error}</p>
      )}

      {/* Sources — shown when done */}
      {status === 'done' && sources.length > 0 && (
        <div style={S.sources}>
          {sources.slice(0, 3).map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer" style={S.source}>
              <span style={S.sourceIcon}>↗</span>
              <span style={S.sourceTitle}>{getDomain(s.url)}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

const S = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '12px 14px',
    display: 'flex', flexDirection: 'column', gap: 8,
    transition: 'border-color 0.3s',
  },
  header: { display: 'flex', alignItems: 'center', gap: 10 },
  dot: {
    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
    transition: 'background 0.3s, box-shadow 0.3s',
  },
  title: { fontSize: 12, fontWeight: 600, color: 'var(--text)', flex: 1 },
  badge: {
    fontSize: 9, fontFamily: 'var(--mono)',
    border: '1px solid', borderRadius: 20, padding: '2px 8px',
    letterSpacing: '0.08em', flexShrink: 0,
  },
  angle: {
    fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5,
    paddingLeft: 18,
  },
  findings: {
    fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6,
    paddingLeft: 18,
    borderLeft: '2px solid var(--border)',
    marginLeft: 14,
  },
  scanTrack: {
    height: 2,
    background: 'var(--surface-raised)',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
    marginLeft: 18,
  },
  scanCursor: {
    position: 'absolute',
    top: 0, left: 0,
    height: '100%',
    width: '30%',
    background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
    animation: 'scan 1.6s ease-in-out infinite',
    borderRadius: 2,
  },
  sources: { display: 'flex', flexWrap: 'wrap', gap: 4, paddingLeft: 18 },
  source: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--accent)',
    background: 'var(--accent-dim)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    padding: '2px 8px',
    maxWidth: 180,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    transition: 'border-color 0.12s, color 0.12s',
    textDecoration: 'none',
  },
  sourceIcon: { fontSize: 9, flexShrink: 0, opacity: 0.7 },
  sourceTitle: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  errorMsg: { fontSize: 11, color: 'var(--red)', paddingLeft: 18, lineHeight: 1.5 },
}
