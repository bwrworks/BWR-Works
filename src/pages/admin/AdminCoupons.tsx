import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useToast } from '../../context/ToastContext'
import styles from './AdminDashboard.module.css'

export default function AdminCoupons() {
  const coupons = useQuery(api.coupons.listCoupons)
  const createCoupon = useMutation(api.coupons.createCoupon)
  const toggleCoupon = useMutation(api.coupons.toggleCoupon)
  const deleteCoupon = useMutation(api.coupons.deleteCoupon)
  const { success, error: toastError, confirm } = useToast()

  const [form, setForm] = useState({
    code: '', discountType: 'flat' as 'flat' | 'percent',
    discountValue: 0, minOrderAmount: '', maxUses: '', expiresAt: '',
  })
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code || !form.discountValue) { toastError('Code and discount value are required'); return }
    setCreating(true)
    try {
      await createCoupon({
        code: form.code,
        discountType: form.discountType,
        discountValue: form.discountType === 'flat' ? form.discountValue * 100 : form.discountValue,
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) * 100 : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).getTime() : undefined,
      })
      success(`Coupon "${form.code.toUpperCase()}" created!`)
      setForm({ code: '', discountType: 'flat', discountValue: 0, minOrderAmount: '', maxUses: '', expiresAt: '' })
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to create coupon')
    } finally { setCreating(false) }
  }

  const handleDelete = async (id: string, code: string) => {
    const ok = await confirm(`Delete coupon "${code}"? This cannot be undone.`)
    if (!ok) return
    setDeleting(id)
    try {
      await deleteCoupon({ id: id as any })
      success(`Coupon "${code}" deleted.`)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Delete failed')
    } finally { setDeleting(null) }
  }

  const fmt = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`

  const is = { padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', outline: 'none', width: '100%' }
  const ls = { fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--muted)', display: 'block', marginBottom: 6 }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>ADMIN</div>
          <h1 className={styles.title}>Coupons</h1>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)' }}>
          {coupons?.length ?? 0} coupons total
        </div>
      </div>

      {/* ── CREATE FORM ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle} style={{ marginBottom: 'var(--space-xl)' }}>Create New Coupon</h2>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div><label style={ls}>COUPON CODE *</label>
              <input style={{ ...is, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
                value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. LAUNCH20" /></div>
            <div><label style={ls}>DISCOUNT TYPE *</label>
              <select style={is} value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value as 'flat' | 'percent' }))}>
                <option value="flat">Flat (₹)</option>
                <option value="percent">Percent (%)</option>
              </select></div>
            <div><label style={ls}>VALUE * {form.discountType === 'flat' ? '(₹)' : '(%)'}</label>
              <input type="number" style={is} value={form.discountValue || ''} min={1} max={form.discountType === 'percent' ? 100 : undefined}
                onChange={e => setForm(p => ({ ...p, discountValue: Number(e.target.value) }))} placeholder={form.discountType === 'flat' ? '100' : '10'} /></div>
            <div><label style={ls}>MIN ORDER (₹) <span style={{ opacity: 0.5 }}>optional</span></label>
              <input type="number" style={is} value={form.minOrderAmount} onChange={e => setForm(p => ({ ...p, minOrderAmount: e.target.value }))} placeholder="500" /></div>
            <div><label style={ls}>MAX USES <span style={{ opacity: 0.5 }}>optional</span></label>
              <input type="number" style={is} value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))} placeholder="100" /></div>
            <div><label style={ls}>EXPIRES <span style={{ opacity: 0.5 }}>optional</span></label>
              <input type="date" style={is} value={form.expiresAt} min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} /></div>
          </div>
          <button type="submit" disabled={creating} className={styles.btnPrimary}>
            {creating ? 'Creating...' : '+ Create Coupon'}
          </button>
        </form>
      </div>

      {/* ── COUPON LIST ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle} style={{ marginBottom: 'var(--space-xl)' }}>All Coupons</h2>
        {coupons === undefined ? <div className={styles.loading}>Loading...</div>
          : coupons.length === 0 ? <div className={styles.empty}>No coupons yet. Create your first one above.</div>
          : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {coupons.map(c => (
              <div key={c._id} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--ink)', minWidth: 100 }}>{c.code}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--orange)', fontWeight: 600 }}>
                  {c.discountType === 'flat' ? fmt(c.discountValue) : `${c.discountValue}%`} OFF
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)' }}>
                  {c.minOrderAmount ? `Min ${fmt(c.minOrderAmount)}` : 'No min'} · Uses: {c.currentUses}{c.maxUses ? `/${c.maxUses}` : ''}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)' }}>
                  {c.expiresAt ? `Expires ${new Date(c.expiresAt).toLocaleDateString('en-IN')}` : 'No expiry'}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', background: c.isActive ? '#D1FAE5' : '#F3F4F6', color: c.isActive ? '#059669' : '#9CA3AF', padding: '4px 10px', borderRadius: 3 }}>
                    {c.isActive ? 'ACTIVE' : 'OFF'}
                  </span>
                  <button onClick={() => toggleCoupon({ id: c._id, isActive: !c.isActive })}
                    className={styles.btnOutline} style={{ padding: '6px 14px', fontSize: '0.62rem' }}>
                    {c.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDelete(c._id, c.code)}
                    disabled={deleting === c._id}
                    style={{ padding: '6px 14px', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {deleting === c._id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
