import { useState } from 'react'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import styles from './AdminDashboard.module.css'

// ─────────────────────────────────────────────────
// Cloudinary signed upload (uses backend-generated signature)
// ─────────────────────────────────────────────────
async function uploadToCloudinary(
  file: File,
  signature: string,
  timestamp: number,
  apiKey: string,
  cloudName: string,
  folder: string
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', apiKey)
  formData.append('timestamp', String(timestamp))
  formData.append('signature', signature)
  formData.append('folder', folder)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  )
  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } }
    throw new Error(err.error?.message || 'Upload failed')
  }
  const data = await res.json() as { secure_url: string }
  return data.secure_url
}

// ─────────────────────────────────────────────────
// PRODUCT CARD
// ─────────────────────────────────────────────────
function ProductCard({ product, onEdit }: { product: any; onEdit: (p: any) => void }) {
  const toggleActive = useMutation(api.products.update)

  return (
    <div className={styles.productCard} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', display: 'flex', gap: 'var(--space-lg)', alignItems: 'flex-start' }}>
      {/* Image */}
      <div style={{ width: 80, height: 80, background: '#F3F4F6', borderRadius: 'var(--radius-sm)', flexShrink: 0, overflow: 'hidden' }}>
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📦</div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' }}>{product.name}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', background: product.isActive ? 'var(--success)' : 'var(--muted)', color: 'white', padding: '2px 8px', borderRadius: 2 }}>
            {product.isActive ? 'ACTIVE' : 'DRAFT'}
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--muted)', marginBottom: 4 }}>/{product.slug}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--muted)' }}>{product.shortTagline}</div>
        {product.price && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--orange)', marginTop: 4, fontWeight: 600 }}>
            ₹{(product.price / 100).toLocaleString('en-IN')}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', flexDirection: 'column', alignItems: 'flex-end' }}>
        <button className={styles.btnPrimary} style={{ padding: '8px 16px', fontSize: '0.62rem' }} onClick={() => onEdit(product)}>
          Edit
        </button>
        <button
          className={styles.btnOutline}
          style={{ padding: '8px 16px', fontSize: '0.62rem' }}
          onClick={() => toggleActive({ id: product._id, isActive: !product.isActive })}
        >
          {product.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────
// PRODUCT EDIT FORM
// ─────────────────────────────────────────────────
function ProductEditForm({ product, onClose }: { product: any; onClose: () => void }) {
  const updateProduct = useMutation(api.products.update)
  const generateSignature = useAction(api.cloudinary.generateSignature)

  const [form, setForm] = useState({
    name: product.name || '',
    description: product.description || '',
    shortTagline: product.shortTagline || '',
    emotionalAngle: product.emotionalAngle || '',
    stock: product.stock || 0,
    isActive: product.isActive || false,
  })
  const [images, setImages] = useState<string[]>(product.images || [])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File too large. Max 10MB.')
      return
    }

    setUploading(true)
    setUploadError('')
    try {
      const { signature, timestamp, cloudName, apiKey, folder } = await generateSignature({ folder: 'bwr-works/products' })
      const url = await uploadToCloudinary(file, signature, timestamp, apiKey, cloudName, folder)
      setImages(prev => [...prev, url])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Check Cloudinary env vars in Convex.')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProduct({ id: product._id, ...form, images })
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const fieldStyle = { display: 'flex', flexDirection: 'column' as const, gap: 6 }
  const labelStyle = { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase' as const }
  const inputStyle = { padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', outline: 'none', color: 'var(--black-soft)' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)' }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-md)', maxWidth: 640, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ padding: 'var(--space-xl)', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Edit: {product.name}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--muted)' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

          {/* Images */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Product Images</label>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              {images.map((url, i) => (
                <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }} />
                  <button
                    onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--error)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >×</button>
                </div>
              ))}
              <label style={{ width: 80, height: 80, border: '2px dashed var(--line)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'wait' : 'pointer', fontSize: '1.2rem', color: 'var(--muted)', gap: 4 }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploading} />
                {uploading ? '⏳' : '+'}
                <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)' }}>UPLOAD</span>
              </label>
            </div>
            {uploadError && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--error)' }}>{uploadError}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Product Name *</label>
              <input style={inputStyle} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Stock</label>
              <input type="number" style={inputStyle} value={form.stock} min={0} onChange={e => setForm(p => ({ ...p, stock: Number(e.target.value) }))} />
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Short Tagline</label>
            <input style={inputStyle} value={form.shortTagline} onChange={e => setForm(p => ({ ...p, shortTagline: e.target.value }))} placeholder="Single line shown on product card" />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Emotional Angle</label>
            <input style={inputStyle} value={form.emotionalAngle} onChange={e => setForm(p => ({ ...p, emotionalAngle: e.target.value }))} placeholder="e.g. For those who refuse to be average" />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Full Description</label>
            <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} style={{ accentColor: 'var(--orange)', width: 16, height: 16 }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>Active (visible on storefront)</span>
          </label>
        </div>

        {/* Footer */}
        <div style={{ padding: 'var(--space-lg) var(--space-xl)', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)' }}>
          <button className={styles.btnOutline} onClick={onClose}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────
export default function AdminProducts() {
  const products = useQuery(api.products.listAll)
  const [editingProduct, setEditingProduct] = useState<any>(null)

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>ADMIN</div>
          <h1 className={styles.title}>Products</h1>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)' }}>
          {products?.length ?? 0} products total
        </div>
      </div>

      {products === undefined ? (
        <div className={styles.loading}>Loading products...</div>
      ) : products.length === 0 ? (
        <div className={styles.empty}>
          No products yet. Add products via the Convex dashboard or seed script.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {products.map(p => (
            <ProductCard key={p._id} product={p} onEdit={setEditingProduct} />
          ))}
        </div>
      )}

      {editingProduct && (
        <ProductEditForm product={editingProduct} onClose={() => setEditingProduct(null)} />
      )}
    </div>
  )
}
