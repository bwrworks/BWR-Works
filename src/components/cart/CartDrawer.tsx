import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../lib/formatters'
import styles from './CartDrawer.module.css'

export default function CartDrawer() {
  const navigate = useNavigate()
  const { items, itemCount, subtotal, removeItem, updateQuantity, isOpen, setIsOpen } = useCart()

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
          </div>
        ) : (
          <>
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
                    <div className={styles.itemCustom}>
                      {Object.entries(item.customisations)
                        .filter(([, v]) => v !== false && v !== '')
                        .slice(0, 2)
                        .map(([, v]) => String(v))
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
              <div className={styles.taxNote}>GST and shipping calculated at checkout</div>
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
