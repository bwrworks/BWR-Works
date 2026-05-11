import { useState } from 'react'
import { useCart } from '../../context/CartContext'
import { useQuery, useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useToast } from '../../context/ToastContext'
import styles from './CustomiserPanel.module.css'

interface CustomField {
  fieldId: string
  label: string
  type: 'select' | 'text' | 'toggle' | 'file' | 'quantity'
  required: boolean
  options?: string[]
  maxLength?: number
  minQty?: number
  maxQty?: number
  priceModifier?: number
  fileConfig?: { maxSizeMB: number; allowedTypes: string[] }
}

interface Props {
  config: CustomField[]
  productId: string
  productName: string
  productSlug: string
  image?: string
  variant?: 'dark' | 'light'
}

export default function CustomiserPanel({ config, productId, productName, productSlug, image, variant = 'dark' }: Props) {
  const [values, setValues] = useState<Record<string, string | number | boolean>>({})
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { addItem } = useCart()
  const uploadFile = useAction(api.cloudinary.uploadCustomerFile)
  const { success, error: toastError, warning } = useToast()

  const hasQtyField = config.some(f => f.type === 'quantity')

  const priceData = useQuery(api.pricing.getProductPrice, {
    productId: productId as any,
    quantity: hasQtyField ? ((values['quantity'] as number) || 1) : qty,
  })

  const set = (fieldId: string, value: string | number | boolean) =>
    setValues(prev => ({ ...prev, [fieldId]: value }))

  const handleAddToCart = async () => {
    const missing = config.filter(f => f.required && !values[f.fieldId] && f.type !== 'quantity' && f.type !== 'file')
    const missingFiles = config.filter(f => f.required && f.type === 'file' && !files[f.fieldId])

    if (missing.length > 0 || missingFiles.length > 0) {
      const labels = [...missing, ...missingFiles].map(f => f.label)
      warning(`Please fill in: ${labels.join(', ')}`)
      return
    }

    setIsUploading(true)
    const finalValues = { ...values }

    try {
      for (const [fieldId, file] of Object.entries(files)) {
        if (!file) continue;
        
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const secureUrl = await uploadFile({
          productId: productId as any,
          fieldId,
          base64Data,
          fileName: file.name,
          fileType: file.type
        });

        finalValues[fieldId] = secureUrl;
      }
    } catch (err: any) {
      setIsUploading(false)
      toastError(err.message || 'File upload failed');
      return;
    }

    setIsUploading(false)

    const quantity = hasQtyField ? ((values['quantity'] as number) || 1) : qty

    addItem({
      productId,
      productSlug,
      productName,
      unitPrice: priceData?.unitPrice ?? 0,
      quantity,
      costBreakdown: {
        material: 0, electricity: 0, machine: 0, consumables: 0,
        design: 0, labour: 0, packaging: 0, overheads: 0,
        subtotalCost: 0, riskBuffer: 0, trueCost: 0, margin: 0,
        sellingPrice: priceData?.unitPrice ?? 0,
      },
      customisations: finalValues,
      imageRef: image,
    })

    setAdded(true)
    success(`${productName} added to cart!`)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <div className={`${styles.panel} ${variant === 'light' ? styles.light : ''}`}>

      {/* ── TRUST BADGES ── */}
      <div className={styles.badges}>
        <div className={styles.badge}>🎨 Made to Order</div>
        <div className={styles.badge}>📦 7-Day Delivery</div>
        <div className={styles.badge}>⭐ Premium Packaging</div>
      </div>

      {/* ── DEFAULT QUANTITY (when config has no qty field) ── */}
      {!hasQtyField && (
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Quantity</label>
          <div className={styles.qtyWrap}>
            <button type="button" className={styles.qtyBtn}
              onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}>−</button>
            <span className={styles.qtyValue}>{qty}</span>
            <button type="button" className={styles.qtyBtn}
              onClick={() => setQty(q => Math.min(99, q + 1))} disabled={qty >= 99}>+</button>
          </div>
        </div>
      )}

      {/* ── CUSTOM FIELDS HEADER ── */}
      {config.length > 0 && (
        <div className={styles.sectionTitle}>Customise Your Piece</div>
      )}

      {/* ── FIELDS ── */}
      {config.map(field => (
        <div key={field.fieldId} className={styles.fieldGroup}>
          <label className={styles.label}>
            {field.label}
            {field.required && <span className={styles.required}>*</span>}
          </label>

          {field.type === 'select' && field.options && (
            <div className={styles.optionsGrid}>
              {field.options.map(opt => (
                <button key={opt} type="button"
                  className={`${styles.optionBtn} ${values[field.fieldId] === opt ? styles.optionActive : ''}`}
                  onClick={() => set(field.fieldId, opt)}>{opt}</button>
              ))}
            </div>
          )}

          {field.type === 'text' && (
            <div className={styles.textWrap}>
              <input type="text" className={styles.textInput}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                maxLength={field.maxLength}
                value={(values[field.fieldId] as string) || ''}
                onChange={e => set(field.fieldId, e.target.value)} />
              {field.maxLength && (
                <span className={styles.charCount}>
                  {((values[field.fieldId] as string) || '').length}/{field.maxLength}
                </span>
              )}
            </div>
          )}

          {field.type === 'quantity' && (
            <div className={styles.qtyWrap}>
              <button type="button" className={styles.qtyBtn} onClick={() => {
                const curr = (values[field.fieldId] as number) || field.minQty || 1
                if (curr > (field.minQty || 1)) set(field.fieldId, curr - 1)
              }}>−</button>
              <span className={styles.qtyValue}>
                {(values[field.fieldId] as number) || field.minQty || 1}
              </span>
              <button type="button" className={styles.qtyBtn} onClick={() => {
                const curr = (values[field.fieldId] as number) || field.minQty || 1
                if (curr < (field.maxQty || 99)) set(field.fieldId, curr + 1)
              }}>+</button>
              {field.maxQty && <span className={styles.qtyMax}>Max {field.maxQty}</span>}
            </div>
          )}

          {field.type === 'toggle' && (
            <div className={styles.toggleWrap}>
              <button type="button"
                className={`${styles.toggle} ${values[field.fieldId] ? styles.toggleOn : ''}`}
                onClick={() => set(field.fieldId, !values[field.fieldId])}>
                <div className={styles.toggleKnob} />
              </button>
              {field.priceModifier && (
                <span className={styles.togglePrice}>+₹{(field.priceModifier / 100).toFixed(0)}</span>
              )}
            </div>
          )}

          {field.type === 'file' && (
            <div className={styles.fileWrap}>
              <label className={styles.fileLabel}>
                <input type="file" className={styles.fileInput}
                  accept={field.fileConfig?.allowedTypes.join(',')}
                  onChange={e => {
                    const file = e.target.files?.[0] ?? null
                    if (file && field.fileConfig && file.size > field.fileConfig.maxSizeMB * 1024 * 1024) {
                      toastError(`File too large. Max ${field.fileConfig.maxSizeMB}MB`)
                      return
                    }
                    setFiles(prev => ({ ...prev, [field.fieldId]: file }))
                  }} />
                <span className={styles.fileIcon}>📎</span>
                <span>{files[field.fieldId]?.name || 'Choose file'}</span>
              </label>
              {field.fileConfig && (
                <span className={styles.fileHint}>
                  Max {field.fileConfig.maxSizeMB}MB · {field.fileConfig.allowedTypes.map(t => t.split('/')[1]).join(', ')}
                </span>
              )}
            </div>
          )}
        </div>
      ))}

      {/* ── ADD TO CART ── */}
      <button type="button"
        className={`${styles.addToCart} ${added ? styles.addToCartAdded : ''}`}
        onClick={handleAddToCart}
        disabled={isUploading}>
        {isUploading ? 'Uploading...' : added ? '✓ Added to Cart' : 'Add to Cart →'}
      </button>

      <div className={styles.guarantee}>
        <span>✦</span> Handcrafted to order · 7-day delivery · Premium packaging
      </div>
    </div>
  )
}
