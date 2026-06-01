import { useState, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { formatPrice, formatDate } from '../../lib/formatters'

type SortKey = 'name' | 'email' | 'totalOrders' | 'totalRevenue' | '_creationTime'
type SortDir = 'asc' | 'desc'

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  received:  { bg: 'rgba(255,92,26,0.15)',   color: '#FF5C1A', label: 'Received'  },
  printing:  { bg: 'rgba(245,158,11,0.15)',  color: '#D97706', label: 'Printing'  },
  shipped:   { bg: 'rgba(59,130,246,0.15)',  color: '#2563EB', label: 'Shipped'   },
  delivered: { bg: 'rgba(34,197,94,0.15)',   color: '#16A34A', label: 'Delivered' },
  cancelled: { bg: 'rgba(239,68,68,0.12)',   color: '#DC2626', label: 'Cancelled' },
}

const PAYMENT_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  verified: { bg: 'rgba(34,197,94,0.15)',  color: '#16A34A', dot: '#22c55e' },
  pending:  { bg: 'rgba(245,158,11,0.15)', color: '#D97706', dot: '#F59E0B' },
  failed:   { bg: 'rgba(239,68,68,0.12)',  color: '#DC2626', dot: '#EF4444' },
}

function Badge({ text, style }: { text: string; style: { bg: string; color: string } }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 4,
      background: style.bg, color: style.color,
      fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
      fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase',
    }}>
      {text}
    </span>
  )
}

