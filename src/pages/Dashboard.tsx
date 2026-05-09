import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthActions } from '@convex-dev/auth/react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import Navbar from '../components/layout/Navbar'
import AddressForm from '../components/checkout/AddressForm'
import { useToast } from '../context/ToastContext'
import styles from './Dashboard.module.css'

// ─────────────────────────────────────
// ADMIN QUICK VIEW — shown instead of customer stats
// ─────────────────────────────────────
function AdminQuickPanel() {
  const stats = useQuery(api.admin.getDashboardStats)

  const statCards = [
    { icon: '📦', label: 'Total Orders', value: stats?.totalOrders ?? '—', color: '#FF5C1A' },
    { icon: '⏳', label: 'Pending Payment', value: stats?.pendingPayment ?? '—', color: '#F59E0B' },
    { icon: '🚀', label: 'To Dispatch', value: stats?.toDispatch ?? '—', color: '#8B5CF6' },
    { icon: '👥', label: 'Total Users', value: stats?.totalUsers ?? '—', color: '#0EA5E9' },
    { icon: '🚚', label: 'Shipped', value: stats?.shipped ?? '—', color: '#10B981' },
    { icon: '💰', label: 'Revenue', value: stats ? `₹${((stats.totalRevenue ?? 0) / 100).toLocaleString('en-IN')}` : '—', color: '#10B981' },
  ]

  const statusMeta: Record<string, { label: string; color: string }> = {
    received: { label: 'Received', color: '#FF5C1A' },
    printing: { label: 'Printing', color: '#8B5CF6' },
    shipped:  { label: 'Shipped',  color: '#0EA5E9' },
    delivered:{ label: 'Delivered',color: '#10B981' },
  }

  return (
    <div className={styles.adminPanel}>
      {/* Stats grid */}
      <div className={styles.adminStatsGrid}>
        {statCards.map(card => (
          <div key={card.label} className={styles.adminStatCard}>
            <div className={styles.adminStatIcon} style={{ background: card.color + '15', color: card.color }}>{card.icon}</div>
            <div>
              <div className={styles.adminStatValue} style={{ color: card.color }}>{card.value}</div>
              <div className={styles.adminStatLabel}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className={styles.adminRecentOrders}>
        <div className={styles.adminSectionTitle}>Recent Orders</div>
        {!stats ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>Loading...</div>
        ) : stats.recentOrders.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>No orders yet. Start selling!</div>
        ) : (
          <div className={styles.adminOrderTable}>
            <div className={styles.adminOrderHead}>
              <span>ORDER ID</span><span>CUSTOMER</span><span>STATUS</span><span>AMOUNT</span><span>DATE</span>
            </div>
            {stats.recentOrders.map(o => (
              <Link key={o._id} to={`/admin/orders`} className={styles.adminOrderRow}>
                <span className={styles.adminOrderId}>{o.orderId}</span>
                <span>{o.customerName}</span>
                <span>
                  <span className={styles.adminStatusBadge} style={{ background: (statusMeta[o.status]?.color ?? '#999') + '20', color: statusMeta[o.status]?.color ?? '#999' }}>
                    {statusMeta[o.status]?.label ?? o.status}
                  </span>
                </span>
                <span style={{ fontWeight: 600, color: 'var(--orange)' }}>₹{(o.total / 100).toLocaleString('en-IN')}</span>
                <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  pending:   { label: 'Payment Pending', color: '#F59E0B', icon: '⏳' },
  paid:      { label: 'Payment Received', color: '#3B82F6', icon: '✅' },
  received:  { label: 'Order Received',   color: '#FF5C1A', icon: '📬' },
  printing:  { label: 'Printing Now',     color: '#8B5CF6', icon: '🖨️' },
  shipped:   { label: 'Shipped',          color: '#0EA5E9', icon: '🚚' },
  delivered: { label: 'Delivered',        color: '#10B981', icon: '🎉' },
}

function fmt(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
}

function Avatar({ name, email }: { name?: string; email?: string }) {
  const initials = (name || email || 'U').split(/\s|@/)[0].slice(0, 2).toUpperCase()
  return (
    <div className={styles.avatar}>
      <span>{initials}</span>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { signOut } = useAuthActions()

  const user = useQuery(api.users.current)
  const addresses = useQuery(api.addresses.getMyAddresses)
  const orders = useQuery(api.orders.getMyOrders)
  const deleteAddress = useMutation(api.addresses.deleteAddress)
  const ensureAdmin = useMutation(api.admin.ensureAdminRole)

  const [activeTab, setActiveTab] = useState<'orders' | 'support' | 'profile'>('orders')
  const [showAddressForm, setShowAddressForm] = useState(false)

  useEffect(() => {
    if (user?.email === 'bwrworks.in@gmail.com' && user.role !== 'admin') {
      ensureAdmin()
    }
  }, [user, ensureAdmin])

  useEffect(() => { window.scrollTo(0, 0) }, [])

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  if (user === undefined) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loadingScreen}>
          <div className={styles.spinner} />
          <span>Loading your profile...</span>
        </div>
      </div>
    )
  }

  if (user === null) {
    navigate('/auth')
    return null
  }

  const activeOrders = (orders || []).filter(o => o.status !== 'delivered')
  const pastOrders = (orders || []).filter(o => o.status === 'delivered')
  const totalSpend = (orders || []).reduce((s, o) => s + o.total, 0)

  return (
    <div className={styles.page}>
      <Navbar />

      <div className={styles.container}>

        {/* ── PROFILE HEADER ── */}
        <div className={styles.profileHeader}>
          <div className={styles.profileLeft}>
            <Avatar name={user.name} email={user.email} />
            <div className={styles.profileMeta}>
              <h1 className={styles.profileName}>{user.name || user.email?.split('@')[0] || 'Customer'}</h1>
              <p className={styles.profileEmail}>{user.email}</p>
              <div className={styles.memberBadge}>
                <span className={styles.memberDot} />
                Member since {new Date(user._creationTime).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
          <div className={styles.profileActions}>
            {user.role === 'admin' && (
              <Link to="/admin" className={styles.adminBtn}>
                ⚡ Admin Panel
              </Link>
            )}
            <button onClick={() => navigate('/products')} className={styles.shopBtn}>
              Shop Now →
            </button>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Sign Out
            </button>
          </div>
        </div>

        {/* ── ADMIN: show business quick-view, hide customer stats ── */}
        {user.role === 'admin' ? (
          <AdminQuickPanel />
        ) : (
          <>
            {/* ── CUSTOMER STATS ROW ── */}
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📦</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{orders?.length ?? '—'}</div>
                  <div className={styles.statLabel}>Total Orders</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🖨️</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{activeOrders.length}</div>
                  <div className={styles.statLabel}>In Progress</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>💰</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{orders ? fmt(totalSpend) : '—'}</div>
                  <div className={styles.statLabel}>Total Spent</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📍</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{addresses?.length ?? '—'}</div>
                  <div className={styles.statLabel}>Saved Addresses</div>
                </div>
              </div>
            </div>

            {/* ── TABS ── */}
            <div className={styles.tabs}>
              {(['orders', 'support', 'profile'] as const).map(tab => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'orders' && '📦 My Orders'}
                  {tab === 'support' && '✉️ Support'}
                  {tab === 'profile' && '👤 Profile & Addresses'}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── TAB: ORDERS ── */}
        {activeTab === 'orders' && (
          <div className={styles.tabContent}>

            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>🔥 Active Orders</h2>
                <div className={styles.orderGrid}>
                  {activeOrders.map(order => {
                    const meta = STATUS_META[order.status] || STATUS_META.received
                    return (
                      <div key={order._id} className={styles.orderCard}>
                        <div className={styles.orderCardTop}>
                          <div>
                            <div className={styles.orderIdLabel}>ORDER ID</div>
                            <div className={styles.orderId}>{order.orderId}</div>
                          </div>
                          <div className={styles.statusBadge} style={{ background: meta.color + '20', color: meta.color, borderColor: meta.color + '40' }}>
                            {meta.icon} {meta.label}
                          </div>
                        </div>

                        <div className={styles.orderItems}>
                          {order.items.slice(0, 2).map((item, i) => (
                            <div key={i} className={styles.orderItem}>
                              <span className={styles.orderItemName}>{item.productName}</span>
                              <span className={styles.orderItemQty}>×{item.quantity}</span>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className={styles.orderItemMore}>+{order.items.length - 2} more</div>
                          )}
                        </div>

                        <div className={styles.orderCardBottom}>
                          <div className={styles.orderTotal}>{fmt(order.total)}</div>
                          <div className={styles.orderDate}>
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </div>
                          <Link to={`/order/${order.orderId}`} className={styles.trackBtn}>
                            Track →
                          </Link>
                        </div>

                        {/* Mini timeline */}
                        <div className={styles.miniTimeline}>
                          {['received', 'printing', 'shipped', 'delivered'].map((step, i) => {
                            const steps = ['received', 'printing', 'shipped', 'delivered']
                            const currentIdx = steps.indexOf(order.status)
                            const isDone = i <= currentIdx
                            return (
                              <div key={step} className={styles.miniStep}>
                                <div className={`${styles.miniDot} ${isDone ? styles.miniDotDone : ''}`} />
                                {i < 3 && <div className={`${styles.miniLine} ${isDone && i < currentIdx ? styles.miniLineDone : ''}`} />}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Past Orders */}
            {pastOrders.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>📋 Order History</h2>
                <div className={styles.historyTable}>
                  <div className={styles.historyHead}>
                    <span>Order ID</span><span>Items</span><span>Total</span><span>Date</span><span>Status</span><span></span>
                  </div>
                  {pastOrders.map(order => (
                    <div key={order._id} className={styles.historyRow}>
                      <span className={styles.historyId}>{order.orderId}</span>
                      <span className={styles.historyCell}>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                      <span className={styles.historyCell}>{fmt(order.total)}</span>
                      <span className={styles.historyCell}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                      <span>
                        <span className={styles.historyBadge} style={{ background: STATUS_META[order.status]?.color + '20', color: STATUS_META[order.status]?.color }}>
                          {order.status}
                        </span>
                      </span>
                      <span style={{ display: 'flex', gap: '12px' }}>
                        <Link to={`/invoice/${order.orderId}`} target="_blank" className={styles.historyLink} title="Print Invoice">🖨️</Link>
                        <Link to={`/order/${order.orderId}`} className={styles.historyLink}>View →</Link>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty */}
            {(orders || []).length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📦</div>
                <h3 className={styles.emptyTitle}>No orders yet</h3>
                <p className={styles.emptyText}>Your custom pieces will appear here once you place an order.</p>
                <Link to="/products" className={styles.emptyBtn}>Start Shopping →</Link>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: SUPPORT ── */}
        {activeTab === 'support' && <SupportTab />}

        {/* ── TAB: PROFILE (includes addresses) ── */}
        {activeTab === 'profile' && (
          <div className={styles.tabContent}>
            <div className={styles.profileGrid}>

              {/* Account info */}
              <div className={styles.profileCard}>
                <h2 className={styles.sectionTitle}>Account Details</h2>
                <div className={styles.profileFields}>
                  <div className={styles.profileField}>
                    <span className={styles.fieldLabel}>EMAIL</span>
                    <span className={styles.fieldValue}>{user.email}</span>
                  </div>
                  <div className={styles.profileField}>
                    <span className={styles.fieldLabel}>MEMBER SINCE</span>
                    <span className={styles.fieldValue}>
                      {new Date(user._creationTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Support */}
                <div style={{ marginTop: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  <a
                    href="https://wa.me/918431797007?text=Hi%20BWR%20Works%2C%20I%20need%20help%20with%20my%20account"
                    target="_blank" rel="noopener noreferrer"
                    className={styles.waBtn}
                  >
                    💬 WhatsApp Support
                  </a>
                  <button onClick={() => navigate('/contact')} className={styles.contactBtn}>
                    Contact Form →
                  </button>
                </div>
              </div>

              {/* Addresses in profile */}
              <div className={styles.profileCard}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Delivery Addresses</h2>
                  <button className={styles.addBtn} onClick={() => setShowAddressForm(!showAddressForm)}>
                    {showAddressForm ? '✕ Cancel' : '+ Add New'}
                  </button>
                </div>

                {showAddressForm && (
                  <div className={styles.formWrapper} style={{ marginTop: 'var(--space-lg)' }}>
                    <AddressForm
                      onSave={() => setShowAddressForm(false)}
                      onCancel={() => setShowAddressForm(false)}
                    />
                  </div>
                )}

                {addresses && addresses.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                    {addresses.map(addr => (
                      <div key={addr._id} className={`${styles.addressCard} ${addr.isDefault ? styles.addressCardDefault : ''}`}>
                        {addr.isDefault && <div className={styles.defaultBadge}>✓ Default</div>}
                        <h4 className={styles.addrName}>{addr.name}</h4>
                        <p className={styles.addrText}>{addr.line1}</p>
                        {addr.line2 && <p className={styles.addrText}>{addr.line2}</p>}
                        <p className={styles.addrText}>{addr.city}, {addr.state} — {addr.pincode}</p>
                        <p className={styles.addrPhone}>📱 {addr.phone}</p>
                        <div className={styles.addrActions}>
                          <button className={styles.addrDelete} onClick={() => deleteAddress({ id: addr._id })}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !showAddressForm && (
                  <div style={{ padding: 'var(--space-xl) 0', textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>
                    No addresses yet. Add one to speed up checkout.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ───────────────────────────────────────────
// SUPPORT TAB — Customer inquiry threads
// ───────────────────────────────────────────
function SupportTab() {
  const inquiries = useQuery(api.inquiries.getMyInquiries)
  const [selectedId, setSelectedId] = useState<Id<'inquiries'> | null>(null)
  useToast() // available for future use

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
          <div className={styles.emptyIcon}>✉️</div>
          <h3 className={styles.emptyTitle}>No support requests</h3>
          <p className={styles.emptyText}>When you submit a query via the Contact page, your conversation thread will appear here.</p>
          <Link to="/contact" className={styles.emptyBtn}>Contact Us →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.tabContent}>
      <h2 className={styles.sectionTitle}>✉️ My Support Threads</h2>

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

// ───────────────────────────────────────────
// THREAD VIEW — Shows messages + reply box
// ───────────────────────────────────────────
function ThreadView({ inquiryId, status }: { inquiryId: Id<'inquiries'>; status: string }) {
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
