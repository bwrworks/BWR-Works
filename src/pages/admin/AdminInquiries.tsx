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

export default function AdminInquiries() {
  const [filter, setFilter] = useState<'all' | 'new' | 'replied' | 'closed'>('all')
  const [selected, setSelected] = useState<any>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const inquiries = useQuery(api.inquiries.listInquiries, filter === 'all' ? {} : { status: filter as any })
  const updateStatus = useMutation(api.inquiries.updateInquiryStatus)
  const saveReply = useMutation(api.inquiries.saveAdminReply)
  const sendReplyEmail = useAction(api.notifications.sendAdminReplyEmail)
  const { success, error: toastError } = useToast()

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return
    setSending(true)
    try {
      // Send email
      await sendReplyEmail({
        customerEmail: selected.email,
        customerName: selected.name,
        originalMessage: selected.message,
        replyMessage: replyText,
      })
      // Save reply to DB
      await saveReply({
        id: selected._id,
        replyMessage: replyText,
        repliedAt: Date.now(),
      })
      success(`Reply sent to ${selected.email}`)
      setReplyText('')
      setSelected(null)
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

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>ADMIN</div>
          <h1 className={styles.title}>Inquiries</h1>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)' }}>
          {inquiries?.filter(i => i.status === 'new').length ?? 0} new
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-lg)' }}>
        {(['all', 'new', 'replied', 'closed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '7px 18px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
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

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.2fr' : '1fr', gap: 'var(--space-lg)' }}>

        {/* ── LEFT: INQUIRY LIST ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>{inq.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', marginTop: 2 }}>{inq.email}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.08em',
                    background: STATUS_COLORS[inq.status] + '20', color: STATUS_COLORS[inq.status],
                    border: `1px solid ${STATUS_COLORS[inq.status]}40`,
                    padding: '2px 8px', borderRadius: 3
                  }}>{inq.status.toUpperCase()}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--muted)' }}>
                    {SUBJECT_LABELS[inq.subject]}
                  </span>
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--muted)', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {inq.message}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--muted)', marginTop: 8, opacity: 0.6 }}>
                {new Date(inq.createdAt).toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>

        {/* ── RIGHT: DETAIL + REPLY ── */}
        {selected && (
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)' }}>{selected.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--orange)' }}>{selected.email}</div>
                {selected.phone && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)' }}>{selected.phone}</div>}
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.2rem' }}>✕</button>
            </div>

            <div style={{ background: '#F9FAFB', padding: '14px 16px', borderLeft: '3px solid var(--orange)', borderRadius: '0 4px 4px 0' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--orange)', letterSpacing: '0.1em', marginBottom: 8 }}>CUSTOMER MESSAGE</div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--ink)', lineHeight: 1.7, margin: 0 }}>{selected.message}</p>
            </div>

            {selected.adminReply && (
              <div style={{ background: '#F0FDF4', padding: '14px 16px', borderLeft: '3px solid #10B981', borderRadius: '0 4px 4px 0' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: '#10B981', letterSpacing: '0.1em', marginBottom: 8 }}>YOUR PREVIOUS REPLY</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#374151', margin: 0, whiteSpace: 'pre-wrap' }}>{selected.adminReply}</p>
              </div>
            )}

            {selected.status !== 'closed' && (
              <>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>REPLY TO {selected.name.toUpperCase()}</label>
                  <textarea
                    rows={5}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={`Hi ${selected.name.split(' ')[0]},\n\nThank you for reaching out...`}
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.88rem', outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleReply} disabled={sending || !replyText.trim()} className={styles.btnPrimary} style={{ flex: 1 }}>
                    {sending ? 'Sending...' : '📧 Send Reply'}
                  </button>
                  <button onClick={() => handleClose(selected)} className={styles.btnOutline} style={{ padding: '10px 16px' }}>
                    Close
                  </button>
                </div>
              </>
            )}
            {selected.status === 'closed' && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', textAlign: 'center', padding: '12px', background: '#F9FAFB', borderRadius: 4 }}>
                This inquiry is closed
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
