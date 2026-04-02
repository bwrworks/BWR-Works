import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Link } from 'react-router-dom'
import styles from './AdminDashboard.module.css'

function StatCard({ label, value, sub, color = 'var(--orange)' }: {
  label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={{ color }}>{value}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  )
}

const STATUS_COLOR: Record<string, string> = {
  received: '#FF5C1A', printing: '#F57C00', shipped: '#1565C0', delivered: '#2E7D32',
}

function fmt(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
}

export default function AdminDashboard() {
  const stats = useQuery(api.orders.getOrderStats)
  const recentOrders = useQuery(api.orders.getAllForAdmin, { limit: 5 })

  if (stats === undefined || recentOrders === undefined) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>ADMIN</div>
          <h1 className={styles.title}>Dashboard</h1>
        </div>
        <div className={styles.headerActions}>
          <Link to="/admin/orders" className={styles.btnOutline}>View All Orders</Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Today's Revenue"
          value={fmt(stats.todayRevenue)}
          sub={`${stats.todayOrders} order${stats.todayOrders !== 1 ? 's' : ''} today`}
        />
        <StatCard
          label="This Week"
          value={fmt(stats.weekRevenue)}
          sub={`${stats.weekOrders} orders this week`}
          color="var(--info)"
        />
        <StatCard
          label="Total Revenue"
          value={fmt(stats.totalRevenue)}
          sub={`${stats.paidOrders} paid orders total`}
          color="var(--success)"
        />
        <StatCard
          label="Pending"
          value={String(stats.byStatus.received + stats.byStatus.printing)}
          sub="need attention"
          color="var(--warning)"
        />
      </div>

      {/* Order Status Breakdown */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Order Status</h2>
        <div className={styles.statusGrid}>
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <Link key={status} to={`/admin/orders?status=${status}`} className={styles.statusCard}>
              <div className={styles.statusCount}>{count}</div>
              <div className={styles.statusLabel} style={{ color: STATUS_COLOR[status] }}>
                {status.toUpperCase()}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Orders</h2>
          <Link to="/admin/orders" className={styles.seeAll}>See All →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className={styles.empty}>No orders yet. Share the site link to get your first order!</div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>ORDER ID</span><span>CUSTOMER</span><span>AMOUNT</span>
              <span>STATUS</span><span>DATE</span><span></span>
            </div>
            {recentOrders.map(order => (
              <div key={order._id} className={styles.tableRow}>
                <span className={styles.orderId}>{order.orderId}</span>
                <span className={styles.cell}>{order.addressSnapshot.name}</span>
                <span className={styles.cell}>{fmt(order.total)}</span>
                <span>
                  <span className={styles.badge} style={{ background: STATUS_COLOR[order.status] }}>
                    {order.status.toUpperCase()}
                  </span>
                </span>
                <span className={styles.cell}>
                  {new Date(order.createdAt).toLocaleDateString('en-IN')}
                </span>
                <span>
                  <Link to={`/admin/orders/${order.orderId}`} className={styles.viewLink}>View →</Link>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
