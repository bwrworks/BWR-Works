import { useState, useRef, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Link } from 'react-router-dom'
import { formatPrice } from '../../lib/formatters'

export default function SearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [term, setTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(term.trim()), 300)
    return () => clearTimeout(timer)
  }, [term])

  const results = useQuery(api.products.search, debouncedTerm.length >= 2 ? { term: debouncedTerm } : 'skip')

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      setTerm('')
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!isOpen) return null



  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '12vh',
        animation: 'fadeIn 0.25s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '90%',
          maxWidth: 560,
          background: '#fff',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
          animation: 'fadeUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #eee', gap: 12 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search products…"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              fontFamily: 'var(--font-body)',
              color: 'var(--ink)',
              background: 'transparent',
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: '#f3f3f3',
              border: 'none',
              borderRadius: 6,
              padding: '4px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: '#888',
              cursor: 'pointer',
            }}
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '50vh', overflowY: 'auto', padding: term.length >= 2 ? '8px 0' : 0 }}>
          {term.length < 2 && (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: '#aaa', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
              TYPE AT LEAST 2 CHARACTERS
            </div>
          )}

          {term.length >= 2 && results === undefined && (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: '#aaa', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
              Searching…
            </div>
          )}

          {term.length >= 2 && results && results.length === 0 && (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: '#aaa', fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>
              No products found for "<strong>{term}</strong>"
            </div>
          )}

          {results && results.length > 0 && results.map((product) => (
            <Link
              key={product._id}
              to={`/products/${product.slug}`}
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 20px',
                textDecoration: 'none',
                color: 'inherit',
                borderBottom: '1px solid #f5f5f5',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f9f9f9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '')}
            >
              {product.images?.[0] && (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  style={{
                    width: 48,
                    height: 48,
                    objectFit: 'cover',
                    borderRadius: 6,
                    background: '#f3f3f3',
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {product.name}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  color: '#999',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginTop: 2,
                }}>
                  {product.category}
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--orange)',
                flexShrink: 0,
              }}>
                {product.price ? formatPrice(product.price) : ''}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
