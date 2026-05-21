import { useState } from 'react'

const EXAMPLES = [
  { company: 'Linear', role: 'Senior Product Manager' },
  { company: 'Monzo', role: 'Product Manager, Lending' },
  { company: 'Anthropic', role: 'Product Manager, Developer Experience' },
]

export default function BriefForm({ onSubmit, loading }) {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [jdText, setJdText] = useState('')
  const [showJd, setShowJd] = useState(false)

  const [focusedField, setFocusedField] = useState(null)
  const [hoverSubmit, setHoverSubmit] = useState(false)
  const [hoveredChip, setHoveredChip] = useState(null)

  const valid = company.trim() && role.trim()

  const fill = ex => { setCompany(ex.company); setRole(ex.role) }

  const submit = e => {
    e.preventDefault()
    if (!valid || loading) return
    onSubmit(company.trim(), role.trim(), jdText.trim())
  }

  const inputStyle = field => ({
    ...S.input,
    borderColor: focusedField === field ? 'var(--border-bright)' : 'var(--border)',
    boxShadow: focusedField === field ? '0 0 0 3px var(--accent-dim)' : 'none',
  })

  return (
    <form onSubmit={submit} style={S.form}>
      <div style={S.row}>
        <div style={S.field}>
          <label style={S.label}>COMPANY</label>
          <input
            value={company}
            onChange={e => setCompany(e.target.value)}
            onFocus={() => setFocusedField('company')}
            onBlur={() => setFocusedField(null)}
            placeholder="e.g. Linear"
            style={inputStyle('company')}
            disabled={loading}
            autoFocus
            autoComplete="organization"
          />
        </div>
        <div style={S.field}>
          <label style={S.label}>ROLE</label>
          <input
            value={role}
            onChange={e => setRole(e.target.value)}
            onFocus={() => setFocusedField('role')}
            onBlur={() => setFocusedField(null)}
            placeholder="e.g. Senior Product Manager"
            style={inputStyle('role')}
            disabled={loading}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Examples */}
      <div style={S.examples}>
        <span style={S.exLabel}>Try:</span>
        {EXAMPLES.map(ex => (
          <button
            key={ex.company}
            type="button"
            onClick={() => fill(ex)}
            onMouseEnter={() => setHoveredChip(ex.company)}
            onMouseLeave={() => setHoveredChip(null)}
            style={{
              ...S.chip,
              background: hoveredChip === ex.company ? 'rgba(245,158,11,0.18)' : 'var(--accent-dim)',
              borderColor: hoveredChip === ex.company ? 'var(--border-bright)' : 'var(--border)',
              color: hoveredChip === ex.company ? 'var(--accent)' : 'var(--text-dim)',
            }}
            disabled={loading}
          >
            {ex.company} — {ex.role}
          </button>
        ))}
      </div>

      {/* Optional JD */}
      <div>
        <button
          type="button"
          onClick={() => setShowJd(v => !v)}
          style={S.toggleJd}
          disabled={loading}
        >
          <span style={{
            ...S.toggleIcon,
            transform: showJd ? 'rotate(45deg)' : 'rotate(0deg)',
          }}>+</span>
          {showJd ? 'Hide job description' : 'Paste job description'}
          <span style={S.optional}>(optional — improves output)</span>
        </button>
        {showJd && (
          <textarea
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            onFocus={() => setFocusedField('jd')}
            onBlur={() => setFocusedField(null)}
            placeholder="Paste the full job description here…"
            rows={6}
            style={{
              ...inputStyle('jd'),
              marginTop: 10,
              resize: 'vertical',
              animation: 'fadeInUp 0.2s ease both',
            }}
            disabled={loading}
          />
        )}
      </div>

      <div style={S.footer}>
        <p style={S.hint}>
          4 parallel agents · company strategy · PM culture · competitive context · role intelligence
        </p>
        <button
          type="submit"
          onMouseEnter={() => setHoverSubmit(true)}
          onMouseLeave={() => setHoverSubmit(false)}
          style={{
            ...S.submit,
            opacity: (!valid || loading) ? 0.45 : 1,
            background: hoverSubmit && valid && !loading ? 'var(--accent-hover)' : 'var(--accent)',
            transform: hoverSubmit && valid && !loading ? 'translateY(-1px)' : 'translateY(0)',
            boxShadow: hoverSubmit && valid && !loading
              ? '0 6px 20px rgba(245,158,11,0.35)'
              : '0 2px 8px rgba(245,158,11,0.15)',
          }}
          disabled={!valid || loading}
        >
          {loading ? 'Scanning…' : 'Run Radar →'}
        </button>
      </div>
    </form>
  )
}

const S = {
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  row: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  field: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 200 },
  label: { fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', letterSpacing: '0.12em' },
  input: {
    width: '100%',
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '11px 13px',
    color: 'var(--text)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  examples: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  exLabel: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' },
  chip: {
    background: 'var(--accent-dim)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '4px 12px',
    fontSize: 11,
    transition: 'all 0.12s',
    cursor: 'pointer',
  },
  toggleJd: {
    background: 'none', border: 'none',
    color: 'var(--text-dim)', fontSize: 12,
    fontFamily: 'var(--mono)', padding: 0,
    display: 'flex', alignItems: 'center', gap: 8,
    cursor: 'pointer',
  },
  toggleIcon: {
    display: 'inline-block',
    fontSize: 16, color: 'var(--accent)',
    lineHeight: 1, transition: 'transform 0.2s ease',
    fontWeight: 400,
  },
  optional: { color: 'var(--muted)', fontSize: 11 },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  hint: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', flex: 1, lineHeight: 1.6 },
  submit: {
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--radius)',
    padding: '11px 26px',
    color: '#000',
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: '0.01em',
    transition: 'all 0.15s',
    flexShrink: 0,
    cursor: 'pointer',
  },
}
