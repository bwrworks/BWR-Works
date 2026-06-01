import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthActions } from '@convex-dev/auth/react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import Logo from '../../components/ui/Logo'
import { Package, Printer, Settings, Tag, Mail, PenTool, AlertTriangle, LayoutDashboard, Users, Star } from 'lucide-react'
import styles from './AdminLayout.module.css'

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={16} />, exact: true },
  { path: '/admin/orders', label: 'Orders', icon: <Package size={16} /> },
  { path: '/admin/products', label: 'Products', icon: <Printer size={16} /> },
  { path: '/admin/pricing', label: 'Pricing Engine', icon: <Settings size={16} /> },
  { path: '/admin/coupons', label: 'Coupons', icon: <Tag size={16} /> },
  { path: '/admin/inventory', label: 'Inventory', icon: <AlertTriangle size={16} /> },
  { path: '/admin/inquiries', label: 'Inquiries', icon: <Mail size={16} /> },
  { path: '/admin/users', label: 'Users', icon: <Users size={16} /> },
  { path: '/admin/reviews', label: 'Reviews', icon: <Star size={16} /> },
  { path: '/admin/content', label: 'Content CMS', icon: <PenTool size={16} /> },
]

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const items = useQuery(api.adminNotifications.getNotificationItems)

  const typeIcons: Record<string, React.ReactNode> = {
    order: <Package size={16} />,
    inquiry: <Mail size={16} />,
    stock: <AlertTriangle size={16} />,
    payment: <span style={{ fontSize: '1rem' }}>💳</span>,
  }

  const typeColors: Record<string, string> = {
    order: '#FF5C1A',
    inquiry: '#0EA5E9',
    stock: '#EF4444',
    payment: '#F59E0B',
  }

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: '100%', maxWidth: 380,
      background: '#fff', borderLeft: '1px solid var(--line)',
      zIndex: 10001, boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
      display: 'flex', flexDirection: 'column',
      animation: 'slideInRight 0.25s ease',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px', borderBottom: '1px solid var(--line)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--ink)',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.14em', color: 'var(--orange)', textTransform: 'uppercase', marginBottom: 4 }}>NOTIFICATIONS</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Action Required</div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.4rem', cursor: 'pointer', padding: 8 }}
        >✕</button>
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {items === undefined ? (
          <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted)' }}>Loading...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>All caught up!</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--muted)' }}>No items need your attention right now.</div>
          </div>
        ) : (
          items.map((item: any) => (
            <NavLink
              key={item.id}
              to={item.link}
              onClick={onClose}
              style={{
                display: 'flex', gap: 14, padding: '14px 24px',
                textDecoration: 'none', transition: 'background 0.15s',
                borderLeft: item.urgent ? '3px solid #EF4444' : '3px solid transparent',
                background: item.urgent ? '#FEF2F2' : 'transparent',
              }}
              onMouseOver={e => (e.currentTarget.style.background = item.urgent ? '#FEE2E2' : '#F9FAFB')}
              onMouseOut={e => (e.currentTarget.style.background = item.urgent ? '#FEF2F2' : 'transparent')}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: (typeColors[item.type] || '#FF5C1A') + '15',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', flexShrink: 0,
              }}>
                {typeIcons[item.type] || '📋'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: '0.88rem', fontWeight: 600,
                  color: 'var(--ink)', marginBottom: 2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{item.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: typeColors[item.type] || 'var(--muted)' }}>{item.subtitle}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', flexShrink: 0, marginLeft: 8 }}>{timeAgo(item.time)}</span>
                </div>
              </div>
            </NavLink>
          ))
        )}
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const { signOut } = useAuthActions()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const counts = useQuery(api.adminNotifications.getNotificationCounts)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className={styles.shell}>
      {/* Mobile hamburger */}
      <button className={styles.hamburger} onClick={() => setSidebarOpen(!sidebarOpen)}>
        <span /><span /><span />
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logo} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Logo style={{ height: 28, width: 'auto', color: 'var(--ink)' }} />
          <span className={styles.logoSub}>ADMIN</span>
          {/* Notification bell */}
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              cursor: 'pointer', position: 'relative', padding: 6,
              fontSize: '1.2rem', lineHeight: 1,
            }}
          >
            🔔
            {(counts?.totalAttention ?? 0) > 0 && (
              <span style={{
                position: 'absolute', top: 0, right: 0,
                background: '#EF4444', color: '#fff',
                fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
                fontWeight: 700, minWidth: 18, height: 18,
                borderRadius: 9, display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: '0 4px',
              }}>
                {counts!.totalAttention > 9 ? '9+' : counts!.totalAttention}
              </span>
            )}
          </button>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
              {/* Badge for orders */}
              {item.path === '/admin/orders' && (counts?.newOrders ?? 0) > 0 && (
                <span style={{
                  marginLeft: 'auto', background: '#FF5C1A', color: '#fff',
                  fontSize: '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                  minWidth: 20, height: 20, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{counts!.newOrders}</span>
              )}
              {/* Badge for inquiries */}
              {item.path === '/admin/inquiries' && (counts?.newInquiries ?? 0) > 0 && (
                <span style={{
                  marginLeft: 'auto', background: '#0EA5E9', color: '#fff',
                  fontSize: '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                  minWidth: 20, height: 20, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{counts!.newInquiries}</span>
              )}
              {/* Badge for inventory */}
              {item.path === '/admin/inventory' && (counts?.outOfStock ?? 0) > 0 && (
                <span style={{
                  marginLeft: 'auto', background: '#EF4444', color: '#fff',
                  fontSize: '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                  minWidth: 20, height: 20, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{counts!.outOfStock}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <NavLink to="/" className={styles.viewSite}>
            ↗ View Site
          </NavLink>
          <button className={styles.signOut} onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* Notification Panel Overlay */}
      {notifOpen && (
        <>
          <div
            onClick={() => setNotifOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000 }}
          />
          <NotificationPanel onClose={() => setNotifOpen(false)} />
        </>
      )}
    </div>
  )
}
