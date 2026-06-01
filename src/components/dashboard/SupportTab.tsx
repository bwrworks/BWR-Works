import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Link } from 'react-router-dom'
import { ThreadView } from './ThreadView'
import { Mail } from 'lucide-react'
import styles from '../../pages/Dashboard.module.css'

export function SupportTab() {
  const inquiries = useQuery(api.inquiries.getMyInquiries)
  const [selectedId, setSelectedId] = useState<Id<'inquiries'> | null>(null)

  const STATUS_COLORS: Record<string, string> = {
    new: '#FF5C1A', replied: '#10B981', closed: '#9CA3AF',
  }
  const SUBJECT_LABELS: Record<string, string> = {
    support: 'Order Support', bulk_order: 'Bulk / B2B', general: 'General',
  }

  if (!inquiries) {
    return (
      <div className={styles.tabContent}>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>Loading...</div>
      </div>
    )
  }

  if (inquiries.length === 0) {
    return (
      <div className={styles.tabContent}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><Mail size={48} color="var(--muted)" /></div>
          <h3 className={styles.emptyTitle}>No support requests</h3>
          <p className={styles.emptyText}>When you submit a query via the Contact page, your conversation thread will appear here.</p>
          <Link to="/contact" className={styles.emptyBtn}>Contact Us →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.tabContent}>
      <h2 className={styles.sectionTitle} style={{display:'flex', alignItems:'center', gap:'8px'}}><Mail size={24} /> My Support Threads</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {inquiries.map(inq => (
          <div key={inq._id}>
            {/* Inquiry summary card */}
            <div
              className={styles.orderCard}
              style={{ cursor: 'pointer', borderLeft: `3px solid ${STATUS_COLORS[inq.status] || '#9CA3AF'}` }}
              onClick={() => setSelectedId(selectedId === inq._id ? null : inq._id)}
            >
              <div className={styles.orderCardTop}>
                <div>
                  <div className={styles.orderIdLabel}>{SUBJECT_LABELS[inq.subject] || inq.subject}</div>
                  <div className={styles.orderId}>{inq.threadId || `BWR-Q-${inq._id.slice(0, 8)}`}</div>
                </div>
                <div className={styles.statusBadge} style={{
                  background: (STATUS_COLORS[inq.status] || '#9CA3AF') + '20',
                  color: STATUS_COLORS[inq.status] || '#9CA3AF',
                  borderColor: (STATUS_COLORS[inq.status] || '#9CA3AF') + '40',
                }}>
                  {inq.status === 'new' ? '⏳' : inq.status === 'replied' ? '✅' : '🔒'} {inq.status.toUpperCase()}
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--muted)', marginTop: 8 }}>
                {inq.message.slice(0, 120)}{inq.message.length > 120 ? '...' : ''}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', marginTop: 8 }}>
                {new Date(inq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>

            {/* Thread expansion */}
            {selectedId === inq._id && (
              <ThreadView inquiryId={inq._id} status={inq.status} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
