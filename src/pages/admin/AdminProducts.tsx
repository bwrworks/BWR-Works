import { useState } from 'react'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useToast } from '../../context/ToastContext'
import styles from './AdminDashboard.module.css'

// ─────────────────────────────────────────────────
// Cloudinary signed upload
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
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData })
  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } }
    throw new Error(err.error?.message || 'Upload failed')
  }
  const data = await res.json() as { secure_url: string }
  return data.secure_url
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ── Shared form styles ──
const fs = { display: 'flex', flexDirection: 'column' as const, gap: 6 }
const ls = { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase' as const }
const is = { padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', outline: 'none', color: 'var(--black-soft)', width: '100%' }

// ─────────────────────────────────────────────────
// IMAGE UPLOADER — shared between create + edit
// ─────────────────────────────────────────────────
function ImageUploader({ images, setImages }: { images: string[]; setImages: React.Dispatch<React.SetStateAction<string[]>> }) {
  const generateSignature = useAction(api.cloudinary.generateSignature)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setUploadError('Max 10MB'); return }
    setUploading(true); setUploadError('')
    try {
      const sig = await generateSignature({ folder: 'bwr-works/products' })
      const url = await uploadToCloudinary(file, sig.signature, sig.timestamp, sig.apiKey, sig.cloudName, sig.folder)
      setImages(prev => [...prev, url])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed — check Cloudinary env vars in Convex.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div style={fs}>
      <label style={ls}>Product Images</label>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
        {images.map((url, i) => (
          <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6, border: '1px solid var(--line)' }} />
            <button
              type="button"
              onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
              style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--error)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >×</button>
          </div>
        ))}
        <label style={{ width: 80, height: 80, border: '2px dashed var(--line)', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'wait' : 'pointer', color: 'var(--muted)', gap: 4 }}>
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
          <span style={{ fontSize: '1.2rem' }}>{uploading ? '⏳' : '+'}</span>
          <span style={{ fontSize: '0.52rem', fontFamily: 'var(--font-mono)' }}>{uploading ? 'UPLOADING' : 'UPLOAD'}</span>
        </label>
      </div>
      {uploadError && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--error)' }}>{uploadError}</span>}
    </div>
  )
}

