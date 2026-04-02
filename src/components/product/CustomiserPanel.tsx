import { useState } from 'react'
import { useCart } from '../../context/CartContext'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
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
  fileConfig?: {
    maxSizeMB: number
    allowedTypes: string[]
  }
}

interface CustomiserPanelProps {
  config: CustomField[]
  productId: string
  productName: string
  variant?: 'dark' | 'light'
}

export default function CustomiserPanel({ config, productId, productName, variant = 'dark' }: CustomiserPanelProps) {
  const [values, setValues] = useState<Record<string, string | number | boolean>>({})
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const { addItem } = useCart()

  // Get price from pricing engine
  const priceData = useQuery(api.pricing.getProductPrice, {
    productId: productId as any,
    quantity: (values['quantity'] as number) || 1,
  })

  const updateValue = (fieldId: string, value: string | number | boolean) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleAddToCart = () => {
    // Validate required fields
    const missing = config
      .filter((f) => f.required && !values[f.fieldId] && f.type !== 'quantity')
      .map((f) => f.label)

    if (missing.length > 0) {
      alert(`Please fill in: ${missing.join(', ')}`)
      return
    }

    const qty = (values['quantity'] as number) || 1

    // Find slug from product name
    const slug = productName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    addItem({
      productId,
      productSlug: slug,
      productName,
      unitPrice: priceData?.unitPrice ?? 0,
      quantity: qty,
      costBreakdown: {
        // Public pricing API intentionally hides cost breakdown.
        // Real costs are stored in productPricing table server-side.
        material: 0, electricity: 0, machine: 0, consumables: 0, design: 0,
        labour: 0, packaging: 0, overheads: 0, subtotalCost: 0,
        riskBuffer: 0, trueCost: 0, margin: 0,
        sellingPrice: priceData?.unitPrice ?? 0,
      },
      customisations: values,
    })
  }

  return (
    <div className={`${styles.panel} ${variant === 'light' ? styles.light : ''}`}>
      <div className={styles.sectionTitle}>Customise Your Piece</div>

      {config.map((field) => (
        <div key={field.fieldId} className={styles.fieldGroup}>
          <label className={styles.label}>
            {field.label}
            {field.required && <span className={styles.required}>*</span>}
          </label>

          {/* SELECT */}
          {field.type === 'select' && field.options && (
            <div className={styles.optionsGrid}>
              {field.options.map((opt) => (
                <button
                  key={opt}
                  className={`${styles.optionBtn} ${values[field.fieldId] === opt ? styles.optionActive : ''}`}
                  onClick={() => updateValue(field.fieldId, opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* TEXT */}
          {field.type === 'text' && (
            <div className={styles.textWrap}>
              <input
                type="text"
                className={styles.textInput}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                maxLength={field.maxLength}
                value={(values[field.fieldId] as string) || ''}
                onChange={(e) => updateValue(field.fieldId, e.target.value)}
              />
              {field.maxLength && (
                <span className={styles.charCount}>
                  {((values[field.fieldId] as string) || '').length}/{field.maxLength}
                </span>
              )}
            </div>
          )}

          {/* QUANTITY */}
          {field.type === 'quantity' && (
            <div className={styles.qtyWrap}>
              <button
                className={styles.qtyBtn}
                onClick={() => {
                  const curr = (values[field.fieldId] as number) || field.minQty || 1
                  if (curr > (field.minQty || 1)) updateValue(field.fieldId, curr - 1)
                }}
              >
                −
              </button>
              <span className={styles.qtyValue}>
                {(values[field.fieldId] as number) || field.minQty || 1}
              </span>
              <button
                className={styles.qtyBtn}
                onClick={() => {
                  const curr = (values[field.fieldId] as number) || field.minQty || 1
                  if (curr < (field.maxQty || 99)) updateValue(field.fieldId, curr + 1)
                }}
              >
                +
              </button>
              {field.maxQty && (
                <span className={styles.qtyMax}>Max {field.maxQty}</span>
              )}
            </div>
          )}

          {/* TOGGLE */}
          {field.type === 'toggle' && (
            <div className={styles.toggleWrap}>
              <button
                className={`${styles.toggle} ${values[field.fieldId] ? styles.toggleOn : ''}`}
                onClick={() => updateValue(field.fieldId, !values[field.fieldId])}
              >
                <div className={styles.toggleKnob} />
              </button>
              {field.priceModifier && (
                <span className={styles.togglePrice}>
                  +₹{(field.priceModifier / 100).toFixed(0)}
                </span>
              )}
            </div>
          )}

          {/* FILE */}
          {field.type === 'file' && (
            <div className={styles.fileWrap}>
              <label className={styles.fileLabel}>
                <input
                  type="file"
                  className={styles.fileInput}
                  accept={field.fileConfig?.allowedTypes.join(',')}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    if (file && field.fileConfig) {
                      if (file.size > field.fileConfig.maxSizeMB * 1024 * 1024) {
                        alert(`File too large. Max ${field.fileConfig.maxSizeMB}MB`)
                        return
                      }
                    }
                    setFiles((prev) => ({ ...prev, [field.fieldId]: file }))
                  }}
                />
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

      {/* ADD TO CART */}
      <button className={styles.addToCart} onClick={handleAddToCart}>
        Add to Cart →
      </button>

      <div className={styles.guarantee}>
        <span>✦</span> Handcrafted to order · 7-day delivery · Premium packaging
      </div>
    </div>
  )
}
