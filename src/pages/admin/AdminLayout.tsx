import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthActions } from '@convex-dev/auth/react'
import styles from './AdminLayout.module.css'

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: '◈', exact: true },
  { path: '/admin/orders', label: 'Orders', icon: '📦' },
  { path: '/admin/products', label: 'Products', icon: '🖨️' },
  { path: '/admin/pricing', label: 'Pricing Engine', icon: '⚙️' },
  { path: '/admin/coupons', label: 'Coupons', icon: '🏷️' },
  { path: '/admin/inventory', label: 'Inventory', icon: '📊' },
  { path: '/admin/inquiries', label: 'Inquiries', icon: '✉️' },
  { path: '/admin/content', label: 'Content CMS', icon: '✏️' },
]

export default function AdminLayout() {
  const { signOut } = useAuthActions()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
        <div className={styles.logo}>
          <span className={styles.logoText}>BW<span className={styles.logoR}>R</span></span>
          <span className={styles.logoSub}>ADMIN</span>
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
    </div>
  )
}
