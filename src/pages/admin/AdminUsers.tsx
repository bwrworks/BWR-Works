import { useState, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { formatPrice, formatDate } from '../../lib/formatters'

type SortKey = 'name' | 'email' | 'totalOrders' | 'totalRevenue' | '_creationTime'
type SortDir = 'asc' | 'desc'

// ─── Strict B&W/Orange palette ───────────────────────────────────────────────
const C = {
  orange:      '#FF5C1A',
  orangeDim:   'rgba(255,92,26,0.12)',
  orangeBorder:'rgba(255,92,26,0.35)',
  black:       '#111111',
  charcoal:    '#333333',
  mid:         '#666666',
  muted:       '#999999',
  border:      '#E5E7EB',
  borderLight: '#F3F4F6',
  bg:          '#F9FAFB',
  white:       '#FFFFFF',
}

// ─── Status badges — orange / black tones only ───────────────────────────────
const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  received:  { label: 'RECEIVED',  color: C.orange,   bg: C.orangeDim },
  printing:  { label: 'PRINTING',  color: C.charcoal, bg: '#F3F4F6'   },
  shipped:   { label: 'SHIPPED',   color: C.black,    bg: '#EBEBEB'   },
  delivered: { label: 'DELIVERED', color: C.white,    bg: C.black     },
  cancelled: { label: 'CANCELLED', color: C.white,    bg: '#444'      },
}

const PAYMENT: Record<string, { label: string; color: string; bg: string }> = {
  verified: { label: 'PAID',    color: C.black,  bg: '#E5E7EB' },
  pending:  { label: 'PENDING', color: C.orange, bg: C.orangeDim },
  failed:   { label: 'FAILED',  color: C.white,  bg: '#222'    },
}

// ─── Shared badge ─────────────────────────────────────────────────────────────
function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 7px',
      borderRadius: 3,
      background: bg,
      color,
      fontFamily: 'var(--font-mono)',
      fontSize: '0.58rem',
      fontWeight: 700,
      letterSpacing: '0.1em',
    }}>
      {label}
    </span>
  )
}

