import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--space-2xl)',
        background: 'var(--bg)',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(5rem, 12vw, 10rem)',
          fontWeight: 800,
          lineHeight: 1,
          color: 'var(--ink)',
          opacity: 0.08,
          position: 'absolute',
          userSelect: 'none',
        }}>
          404
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          color: 'var(--orange)',
          marginBottom: 'var(--space-sm)',
        }}>
          Page Not Found
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          fontWeight: 700,
          color: 'var(--ink)',
          margin: '0 0 var(--space-md)',
        }}>
          This page doesn't exist.
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1rem',
          color: 'var(--muted)',
          maxWidth: '420px',
          lineHeight: 1.6,
          marginBottom: 'var(--space-xl)',
        }}>
          The URL you entered doesn't match any page on BWR Works.
          It may have been moved, removed, or never existed.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <Link to="/" style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            padding: '12px 28px',
            background: 'var(--ink)',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '4px',
            transition: 'opacity 0.2s',
          }}>
            ← Back Home
          </Link>
          <Link to="/products" style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            padding: '12px 28px',
            background: 'transparent',
            color: 'var(--ink)',
            textDecoration: 'none',
            borderRadius: '4px',
            border: '1px solid var(--ink)',
            transition: 'opacity 0.2s',
          }}>
            Browse Products
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}
