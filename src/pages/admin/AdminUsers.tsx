import { useState, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { formatPrice, formatDate } from '../../lib/formatters'

type SortKey = 'name' | 'email' | 'totalOrders' | 'totalRevenue' | '_creationTime'
type SortDir = 'asc' | 'desc'

// Status styling
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  received: { bg: 'rgba(255, 92, 26, 0.12)', color: '#FF5C1A' },
  printing: { bg: 'rgba(245, 124, 0, 0.12)', color: '#F57C00' },
  shipped: { bg: 'rgba(21, 101, 192, 0.12)', color: '#1565C0' },
  delivered: { bg: 'rgba(46, 125, 50, 0.12)', color: '#2E7D32' },
  cancelled: { bg: 'rgba(211, 47, 47, 0.10)', color: '#D32F2F' },
}

const PAYMENT_COLORS: Record<string, { bg: string; color: string }> = {
  verified: { bg: 'rgba(46, 125, 50, 0.12)', color: '#2E7D32' },
  pending: { bg: 'rgba(245, 124, 0, 0.12)', color: '#F57C00' },
  failed: { bg: 'rgba(211, 47, 47, 0.10)', color: '#D32F2F' },
}

/** Sub-component: User detail panel showing orders */
function UserOrdersPanel({ userId, userName }: { userId: string; userName: string }) {
  const orders = useQuery(api.users.getOrdersForUser, { userId })

  if (orders === undefined) {
    return (
      <div style={{ padding: '20px 0', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#888' }}>
        Loading orders for {userName}...
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div style={{
        padding: '24px', textAlign: 'center',
        fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
        color: '#666', letterSpacing: '0.08em',
      }}>
        NO ORDERS YET
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {orders.map(order => {
        const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.received
        const payStyle = PAYMENT_COLORS[order.paymentStatus] || PAYMENT_COLORS.pending
        return (
          <div key={order._id} style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(245, 240, 232, 0.08)',
            borderRadius: 8, padding: '14px 18px',
            transition: 'border-color 0.2s',
          }}>
            {/* Order Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontWeight: 700,
                  fontSize: '0.8rem', color: 'var(--off-white)',
                }}>{order.orderId}</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
                  letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 3,
                  background: statusStyle.bg, color: statusStyle.color,
                  textTransform: 'uppercase', fontWeight: 600,
                }}>{order.status}</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
                  letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 3,
                  background: payStyle.bg, color: payStyle.color,
                  textTransform: 'uppercase', fontWeight: 600,
                }}>{order.paymentStatus}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700,
                  fontSize: '0.9rem', color: 'var(--orange)',
                }}>{formatPrice(order.total)}</span>
                <a
                  href={`/invoice/${order.orderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--off-white)', textDecoration: 'none',
                    padding: '4px 10px', border: '1px solid rgba(245, 240, 232, 0.15)',
                    borderRadius: 4, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF5C1A'; e.currentTarget.style.color = '#FF5C1A' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245, 240, 232, 0.15)'; e.currentTarget.style.color = 'var(--off-white)' }}
                >
                  Invoice ↗
                </a>
              </div>
            </div>

            {/* Items list */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 4,
              paddingTop: 8, borderTop: '1px solid rgba(245, 240, 232, 0.06)',
            }}>
              {order.items.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: '#ccc',
                  }}>
                    {item.productName} × {item.quantity}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#999',
                  }}>{formatPrice(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Footer meta */}
            <div style={{
              display: 'flex', gap: 16, marginTop: 8,
              fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
              color: '#666', letterSpacing: '0.06em',
            }}>
              <span>{formatDate(order._creationTime)}</span>
              {order.paymentMode && <span>Mode: {order.paymentMode.toUpperCase()}</span>}
              {order.couponCode && <span>Coupon: {order.couponCode}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function AdminUsers() {
  const users = useQuery(api.users.getAllWithStats)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('_creationTime')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return '↕'
    return sortDir === 'asc' ? '↑' : '↓'
  }

  const filtered = useMemo(() => {
    if (!users) return []
    const q = search.toLowerCase().trim()
    let result = q
      ? users.filter(u =>
          (u.name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q)
        )
      : [...users]

    result.sort((a, b) => {
      let av: string | number = 0
      let bv: string | number = 0
      switch (sortKey) {
        case 'name': av = (a.name || '').toLowerCase(); bv = (b.name || '').toLowerCase(); break
        case 'email': av = (a.email || '').toLowerCase(); bv = (b.email || '').toLowerCase(); break
        case 'totalOrders': av = a.totalOrders; bv = b.totalOrders; break
        case 'totalRevenue': av = a.totalRevenue; bv = b.totalRevenue; break
        case '_creationTime': av = a._creationTime; bv = b._creationTime; break
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return result
  }, [users, search, sortKey, sortDir])

  if (users === undefined) {
    return (
      <div style={{ padding: '40px 0' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.8rem',
          fontWeight: 700, color: 'var(--off-white)', marginBottom: 24,
        }}>Users</h1>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
          color: '#888', letterSpacing: '0.08em',
        }}>Loading users...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        paddingBottom: 20, borderBottom: '1px solid rgba(245, 240, 232, 0.1)',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
            letterSpacing: '0.16em', color: 'var(--orange)', marginBottom: 4,
          }}>ADMIN</div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.8rem',
            fontWeight: 700, color: 'var(--off-white)', margin: 0,
          }}>Users ({users.length})</h1>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
          color: '#888', letterSpacing: '0.06em',
        }}>
          Total Revenue: {formatPrice(users.reduce((s, u) => s + u.totalRevenue, 0))}
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', maxWidth: 420, padding: '11px 18px',
            fontFamily: 'var(--font-body)', fontSize: '0.82rem',
            background: 'rgba(245, 240, 232, 0.04)',
            border: '1px solid rgba(245, 240, 232, 0.1)',
            color: 'var(--off-white)', borderRadius: 8,
            outline: 'none', transition: 'border-color 0.2s',
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(255, 92, 26, 0.4)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(245, 240, 232, 0.1)'}
        />
      </div>

      {/* Sort buttons */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap',
      }}>
        {([
          ['_creationTime', 'Joined'],
          ['totalOrders', 'Orders'],
          ['totalRevenue', 'Revenue'],
          ['name', 'Name'],
        ] as [SortKey, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => handleSort(key)}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              background: sortKey === key ? 'rgba(255, 92, 26, 0.12)' : 'rgba(245, 240, 232, 0.04)',
              color: sortKey === key ? '#FF5C1A' : '#999',
              border: `1px solid ${sortKey === key ? 'rgba(255, 92, 26, 0.3)' : 'rgba(245, 240, 232, 0.08)'}`,
              padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {label} {sortIcon(key)}
          </button>
        ))}
      </div>

      {/* User cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(u => {
          const isExpanded = expandedUser === u._id
          return (
            <div key={u._id} style={{
              background: isExpanded
                ? 'rgba(255, 92, 26, 0.03)'
                : 'rgba(245, 240, 232, 0.02)',
              border: `1px solid ${isExpanded ? 'rgba(255, 92, 26, 0.2)' : 'rgba(245, 240, 232, 0.08)'}`,
              borderRadius: 10, overflow: 'hidden',
              transition: 'all 0.2s',
            }}>
              {/* User row — clickable */}
              <div
                onClick={() => setExpandedUser(isExpanded ? null : u._id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 16, padding: '16px 20px',
                  cursor: 'pointer', transition: 'background 0.15s',
                  alignItems: 'center',
                }}
                onMouseEnter={e => {
                  if (!isExpanded) e.currentTarget.style.background = 'rgba(245, 240, 232, 0.04)'
                }}
                onMouseLeave={e => {
                  if (!isExpanded) e.currentTarget.style.background = ''
                }}
              >
                {/* Left: name + email + meta */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: u.role === 'admin'
                        ? 'linear-gradient(135deg, #FF5C1A, #ff8a50)'
                        : 'rgba(245, 240, 232, 0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: '0.75rem', color: u.role === 'admin' ? '#fff' : '#999',
                      flexShrink: 0,
                    }}>
                      {(u.name || u.email || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontWeight: 600,
                        fontSize: '0.88rem', color: 'var(--off-white)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {u.name || 'Unnamed'}
                        {u.role === 'admin' && (
                          <span style={{
                            marginLeft: 8, fontFamily: 'var(--font-mono)',
                            fontSize: '0.5rem', letterSpacing: '0.1em',
                            background: 'rgba(255, 92, 26, 0.15)', color: '#FF5C1A',
                            padding: '2px 6px', borderRadius: 3,
                            textTransform: 'uppercase', fontWeight: 600,
                          }}>ADMIN</span>
                        )}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                        color: '#888', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{u.email || '-'}</div>
                    </div>
                  </div>
                  {/* Meta row */}
                  <div style={{
                    display: 'flex', gap: 16, marginLeft: 44,
                    fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
                    color: '#666', letterSpacing: '0.05em',
                  }}>
                    <span>Joined {formatDate(u._creationTime)}</span>
                    <span>{u.totalOrders} order{u.totalOrders !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Right: revenue + expand arrow */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: '1rem', color: u.totalRevenue > 0 ? '#22c55e' : '#555',
                    }}>{formatPrice(u.totalRevenue)}</div>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.5rem',
                      color: '#666', letterSpacing: '0.08em',
                    }}>REVENUE</div>
                  </div>
                  <div style={{
                    color: '#666', fontSize: '0.8rem',
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                  }}>▼</div>
                </div>
              </div>

              {/* Expanded detail panel */}
              {isExpanded && (
                <div style={{
                  padding: '0 20px 20px',
                  borderTop: '1px solid rgba(245, 240, 232, 0.06)',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                    letterSpacing: '0.12em', color: 'var(--orange)',
                    textTransform: 'uppercase', margin: '16px 0 12px',
                  }}>
                    ORDER HISTORY
                  </div>
                  <UserOrdersPanel userId={u._id} userName={u.name || 'User'} />
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
            color: '#666', letterSpacing: '0.08em',
          }}>
            {search ? 'No users match your search' : 'No users found'}
          </div>
        )}
      </div>
    </div>
  )
}
