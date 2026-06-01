import { useState, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { formatPrice, formatDate, safe } from '../../lib/formatters'

// ═══════════════════════════════════════════════════════════════════════════
// PALETTE — strict B&W + orange only
// ═══════════════════════════════════════════════════════════════════════════
const C = {
  orange:        '#FF5C1A',
  orangeHover:   '#E04800',
  orangeDim:     'rgba(255,92,26,0.10)',
  orangeBorder:  'rgba(255,92,26,0.30)',
  black:         '#111111',
  charcoal:      '#333333',
  mid:           '#666666',
  muted:         '#9CA3AF',
  border:        '#E5E7EB',
  borderLight:   '#F3F4F6',
  bg:            '#F9FAFB',
  white:         '#FFFFFF',
  redDim:        'rgba(180,20,20,0.08)',
  redBorder:     'rgba(180,20,20,0.25)',
  red:           '#B41414',
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS + PAYMENT BADGE STYLES
// ═══════════════════════════════════════════════════════════════════════════
const STATUS_S: Record<string, { label: string; color: string; bg: string }> = {
  received:  { label: 'RECEIVED',  color: C.orange,   bg: C.orangeDim },
  printing:  { label: 'PRINTING',  color: '#555',     bg: '#EFEFEF'   },
  shipped:   { label: 'SHIPPED',   color: C.black,    bg: '#E0E0E0'   },
  delivered: { label: 'DELIVERED', color: C.white,    bg: C.black     },
}
const PAY_S: Record<string, { label: string; color: string; bg: string }> = {
  verified: { label: 'PAID',    color: C.charcoal, bg: '#E0E0E0'   },
  pending:  { label: 'PENDING', color: C.orange,   bg: C.orangeDim },
  failed:   { label: 'FAILED',  color: C.white,    bg: '#444'      },
}

type SortKey      = 'name' | 'totalOrders' | 'totalRevenue' | '_creationTime' | 'lastOrderDate'
type SortDir      = 'asc' | 'desc'
type RoleFilter   = 'all' | 'admin' | 'customer'
type ActFilter    = 'all' | 'active' | 'inactive'

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
function clip(text: string, cb: () => void) {
  navigator.clipboard.writeText(text).then(cb).catch(() => {})
}

function exportCSV(rows: any[]) {
  const hdr = ['Name', 'Email', 'Role', 'Total Orders', 'Revenue (INR)', 'Last Order', 'Joined']
  const body = rows.map(u => [
    `"${safe(u.name) || 'Unnamed'}"`,
    `"${safe(u.email)}"`,
    u.role || 'customer',
    u.totalOrders,
    ((u.totalRevenue || 0) / 100).toFixed(2),
    u.lastOrderDate ? formatDate(u.lastOrderDate) : 'Never',
    formatDate(u._creationTime),
  ])
  const csv = [hdr, ...body].map(r => r.join(',')).join('\n')
  const a   = document.createElement('a')
  a.href    = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  a.download = `bwr-users-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
}

// ═══════════════════════════════════════════════════════════════════════════
// BADGE PILL
// ═══════════════════════════════════════════════════════════════════════════
function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 7px', borderRadius: 3,
      background: bg, color,
      fontFamily: 'var(--font-mono)', fontSize: '0.56rem',
      fontWeight: 700, letterSpacing: '0.1em',
    }}>
      {label}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FILTER PILL BUTTON
// ═══════════════════════════════════════════════════════════════════════════
function FilterBtn({
  label, active, activeColor = C.black, onClick,
}: {
  label: string; active: boolean; activeColor?: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
        letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 600,
        padding: '6px 11px', borderRadius: 5, cursor: 'pointer',
        border: `1px solid ${active ? activeColor : C.border}`,
        background: active ? activeColor : 'transparent',
        color:      active ? C.white    : C.mid,
        transition: 'all 0.14s',
      }}
    >
      {label}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ORDER CARDS (inside expanded panel)
// ═══════════════════════════════════════════════════════════════════════════
function OrdersPanel({ userId }: { userId: Id<'users'> }) {
  const orders = useQuery(api.users.getOrdersForUser, { userId })

  if (orders === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 0' }}>
        <div style={{
          width: 14, height: 14, borderRadius: '50%',
          border: `2px solid ${C.orangeBorder}`, borderTopColor: C.orange,
          animation: 'bwrspin 0.7s linear infinite', flexShrink: 0,
        }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: C.muted }}>
          Loading orders…
        </span>
        <style>{`@keyframes bwrspin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div style={{
        padding: '28px 0', textAlign: 'center',
        fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
        color: C.muted, letterSpacing: '0.1em',
        border: `1px dashed ${C.border}`, borderRadius: 6,
      }}>
        NO ORDERS YET
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {orders.map(order => {
        const ss = STATUS_S[order.status]       ?? STATUS_S.received
        const ps = PAY_S[order.paymentStatus]   ?? PAY_S.pending
        return (
          <div key={order._id} style={{
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 6, overflow: 'hidden',
          }}>
            {/* Header row */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 14px', background: C.bg,
              borderBottom: `1px solid ${C.borderLight}`,
              flexWrap: 'wrap', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontWeight: 700,
                  fontSize: '0.75rem', color: C.black,
                }}>
                  {order.orderId}
                </span>
                <Pill label={ss.label} color={ss.color} bg={ss.bg} />
                <Pill label={ps.label} color={ps.color} bg={ps.bg} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                  fontSize: '0.9rem', color: C.black,
                }}>
                  {formatPrice(order.total)}
                </span>
                <a
                  href={`/invoice/${order.orderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.56rem',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: C.orange, textDecoration: 'none',
                    padding: '3px 8px',
                    border: `1px solid ${C.orangeBorder}`, borderRadius: 3,
                    fontWeight: 600, transition: 'all 0.14s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.orange; e.currentTarget.style.color = C.white }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = C.orange }}
                >
                  Invoice ↗
                </a>
              </div>
            </div>

            {/* Items */}
            <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: C.charcoal }}>
                    {safe(item.productName) || '—'}
                    <span style={{ color: C.muted, marginLeft: 5, fontFamily: 'var(--font-mono)', fontSize: '0.66rem' }}>
                      ×{item.quantity}
                    </span>
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: C.mid }}>
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer meta */}
            <div style={{
              padding: '5px 14px', borderTop: `1px solid ${C.borderLight}`,
              display: 'flex', gap: 14, flexWrap: 'wrap',
              fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
              color: C.muted, letterSpacing: '0.04em',
            }}>
              <span>{formatDate(order._creationTime)}</span>
              {order.paymentMode && <span>Via {order.paymentMode.toUpperCase()}</span>}
              {order.couponCode  && <span>Coupon: {safe(order.couponCode)}</span>}
              {order.gstAmount > 0 && <span>GST {formatPrice(order.gstAmount)}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPANDED PANEL (profile card + orders)
// ═══════════════════════════════════════════════════════════════════════════
type UserRow = {
  _id:           Id<'users'>
  name?:         string | null
  email?:        string | null
  role?:         string | null
  _creationTime: number
  totalOrders:   number
  totalRevenue:  number
  lastOrderDate?: number | null
}

function ExpandedPanel({
  user,
  onRoleChange,
}: {
  user: UserRow
  onRoleChange: (uid: Id<'users'>, role: 'admin' | 'customer') => Promise<void>
}) {
  const [confirmRole, setConfirmRole]   = useState(false)
  const [copiedEmail, setCopiedEmail]   = useState(false)
  const [roleLoading, setRoleLoading]   = useState(false)

  const name  = typeof user.name  === 'string' ? user.name.trim()  : ''
  const email = typeof user.email === 'string' ? user.email.trim() : ''
  const isAdmin = user.role === 'admin'
  const avgOrder = user.totalOrders > 0 ? Math.round(user.totalRevenue / user.totalOrders) : 0

  const handleCopy = () => {
    if (!email) return
    clip(email, () => { setCopiedEmail(true); setTimeout(() => setCopiedEmail(false), 2000) })
  }

  const handleRoleConfirm = async () => {
    setRoleLoading(true)
    await onRoleChange(user._id, isAdmin ? 'customer' : 'admin')
    setRoleLoading(false)
    setConfirmRole(false)
  }

  const metaRow = (label: string, val: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.52rem',
        letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase',
      }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: C.charcoal }}>
        {val}
      </div>
    </div>
  )

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(260px, 280px) 1fr',
      gap: 18,
      padding: '20px 24px 24px',
      background: C.bg,
      borderTop: `2px solid ${C.orange}`,
    }}>

      {/* ── LEFT: User profile card ───────────────────────────────── */}
      <div style={{
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        alignSelf: 'start',
      }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: C.black,
            border: `3px solid ${C.orange}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: '1.1rem', color: C.white, letterSpacing: '0.04em',
          }}>
            {(name || email || '?').substring(0, 2).toUpperCase()}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-body)', fontWeight: 700,
              fontSize: '0.95rem', color: C.black, marginBottom: 5,
            }}>
              {name || 'Unnamed'}
            </div>
            {isAdmin
              ? <Pill label="ADMIN"    color={C.orange} bg={C.orangeDim}   />
              : <Pill label="CUSTOMER" color={C.mid}    bg={C.borderLight} />
            }
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: C.borderLight }} />

        {/* Email row */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.52rem',
            letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase',
          }}>
            Email
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: C.charcoal,
              flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {email || '—'}
            </span>
            {email && (
              <button
                onClick={handleCopy}
                style={{
                  flexShrink: 0,
                  fontFamily: 'var(--font-mono)', fontSize: '0.52rem',
                  fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '3px 8px', borderRadius: 3, cursor: 'pointer',
                  background:  copiedEmail ? C.black : 'transparent',
                  color:       copiedEmail ? C.white : C.mid,
                  border:      `1px solid ${copiedEmail ? C.black : C.border}`,
                  transition: 'all 0.18s',
                }}
              >
                {copiedEmail ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
        </div>

        {/* Member since */}
        {metaRow('Member Since', formatDate(user._creationTime))}

        {/* Stats 2×2 grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          background: C.bg, borderRadius: 6,
          border: `1px solid ${C.borderLight}`,
          padding: 12,
        }}>
          {[
            { label: 'Orders',     val: String(user.totalOrders) },
            { label: 'Revenue',    val: user.totalOrders > 0 ? formatPrice(user.totalRevenue) : '—' },
            { label: 'Avg Order',  val: user.totalOrders > 0 ? formatPrice(avgOrder)           : '—' },
            { label: 'Last Order', val: user.lastOrderDate      ? formatDate(user.lastOrderDate) : 'Never' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: '0.88rem', color: C.black, marginBottom: 2,
              }}>
                {s.val}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.5rem',
                color: C.muted, letterSpacing: '0.07em', textTransform: 'uppercase',
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: C.borderLight }} />

        {/* Role action */}
        {!confirmRole ? (
          <button
            onClick={() => setConfirmRole(true)}
            style={{
              width: '100%', padding: '9px 0',
              fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
              fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
              borderRadius: 5, cursor: 'pointer', transition: 'all 0.15s',
              background: isAdmin ? 'transparent' : C.black,
              color:       isAdmin ? C.charcoal   : C.white,
              border:      `1px solid ${isAdmin ? C.border : C.black}`,
            }}
            onMouseEnter={e => {
              if (isAdmin) { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red }
              else         { e.currentTarget.style.background = C.charcoal }
            }}
            onMouseLeave={e => {
              if (isAdmin) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.charcoal }
              else         { e.currentTarget.style.background = C.black }
            }}
          >
            {isAdmin ? 'Remove Admin Access' : 'Make Admin'}
          </button>
        ) : (
          <div style={{
            background:    isAdmin ? C.redDim  : C.orangeDim,
            border:        `1px solid ${isAdmin ? C.redBorder : C.orangeBorder}`,
            borderRadius:  5, padding: '12px',
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
              color: isAdmin ? C.red : C.orange,
              fontWeight: 700, letterSpacing: '0.06em', marginBottom: 10,
            }}>
              {isAdmin ? 'Remove admin access?' : 'Grant admin access?'}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleRoleConfirm}
                disabled={roleLoading}
                style={{
                  flex: 1, padding: '7px 0',
                  fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                  fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  background: isAdmin ? C.red   : C.black,
                  color:      C.white,
                  border:     'none', borderRadius: 4, cursor: roleLoading ? 'wait' : 'pointer',
                  opacity:    roleLoading ? 0.6 : 1,
                }}
              >
                {roleLoading ? '…' : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirmRole(false)}
                disabled={roleLoading}
                style={{
                  flex: 1, padding: '7px 0',
                  fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                  fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  background: 'transparent', color: C.mid,
                  border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: Order history ──────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
            letterSpacing: '0.14em', color: C.orange,
            textTransform: 'uppercase', fontWeight: 700,
          }}>
            Order History
          </span>
          {user.totalOrders > 0 && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
              background: C.orangeDim, color: C.orange,
              padding: '1px 7px', borderRadius: 3, fontWeight: 700,
            }}>
              {user.totalOrders}
            </span>
          )}
          {user.totalRevenue > 0 && (
            <span style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
              color: C.mid,
            }}>
              {formatPrice(user.totalRevenue)} total
            </span>
          )}
        </div>
        <OrdersPanel userId={user._id} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COLUMN HEADER (sortable)
