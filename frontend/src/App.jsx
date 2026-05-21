import { useState } from 'react'
import NewBriefPage from './pages/NewBriefPage'
import SavedBriefsPage from './pages/SavedBriefsPage'
import './index.css'

const NAV = [
  { key: 'new', label: 'New Radar' },
  { key: 'saved', label: 'Saved Briefs' },
]

export default function App() {
  const [page, setPage] = useState('new')

  return (
    <div style={S.shell}>
      <header style={S.header}>
        <div style={S.brand}>
          <span style={S.logo}>◎</span>
          <span style={S.logoText}>Radar</span>
          <span style={S.tagline}>PM interview prep</span>
        </div>
        <nav style={S.nav}>
          {NAV.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPage(key)}
              style={{
                ...S.navBtn,
                color: page === key ? 'var(--text)' : 'var(--muted)',
                borderBottom: page === key ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {page === 'new' && (
        <div style={S.hero}>
          <h1 style={S.h1}>Pick up every signal<br />before the interview.</h1>
          <p style={S.sub}>
            Enter a company and role. Four parallel agents research the strategy,
            PM culture, competitive landscape, and the role itself.
            You get smart questions you couldn't have found by Googling — in 90 seconds.
          </p>
          <div style={S.pills}>
            <span style={S.pill}>Company strategy</span>
            <span style={S.pill}>PM culture signals</span>
            <span style={S.pill}>Competitive context</span>
            <span style={S.pill}>Role intelligence</span>
            <span style={S.pill}>5 questions that show depth</span>
          </div>
        </div>
      )}

      {page === 'saved' && (
        <div style={S.hero}>
          <h1 style={S.h1}>Saved Briefs</h1>
          <p style={S.sub}>Your intel, ready to review before any interview.</p>
        </div>
      )}

      <main style={S.main}>
        {page === 'new' ? <NewBriefPage /> : <SavedBriefsPage />}
      </main>

      <footer style={S.footer}>
        <span>Built with Claude API · FastAPI · React</span>
        <a href="https://github.com/akeemkabia" target="_blank" rel="noreferrer">GitHub</a>
      </footer>
    </div>
  )
}

const S = {
  shell: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    maxWidth: 820, margin: '0 auto', padding: '0 20px',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 0 0', borderBottom: '1px solid var(--border)',
    flexWrap: 'wrap', gap: 12,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  logo: { fontSize: 18, color: 'var(--accent)' },
  logoText: { fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' },
  tagline: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' },
  nav: { display: 'flex' },
  navBtn: {
    background: 'none', border: 'none', padding: '16px 18px 14px',
    fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'color 0.15s',
  },
  hero: { padding: '44px 0 28px', display: 'flex', flexDirection: 'column', gap: 12 },
  h1: {
    fontSize: 'clamp(26px, 5vw, 42px)', fontWeight: 800,
    letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.2,
  },
  sub: { fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.65, maxWidth: 580 },
  pills: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  pill: {
    fontSize: 11, fontFamily: 'var(--mono)',
    background: 'var(--accent-dim)', border: '1px solid var(--border)',
    borderRadius: 20, padding: '3px 10px', color: 'var(--accent-hover)',
  },
  main: { flex: 1, paddingBottom: 60 },
  footer: {
    borderTop: '1px solid var(--border)', padding: '20px 0',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)',
  },
}
