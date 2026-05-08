import { useState } from 'react'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useToast } from '../../context/ToastContext'
import styles from './AdminDashboard.module.css'

const STATUS_COLORS: Record<string, string> = {
  new: '#FF5C1A',
  replied: '#10B981',
  closed: '#9CA3AF',
}
const SUBJECT_LABELS: Record<string, string> = {
  support: 'Order Support',
  bulk_order: 'Bulk / B2B',
  general: 'General',
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function AdminInquiries() {
  const [filter, setFilter] = useState<'all' | 'new' | 'replied' | 'closed'>('all')
  const [selected, setSelected] = useState<any>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const inquiries = useQuery(api.inquiries.listInquiries, filter === 'all' ? {} : { status: filter as any })
  const thread = useQuery(api.inquiries.getThread, selected ? { inquiryId: selected._id } : 'skip')
  const updateStatus = useMutation(api.inquiries.updateInquiryStatus)
  const saveReply = useMutation(api.inquiries.saveAdminReply)
  const sendReplyEmail = useAction(api.notifications.sendAdminReplyEmail)
  const { success, error: toastError } = useToast()

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return
    setSending(true)
    try {
      const now = Date.now()
      // Build previous messages for email context
      const prevMessages = (thread || []).slice(-4).map(m => ({
        sender: m.sender,
        content: m.content,
        timestamp: m.timestamp,
      }))

      await sendReplyEmail({
        customerEmail: selected.email,
        customerName: selected.name,
        threadId: selected.threadId || `BWR-Q-${selected._id.slice(0, 8)}`,
        replyMessage: replyText,
        previousMessages: prevMessages,
      })

      await saveReply({
        id: selected._id,
        replyMessage: replyText,
        repliedAt: now,
      })

      success(`Reply sent to ${selected.name}`)
      setReplyText('')
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const handleClose = async (inquiry: any) => {
    await updateStatus({ id: inquiry._id, status: 'closed' })
    if (selected?._id === inquiry._id) setSelected(null)
    success('Inquiry closed')
  }

  const newCount = inquiries?.filter(i => i.status === 'new').length ?? 0

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>ADMIN</div>
          <h1 className={styles.title}>Inquiries {newCount > 0 && <span style={{ color: 'var(--orange)', fontSize: '1rem' }}>({newCount} new)</span>}</h1>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
        {(['all', 'new', 'replied', 'closed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 18px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            background: filter === f ? 'var(--ink)' : 'white',
            color: filter === f ? 'white' : 'var(--muted)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            {f}
          </button>
        ))}
      </div>

      <div className={selected ? styles.splitLayout : styles.splitLayoutSingle}>

        {/* ── LEFT: INQUIRY LIST (Hide on mobile if selected) ── */}
        <div className={selected ? styles.mobileHide : ''} style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          {inquiries === undefined ? (
            <div className={styles.loading}>Loading inquiries...</div>
          ) : inquiries.length === 0 ? (
            <div className={styles.empty}>No inquiries in this category.</div>
          ) : inquiries.map(inq => (
            <div key={inq._id}
              onClick={() => { setSelected(inq); setReplyText('') }}
              style={{
                background: selected?._id === inq._id ? '#FFF5F0' : 'white',
                border: `1px solid ${selected?._id === inq._id ? 'var(--orange)' : 'var(--line)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {inq.name}
                    {inq.status === 'new' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)', display: 'inline-block' }} />}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', marginTop: 2, wordBreak: 'break-all' }}>{inq.email}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--muted)', opacity: 0.6 }}>{timeAgo(inq.createdAt)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--muted)' }}>{SUBJECT_LABELS[inq.subject]}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.08em',
                    background: `${STATUS_COLORS[inq.status]}20`, color: STATUS_COLORS[inq.status],
                    border: `1px solid ${STATUS_COLORS[inq.status]}40`,
                    padding: '2px 8px', borderRadius: 3
                  }}>{inq.status.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--muted)', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {inq.message}
              </div>
              {inq.threadId && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--muted)', marginTop: 6, opacity: 0.5 }}>{inq.threadId}</div>
              )}
            </div>
          ))}
        </div>

        {/* ── RIGHT: CONVERSATION THREAD ── */}
        {selected && (
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--ink)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <button 
                  onClick={() => setSelected(null)} 
                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 8px 4px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}
                  className={styles.mobileBackBtn}
                >
                  ←
                </button>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'white' }}>{selected.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', marginTop: 2, wordBreak: 'break-all' }}>{selected.email}</div>
                  {selected.threadId && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'rgba(255,92,26,0.8)', marginTop: 2 }}>{selected.threadId}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {selected.status !== 'closed' && (
                  <button onClick={() => handleClose(selected)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', padding: '5px 12px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, cursor: 'pointer' }}>
                    Close
                  </button>
                )}
              </div>
            </div>

            {/* Thread messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400 }}>
              {thread === undefined ? (
                <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', textAlign: 'center' }}>Loading messages...</div>
              ) : thread.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', textAlign: 'center' }}>No messages yet</div>
              ) : thread.map((msg, i) => (
                <div key={i} style={{
                  alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}>
                  <div style={{
                    background: msg.sender === 'admin' ? 'var(--ink)' : '#F3F4F6',
                    color: msg.sender === 'admin' ? 'white' : 'var(--ink)',
                    padding: '10px 14px',
                    borderRadius: msg.sender === 'admin' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.88rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.content}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--muted)', marginTop: 4, textAlign: msg.sender === 'admin' ? 'right' : 'left' }}>
                    {msg.sender === 'admin' ? 'BWR Works' : selected.name} · {new Date(msg.timestamp).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply box */}
            {selected.status !== 'closed' ? (
              <div style={{ padding: 16, borderTop: '1px solid var(--line)', background: '#FAFAFA' }}>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={`Reply to ${selected.name.split(' ')[0]}...`}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.88rem', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
                />
                <button
                  onClick={handleReply}
                  disabled={sending || !replyText.trim()}
                  className={styles.btnPrimary}
                  style={{ marginTop: 10, width: '100%' }}>
                  {sending ? 'Sending...' : '📧 Send Reply via Email'}
                </button>
              </div>
            ) : (
              <div style={{ padding: 16, borderTop: '1px solid var(--line)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', textAlign: 'center', background: '#F9FAFB' }}>
                Inquiry is closed — reopen by replying
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
