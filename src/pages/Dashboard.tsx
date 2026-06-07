import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthActions } from '@convex-dev/auth/react'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import Navbar from '../components/layout/Navbar'
import AddressForm from '../components/checkout/AddressForm'
import { AdminQuickPanel } from '../components/dashboard/AdminQuickPanel'
import { Avatar } from '../components/dashboard/Avatar'
import { SupportTab } from '../components/dashboard/SupportTab'
import { Settings, Package, Printer, Mail, Flame, MapPin, Hourglass, CheckCircle, ClipboardList, PartyPopper, User, Banknote } from 'lucide-react'
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

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (document.getElementById('razorpay-script')) return resolve(true)
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { signOut } = useAuthActions()

  const user = useQuery(api.users.current)
  const addresses = useQuery(api.addresses.getMyAddresses)
  const orders = useQuery(api.orders.getMyOrders)
  const customPrints = useQuery(api.customPrints.getMyCustomPrints)
  const deleteAddress = useMutation(api.addresses.deleteAddress)
  const prepareCustomPrintPayment = useAction(api.customPrints.prepareCustomPrintPayment)
  const pricingDefaults = useQuery(api.pricing.getPricingDefaults)
  const isGstEnabled = pricingDefaults ? pricingDefaults.gstPercent > 0 : false

  const [activeTab, setActiveTab] = useState<'orders' | 'custom-prints' | 'support' | 'profile'>('orders')
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
              {(['orders', 'custom-prints', 'support', 'profile'] as const).map(tab => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'orders' && <div style={{display:'flex', alignItems:'center', gap:'6px'}}><Package size={16} /> My Orders</div>}
                  {tab === 'custom-prints' && <div style={{display:'flex', alignItems:'center', gap:'6px'}}><Printer size={16} /> Custom Prints</div>}
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

            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle} style={{display:'flex', alignItems:'center', gap:'8px'}}><Flame size={24} /> Active Orders</h2>
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
                <h2 className={styles.sectionTitle} style={{display:'flex', alignItems:'center', gap:'8px'}}><ClipboardList size={24} /> Order History</h2>
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
                        <Link to={`/invoice/${order.orderId}`} target="_blank" className={styles.historyLink} title="Print Invoice"><Printer size={16} /></Link>
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
                <div className={styles.emptyIcon}><Package size={48} color="var(--muted)" /></div>
                <h3 className={styles.emptyTitle}>No orders yet</h3>
                <p className={styles.emptyText}>Your custom pieces will appear here once you place an order.</p>
                <Link to="/products" className={styles.emptyBtn}>Start Shopping →</Link>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: CUSTOM PRINTS ── */}
        {activeTab === 'custom-prints' && (
          <CustomPrintsTab 
            customPrints={customPrints}
            addresses={addresses}
            preparePayment={prepareCustomPrintPayment}
          />
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
                        <p className={styles.addrPhone} style={{display:'flex', alignItems:'center', gap:'4px'}}><MapPin size={14} /> {addr.phone}</p>
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

function CustomPrintsTab({
  customPrints,
  addresses,
  preparePayment,
}: {
  customPrints: any[] | undefined
  addresses: any[] | undefined
  preparePayment: any
}) {
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<Record<string, string>>({})
  const [error, setError] = useState<Record<string, string>>({})

  const updateCustomPrint = useMutation(api.customPrints.updateCustomPrintRequest)
  const uploadFile = useAction(api.cloudinary.uploadCustomPrintFile)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editImages, setEditImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [savingId, setSavingId] = useState<string | null>(null)

  if (customPrints === undefined) {
    return (
      <div className={styles.tabContent}>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
          Loading your custom requests...
        </div>
      </div>
    )
  }

  if (customPrints.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}><Printer size={48} color="var(--muted)" /></div>
        <h3 className={styles.emptyTitle}>No custom prints requested</h3>
        <p className={styles.emptyText}>Have a unique design idea? Request a custom 3D print and we'll craft it for you.</p>
        <Link to="/custom-print" className={styles.emptyBtn}>Request Custom Print →</Link>
      </div>
    )
  }

  const handlePay = async (req: any) => {
    const reqId = req.customPrintId
    const addrId = selectedAddressId[reqId] || (addresses && addresses.find(a => a.isDefault)?._id) || (addresses && addresses[0]?._id)

    if (!addrId) {
      setError(prev => ({ ...prev, [reqId]: 'Please add and select a delivery address in your profile.' }))
      return
    }

    const selectedAddr = addresses?.find(a => a._id === addrId)
    if (!selectedAddr) return

    setPaymentLoading(reqId)
    setError(prev => ({ ...prev, [reqId]: '' }))

    try {
      // 1. Load Razorpay script
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        throw new Error('Could not load payment gateway. Check your connection.')
      }

      // 2. Prepare payment on backend (creates Razorpay order and returns options)
      const rzpOrder = await preparePayment({
        customPrintId: req.customPrintId,
        address: {
          name: selectedAddr.name,
          line1: selectedAddr.line1,
          line2: selectedAddr.line2 || undefined,
          city: selectedAddr.city,
          state: selectedAddr.state,
          pincode: selectedAddr.pincode,
          phone: selectedAddr.phone,
        }
      })

      // 3. Open Razorpay modal
      const rzp = new window.Razorpay({
        key: rzpOrder.keyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: 'BWR Works',
        description: `Custom Print ${req.customPrintId}`,
        image: '/logo.png',
        order_id: rzpOrder.razorpayOrderId,
        prefill: { name: selectedAddr.name, contact: selectedAddr.phone },
        theme: { color: '#FF5C1A' },
        modal: { ondismiss: () => setPaymentLoading(null) },
        handler: () => {
          // Refresh page upon success
          window.location.reload()
        }
      })
      rzp.open()
    } catch (err: any) {
      console.error(err)
      setError(prev => ({ ...prev, [reqId]: err?.message || 'Payment initiation failed.' }))
      setPaymentLoading(null)
    }
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.orderGrid}>
        {customPrints.map(req => {
          const meta = CUSTOM_STATUS_META[req.status] || CUSTOM_STATUS_META.requested
          const activeAddrId = selectedAddressId[req.customPrintId] || (addresses && addresses.find(a => a.isDefault)?._id) || (addresses && addresses[0]?._id) || ''
          const reqError = error[req.customPrintId]

          if (editingId === req.customPrintId) {
            return (
              <div key={req._id} className={styles.orderCard} style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'auto', border: '1px solid var(--orange)' }}>
                <div className={styles.orderCardTop}>
                  <div>
                    <div className={styles.orderIdLabel}>EDIT REQUEST</div>
                    <div className={styles.orderId}>{req.customPrintId}</div>
                  </div>
                  <button 
                    onClick={() => setEditingId(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
                  >
                    ✕ Cancel
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase' }}>Description *</label>
                    <textarea
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      rows={4}
                      style={{ background: 'var(--ink)', color: '#fff', border: '1px solid var(--line)', padding: '10px', borderRadius: '4px', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'var(--font-body)', outline: 'none' }}
                      required
                      disabled={savingId === req.customPrintId || isUploading}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase' }}>Reference Photos (Max 3)</label>
                    
                    {/* Current images */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {editImages.map((img: string, i: number) => (
                        <div key={i} style={{ position: 'relative', width: '60px', height: '60px' }}>
                          <img src={img} alt="reference" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--line)' }} />
                          <button
                            type="button"
                            onClick={() => setEditImages(prev => prev.filter((_, j) => j !== i))}
                            style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--error)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* File input */}
                    {editImages.length < 3 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={async (e) => {
                            if (!e.target.files) return;
                            const newFiles = Array.from(e.target.files);
                            if (editImages.length + newFiles.length > 3) {
                              alert("Max 3 reference images allowed.");
                              return;
                            }
                            setIsUploading(true);
                            setUploadProgress(0);
                            try {
                              const uploaded: string[] = [...editImages];
                              for (let i = 0; i < newFiles.length; i++) {
                                setUploadProgress(Math.round((i / newFiles.length) * 100));
                                
                                // base64 conversion
                                const base64Data = await new Promise<string>((resolve, reject) => {
                                  const reader = new FileReader();
                                  reader.readAsDataURL(newFiles[i]);
                                  reader.onload = () => {
                                    const result = reader.result as string;
                                    const base64 = result.split(',')[1];
                                    resolve(base64);
                                  };
                                  reader.onerror = err => reject(err);
                                });

                                const url = await uploadFile({
                                  base64Data,
                                  fileName: newFiles[i].name,
                                  fileType: newFiles[i].type,
                                });
                                uploaded.push(url);
                              }
                              setEditImages(uploaded);
                            } catch (err: any) {
                              alert("File upload failed: " + (err.message || err));
                            } finally {
                              setIsUploading(false);
                              setUploadProgress(100);
                            }
                          }}
                          disabled={isUploading || savingId === req.customPrintId}
                          style={{ fontSize: '0.75rem', color: 'var(--muted)' }}
                        />
                        {isUploading && <span style={{ fontSize: '0.7rem', color: 'var(--orange)' }}>Uploading {uploadProgress}%...</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button
                    onClick={async () => {
                      if (!editDescription.trim()) {
                        alert("Description is required.");
                        return;
                      }
                      setSavingId(req.customPrintId);
                      try {
                        await updateCustomPrint({
                          customPrintId: req.customPrintId,
                          description: editDescription,
                          images: editImages,
                        });
                        setEditingId(null);
                      } catch (err: any) {
                        alert("Failed to update request: " + (err.message || err));
                      } finally {
                        setSavingId(null);
                      }
                    }}
                    disabled={savingId === req.customPrintId || isUploading}
                    style={{ flex: 1, background: 'var(--orange)', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                  >
                    {savingId === req.customPrintId ? 'Saving...' : 'Save Updates'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    disabled={savingId === req.customPrintId || isUploading}
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--line)', padding: '10px', borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={req._id} className={styles.orderCard} style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'auto' }}>
              <div className={styles.orderCardTop}>
                <div>
                  <div className={styles.orderIdLabel}>REQUEST ID</div>
                  <div className={styles.orderId}>{req.customPrintId}</div>
                </div>
                <div className={styles.statusBadge} style={{ background: meta.color + '20', color: meta.color, borderColor: meta.color + '40' }}>
                  {meta.icon} {meta.label}
                </div>
              </div>

              {/* Description & Thumbs */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.88rem', color: '#eaeaea', lineHeight: 1.5, margin: '0 0 12px 0', whiteSpace: 'pre-wrap' }}>
                  {req.description}
                </p>
                {req.images && req.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {req.images.map((img: string, i: number) => (
                      <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                        <img src={img} alt="reference" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--line)' }} />
                      </a>
                    ))}
                  </div>
                )}
                {['requested', 'quoted'].includes(req.status) && (
                  <button
                    onClick={() => {
                      setEditingId(req.customPrintId)
                      setEditDescription(req.description)
                      setEditImages(req.images || [])
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      color: 'var(--orange)',
                      border: '1px solid var(--orange)',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      marginTop: '4px',
                      transition: 'all 0.15s',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}
                  >
                    ✏️ Edit Request
                  </button>
                )}
              </div>

              {/* Pricing & Checkout Block */}
              {req.status === 'quoted' && req.pricing && (
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--line)', padding: '16px', borderRadius: '6px', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>QUOTED PRICE:</span>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--orange)' }}>{fmt(req.pricing.total)}</strong>
                  </div>

                  {addresses && addresses.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>SHIPPING ADDRESS:</label>
                      <select
                        value={activeAddrId}
                        onChange={e => setSelectedAddressId(prev => ({ ...prev, [req.customPrintId]: e.target.value }))}
                        style={{ background: 'var(--ink)', color: '#fff', border: '1px solid var(--line)', padding: '8px', borderRadius: '4px', fontSize: '0.85rem' }}
                      >
                        {addresses.map(a => (
                          <option key={a._id} value={a._id}>
                            {a.name} - {a.line1}, {a.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>No saved addresses. Please add one under the "Profile & Addresses" tab first.</span>
                    </div>
                  )}

                  {reqError && (
                    <div style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '10px', fontFamily: 'var(--font-mono)' }}>
                      ⚠️ {reqError}
                    </div>
                  )}

                  <button
                    onClick={() => handlePay(req)}
                    disabled={paymentLoading === req.customPrintId || !activeAddrId}
                    style={{
                      width: '100%',
                      background: 'var(--orange)',
                      color: '#fff',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      marginTop: '14px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-display)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontSize: '0.85rem'
                    }}
                  >
                    {paymentLoading === req.customPrintId ? 'Processing...' : `Pay & Order →`}
                  </button>
                </div>
              )}

              {/* Progress Milestones for Active Orders */}
              {['ordered', 'printing', 'shipped', 'delivered'].includes(req.status) && (
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '8px' }}>
                    <span>ORDER TOTAL: {req.pricing ? fmt(req.pricing.total) : '—'}</span>
                    <span>{new Date(req.updatedAt).toLocaleDateString('en-IN')}</span>
                  </div>

                  {/* Tracking number display */}
                  {req.trackingNumber && (
                    <div style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--line)', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)', display: 'block' }}>TRACKING NUMBER</span>
                      <strong style={{ color: 'var(--orange)' }}>{req.trackingNumber}</strong>
                    </div>
                  )}

                  {/* Mini timeline */}
                  <div className={styles.miniTimeline} style={{ marginTop: '12px' }}>
                    {['ordered', 'printing', 'shipped', 'delivered'].map((step, i) => {
                      const steps = ['ordered', 'printing', 'shipped', 'delivered']
                      const currentIdx = steps.indexOf(req.status)
                      const isDone = i <= currentIdx
                      return (
                        <div key={step} className={styles.miniStep}>
                          <div className={`${styles.miniDot} ${isDone ? styles.miniDotDone : ''}`} title={step} />
                          {i < 3 && <div className={`${styles.miniLine} ${isDone && i < currentIdx ? styles.miniLineDone : ''}`} />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {req.adminNotes && (
                <div style={{ background: 'rgba(255,92,26,0.05)', padding: '10px 14px', borderRadius: '4px', borderLeft: '3px solid var(--orange)', fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: 700, display: 'block', marginBottom: '2px', color: 'var(--orange)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>DESIGN TEAM UPDATE</span>
                  <p style={{ margin: 0, color: '#eaeaea' }}>{req.adminNotes}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


