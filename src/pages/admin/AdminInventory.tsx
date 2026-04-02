import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import styles from './AdminDashboard.module.css'

const CATEGORIES = [
  { id: 'keychains', label: 'Keychains' },
  { id: 'desk-items', label: 'Desk Items' },
  { id: 'signage', label: 'Signage' },
  { id: 'gifts', label: 'Gifts' },
  { id: 'automotive', label: 'Automotive' },
  { id: 'custom', label: 'Custom' },
]

export default function AdminInventory() {
  const products = useQuery(api.products.listAll)
  const update = useMutation(api.products.update)
  const [saving, setSaving] = useState<string | null>(null)
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({})

  const handleStockChange = (id: string, val: number) => {
    setStockEdits(p => ({ ...p, [id]: val }))
  }

  const handleSaveStock = async (id: string) => {
    const stock = stockEdits[id]
    if (stock === undefined) return
    setSaving(id)
    try {
      await update({ id: id as any, stock })
      setStockEdits(p => { const n = { ...p }; delete n[id]; return n })
    } finally { setSaving(null) }
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: '#EF4444' }
    if (stock <= 5) return { label: 'Low Stock', color: '#F59E0B' }
    return { label: 'In Stock', color: '#10B981' }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>ADMIN</div>
          <h1 className={styles.title}>Inventory</h1>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)' }}>
          {products?.length ?? 0} products
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px 120px', padding: '12px 20px', background: '#F9FAFB', borderBottom: '1px solid var(--line)', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          <span>Product</span>
          <span>Category</span>
          <span>Status</span>
          <span>Stock (units)</span>
          <span></span>
        </div>

        {products === undefined ? (
          <div className={styles.loading} style={{ padding: 40, textAlign: 'center' }}>Loading inventory...</div>
        ) : products.length === 0 ? (
          <div className={styles.empty} style={{ padding: 40, textAlign: 'center' }}>No products yet.</div>
        ) : products.map(p => {
          const currentStock = stockEdits[p._id] ?? p.stock ?? 0
          const status = getStockStatus(p.stock ?? 0)
          const isDirty = stockEdits[p._id] !== undefined

          return (
            <div key={p._id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px 120px', padding: '14px 20px', borderBottom: '1px solid var(--line)', alignItems: 'center', transition: 'background 0.15s' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink)' }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', marginTop: 2 }}>/{p.slug}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)' }}>
                {CATEGORIES.find(c => c.id === p.category)?.label || p.category}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: status.color, background: status.color + '15', padding: '3px 8px', borderRadius: 4, display: 'inline-block' }}>
                {status.label}
              </span>
              <input
                type="number"
                min={0}
                value={currentStock}
                onChange={e => handleStockChange(p._id, Number(e.target.value))}
                style={{ width: 70, padding: '6px 10px', border: `1px solid ${isDirty ? 'var(--orange)' : 'var(--line)'}`, borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--ink)' }}
              />
              <div>
                {isDirty && (
                  <button
                    onClick={() => handleSaveStock(p._id)}
                    disabled={saving === p._id}
                    style={{ padding: '6px 14px', background: 'var(--orange)', color: 'white', border: 'none', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: '0.6rem', cursor: 'pointer' }}
                  >
                    {saving === p._id ? '...' : 'Save'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
