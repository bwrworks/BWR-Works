import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthActions } from '@convex-dev/auth/react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import Navbar from '../components/layout/Navbar'
import AddressForm from '../components/checkout/AddressForm'
import { AdminQuickPanel } from '../components/dashboard/AdminQuickPanel'
import { Avatar } from '../components/dashboard/Avatar'
import { SupportTab } from '../components/dashboard/SupportTab'
import { Settings, Package, Printer, Mail, MapPin, Hourglass, CheckCircle, ClipboardList, PartyPopper, User, Banknote } from 'lucide-react'
import { fmt } from '../lib/formatters'
import styles from './Dashboard.module.css'

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: 'Payment Pending', color: '#F59E0B', icon: <Hourglass size={16} /> },
  paid:      { label: 'Payment Received', color: '#3B82F6', icon: <CheckCircle size={16} /> },
  received:  { label: 'Order Received', color: '#FF5C1A', icon: <ClipboardList size={16} /> },
  printing:  { label: 'Crafting Now',     color: '#8B5CF6', icon: <Settings size={16} /> },
  shipped:   { label: 'Shipped',          color: '#0EA5E9', icon: <Package size={16} /> },
  delivered: { label: 'Delivered',        color: '#10B981', icon: <PartyPopper size={16} /> },
}

const CUSTOM_STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  requested: { label: 'Awaiting Quote', color: '#94A3B8', icon: <Hourglass size={16} /> },
  quoted:    { label: 'Quote Ready',    color: '#FF5C1A', icon: <Banknote size={16} /> },
  ordered:   { label: 'Paid & Queued',  color: '#3B82F6', icon: <CheckCircle size={16} /> },
  printing:  { label: 'Crafting Now',   color: '#8B5CF6', icon: <Settings size={16} /> },
  shipped:   { label: 'Shipped',        color: '#0EA5E9', icon: <Package size={16} /> },
  delivered: { label: 'Delivered',      color: '#10B981', icon: <PartyPopper size={16} /> },
}


