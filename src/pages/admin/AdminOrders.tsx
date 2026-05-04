import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Link, useSearchParams } from 'react-router-dom'
import styles from './AdminOrders.module.css'

const STATUSES = ['all', 'received', 'printing', 'shipped', 'delivered']
const STATUS_COLOR: Record<string, string> = {
  received: '#FF5C1A', printing: '#F57C00', shipped: '#1565C0', delivered: '#2E7D32',
}

function fmt(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
}

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  const statusFilter = searchParams.get('status') || 'all'
  const updateStatus = useMutation(api.orders.updateOrderStatus)
  const addNote = useMutation(api.orders.addAdminNote)

  const orders = useQuery(api.orders.getAllForAdmin, {
    status: statusFilter === 'all' ? undefined : statusFilter,
  })

  const filtered = (orders || []).filter(o => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      o.orderId.toLowerCase().includes(q) ||
      o.addressSnapshot.name.toLowerCase().includes(q) ||
      o.addressSnapshot.phone.includes(q)
    )
  })

  const handleStatusChange = async (orderId: string, status: string, trackingNumber?: string) => {
    await updateStatus({
      orderId,
      status: status as 'received' | 'printing' | 'shipped' | 'delivered',
      trackingNumber,
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>ADMIN</div>
          <h1 className={styles.title}>Orders</h1>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.statusTabs}>
          {STATUSES.map(s => (
            <button
              key={s}
              className={`${styles.statusTab} ${statusFilter === s ? styles.statusTabActive : ''}`}
              onClick={() => setSearchParams(s === 'all' ? {} : { status: s })}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        <input
          className={styles.searchInput}
          placeholder="Search by Order ID, name, phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Orders */}
      {orders === undefined ? (
        <div className={styles.loading}>Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          {search ? `No orders matching "${search}"` : 'No orders in this category yet.'}
        </div>
      ) : (
        <div className={styles.orderList}>
          {filtered.map(order => (
            <div key={order._id} className={styles.orderCard}>
              <div
                className={styles.orderHeader}
                onClick={() => setExpandedOrder(expandedOrder === order.orderId ? null : order.orderId)}
              >
                <div className={styles.orderMeta}>
                  <span className={styles.orderId}>{order.orderId}</span>
                  <span className={styles.orderCustomer}>{order.addressSnapshot.name}</span>
                  <span className={styles.orderAmount}>{fmt(order.total)}</span>
                </div>
                <div className={styles.orderRight}>
                  <span className={styles.badge} style={{ background: STATUS_COLOR[order.status] }}>
                    {order.status.toUpperCase()}
                  </span>
                  <span className={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </span>
                  <span className={styles.chevron}>{expandedOrder === order.orderId ? '▲' : '▼'}</span>
                </div>
              </div>

              {expandedOrder === order.orderId && (
                <div className={styles.orderDetail}>
                  {/* Items */}
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>ITEMS</div>
                    {order.items.map((item, i) => (
                      <div key={i} className={styles.detailItem}>
                        <span>{item.productName} × {item.quantity}</span>
                        <span>{fmt(item.unitPrice * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Address */}
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>DELIVER TO</div>
                    <div className={styles.detailText}>
                      {order.addressSnapshot.name}, {order.addressSnapshot.line1},
                      {order.addressSnapshot.city}, {order.addressSnapshot.state} — {order.addressSnapshot.pincode}
                      <br />📱 {order.addressSnapshot.phone}
                    </div>
                  </div>

                  {/* Status Update */}
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>UPDATE STATUS</div>
                    <div className={styles.statusActions}>
                      {(['received', 'printing', 'shipped', 'delivered'] as const).map(s => (
                        <button
                          key={s}
                          className={`${styles.statusBtn} ${order.status === s ? styles.statusBtnActive : ''}`}
                          style={order.status === s ? { background: STATUS_COLOR[s] } : {}}
                          onClick={() => handleStatusChange(order.orderId, s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {order.status === 'shipped' && (
                      <input
                        className={styles.trackingInput}
                        placeholder="Enter tracking number..."
                        defaultValue={order.trackingNumber || ''}
                        onBlur={e => {
                          if (e.target.value !== order.trackingNumber) {
                            handleStatusChange(order.orderId, 'shipped', e.target.value)
                          }
                        }}
                      />
                    )}
                  </div>

                  {/* Admin Note */}
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>INTERNAL NOTE</div>
                    <textarea
                      className={styles.noteInput}
                      placeholder="Add a private note about this order..."
                      defaultValue={order.adminNotes || ''}
                      rows={2}
                      onBlur={e => {
                        if (e.target.value !== order.adminNotes) {
                          addNote({ orderId: order.orderId, note: e.target.value })
                        }
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginTop: '16px', alignItems: 'center' }}>
                    <Link to={`/invoice/${order.orderId}`} target="_blank" className={styles.statusBtn} style={{ background: '#333', color: '#fff', textDecoration: 'none', padding: '6px 12px' }}>
                      🖨️ Print Invoice
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