// ─── Expanded order panel ─────────────────────────────────────────────────────
function UserOrdersPanel({ userId, userName }: { userId: Id<'users'>; userName: string }) {
  const orders = useQuery(api.users.getOrdersForUser, { userId })

  if (orders === undefined) {
    return (
      <div style={{ padding: '20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          border: `2px solid ${C.orangeBorder}`,
          borderTopColor: C.orange,
          animation: 'bwr-spin 0.7s linear infinite',
          flexShrink: 0,
        }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: C.muted }}>
          Loading orders for {userName}…
        </span>
        <style>{`@keyframes bwr-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div style={{
        padding: '24px 0',
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        color: C.muted,
        letterSpacing: '0.1em',
      }}>
        NO ORDERS YET
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {orders.map(order => {
        const ss = STATUS[order.status]          ?? STATUS.received
        const ps = PAYMENT[order.paymentStatus]  ?? PAYMENT.pending
        return (
          <div key={order._id} style={{
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              flexWrap: 'wrap',
              gap: 8,
              borderBottom: `1px solid ${C.borderLight}`,
              background: C.bg,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  color: C.black,
                }}>
                  {order.orderId}
                </span>
                <Pill label={ss.label} color={ss.color} bg={ss.bg} />
                <Pill label={ps.label} color={ps.color} bg={ps.bg} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: C.black,
                }}>
                  {formatPrice(order.total)}
                </span>
                <a
                  href={`/invoice/${order.orderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase' as const,
                    color: C.orange,
                    textDecoration: 'none',
                    padding: '4px 10px',
                    border: `1px solid ${C.orangeBorder}`,
                    borderRadius: 4,
                    fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = C.orange
                    e.currentTarget.style.color = C.white
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = C.orange
                  }}
                >
                  Invoice ↗
                </a>
              </div>
            </div>

            {/* Items */}
            <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {order.items.map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: C.charcoal }}>
                    {/* Safely coerce productName to string to prevent React Error #130 */}
                    {typeof item.productName === 'string' ? item.productName : String(item.productName ?? '—')}
                    <span style={{ color: C.muted, marginLeft: 6, fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                      ×{item.quantity}
                    </span>
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: C.mid }}>
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer meta */}
            <div style={{
              padding: '6px 16px',
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              borderTop: `1px solid ${C.borderLight}`,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.58rem',
              color: C.muted,
              letterSpacing: '0.05em',
            }}>
              <span>{formatDate(order._creationTime)}</span>
              {order.paymentMode && <span>Via {order.paymentMode.toUpperCase()}</span>}
              {order.couponCode && (
                <span>Coupon: <strong style={{ color: C.mid }}>{order.couponCode}</strong></span>
              )}
              {order.gstAmount > 0 && <span>GST: {formatPrice(order.gstAmount)}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const users = useQuery(api.users.getAllWithStats)
  const [search, setSearch]         = useState('')
  const [sortKey, setSortKey]       = useState<SortKey>('_creationTime')
  const [sortDir, setSortDir]       = useState<SortDir>('desc')
  const [expandedUser, setExpanded] = useState<string | null>(null)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = useMemo(() => {
    if (!users) return []
    const q = search.toLowerCase().trim()
    let list = q
      ? users.filter(u =>
          (u.name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q)
        )
      : [...users]

    list.sort((a, b) => {
      let av: string | number = 0
      let bv: string | number = 0
      switch (sortKey) {
        case 'name':          av = (a.name || '').toLowerCase(); bv = (b.name || '').toLowerCase(); break
        case 'email':         av = (a.email || '').toLowerCase(); bv = (b.email || '').toLowerCase(); break
        case 'totalOrders':   av = a.totalOrders;   bv = b.totalOrders;   break
        case 'totalRevenue':  av = a.totalRevenue;  bv = b.totalRevenue;  break
        case '_creationTime': av = a._creationTime; bv = b._creationTime; break
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ?  1 : -1
      return 0
    })
    return list
  }, [users, search, sortKey, sortDir])

  // ── Loading ──────────────────────────────────────────────────────────────
  if (users === undefined) {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
            letterSpacing: '0.18em', color: C.orange,
            textTransform: 'uppercase', marginBottom: 4,
          }}>
            Admin · User Management
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.7rem',
            fontWeight: 800, color: C.black, margin: 0,
          }}>
            All Users
          </h1>
        </div>
        <div style={{
          background: C.white, borderRadius: 10,
          border: `1px solid ${C.border}`,
          padding: 40, textAlign: 'center',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            border: `2px solid ${C.orangeBorder}`,
            borderTopColor: C.orange,
            animation: 'bwr-spin 0.7s linear infinite',
            margin: '0 auto 14px',
          }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: C.muted }}>
            Loading users…
          </div>
          <style>{`@keyframes bwr-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  const totalRevenue = users.reduce((s, u) => s + u.totalRevenue, 0)
  const totalOrders  = users.reduce((s, u) => s + u.totalOrders, 0)
  const adminCount   = users.filter(u => u.role === 'admin').length

  // ── Stats strip ──────────────────────────────────────────────────────────
  const stats = [
    { label: 'Total Users',   value: String(users.length)         },
    { label: 'Total Orders',  value: String(totalOrders)          },
    { label: 'Total Revenue', value: formatPrice(totalRevenue)    },
    { label: 'Admins',        value: String(adminCount)           },
  ]

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
          letterSpacing: '0.18em', color: C.orange,
          textTransform: 'uppercase', marginBottom: 4,
        }}>
          Admin · User Management
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.7rem',
          fontWeight: 800, color: C.black, margin: 0,
        }}>
          All Users
        </h1>
      </div>

      {/* Stats strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 12, marginBottom: 24,
      }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: '16px 20px',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: '1.2rem', color: C.black, marginBottom: 4,
            }}>
              {s.value}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
              color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Controls + table */}
      <div style={{
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        {/* Search + sort bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 20px',
          borderBottom: `1px solid ${C.borderLight}`,
          flexWrap: 'wrap',
        }}>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: '1 1 240px', minWidth: 180,
              padding: '9px 14px',
              fontFamily: 'var(--font-body)', fontSize: '0.84rem',
              background: C.bg, border: `1px solid ${C.border}`,
              color: C.black, borderRadius: 6, outline: 'none',
              transition: 'border-color 0.15s', boxSizing: 'border-box',
            }}
            onFocus={e  => e.currentTarget.style.borderColor = C.orange}
            onBlur={e   => e.currentTarget.style.borderColor = C.border}
          />

          {/* Sort pills */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {([
              ['_creationTime', 'Joined'],
              ['totalRevenue',  'Revenue'],
              ['totalOrders',   'Orders'],
              ['name',          'Name'],
            ] as [SortKey, string][]).map(([key, label]) => {
              const active = sortKey === key
              return (
                <button
                  key={key}
                  onClick={() => handleSort(key)}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    background: active ? C.black : C.bg,
                    color:      active ? C.white : C.mid,
                    border:    `1px solid ${active ? C.black : C.border}`,
                    padding: '6px 12px', borderRadius: 5,
                    cursor: 'pointer', transition: 'all 0.15s', fontWeight: 600,
                  }}
                >
                  {label} {active ? (sortDir === 'asc' ? '↑' : '↓') : <span style={{ opacity: 0.3 }}>↕</span>}
                </button>
              )
            })}
          </div>

          <div style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono)', fontSize: '0.63rem',
            color: C.muted, whiteSpace: 'nowrap',
          }}>
            {filtered.length} of {users.length}
          </div>
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2.5fr 1.8fr 90px 120px 50px',
          padding: '8px 20px',
          background: C.bg,
          borderBottom: `1px solid ${C.border}`,
        }}>
          {['User', 'Email', 'Orders', 'Revenue', ''].map((h, i) => (
            <div key={i} style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
              letterSpacing: '0.12em', color: C.muted,
              textTransform: 'uppercase', padding: '2px 0',
            }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div>
          {filtered.map((u, idx) => {
            const isExpanded = expandedUser === u._id
            // Safe initials — always a plain string, no JSX
            const displayName  = typeof u.name === 'string' && u.name.trim() ? u.name.trim() : ''
            const displayEmail = typeof u.email === 'string' ? u.email : ''
            const initials = (displayName || displayEmail || '?').substring(0, 2).toUpperCase()

            return (
              <div
                key={u._id}
                style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}
              >
                {/* Clickable row */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpanded(isExpanded ? null : u._id)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setExpanded(isExpanded ? null : u._id) }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2.5fr 1.8fr 90px 120px 50px',
                    padding: '14px 20px',
                    cursor: 'pointer',
                    background: isExpanded ? '#FAFAFA' : C.white,
                    transition: 'background 0.15s',
                    alignItems: 'center',
                    outline: 'none',
                  }}
                  onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = C.bg }}
                  onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = C.white }}
                >
                  {/* User info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    {/* Avatar — black/orange only */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: C.black,
                      border: isExpanded ? `2px solid ${C.orange}` : `2px solid transparent`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontWeight: 800,
                      fontSize: '0.7rem', color: C.white,
                      flexShrink: 0, letterSpacing: '0.04em',
                      transition: 'border-color 0.15s',
                    }}>
                      {initials}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontFamily: 'var(--font-body)', fontWeight: 600,
                          fontSize: '0.88rem', color: C.black,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {/* Always a plain string — no JSX inside a text span */}
                          {displayName || 'Unnamed'}
                        </span>
                        {!displayName && (
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
                            color: C.muted, fontStyle: 'italic',
                          }}>
                            (no name)
                          </span>
                        )}
                        {u.role === 'admin' && (
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: '0.52rem',
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            background: C.orangeDim, color: C.orange,
                            padding: '1px 6px', borderRadius: 3, fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            Admin
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                        color: C.muted, marginTop: 2,
                      }}>
                        Joined {formatDate(u._creationTime)}
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
                    color: C.mid,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    paddingRight: 12,
                  }}>
                    {displayEmail || '—'}
                  </div>

                  {/* Orders */}
                  <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: '1rem',
                    color: u.totalOrders > 0 ? C.black : C.border,
                  }}>
                    {u.totalOrders}
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
                      color: C.muted, marginLeft: 3, fontWeight: 400,
                    }}>
                      {u.totalOrders === 1 ? 'order' : 'orders'}
                    </span>
                  </div>

                  {/* Revenue */}
                  <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 800,
                    fontSize: '0.92rem',
                    color: u.totalRevenue > 0 ? C.black : C.border,
                  }}>
                    {formatPrice(u.totalRevenue)}
                  </div>

                  {/* Expand toggle */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 26, height: 26, borderRadius: 5,
                      background: isExpanded ? C.black : C.bg,
                      border: `1px solid ${isExpanded ? C.black : C.border}`,
                      color: isExpanded ? C.white : C.mid,
                      fontSize: '0.7rem',
                      transition: 'all 0.2s',
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                    }}>
                      ▼
                    </div>
                  </div>
                </div>

                {/* Expanded orders panel */}
                {isExpanded && (
                  <div style={{
                    padding: '16px 20px 20px',
                    background: C.bg,
                    borderTop: `1px solid ${C.border}`,
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                        letterSpacing: '0.14em', color: C.orange,
                        textTransform: 'uppercase', fontWeight: 700,
                      }}>
                        Order History
                      </span>
                      {u.totalOrders > 0 && (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
                          background: C.orangeDim, color: C.orange,
                          padding: '1px 7px', borderRadius: 3, fontWeight: 600,
                        }}>
                          {u.totalOrders}
                        </span>
                      )}
                    </div>
                    <UserOrdersPanel userId={u._id} userName={displayName || displayEmail || 'User'} />
                  </div>
                )}
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '48px 20px',
              fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
              color: C.muted, letterSpacing: '0.08em',
            }}>
              {search ? `No users matching "${search}"` : 'No users found'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