export default function Dashboard() {
  const navigate = useNavigate()
  const { signOut } = useAuthActions()

  const user = useQuery(api.users.current)
  const addresses = useQuery(api.addresses.getMyAddresses)
  const orders = useQuery(api.orders.getMyOrders)
  const customPrints = useQuery(api.customPrints.getMyCustomPrints)
  const deleteAddress = useMutation(api.addresses.deleteAddress)

  const pricingDefaults = useQuery(api.pricing.getPricingDefaults)
  const isGstEnabled = pricingDefaults ? pricingDefaults.gstPercent > 0 : false

  const [activeTab, setActiveTab] = useState<'orders' | 'support' | 'profile'>('orders')
  const [showAddressForm, setShowAddressForm] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    
    // Auto-select tab if redirected
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab === 'custom-prints' || tab === 'orders' || tab === 'support' || tab === 'profile') {
      setActiveTab(tab as any)
    }
  }, [])

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
  const totalSpend = (orders || []).reduce((s, o) => s + o.total, 0)

  const combinedOrders = [
    ...(orders || []).map(o => ({ ...o, type: 'standard' as const })),
    ...(customPrints || []).map(c => ({ ...c, type: 'custom' as const }))
  ].sort((a, b) => b.createdAt - a.createdAt)

  const isLoadingOrders = orders === undefined || customPrints === undefined

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
                <div className={styles.statIcon}><Package size={24} /></div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{orders?.length ?? '—'}</div>
                  <div className={styles.statLabel}>Total Orders</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}><Printer size={24} /></div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{activeOrders.length}</div>
                  <div className={styles.statLabel}>In Progress</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}><Banknote size={24} /></div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{orders ? fmt(totalSpend) : '—'}</div>
                  <div className={styles.statLabel}>Total Spent {isGstEnabled ? '(incl. GST)' : ''}</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}><MapPin size={24} /></div>
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
                  {tab === 'orders' && <div style={{display:'flex', alignItems:'center', gap:'6px'}}><Package size={16} /> My Orders</div>}
                  {tab === 'support' && <div style={{display:'flex', alignItems:'center', gap:'6px'}}><Mail size={16} /> Support</div>}
                  {tab === 'profile' && <div style={{display:'flex', alignItems:'center', gap:'6px'}}><User size={16} /> Profile & Addresses</div>}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── TAB: ORDERS ── */}
        {activeTab === 'orders' && (
          <div className={styles.tabContent}>
            {isLoadingOrders ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                Loading your orders and requests...
              </div>
            ) : combinedOrders.length > 0 ? (
              <div className={styles.section}>
                <div className={styles.orderGrid}>
                  {combinedOrders.map(item => {
                    if (item.type === 'standard') {
                      // Standard Order Card
                      const meta = STATUS_META[item.status] || STATUS_META.received
                      return (
                        <div key={item._id} className={styles.orderCard}>
                          <div className={styles.orderCardTop}>
                            <div>
                              <div className={styles.orderIdLabel}>ORDER ID</div>
                              <div className={styles.orderId}>{item.orderId}</div>
                            </div>
                            <div className={styles.statusBadge} style={{ background: meta.color + '20', color: meta.color, borderColor: meta.color + '40' }}>
                              {meta.icon} {meta.label}
                            </div>
                          </div>

                          <div className={styles.orderItems}>
                            {item.items.slice(0, 2).map((itm, i) => (
                              <div key={i} className={styles.orderItem}>
                                <span className={styles.orderItemName}>{itm.productName}</span>
                                <span className={styles.orderItemQty}>×{itm.quantity}</span>
                              </div>
                            ))}
                            {item.items.length > 2 && (
                              <div className={styles.orderItemMore}>+{item.items.length - 2} more</div>
                            )}
                          </div>

                          <div className={styles.orderCardBottom}>
                            <div className={styles.orderTotal}>{fmt(item.total)}</div>
                            <div className={styles.orderDate}>
                              {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </div>
                            <Link to={`/order/${item.orderId}`} className={styles.trackBtn}>
                              Track →
                            </Link>
                          </div>

                          {/* Mini timeline */}
                          <div className={styles.miniTimeline}>
                            {['received', 'printing', 'shipped', 'delivered'].map((step, i) => {
                              const steps = ['received', 'printing', 'shipped', 'delivered']
                              const currentIdx = steps.indexOf(item.status)
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
                    } else {
                      // Custom Print Request Card
                      const meta = CUSTOM_STATUS_META[item.status] || CUSTOM_STATUS_META.requested
                      return (
                        <div key={item._id} className={styles.orderCard} style={{ border: '1px solid rgba(255, 92, 26, 0.15)' }}>
                          <div className={styles.orderCardTop}>
                            <div>
                              <div className={styles.orderIdLabel} style={{ color: 'var(--orange)' }}>REQUEST ID</div>
                              <div className={styles.orderId}>{item.customPrintId}</div>
                            </div>
                            <div className={styles.statusBadge} style={{ background: meta.color + '20', color: meta.color, borderColor: meta.color + '40' }}>
                              {meta.icon} {meta.label}
                            </div>
                          </div>

                          <div className={styles.orderItems} style={{ height: 'auto', minHeight: '44px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <p style={{ fontSize: '0.82rem', color: '#ccc', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4, fontFamily: 'var(--font-body)' }}>
                              {item.description}
                            </p>
                            {item.images && item.images.length > 0 && (
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {item.images.slice(0, 3).map((img: string, i: number) => (
                                  <img key={i} src={img} alt="reference" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '3px', border: '1px solid var(--line)' }} />
                                ))}
                              </div>
                            )}
                          </div>

                          <div className={styles.orderCardBottom}>
                            <div className={styles.orderTotal}>
                              {item.pricing ? fmt(item.pricing.total) : 'Awaiting Quote'}
                            </div>
                            <div className={styles.orderDate}>
                              {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </div>
                            <Link 
                              to={`/custom-print/${item.customPrintId}`} 
                              className={styles.trackBtn}
                              style={{ 
                                background: ['requested', 'quoted'].includes(item.status) ? 'rgba(255, 92, 26, 0.08)' : undefined, 
                                color: ['requested', 'quoted'].includes(item.status) ? 'var(--orange)' : undefined,
                                borderColor: ['requested', 'quoted'].includes(item.status) ? 'var(--orange)' : undefined 
                              }}
                            >
                              {item.status === 'quoted' ? 'Pay Now →' : ['ordered', 'printing', 'shipped'].includes(item.status) ? 'Track →' : 'View →'}
                            </Link>
                          </div>

                          {/* Mini timeline */}
                          <div className={styles.miniTimeline}>
                            {['requested', 'ordered', 'printing', 'shipped', 'delivered'].map((step, i) => {
                              const steps = ['requested', 'ordered', 'printing', 'shipped', 'delivered']
                              const currentIdx = steps.indexOf(item.status)
                              const isDone = item.status === 'quoted' ? i === 0 : i <= currentIdx
                              return (
                                <div key={step} className={styles.miniStep}>
                                  <div className={`${styles.miniDot} ${isDone ? styles.miniDotDone : ''}`} />
                                  {i < 4 && <div className={`${styles.miniLine} ${isDone && (item.status === 'quoted' ? false : i < currentIdx) ? styles.miniLineDone : ''}`} />}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    }
                  })}
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><Package size={48} color="var(--muted)" /></div>
                <h3 className={styles.emptyTitle}>No orders yet</h3>
                <p className={styles.emptyText}>Your custom pieces and order requests will appear here.</p>
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
                        <p className={addr.phone} style={{display:'flex', alignItems:'center', gap:'4px'}}><MapPin size={14} /> {addr.phone}</p>
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


