import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthActions } from '@convex-dev/auth/react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const { signOut } = useAuthActions()
  
  const user = useQuery(api.users.current)
  const addresses = useQuery(api.addresses.getMyAddresses)
  const orders = useQuery(api.orders.getMyOrders)
  const ensureAdmin = useMutation(api.admin.ensureAdminRole)

  const [activeTab, setActiveTab] = useState<'commissions' | 'addresses' | 'profile'>('commissions')

  useEffect(() => {
    if (user?.email === 'bwrworks.in@gmail.com' && user.role !== 'admin') {
      ensureAdmin()
    }
  }, [user, ensureAdmin])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  if (user === undefined) {
    return <div className={styles.page}><Navbar /><div style={{padding:'120px 0', textAlign:'center', color: 'var(--off-white)'}}>Loading profile...</div></div>
  }

  if (user === null) {
    navigate('/auth')
    return null
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <div className={styles.splitLayout}>
        
        {/* ── LEFT: NAVIGATION & SUMMARY (DARK) ── */}
        <div className={styles.leftHalf}>
          <div className={styles.leftContent}>
            
            <div className="section-eyebrow" style={{ color: 'var(--orange)' }}>CLIENT PROFILE</div>
            <h1 className={styles.title}>
              DASH<br />
              <span className={styles.outline}>BOARD</span>
            </h1>

            <div className={styles.userInfo}>
              <p className={styles.userEmail}>{user.email}</p>
              <p className={styles.userSince}>MEMBER SINCE {new Date(user._creationTime).getFullYear()}</p>
            </div>

            {user.role === 'admin' && (
              <button 
                onClick={() => navigate('/admin/pricing')} 
                className={styles.navBtnActive} 
                style={{marginBottom: '24px', width: '100%', background: 'var(--orange)', color: 'var(--white)', borderColor: 'var(--orange)'}}>
                ⚡ Admin Pricing Engine
              </button>
            )}

            <nav className={styles.navMenu}>
              <button 
                className={activeTab === 'commissions' ? styles.navBtnActive : styles.navBtn}
                onClick={() => setActiveTab('commissions')}
              >
                Booking History
              </button>
              <button 
                className={activeTab === 'addresses' ? styles.navBtnActive : styles.navBtn}
                onClick={() => setActiveTab('addresses')}
              >
                Address Book
              </button>
              <button 
                className={activeTab === 'profile' ? styles.navBtnActive : styles.navBtn}
                onClick={() => setActiveTab('profile')}
              >
                Account Details
              </button>
            </nav>

            <button onClick={handleLogout} className={styles.btnLogout}>
              End Session →
            </button>

          </div>
        </div>

        {/* ── RIGHT: CONTENT AREA (LIGHT) ── */}
        <div className={styles.rightHalf}>
          <div className={styles.rightContent}>

            {/* TAB: BOOKING HISTORY */}
            {activeTab === 'commissions' && (
              <div className={styles.tabSection}>
                <h2 className={styles.sectionTitle}>ACTIVE COMMISSIONS</h2>
                {orders && orders.filter(o => ['pending', 'paid', 'printing'].includes(o.status)).length > 0 ? (
                  <div className={styles.cardList}>
                    {orders.filter(o => ['pending', 'paid', 'printing'].includes(o.status)).map(order => (
                      <div key={order._id} className={styles.card}>
                        <div className={styles.cardHeader}>
                          <span>Order #{order._id.substring(0,6).toUpperCase()}</span>
                          <span className={styles.badgeOrange}>{order.status}</span>
                        </div>
                        <div className={styles.cardBody}>
                          Total Amount: ₹{(order.total / 100).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>No active printing commissions found.</p>
                  </div>
                )}

                <h2 className={styles.sectionTitle} style={{marginTop: '48px'}}>ORDER ARCHIVE</h2>
                {orders && orders.filter(o => ['shipped', 'delivered', 'cancelled'].includes(o.status)).length > 0 ? (
                  <div className={styles.cardList}>
                    {orders.filter(o => ['shipped', 'delivered', 'cancelled'].includes(o.status)).map(order => (
                      <div key={order._id} className={styles.card}>
                        <div className={styles.cardHeader}>
                          <span>Order #{order._id.substring(0,6).toUpperCase()}</span>
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className={styles.cardBody}>
                          Status: {order.status}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>No past orders available in your archive.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: ADDRESS BOOK */}
            {activeTab === 'addresses' && (
              <div className={styles.tabSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle} style={{marginBottom: 0}}>SAVED ADDRESSES</h2>
                  <button className={styles.btnSolid}>+ Add New</button>
                </div>
                
                {addresses && addresses.length > 0 ? (
                  <div className={styles.cardList}>
                    {addresses.map(addr => (
                      <div key={addr._id} className={styles.card}>
                        {addr.isDefault && <div className={styles.badgeSolid}>Default</div>}
                        <h4 className={styles.cardHeading}>{addr.name}</h4>
                        <p className={styles.cardText}>{addr.line1}</p>
                        {addr.line2 && <p className={styles.cardText}>{addr.line2}</p>}
                        <p className={styles.cardText}>{addr.city}, {addr.state} {addr.pincode}</p>
                        <p className={styles.cardText}>Phone: {addr.phone}</p>
                        
                        <div className={styles.cardActions}>
                          <button className={styles.btnOutline}>Edit</button>
                          <button className={styles.btnOutlineDanger}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>No delivery destinations saved yet. Adding one will accelerate your next checkout.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: ACCOUNT DETAILS */}
            {activeTab === 'profile' && (
              <div className={styles.tabSection}>
                <h2 className={styles.sectionTitle}>ACCOUNT DETAILS</h2>
                
                <div className={styles.detailBox}>
                  <div className={styles.detailRow}>
                    <label>Registered Email</label>
                    <p>{user.email}</p>
                  </div>
                  <div className={styles.detailRow}>
                    <label>Access Type</label>
                    <p>Passwordless / OTP Verification</p>
                  </div>
                  <div className={styles.detailRow}>
                    <label>Account Created</label>
                    <p>{new Date(user._creationTime).toLocaleDateString()}</p>
                  </div>
                </div>

                <div style={{ marginTop: '40px' }}>
                  <p className={styles.cardText} style={{ marginBottom: '16px' }}>
                    Require further assistance with your account?
                  </p>
                  <button className={styles.btnSolid} onClick={() => navigate('/contact')}>
                    Contact Support
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
      
      <Footer />
    </div>
  )
}
