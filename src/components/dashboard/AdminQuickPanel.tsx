import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Link } from 'react-router-dom'
import styles from '../../pages/Dashboard.module.css'

export function AdminQuickPanel() {
  const stats = useQuery(api.admin.getDashboardStats)

  const statCards = [
    { icon: '📦', label: 'Total Orders', value: stats?.totalOrders ?? '—', color: '#FF5C1A' },
    { icon: '⏳', label: 'Pending Payment', value: stats?.pendingPayment ?? '—', color: '#F59E0B' },
    { icon: '🚀', label: 'To Dispatch', value: stats?.toDispatch ?? '—', color: '#8B5CF6' },
    { icon: '👥', label: 'Total Users', value: stats?.totalUsers ?? '—', color: '#0EA5E9' },
    { icon: '🚚', label: 'Shipped', value: stats?.shipped ?? '—', color: '#10B981' },
    { icon: '💰', label: 'Revenue', value: stats ? `₹${((stats.totalRevenue ?? 0) / 100).toLocaleString('en-IN')}` : '—', color: '#10B981' },
  ]

  const STATUS_CONFIG = {
    received: { label: 'Received', color: '#FF5C1A' },
    printing: { label: 'Crafting', color: '#8B5CF6' },
    shipped: { label: 'Shipped', color: '#0EA5E9' },
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
                  <span className={styles.adminStatusBadge} style={{ background: (STATUS_CONFIG[o.status as keyof typeof STATUS_CONFIG]?.color ?? '#999') + '20', color: STATUS_CONFIG[o.status as keyof typeof STATUS_CONFIG]?.color ?? '#999' }}>
                    {STATUS_CONFIG[o.status as keyof typeof STATUS_CONFIG]?.label ?? o.status}
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
