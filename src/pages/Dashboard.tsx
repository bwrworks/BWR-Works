import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthActions } from '@convex-dev/auth/react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import Navbar from '../components/layout/Navbar'
import AddressForm from '../components/checkout/AddressForm'
import styles from './Dashboard.module.css'

// ─────────────────────────────────────
// ADMIN QUICK VIEW — shown instead of customer stats
// ─────────────────────────────────────
function AdminQuickPanel({ onGoAdmin }: { onGoAdmin: () => void }) {
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
      {/* Quick action banner */}
      <div className={styles.adminBanner}>
        <div>
          <div className={styles.adminBannerLabel}>ADMIN QUICK VIEW</div>
          <div className={styles.adminBannerTitle}>Business Overview</div>
        </div>
        <div className={styles.adminActions}>
          <button className={styles.adminActionBtn} onClick={onGoAdmin}>⚡ Full Admin Panel →</button>
          <Link to="/admin/orders" className={styles.adminActionBtnOutline}>📦 Manage Orders</Link>
          <Link to="/admin/products" className={styles.adminActionBtnOutline}>🖨️ Products</Link>
        </div>
      </div>

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
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>No orders yet</div>
        ) : (
          <div className={styles.adminOrderTable}>
            <div className={styles.adminOrderHead}>
              <span>ORDER ID</span><span>CUSTOMER</span><span>STATUS</span><span>AMOUNT</span><span>DATE</span>
            </div>
            {stats.recentOrders.map(o => (
              <Link key={o._id} to={`/admin/orders/${o.orderId}`} className={styles.adminOrderRow}>
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

  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders')
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
          <AdminQuickPanel onGoAdmin={() => navigate('/admin')} />
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
              {(['orders', 'profile'] as const).map(tab => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'orders' && '📦 My Orders'}
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
                      <span>
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
                    href="https://wa.me/917019427272?text=Hi%20BWR%20Works%2C%20I%20need%20help%20with%20my%20account"
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
