import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { useToast } from '../../context/ToastContext'
import { Link } from 'react-router-dom'

// ───────────────────────────────────────────
// THREAD VIEW — Shows messages + reply box
// ───────────────────────────────────────────
export function ThreadView({ inquiryId, status }: { inquiryId: Id<'inquiries'>; status: string }) {
  const thread = useQuery(api.inquiries.getMyThread, { inquiryId })
  const sendReply = useMutation(api.inquiries.customerReply)
  const { success: toastSuccess, error: toastError } = useToast()
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const handleReply = async () => {
    if (!replyText.trim()) return
    setSending(true)
    try {
      await sendReply({ inquiryId, message: replyText.trim() })
      toastSuccess('Reply sent!')
      setReplyText('')
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{
      background: 'rgba(17,17,17,0.03)',
      border: '1px solid rgba(17,17,17,0.08)',
      borderTop: 'none',
      padding: 'var(--space-lg)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
    }}>
      {/* Messages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '60vh', overflowY: 'auto', padding: '12px 4px' }}>
        {(thread || []).map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.sender === 'admin' ? 'flex-start' : 'flex-end',
            maxWidth: '85%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.sender === 'admin' ? 'flex-start' : 'flex-end'
          }}>
            <div style={{
              background: msg.sender === 'admin' ? '#FFFFFF' : 'linear-gradient(135deg, var(--orange), #FF7B47)',
              color: msg.sender === 'admin' ? 'var(--ink)' : 'white',
              padding: '12px 18px',
              borderRadius: msg.sender === 'admin' ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
              border: msg.sender === 'admin' ? '1px solid rgba(17,17,17,0.08)' : 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--muted)', marginTop: 6, opacity: 0.8 }}>
              {msg.sender === 'admin' ? 'BWR Works' : 'You'} · {new Date(msg.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>

      {/* Reply box (only if not closed) */}
      {status !== 'closed' && (
        <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'flex-end' }}>
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Type your reply..."
            rows={1}
            style={{
              flex: 1, resize: 'none', fontFamily: 'var(--font-body)', fontSize: '0.9rem',
              padding: '12px 18px', border: '1px solid rgba(17,17,17,0.12)', background: '#fff',
              borderRadius: '24px', outline: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}
          />
          <button
            onClick={handleReply}
            disabled={sending || !replyText.trim()}
            style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem',
              letterSpacing: '0.04em', background: 'var(--ink)', color: '#fff', border: 'none',
              height: '44px', padding: '0 20px', cursor: 'pointer', opacity: sending ? 0.6 : 1,
              borderRadius: '22px', whiteSpace: 'nowrap' as const, transition: 'background 0.2s',
            }}
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      )}
      {status === 'closed' && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', textAlign: 'center', padding: 12 }}>
          This thread is closed. <Link to="/contact" style={{ color: 'var(--orange)' }}>Open a new inquiry →</Link>
        </div>
      )}
    </div>
  )
}