// ═══════════════════════════════════════════════════════════════════════════
function ColHead({
  label, active, dir, onSort,
}: {
  label: string; sortKey?: SortKey; active: boolean; dir: SortDir; onSort?: () => void
}) {
  return (
    <div
      onClick={onSort}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.57rem',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color:      active ? C.black  : C.muted,
        fontWeight: active ? 700      : 400,
        cursor:     onSort ? 'pointer': 'default',
        display: 'flex', alignItems: 'center', gap: 4,
        userSelect: 'none',
      }}
    >
      {label}
      {onSort && (
        <span style={{ opacity: active ? 1 : 0.3, fontSize: '0.6rem' }}>
          {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function AdminUsers() {
  const users      = useQuery(api.users.getAllWithStats)
  const updateRole = useMutation(api.users.updateUserRole)

  const [search,      setSearch]      = useState('')
  const [sortKey,     setSortKey]     = useState<SortKey>('_creationTime')
  const [sortDir,     setSortDir]     = useState<SortDir>('desc')
  const [roleFilter,  setRoleFilter]  = useState<RoleFilter>('all')
  const [actFilter,   setActFilter]   = useState<ActFilter>('all')
  const [expandedId,  setExpanded]    = useState<string | null>(null)
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const handleRoleChange = async (uid: Id<'users'>, role: 'admin' | 'customer') => {
    try {
      await updateRole({ targetUserId: uid, role })
      showToast(role === 'admin' ? 'User promoted to Admin.' : 'Admin access removed.', true)
    } catch (e: any) {
      showToast(e?.message ?? 'Something went wrong.', false)
    }
  }

  const filtered = useMemo(() => {
    if (!users) return []
    const q = search.toLowerCase().trim()
    let list = [...users]

    if (q) {
      list = list.filter(u =>
        (u.name  || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      )
    }
    if (roleFilter !== 'all') {
      list = list.filter(u => (u.role || 'customer') === roleFilter)
    }
    if (actFilter === 'active')   list = list.filter(u => u.totalOrders > 0)
    if (actFilter === 'inactive') list = list.filter(u => u.totalOrders === 0)

    list.sort((a, b) => {
      let av: string | number = 0, bv: string | number = 0
      switch (sortKey) {
        case 'name':          av = (a.name || '').toLowerCase(); bv = (b.name || '').toLowerCase(); break
        case 'totalOrders':   av = a.totalOrders;       bv = b.totalOrders;       break
        case 'totalRevenue':  av = a.totalRevenue;      bv = b.totalRevenue;      break
        case 'lastOrderDate': av = a.lastOrderDate || 0; bv = b.lastOrderDate || 0; break
        case '_creationTime': av = a._creationTime;     bv = b._creationTime;     break
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ?  1 : -1
      return 0
    })
    return list
  }, [users, search, roleFilter, actFilter, sortKey, sortDir])

  // ── Loading ──────────────────────────────────────────────────────────────
  if (users === undefined) {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.18em', color: C.orange, textTransform: 'uppercase', marginBottom: 4 }}>
            Admin · User Management
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 800, color: C.black, margin: 0 }}>
            All Users
          </h1>
        </div>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 48, textAlign: 'center' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            border: `2px solid ${C.orangeBorder}`, borderTopColor: C.orange,
            animation: 'bwrspin 0.7s linear infinite', margin: '0 auto 14px',
          }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: C.muted }}>Loading users…</div>
          <style>{`@keyframes bwrspin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    )
  }

  // ── Aggregate stats ───────────────────────────────────────────────────────
  const totalRevenue = users.reduce((s, u) => s + u.totalRevenue, 0)
  const totalOrders  = users.reduce((s, u) => s + u.totalOrders,  0)
  const adminCount   = users.filter(u => u.role === 'admin').length
  const activeCount  = users.filter(u => u.totalOrders > 0).length

  const GRID_COLS = '2.2fr 1fr 90px 110px 110px 44px'

  return (
    <div>
      {/* ── Page header ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
            letterSpacing: '0.18em', color: C.orange,
            textTransform: 'uppercase', marginBottom: 4,
          }}>
            Admin · User Management
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 800, color: C.black, margin: 0 }}>
            All Users
          </h1>
        </div>

        <button
          onClick={() => exportCSV(filtered)}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
            letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700,
            padding: '9px 16px', borderRadius: 6, cursor: 'pointer',
            background: 'transparent', color: C.black,
            border: `1px solid ${C.border}`, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.black; e.currentTarget.style.color = C.white; e.currentTarget.style.borderColor = C.black }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.black; e.currentTarget.style.borderColor = C.border }}
        >
          Export CSV ↓
        </button>
      </div>

      {/* ── Toast ─────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          marginBottom: 16, padding: '10px 16px', borderRadius: 6,
          background: toast.ok ? C.black : C.red, color: C.white,
          fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.04em',
          transition: 'opacity 0.3s',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Stats strip ───────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12, marginBottom: 20,
      }}>
        {[
          { label: 'Registered',    value: String(users.length),              accent: true  },
          { label: 'Active Buyers', value: `${activeCount} / ${users.length}`,accent: false },
          { label: 'Total Revenue', value: formatPrice(totalRevenue),          accent: false },
          { label: 'All Orders',    value: String(totalOrders),                accent: false },
          { label: 'Admin Accounts',value: String(adminCount),                 accent: false },
        ].map((s) => (
          <div key={s.label} style={{
            background: C.white,
            border: `1px solid ${C.border}`,
            borderTop: `3px solid ${s.accent ? C.orange : C.border}`,
            borderRadius: 8, padding: '14px 18px',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: '1.2rem', color: s.accent ? C.orange : C.black,
              marginBottom: 4,
            }}>
              {s.value}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.57rem',
              color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Table card ────────────────────────────────────────────── */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>

        {/* Filters bar */}
        <div style={{
          padding: '14px 20px', borderBottom: `1px solid ${C.borderLight}`,
          display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
        }}>
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: '1 1 220px', minWidth: 150,
              padding: '8px 12px',
              fontFamily: 'var(--font-body)', fontSize: '0.84rem',
              background: C.bg, border: `1px solid ${C.border}`,
              color: C.black, borderRadius: 6, outline: 'none',
              transition: 'border-color 0.15s', boxSizing: 'border-box',
            }}
            onFocus={e => e.currentTarget.style.borderColor = C.orange}
            onBlur={e  => e.currentTarget.style.borderColor = C.border}
          />

          {/* Role filter */}
          <div style={{ display: 'flex', gap: 3 }}>
            <FilterBtn label="All Roles"  active={roleFilter === 'all'}      onClick={() => setRoleFilter('all')}      />
            <FilterBtn label="Admins"     active={roleFilter === 'admin'}     onClick={() => setRoleFilter('admin')}    />
            <FilterBtn label="Customers"  active={roleFilter === 'customer'}  onClick={() => setRoleFilter('customer')} />
          </div>

          {/* Activity filter */}
          <div style={{ display: 'flex', gap: 3 }}>
            <FilterBtn label="All"        active={actFilter === 'all'}      activeColor={C.orange} onClick={() => setActFilter('all')}      />
            <FilterBtn label="Has Orders" active={actFilter === 'active'}   activeColor={C.orange} onClick={() => setActFilter('active')}   />
            <FilterBtn label="No Orders"  active={actFilter === 'inactive'} activeColor={C.orange} onClick={() => setActFilter('inactive')} />
          </div>

          <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: C.muted, whiteSpace: 'nowrap' }}>
            {filtered.length} of {users.length}
          </div>
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: GRID_COLS,
          padding: '8px 20px',
          background: C.bg, borderBottom: `1px solid ${C.border}`,
        }}>
          <ColHead label="User"        sortKey="_creationTime" active={sortKey === 'name'}          dir={sortDir} onSort={() => handleSort('name')}          />
          <ColHead label="Role"                                active={false}                        dir={sortDir}                                             />
          <ColHead label="Orders"      sortKey="totalOrders"  active={sortKey === 'totalOrders'}    dir={sortDir} onSort={() => handleSort('totalOrders')}    />
          <ColHead label="Revenue"     sortKey="totalRevenue" active={sortKey === 'totalRevenue'}   dir={sortDir} onSort={() => handleSort('totalRevenue')}   />
          <ColHead label="Last Order"  sortKey="lastOrderDate"active={sortKey === 'lastOrderDate'}  dir={sortDir} onSort={() => handleSort('lastOrderDate')}  />
          <ColHead label=""                                    active={false}                        dir={sortDir}                                             />
        </div>

        {/* Rows */}
        <div>
          {filtered.map((u, idx) => {
            const isExp   = expandedId === u._id
            const name    = typeof u.name  === 'string' ? u.name.trim()  : ''
            const email   = typeof u.email === 'string' ? u.email.trim() : ''
            const initials= (name || email || '?').substring(0, 2).toUpperCase()
            const isAdmin = u.role === 'admin'

            return (
              <div key={u._id} style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>

                {/* Clickable row */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpanded(isExp ? null : u._id)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setExpanded(isExp ? null : u._id) }}
                  style={{
                    display: 'grid', gridTemplateColumns: GRID_COLS,
                    padding: '13px 20px', cursor: 'pointer', alignItems: 'center',
                    background: isExp ? '#F5F5F5' : C.white,
                    transition: 'background 0.12s', outline: 'none',
                  }}
                  onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = C.bg   }}
                  onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = C.white }}
                >
                  {/* User info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                      background: C.black,
                      border: `2px solid ${isExp ? C.orange : 'transparent'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontWeight: 800,
                      fontSize: '0.72rem', color: C.white, letterSpacing: '0.04em',
                      transition: 'border-color 0.15s',
                    }}>
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontFamily: 'var(--font-body)', fontWeight: 600,
                        fontSize: '0.88rem', color: C.black,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {name || 'Unnamed'}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: C.muted,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        marginTop: 1,
                      }}>
                        {email || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Role */}
                  <div>
                    {isAdmin
                      ? <Pill label="ADMIN"    color={C.orange} bg={C.orangeDim}   />
                      : <Pill label="CUSTOMER" color={C.muted}  bg={C.borderLight} />
                    }
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.56rem',
                      color: C.muted, marginTop: 3,
                    }}>
                      Since {formatDate(u._creationTime)}
                    </div>
                  </div>

                  {/* Orders */}
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem',
                      color: u.totalOrders > 0 ? C.black : C.border,
                    }}>
                      {u.totalOrders}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: C.muted }}>
                      {u.totalOrders === 1 ? 'order' : 'orders'}
                    </div>
                  </div>

                  {/* Revenue */}
                  <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.88rem',
                    color: u.totalRevenue > 0 ? C.orange : C.border,
                  }}>
                    {formatPrice(u.totalRevenue)}
                  </div>

                  {/* Last order */}
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.64rem',
                    color: u.lastOrderDate ? C.charcoal : C.muted,
                  }}>
                    {u.lastOrderDate ? formatDate(u.lastOrderDate) : 'Never'}
                  </div>

                  {/* Expand toggle */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 26, height: 26, borderRadius: 5,
                      background: isExp ? C.black : C.bg,
                      border: `1px solid ${isExp ? C.black : C.border}`,
                      color: isExp ? C.white : C.mid,
                      fontSize: '0.68rem', transition: 'all 0.2s',
                      transform: isExp ? 'rotate(180deg)' : 'none',
                    }}>
                      ▼
                    </div>
                  </div>
                </div>

                {/* Expanded panel */}
                {isExp && (
                  <ExpandedPanel user={u} onRoleChange={handleRoleChange} />
                )}
              </div>
            )
          })}

          {/* Empty state */}
          {filtered.length === 0 && (
            <div style={{
              padding: '52px 20px', textAlign: 'center',
              fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
              color: C.muted, letterSpacing: '0.08em',
            }}>
              {search || roleFilter !== 'all' || actFilter !== 'all'
                ? `No users match your current filters`
                : 'No users registered yet'
              }
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