// ─────────────────────────────────────────────────
// PRODUCT CARD
// ─────────────────────────────────────────────────
function ProductCard({ product, onEdit }: { product: any; onEdit: (p: any) => void }) {
  const toggleActive = useMutation(api.products.update)
  const deleteProduct = useMutation(api.products.deleteProduct)
  const { success, error: toastError } = useToast()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await deleteProduct({ id: product._id })
      success(`"${product.name}" deleted.`)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Delete failed')
    } finally { setDeleting(false) }
  }

  return (
    <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', display: 'flex', gap: 'var(--space-lg)', alignItems: 'flex-start', flexWrap: 'wrap' as const }}>
      <div style={{ width: 80, height: 80, background: '#F3F4F6', borderRadius: 6, flexShrink: 0, overflow: 'hidden' }}>
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📦</div>
        }
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' as const }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' }}>{product.name}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', background: product.isActive ? '#10B981' : '#9CA3AF', color: 'white', padding: '2px 8px', borderRadius: 2 }}>
            {product.isActive ? 'ACTIVE' : 'DRAFT'}
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--muted)', marginBottom: 4 }}>/{product.slug}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--muted)' }}>{product.shortTagline}</div>
        {product.price && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--orange)', marginTop: 4, fontWeight: 600 }}>₹{(product.price / 100).toLocaleString('en-IN')}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8, flexDirection: 'column', alignItems: 'flex-end' }}>
        <button className={styles.btnPrimary} style={{ padding: '8px 16px', fontSize: '0.62rem' }} onClick={() => onEdit(product)}>Edit</button>
        <button className={styles.btnOutline} style={{ padding: '8px 16px', fontSize: '0.62rem' }} onClick={() => toggleActive({ id: product._id, isActive: !product.isActive })}>
          {product.isActive ? 'Deactivate' : 'Activate'}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ padding: '8px 16px', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.15s' }}>
          {deleting ? '...' : 'Delete'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────
// CREATE PRODUCT FORM
// ─────────────────────────────────────────────────
function CreateProductForm({ onClose }: { onClose: () => void }) {
  const createProduct = useMutation(api.products.create)
  const [images, setImages] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', slug: '', category: 'keychain', description: '',
    shortTagline: '', emotionalAngle: '', stock: 10, isActive: false,
  })

  const set = (k: string, v: string | number | boolean) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Product name is required'); return }
    if (!form.slug.trim()) { setError('Slug is required'); return }
    if (!form.description.trim()) { setError('Description is required'); return }
    if (!form.shortTagline.trim()) { setError('Short tagline is required'); return }
    setSaving(true); setError('')
    try {
      await createProduct({ ...form, images, customisationConfig: [] })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 12, maxWidth: 680, width: '100%', maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.14em', color: 'var(--orange)', textTransform: 'uppercase', marginBottom: 4 }}>NEW PRODUCT</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Add to Collection</h2>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--muted)' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
          <ImageUploader images={images} setImages={setImages} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={fs}>
              <label style={ls}>Product Name *</label>
              <input style={is} value={form.name} onChange={e => { set('name', e.target.value); set('slug', slugify(e.target.value)) }} placeholder="e.g. Car Garage Key Holder" />
            </div>
            <div style={fs}>
              <label style={ls}>Slug (URL) *</label>
              <input style={is} value={form.slug} onChange={e => set('slug', slugify(e.target.value))} placeholder="auto-generated" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={fs}>
              <label style={ls}>Category</label>
              <select style={is} value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="keychain">Keychain</option>
                <option value="keyholder">Key Holder</option>
                <option value="photoframe">Photo Frame</option>
                <option value="decor">Decor</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div style={fs}>
              <label style={ls}>Initial Stock</label>
              <input type="number" style={is} value={form.stock} min={0} onChange={e => set('stock', Number(e.target.value))} />
            </div>
          </div>

          <div style={fs}>
            <label style={ls}>Short Tagline *</label>
            <input style={is} value={form.shortTagline} onChange={e => set('shortTagline', e.target.value)} placeholder="One line shown on product card" />
          </div>

          <div style={fs}>
            <label style={ls}>Emotional Angle</label>
            <input style={is} value={form.emotionalAngle} onChange={e => set('emotionalAngle', e.target.value)} placeholder="e.g. For those who refuse to be average" />
          </div>

          <div style={fs}>
            <label style={ls}>Full Description *</label>
            <textarea style={{ ...is, minHeight: 100, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Detailed product description..." />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: 14, background: '#FFF8F5', borderRadius: 8, border: '1px solid rgba(255,92,26,0.2)' }}>
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} style={{ accentColor: 'var(--orange)', width: 16, height: 16 }} />
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink)' }}>Publish immediately</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: 'var(--muted)', marginTop: 2, letterSpacing: '0.06em' }}>UNCHECK TO SAVE AS DRAFT — visible in admin only</div>
            </div>
          </label>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: 14, fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#DC2626' }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 12, position: 'sticky', bottom: 0, background: 'white' }}>
          <button type="button" className={styles.btnOutline} onClick={onClose}>Cancel</button>
          <button type="button" className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? 'Creating...' : '+ Add Product'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────
// EDIT PRODUCT FORM
// ─────────────────────────────────────────────────
function ProductEditForm({ product, onClose }: { product: any; onClose: () => void }) {
  const updateProduct = useMutation(api.products.update)
  const [form, setForm] = useState({
    name: product.name || '',
    description: product.description || '',
    shortTagline: product.shortTagline || '',
    emotionalAngle: product.emotionalAngle || '',
    stock: product.stock || 0,
    isActive: product.isActive || false,
  })
  const [images, setImages] = useState<string[]>(product.images || [])
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string | number | boolean) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProduct({ id: product._id, ...form, images })
      onClose()
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 12, maxWidth: 640, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Edit: {product.name}</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--muted)' }}>✕</button>
        </div>
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ImageUploader images={images} setImages={setImages} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={fs}><label style={ls}>Product Name *</label><input style={is} value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div style={fs}><label style={ls}>Stock</label><input type="number" style={is} value={form.stock} min={0} onChange={e => set('stock', Number(e.target.value))} /></div>
          </div>
          <div style={fs}><label style={ls}>Short Tagline</label><input style={is} value={form.shortTagline} onChange={e => set('shortTagline', e.target.value)} placeholder="One line on the product card" /></div>
          <div style={fs}><label style={ls}>Emotional Angle</label><input style={is} value={form.emotionalAngle} onChange={e => set('emotionalAngle', e.target.value)} /></div>
          <div style={fs}><label style={ls}>Full Description</label><textarea style={{ ...is, minHeight: 100, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} style={{ accentColor: 'var(--orange)', width: 16, height: 16 }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>Active (visible on storefront)</span>
          </label>
        </div>
        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" className={styles.btnOutline} onClick={onClose}>Cancel</button>
          <button type="button" className={styles.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
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
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>ADMIN</div>
          <h1 className={styles.title}>Products</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)' }}>
            {products?.length ?? 0} products total
          </div>
          <button className={styles.btnPrimary} style={{ padding: '10px 22px', fontSize: '0.7rem' }} onClick={() => setShowCreate(true)}>
            + Add Product
          </button>
        </div>
      </div>

      {products === undefined ? (
        <div className={styles.loading}>Loading products...</div>
      ) : products.length === 0 ? (
        <div className={styles.empty}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📦</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: 'var(--ink)' }}>No products yet</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 20 }}>Click "+ Add Product" to add your first product to the store</div>
          <button className={styles.btnPrimary} onClick={() => setShowCreate(true)}>+ Add First Product</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {products.map(p => (
            <ProductCard key={p._id} product={p} onEdit={setEditingProduct} />
          ))}
        </div>
      )}

      {showCreate && <CreateProductForm onClose={() => setShowCreate(false)} />}
      {editingProduct && <ProductEditForm product={editingProduct} onClose={() => setEditingProduct(null)} />}
    </div>
  )
}
