import { useState } from 'react'
import { useAction, useMutation, useQuery } from 'convex/react'
import { AlertTriangle } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { formatPrice } from '../../lib/formatters'
import styles from './PaymentButton.module.css'

interface CartItem {
  productId: string
  productName: string
  productSlug: string
  unitPrice: number
  quantity: number
  costBreakdown: {
    material: number; electricity: number; machine: number
    consumables: number; design: number; labour: number
    packaging: number; overheads: number; subtotalCost: number
    riskBuffer: number; trueCost: number; margin: number; sellingPrice: number
  }
  customisations?: Record<string, string>
  customText?: Record<string, string>
  imageRef?: string
}

interface AddressSnapshot {
  name: string; line1: string; line2?: string
  city: string; state: string; pincode: string; phone: string
}

interface Props {
  items: CartItem[]
  subtotal: number
  gstAmount: number
  discountAmount: number
  total: number
  couponCode?: string
  address: AddressSnapshot
  onSuccess: (orderId: string) => void
  disabled?: boolean
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

type PaymentMode = 'online' | 'cod'

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (document.getElementById('razorpay-script')) return resolve(true)
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/** Sanitize errors — NEVER show raw server messages to users */
function getFriendlyError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    if (msg.includes('network') || msg.includes('fetch')) {
      return 'Network issue. Please check your connection and try again.'
    }
    if (msg.includes('razorpay') || msg.includes('credentials') || msg.includes('key')) {
      return 'Payment gateway is being set up. Please use Cash on Delivery for now.'
    }
    if (msg.includes('amount') || msg.includes('paise')) {
      return 'Invalid order amount. Please return to cart and try again.'
    }
  }
  return 'Something went wrong. Please try again or contact support.'
}

