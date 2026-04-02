import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import styles from './AdminDashboard.module.css'

export default function AdminCoupons() {
  const coupons = useQuery(api.coupons.listCoupons)
  const createCoupon = useMutation(api.coupons.createCoupon)
  const toggleCoupon = useMutation(api.coupons.toggleCoupon)

  const [form, setForm] = useState({
    code: '', discountType: 'flat' as 'flat' | 'percent',
    discountValue: 0, minOrderAmount: '', maxUses: '', expiresAt: '',
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code || !form.discountValue) return setError('Code and discount value are required')
    setCreating(true); setError(''); setSuccess('')
    try {
      await createCoupon({
        code: form.code,
        discountType: form.discountType,
        discountValue: form.discountType === 'flat'
          ? form.discountValue * 100  // to paise
          : form.discountValue,       // percent as-is
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) * 100 : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).getTime() : undefined,
      })
      setSuccess(`Coupon "${form.code}" created!`)
      setForm({ code: '', discountType: 'flat', discountValue: 0, minOrderAmount: '', maxUses: '', expiresAt: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create coupon')
    } finally { setCreating(false) }
  }

  const fmt = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>ADMIN</div>
          <h1 className={styles.title}>Coupons</h1>
        </div>
      </div>

      {/* Create Form */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle} style={{ marginBottom: 'var(--space-xl)' }}>Create New Coupon</h2>
        <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--muted)' }}>COUPON CODE *</label>
            <input style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', outline: 'none', textTransform: 'uppercase' }}
              value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. LAUNCH20" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--muted)' }}>DISCOUNT TYPE *</label>
            <select style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', outline: 'none' }}
              value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value as 'flat' | 'percent' }))}>
              <option value="flat">Flat (₹)</option>
              <option value="percent">Percent (%)</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--muted)' }}>VALUE * {form.discountType === 'flat' ? '(₹)' : '(%)'}</label>
            <input type="number" style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', outline: 'none' }}
              value={form.discountValue || ''} onChange={e => setForm(p => ({ ...p, discountValue: Number(e.target.value) }))} placeholder={form.discountType === 'flat' ? '100' : '10'} min={1} max={form.discountType === 'percent' ? 100 : undefined} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--muted)' }}>MIN ORDER (₹) <span style={{ opacity: 0.6 }}>optional</span></label>
            <input type="number" style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', outline: 'none' }}
              value={form.minOrderAmount} onChange={e => setForm(p => ({ ...p, minOrderAmount: e.target.value }))} placeholder="500" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--muted)' }}>MAX USES <span style={{ opacity: 0.6 }}>optional</span></label>
            <input type="number" style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', outline: 'none' }}
              value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))} placeholder="100" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--muted)' }}>EXPIRES <span style={{ opacity: 0.6 }}>optional</span></label>
            <input type="date" style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', outline: 'none' }}
              value={form.expiresAt}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
            <button type="submit" disabled={creating} className={styles.btnPrimary}>
              {creating ? 'Creating...' : '+ Create Coupon'}
            </button>
            {error && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--error)' }}>{error}</span>}
            {success && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--success)' }}>✅ {success}</span>}
          </div>
        </form>
      </div>

      {/* Coupons List */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle} style={{ marginBottom: 'var(--space-xl)' }}>All Coupons</h2>
        {coupons === undefined ? <div className={styles.loading}>Loading...</div> : coupons.length === 0 ? (
          <div className={styles.empty}>No coupons yet. Create your first one above.</div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHead} style={{ gridTemplateColumns: '120px 100px 100px 100px 80px 80px 80px' }}>
              <span>CODE</span><span>DISCOUNT</span><span>MIN ORDER</span><span>USES</span><span>EXPIRES</span><span>STATUS</span><span></span>
            </div>
            {coupons.map(c => (
              <div key={c._id} className={styles.tableRow} style={{ gridTemplateColumns: '120px 100px 100px 100px 80px 80px 80px' }}>
                <span className={styles.orderId}>{c.code}</span>
                <span className={styles.cell}>{c.discountType === 'flat' ? fmt(c.discountValue) : `${c.discountValue}%`}</span>
                <span className={styles.cell}>{c.minOrderAmount ? fmt(c.minOrderAmount) : '—'}</span>
                <span className={styles.cell}>{c.currentUses}{c.maxUses ? `/${c.maxUses}` : ''}</span>
                <span className={styles.cell}>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : '—'}</span>
                <span><span className={styles.badge} style={{ background: c.isActive ? 'var(--success)' : 'var(--muted)' }}>{c.isActive ? 'ACTIVE' : 'OFF'}</span></span>
                <span>
                  <button onClick={() => toggleCoupon({ id: c._id, isActive: !c.isActive })} className={styles.viewLink} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    {c.isActive ? 'Disable' : 'Enable'}
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
