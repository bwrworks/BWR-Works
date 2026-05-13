import styles from './OrderSummary.module.css'

interface CartItem {
  productId: string
  productName: string
  productSlug: string
  unitPrice: number // paise
  quantity: number
  customisations?: Record<string, string>
  imageRef?: string
}

interface CouponResult {
  code: string
  discountAmount: number
  discountType: 'flat' | 'percent'
  discountValue: number
}

interface Props {
  items: CartItem[]
  coupon?: CouponResult | null
  gstPercent?: number
}

const GST = 0.18 // 18%

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function calculateTotals(items: CartItem[], couponDiscount = 0, gstPercent = GST) {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const discount = couponDiscount
  const taxableAmount = Math.max(0, subtotal - discount)
  const gstAmount = Math.round(taxableAmount * gstPercent)
  const total = taxableAmount + gstAmount
  return { subtotal, discount, taxableAmount, gstAmount, total }
}

export default function OrderSummary({ items, coupon, gstPercent = GST }: Props) {
  const { subtotal, discount, gstAmount, total } = calculateTotals(
    items,
    coupon?.discountAmount ?? 0,
    gstPercent
  )

  return (
    <div className={styles.card}>
      <h3 className={styles.heading}>ORDER SUMMARY</h3>

      {/* Items */}
      <div className={styles.itemList}>
        {items.map((item, i) => (
          <div key={`${item.productId}-${i}`} className={styles.item}>
            <div className={styles.itemInfo}>
              <span className={styles.itemName}>{item.productName}</span>
              {item.customisations && Object.keys(item.customisations).length > 0 && (
                <span className={styles.itemCustom}>
                  {Object.entries(item.customisations)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' · ')}
                </span>
              )}
              <span className={styles.itemQty}>Qty: {item.quantity}</span>
            </div>
            <span className={styles.itemPrice}>
              {formatRupees(item.unitPrice * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.divider} />

      {/* Subtotal */}
      <div className={styles.row}>
        <span className={styles.rowLabel}>Subtotal</span>
        <span className={styles.rowValue}>{formatRupees(subtotal)}</span>
      </div>

      {/* Coupon Discount */}
      {coupon && discount > 0 && (
        <div className={`${styles.row} ${styles.rowDiscount}`}>
          <span className={styles.rowLabel}>
            Coupon <span className={styles.couponBadge}>{coupon.code}</span>
          </span>
          <span className={styles.discountValue}>−{formatRupees(discount)}</span>
        </div>
      )}

      {/* GST */}
      {gstPercent > 0 && (
        <div className={`${styles.row} ${styles.rowGst}`}>
          <span className={styles.rowLabel}>GST (18%)</span>
          <span className={styles.rowValue}>{formatRupees(gstAmount)}</span>
        </div>
      )}

      <div className={styles.divider} />

      {/* Total */}
      <div className={`${styles.row} ${styles.rowTotal}`}>
        <span className={styles.totalLabel}>TOTAL PAYABLE</span>
        <span className={styles.totalValue}>{formatRupees(total)}</span>
      </div>

      <p className={styles.gstNote}>
        {gstPercent > 0 ? 'GST included in final price · ' : ''}All amounts in INR
      </p>
    </div>
  )
}
