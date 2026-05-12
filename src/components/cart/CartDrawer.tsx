import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../lib/formatters'
import styles from './CartDrawer.module.css'

export default function CartDrawer() {
  const navigate = useNavigate()
  const { items, itemCount, subtotal, removeItem, updateQuantity, isOpen, setIsOpen } = useCart()
  const [priceWarning, setPriceWarning] = useState(false)

  // B-10: Batch-fetch fresh prices for all cart items using a single query
  const productIds = items.map(i => i.productId)
  const freshPrices = useQuery(
    api.pricing.getBatchPrices,
    productIds.length > 0 ? { productIds } : 'skip'
  )

  // Check if any prices have changed since the cart was saved
  useEffect(() => {
    if (!freshPrices || items.length === 0) return
    let changed = false
    for (const item of items) {
      const fresh = freshPrices[item.productId]
      if (fresh && fresh !== item.unitPrice) {
        changed = true
        // Update the item in place via the context
        updateQuantity(item.id, item.quantity) // Trigger re-render
      }
    }
    if (changed) setPriceWarning(true)
  }, [freshPrices]) // eslint-disable-line react-hooks/exhaustive-deps

  // UX-7: Estimate GST (18%)
  const estimatedGst = Math.round(subtotal * 0.18)
  const estimatedTotal = subtotal + estimatedGst

  const handleCheckout = () => {
    setIsOpen(false)
    navigate('/checkout')
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className={styles.backdrop} onClick={() => setIsOpen(false)} />}

      {/* Drawer */}
      <div className={`${styles.drawer} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            Your Cart
            {itemCount > 0 && <span className={styles.badge}>{itemCount}</span>}
          </h3>
          <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>✕</button>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>◇</div>
            <p>Your cart is empty</p>
            <span>Add something beautiful</span>
            {/* CC-03: Browse button so empty cart isn't a dead end */}
            <button
              className={styles.browseBtn}
              onClick={() => { setIsOpen(false); navigate('/products') }}
              style={{
                marginTop: 20, padding: '12px 28px',
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: '0.75rem', letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: 'var(--ink)', color: 'var(--off-white)',
                border: 'none', cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              Browse Collection →
            </button>
          </div>
        ) : (
          <>
            {/* B-10: Price change warning */}
            {priceWarning && (
              <div style={{
                padding: '8px 16px',
                background: '#FEF3C7',
                borderBottom: '1px solid #F59E0B',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                color: '#92400E',
                letterSpacing: '0.05em',
              }}>
                ⚠ Some prices have been updated since your last visit
              </div>
            )}

            <div className={styles.items}>
              {items.map((item) => (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemVisual}>
                    {item.imageRef ? (
                      <img
                        src={item.imageRef}
                        alt={item.productName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div className={styles.itemPlaceholder}>
                        {item.productName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{item.productName}</div>
                    {/* UX-6: Show field labels with customisation values */}
                    <div className={styles.itemCustom}>
                      {Object.entries(item.customisations)
                        .filter(([, v]) => v !== false && v !== '')
                        .slice(0, 3)
                        .map(([key, v]) => {
                          // Convert fieldId to readable label
                          const label = key
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, c => c.toUpperCase())
                          return `${label}: ${String(v)}`
                        })
                        .join(' · ')}
                    </div>
                    <div className={styles.itemRow}>
                      <div className={styles.itemQty}>
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                      </div>
                      <span className={styles.itemPrice}>
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                  <button className={styles.removeBtn} onClick={() => removeItem(item.id)}>✕</button>
                </div>
              ))}
            </div>

            <div className={styles.footer}>
              <div className={styles.subtotalRow}>
                <span>Subtotal</span>
                <span className={styles.subtotalPrice}>{formatPrice(subtotal)}</span>
              </div>
              {/* UX-7: Show estimated GST */}
              <div className={styles.subtotalRow} style={{ opacity: 0.6, fontSize: '0.8rem' }}>
                <span>Est. GST (18%)</span>
                <span>{formatPrice(estimatedGst)}</span>
              </div>
              <div className={styles.subtotalRow} style={{ fontWeight: 700, marginTop: 4 }}>
                <span>Est. Total</span>
                <span className={styles.subtotalPrice}>{formatPrice(estimatedTotal)}</span>
              </div>
              <div className={styles.taxNote}>Exact total calculated at checkout</div>
              <button className={styles.checkoutBtn} onClick={handleCheckout}>
                Proceed to Checkout →
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