export default function PaymentButton({
  items, subtotal, gstAmount, discountAmount, total,
  couponCode, address, onSuccess, disabled = false
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [payMode, setPayMode] = useState<PaymentMode>('online')

  const createRazorpayOrder = useAction(api.payments.createRazorpayOrder)
  const createOrder = useMutation(api.orders.createOrder)
  const pricingDefaults = useQuery(api.pricing.getPricingDefaults)

  const codAdvancePercent = pricingDefaults?.codAdvancePercent ?? 50
  const advanceAmount = Math.ceil((total * codAdvancePercent) / 100)

  const buildOrderItems = () => items.map(item => ({
    productId: item.productId,
    productName: item.productName,
    productSlug: item.productSlug,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    costBreakdown: item.costBreakdown,
    customisations: item.customisations || {},
    customText: item.customText || {},
    imageRef: item.imageRef,
  }))

  const handleOnlinePayment = async () => {
    setError('')
    setLoading(true)
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        setError('Could not load payment gateway. Please check your connection.')
        setLoading(false)
        return
      }

      const rzpOrder = await createRazorpayOrder({
        amount: total,
        currency: 'INR',
        receipt: `bwr_${Date.now()}`,
      })

      await createOrder({
        razorpayOrderId: rzpOrder.razorpayOrderId,
        items: buildOrderItems(),
        subtotal, gstAmount, discountAmount, couponCode, total,
        paymentMode: 'online',
        balanceDue: 0,
        razorpayAmount: total,
        addressSnapshot: address,
      })

      const rzp = new window.Razorpay({
        key: rzpOrder.keyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: 'BWR Works',
        description: 'Premium Custom Crafted Products',
        image: '/logo.png',
        order_id: rzpOrder.razorpayOrderId,
        prefill: { name: address.name, contact: address.phone },
        theme: { color: '#FF5C1A' },
        modal: { ondismiss: () => setLoading(false) },
        handler: () => { onSuccess(rzpOrder.razorpayOrderId) },
      })
      rzp.open()
    } catch (err) {
      setError(getFriendlyError(err))
      setLoading(false)
    }
  }

  const handleCodPayment = async () => {
    setError('')
    setLoading(true)
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        setError('Could not load payment gateway. Please check your connection.')
        setLoading(false)
        return
      }

      // Create Razorpay order for advance only
      const rzpOrder = await createRazorpayOrder({
        amount: advanceAmount,
        currency: 'INR',
        receipt: `bwr_cod_${Date.now()}`,
      })

      await createOrder({
        razorpayOrderId: rzpOrder.razorpayOrderId,
        items: buildOrderItems(),
        subtotal, gstAmount, discountAmount, couponCode, total,
        paymentMode: 'cod',
        balanceDue: total - advanceAmount,
        razorpayAmount: advanceAmount,
        addressSnapshot: address,
      })

      const rzp = new window.Razorpay({
        key: rzpOrder.keyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: 'BWR Works — COD Advance',
        description: `${codAdvancePercent}% advance for COD order. Balance ₹${((total - advanceAmount) / 100).toFixed(0)} on delivery.`,
        image: '/logo.png',
        order_id: rzpOrder.razorpayOrderId,
        prefill: { name: address.name, contact: address.phone },
        theme: { color: '#FF5C1A' },
        modal: { ondismiss: () => setLoading(false) },
        handler: () => { onSuccess(rzpOrder.razorpayOrderId) },
      })
      rzp.open()
    } catch (err) {
      setError(getFriendlyError(err))
      setLoading(false)
    }
  }



  return (
    <div className={styles.wrapper}>

      {/* ── PAYMENT MODE SELECTOR ── */}
      <div className={styles.modeGrid}>
        <button
          className={`${styles.modeBtn} ${payMode === 'online' ? styles.modeBtnActive : ''}`}
          onClick={() => setPayMode('online')}
          type="button"
        >
          <span className={styles.modeIcon}>💳</span>
          <div className={styles.modeInfo}>
            <div className={styles.modeName}>Pay Online</div>
            <div className={styles.modeDesc}>UPI · Cards · NetBanking · EMI</div>
          </div>
          <div className={styles.modeAmount}>{formatPrice(total)}</div>
          <div className={`${styles.modeCheck} ${payMode === 'online' ? styles.modeCheckOn : ''}`} />
        </button>

        <button
          className={`${styles.modeBtn} ${payMode === 'cod' ? styles.modeBtnActive : ''}`}
          onClick={() => setPayMode('cod')}
          type="button"
        >
          <span className={styles.modeIcon}>🚚</span>
          <div className={styles.modeInfo}>
            <div className={styles.modeName}>Cash on Delivery</div>
            <div className={styles.modeDesc}>{codAdvancePercent}% advance now · Balance on delivery</div>
          </div>
          <div className={styles.modeAmount}>{formatPrice(advanceAmount)} now</div>
          <div className={`${styles.modeCheck} ${payMode === 'cod' ? styles.modeCheckOn : ''}`} />
        </button>
      </div>

      {/* COD breakdown note */}
      {payMode === 'cod' && (
        <div className={styles.codNote}>
          <div className={styles.codRow}>
            <span>Advance (pay now via Razorpay)</span>
            <strong>{formatPrice(advanceAmount)}</strong>
          </div>
          <div className={styles.codRow}>
            <span>Balance (pay on delivery)</span>
            <strong>{formatPrice(total - advanceAmount)}</strong>
          </div>
        </div>
      )}

      {/* Error — user-friendly only, never raw server messages */}
      {error && (
        <div className={styles.errorBox}>
          <span style={{display:'flex', alignItems:'center', gap:'6px'}}><AlertTriangle size={16} /> {error}</span>
        </div>
      )}

      {/* Pay button */}
      <button
        id="pay-now-btn"
        className={styles.btn}
        onClick={payMode === 'cod' ? handleCodPayment : handleOnlinePayment}
        disabled={disabled || loading}
      >
        {loading ? (
          <span className={styles.btnLoading}>
            <span className={styles.spinner} />
            Processing...
          </span>
        ) : payMode === 'cod' ? (
          <span>Pay {formatPrice(advanceAmount)} Advance →</span>
        ) : (
          <span>Pay {formatPrice(total)} →</span>
        )}
      </button>

      <p className={styles.secureNote}>
        🔒 Secured by Razorpay · All payment modes supported
      </p>
    </div>
  )
}