/** Expanded user detail panel */
function UserOrdersPanel({ userId, userName }: { userId: Id<'users'>; userName: string }) {
  const orders = useQuery(api.users.getOrdersForUser, { userId })

  if (orders === undefined) {
    return (
      <div style={{ padding: '24px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          border: '2px solid rgba(255,92,26,0.4)',
          borderTopColor: '#FF5C1A',
          animation: 'spin 0.7s linear infinite',
        }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#888' }}>
          Loading orders for {userName}…
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div style={{
        padding: '28px 0', textAlign: 'center',
        fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
        color: '#555', letterSpacing: '0.1em',
      }}>
        <div style={{ fontSize: '1.6rem', marginBottom: 8, opacity: 0.4 }}>📭</div>
        NO ORDERS YET
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {orders.map(order => {
        const ss = STATUS_STYLES[order.status]   || STATUS_STYLES.received
        const ps = PAYMENT_STYLES[order.paymentStatus] || PAYMENT_STYLES.pending
        return (
          <div key={order._id} style={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            {/* Order header row */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px', flexWrap: 'wrap', gap: 8,
              borderBottom: '1px solid #F3F4F6',
              background: '#FAFAFA',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontWeight: 700,
                  fontSize: '0.78rem', color: '#111',
                }}>{order.orderId}</span>
                <Badge text={ss.label} style={ss} />
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '2px 8px', borderRadius: 4,
                  background: ps.bg, color: ps.color,
                  fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                  fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: ps.dot, display: 'inline-block',
                  }} />
                  {order.paymentStatus}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                  fontSize: '0.95rem', color: '#111',
                }}>{formatPrice(order.total)}</span>
                <a
                  href={`/invoice/${order.orderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: '#FF5C1A', textDecoration: 'none',
                    padding: '4px 10px', border: '1px solid rgba(255,92,26,0.4)',
                    borderRadius: 4, transition: 'all 0.15s', fontWeight: 600,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FF5C1A'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#FF5C1A' }}
                >
                  Invoice ↗
                </a>
              </div>
            </div>

            {/* Items */}
            <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {order.items.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: '#374151' }}>
                    {item.productName}
                    <span style={{ color: '#9CA3AF', marginLeft: 6, fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                      ×{item.quantity}
                    </span>
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#6B7280' }}>
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              padding: '6px 16px', display: 'flex', gap: 16, flexWrap: 'wrap',
              borderTop: '1px solid #F3F4F6',
              fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: '#9CA3AF',
              letterSpacing: '0.05em',
            }}>
              <span>{formatDate(order._creationTime)}</span>
              {order.paymentMode && <span>Via {order.paymentMode.toUpperCase()}</span>}
              {order.couponCode && <span>Coupon: <strong style={{ color: '#6B7280' }}>{order.couponCode}</strong></span>}
              {order.gstAmount > 0 && <span>GST: {formatPrice(order.gstAmount)}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Generate a deterministic pastel color from a string
function avatarColor(str: string): string {
  const colors = [
    '#FF5C1A', '#0EA5E9', '#8B5CF6', '#EC4899',
    '#10B981', '#F59E0B', '#EF4444', '#06B6D4',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function AdminUsers() {
  const users = useQuery(api.users.getAllWithStats)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('_creationTime')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <span style={{ opacity: 0.3 }}>↕</span>
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
        case 'name':         av = (a.name || '').toLowerCase(); bv = (b.name || '').toLowerCase(); break
        case 'email':        av = (a.email || '').toLowerCase(); bv = (b.email || '').toLowerCase(); break
        case 'totalOrders':  av = a.totalOrders;    bv = b.totalOrders;    break
        case 'totalRevenue': av = a.totalRevenue;   bv = b.totalRevenue;   break
        case '_creationTime':av = a._creationTime;  bv = b._creationTime;  break
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return result
  }, [users, search, sortKey, sortDir])

  // Loading state
  if (users === undefined) {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
            letterSpacing: '0.16em', color: '#FF5C1A', marginBottom: 4,
          }}>ADMIN · USERS</div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.6rem',
            fontWeight: 800, color: '#111', margin: 0,
          }}>User Management</h1>
        </div>
        <div style={{
          background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center',
          border: '1px solid #E5E7EB',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '3px solid rgba(255,92,26,0.3)',
            borderTopColor: '#FF5C1A',
            animation: 'spin 0.7s linear infinite',
            margin: '0 auto 16px',
          }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#9CA3AF' }}>
            Loading users…
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  const totalRevenue = users.reduce((s, u) => s + u.totalRevenue, 0)
  const totalOrders = users.reduce((s, u) => s + u.totalOrders, 0)
  const adminCount = users.filter(u => u.role === 'admin').length

  return (
    <div>
      {/* Page Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
            letterSpacing: '0.18em', color: '#FF5C1A', marginBottom: 4,
            textTransform: 'uppercase',
          }}>Admin · User Management</div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.7rem',
            fontWeight: 800, color: '#111', margin: 0,
          }}>
            All Users
          </h1>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12, marginBottom: 24,
      }}>
        {[
          { label: 'Total Users', value: users.length, icon: '👥', color: '#6366F1' },
          { label: 'Total Orders', value: totalOrders, icon: '📦', color: '#FF5C1A' },
          { label: 'Total Revenue', value: formatPrice(totalRevenue), icon: '💰', color: '#16A34A' },
          { label: 'Admins', value: adminCount, icon: '🛡️', color: '#D97706' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: '#fff', border: '1px solid #E5E7EB',
            borderRadius: 10, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: stat.color + '15',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', flexShrink: 0,
            }}>{stat.icon}</div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: '1.1rem', color: '#111',
              }}>{stat.value}</div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{
        background: '#fff', border: '1px solid #E5E7EB',
        borderRadius: 10, overflow: 'hidden', marginBottom: 16,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px', borderBottom: '1px solid #F3F4F6',
          flexWrap: 'wrap',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 200 }}>
            <span style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: '#9CA3AF', fontSize: '0.9rem', pointerEvents: 'none',
            }}>🔍</span>
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '9px 14px 9px 36px',
                fontFamily: 'var(--font-body)', fontSize: '0.84rem',
                background: '#F9FAFB', border: '1px solid #E5E7EB',
                color: '#111', borderRadius: 8, outline: 'none',
                transition: 'border-color 0.2s', boxSizing: 'border-box',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#FF5C1A'}
              onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
            />
          </div>

          {/* Sort pills */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {([
              ['_creationTime', 'Joined'],
              ['totalRevenue', 'Revenue'],
              ['totalOrders', 'Orders'],
              ['name', 'Name'],
            ] as [SortKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleSort(key)}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: sortKey === key ? '#FF5C1A' : '#F3F4F6',
                  color: sortKey === key ? '#fff' : '#6B7280',
                  border: 'none', padding: '7px 13px', borderRadius: 6,
                  cursor: 'pointer', transition: 'all 0.15s', fontWeight: 600,
                }}
              >
                {label} {sortIcon(key)}
              </button>
            ))}
          </div>

          <div style={{
            marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
            color: '#9CA3AF', whiteSpace: 'nowrap',
          }}>
            {filtered.length} of {users.length}
          </div>
        </div>

        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2.5fr 1.5fr 80px 120px 80px',
          gap: 0,
          padding: '8px 20px',
          background: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB',
        }}>
          {['User', 'Email', 'Orders', 'Revenue', ''].map((h, i) => (
            <div key={i} style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
              letterSpacing: '0.12em', color: '#9CA3AF',
              textTransform: 'uppercase', padding: '2px 0',
            }}>{h}</div>
          ))}
        </div>

        {/* User rows */}
        <div>
          {filtered.map((u, idx) => {
            const isExpanded = expandedUser === u._id
            const initials = (u.name || u.email || '?').substring(0, 2).toUpperCase()
            const bgColor = avatarColor(u._id)
            return (
              <div key={u._id} style={{
                borderBottom: idx < filtered.length - 1 ? '1px solid #F3F4F6' : 'none',
              }}>
                {/* Row */}
                <div
                  onClick={() => setExpandedUser(isExpanded ? null : u._id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2.5fr 1.5fr 80px 120px 80px',
                    gap: 0,
                    padding: '14px 20px',
                    cursor: 'pointer',
                    background: isExpanded ? '#FFF9F7' : '#fff',
                    transition: 'background 0.15s',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = '#F9FAFB' }}
                  onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = '#fff' }}
                >
                  {/* User info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: bgColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontWeight: 800,
                      fontSize: '0.75rem', color: '#fff',
                      flexShrink: 0, letterSpacing: '0.04em',
                    }}>{initials}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-body)', fontWeight: 600,
                          fontSize: '0.9rem', color: '#111',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{u.name || <span style={{ color: '#9CA3AF', fontStyle: 'italic', fontWeight: 400 }}>Unnamed</span>}</span>
                        {u.role === 'admin' && (
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: '0.52rem',
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            background: 'rgba(255,92,26,0.12)', color: '#FF5C1A',
                            padding: '1px 6px', borderRadius: 3, fontWeight: 700,
                            flexShrink: 0,
                          }}>Admin</span>
                        )}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                        color: '#9CA3AF', marginTop: 1,
                      }}>Joined {formatDate(u._creationTime)}</div>
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                    color: '#6B7280',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    paddingRight: 12,
                  }}>{u.email || '—'}</div>

                  {/* Orders */}
                  <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: '1rem', color: u.totalOrders > 0 ? '#111' : '#D1D5DB',
                  }}>
                    {u.totalOrders}
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
                      color: '#9CA3AF', marginLeft: 3, fontWeight: 400,
                    }}>{u.totalOrders === 1 ? 'order' : 'orders'}</span>
                  </div>

                  {/* Revenue */}
                  <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 800,
                    fontSize: '0.95rem',
                    color: u.totalRevenue > 0 ? '#16A34A' : '#D1D5DB',
                  }}>{formatPrice(u.totalRevenue)}</div>

                  {/* Expand arrow */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 28, height: 28, borderRadius: 6,
                      background: isExpanded ? 'rgba(255,92,26,0.1)' : '#F3F4F6',
                      color: isExpanded ? '#FF5C1A' : '#9CA3AF',
                      fontSize: '0.75rem', transition: 'all 0.2s',
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                    }}>▼</div>
                  </div>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div style={{
                    padding: '16px 20px 20px',
                    background: '#FFF9F7',
                    borderTop: '1px solid rgba(255,92,26,0.08)',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
                    }}>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                        letterSpacing: '0.14em', color: '#FF5C1A',
                        textTransform: 'uppercase', fontWeight: 700,
                      }}>Order History</div>
                      {u.totalOrders > 0 && (
                        <div style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
                          background: 'rgba(255,92,26,0.12)', color: '#FF5C1A',
                          padding: '1px 7px', borderRadius: 3, fontWeight: 600,
                        }}>{u.totalOrders}</div>
                      )}
                    </div>
                    <UserOrdersPanel userId={u._id} userName={u.name || 'User'} />
                  </div>
                )}
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '48px 20px',
              fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
              color: '#9CA3AF', letterSpacing: '0.08em',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 12, opacity: 0.4 }}>🔍</div>
              {search ? `No users match "${search}"` : 'No users found'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
