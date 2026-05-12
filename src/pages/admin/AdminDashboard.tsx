import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Link } from 'react-router-dom'
import { fmt, safe } from '../../lib/formatters'
import styles from './AdminDashboard.module.css'

// ── Pure-CSS bar chart (no external deps) ──
function BarChart({ data, color = 'var(--orange)' }: {
  data: { label: string; value: number }[]
  color?: string
}) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, padding: '0 4px' }}>
      {data.map(d => (
        <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--ink)', fontWeight: 600 }}>
            {d.value > 0 ? d.value : ''}
          </span>
          <div style={{
            width: '100%',
            height: `${(d.value / max) * 100}%`,
            minHeight: d.value > 0 ? 4 : 0,
            background: color,
            borderRadius: '3px 3px 0 0',
            transition: 'height 0.6s cubic-bezier(0.16,1,0.3,1)',
            opacity: d.value === 0 ? 0.15 : 1,
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', lineHeight: 1.2 }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Donut-style status chart ──
function StatusDonut({ byStatus }: { byStatus: Record<string, number> }) {
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0)
  const colors: Record<string, string> = {
    received: '#FF5C1A', printing: '#8B5CF6', shipped: '#0EA5E9', delivered: '#10B981'
  }
  const labels: Record<string, string> = {
    received: 'Received', printing: 'Crafting', shipped: 'Shipped', delivered: 'Delivered'
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Object.entries(byStatus).map(([status, count]) => (
        <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: colors[status], flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--ink)' }}>{labels[status]}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 600, color: colors[status] }}>
                {count} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({total ? Math.round((count / total) * 100) : 0}%)</span>
              </span>
            </div>
            <div style={{ width: '100%', height: 5, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${total ? (count / total) * 100 : 0}%`, height: '100%', background: colors[status], borderRadius: 3, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value, sub, color = 'var(--orange)', icon }: {
  label: string; value: string; sub?: string; color?: string; icon?: string
}) {
  return (
    <div className={styles.statCard} style={{ borderTop: `3px solid ${color}` }}>
      {icon && <div style={{ fontSize: '1.4rem', marginBottom: 8 }}>{icon}</div>}
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={{ color }}>{value}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  )
}

const STATUS_COLOR: Record<string, string> = {
  received: '#FF5C1A', printing: '#8B5CF6', shipped: '#0EA5E9', delivered: '#10B981',
}



// Generate last 7 day labels
function getLast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push({
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 3),
      date: d.toDateString(),
    })
  }
  return days
}

export default function AdminDashboard() {
  const stats = useQuery(api.orders.getOrderStats)
  const recentOrders = useQuery(api.orders.getAllForAdmin, { limit: 8 })
  const allOrders = useQuery(api.orders.getAllForAdmin, {})

  if (stats === undefined || recentOrders === undefined) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading dashboard...</div>
      </div>
    )
  }

  // Build 7-day revenue chart data
  const last7 = getLast7Days()
  const dailyRevenue = last7.map(day => {
    const dayOrders = (allOrders || []).filter(o =>
      new Date(o.createdAt).toDateString() === day.date && o.paymentStatus === 'verified'
    )
    return {
      label: day.label,
      value: dayOrders.reduce((s, o) => s + o.total, 0) / 100 // in rupees
    }
  })

  // Build product popularity data (top 5 from order items)
  const productCounts: Record<string, number> = {}
  ;(allOrders || []).forEach(o => {
    o.items.forEach((item: any) => {
      productCounts[item.productName] = (productCounts[item.productName] || 0) + item.quantity
    })
  })
  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label: label.split(' ').slice(0, 2).join(' '), value }))

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>ADMIN</div>
          <h1 className={styles.title}>Dashboard</h1>
        </div>
        <div className={styles.headerActions}>
          <Link to="/admin/orders" className={styles.btnOutline}>View All Orders</Link>
          <Link to="/admin/products" className={styles.btnPrimary}>+ Add Product</Link>
        </div>
      </div>

      {/* ── KPI STATS ── */}
      <div className={styles.statsGrid}>
        <StatCard icon="💰" label="Today's Revenue" color="var(--orange)"
          value={fmt(stats.todayRevenue)}
          sub={`${stats.todayOrders} order${stats.todayOrders !== 1 ? 's' : ''} today`} />
        <StatCard icon="📅" label="This Week" color="#0EA5E9"
          value={fmt(stats.weekRevenue)}
          sub={`${stats.weekOrders} orders this week`} />
        <StatCard icon="📈" label="Total Revenue" color="#10B981"
          value={fmt(stats.totalRevenue)}
          sub={`${stats.paidOrders} paid orders`} />
        <StatCard icon="⏳" label="Pending Action" color="#F59E0B"
          value={String(stats.byStatus.received + stats.byStatus.printing)}
          sub="need dispatch" />
      </div>

      {/* ── CHARTS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }} className={styles.chartsRow}>
        {/* Revenue bar chart */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Revenue — Last 7 Days</h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)' }}>
              {fmt(stats.weekRevenue)} this week
            </span>
          </div>
          <div style={{ marginTop: 'var(--space-lg)' }}>
            <BarChart data={dailyRevenue} color="var(--orange)" />
          </div>
        </div>

        {/* Order status breakdown */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Order Status</h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)' }}>
              {stats.totalOrders} total
            </span>
          </div>
          <div style={{ marginTop: 'var(--space-lg)' }}>
            <StatusDonut byStatus={stats.byStatus} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 20 }}>
            {Object.entries(stats.byStatus).map(([s, c]) => (
              <Link key={s} to={`/admin/orders?status=${s}`} style={{ textDecoration: 'none' }}>
                <div style={{ textAlign: 'center', padding: '10px 4px', background: '#F9FAFB', borderRadius: 4, border: `1px solid ${STATUS_COLOR[s]}30`, transition: 'all 0.15s', cursor: 'pointer' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: STATUS_COLOR[s] }}>{c}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{s}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── TOP PRODUCTS ── */}
      {topProducts.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Top Products by Units Sold</h2>
          </div>
          <div style={{ marginTop: 'var(--space-lg)' }}>
            <BarChart data={topProducts} color="#8B5CF6" />
          </div>
        </div>
      )}

      {/* ── ANALYTICS NOTE ── */}
      <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 8, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '1.1rem' }}>📊</span>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 600, color: '#4338CA', letterSpacing: '0.08em' }}>WEBSITE TRAFFIC ANALYTICS</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: '#6366F1', marginTop: 2 }}>
            Page views, sessions, and visitor data are available on{' '}
            <a href="https://vercel.com/analytics" target="_blank" rel="noopener noreferrer" style={{ color: '#4338CA', fontWeight: 600 }}>
              Vercel Analytics →
            </a>
          </div>
        </div>
      </div>

      {/* ── RECENT ORDERS ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Recent Orders</h2>
          <Link to="/admin/orders" className={styles.seeAll}>See All →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className={styles.empty}>No orders yet. Share the site to get your first sale!</div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>ORDER</span><span>CUSTOMER</span><span>AMOUNT</span>
              <span>STATUS</span><span>DATE</span><span></span>
            </div>
            {recentOrders.map(order => (
              <div key={order._id} className={styles.tableRow}>
                <span className={styles.orderId}>{safe(order.orderId)}</span>
                <span className={styles.cell}>{safe(order.addressSnapshot.name)}</span>
                <span className={styles.cell}>{fmt(order.total)}</span>
                <span>
                  <span className={styles.badge} style={{ background: STATUS_COLOR[order.status] }}>
                    {order.status.toUpperCase()}
                  </span>
                </span>
                <span className={styles.cell}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                <span>
                  <Link to={`/admin/orders?highlight=${order.orderId}`} className={styles.viewLink}>View →</Link>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
