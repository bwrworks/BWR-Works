import { useState } from 'react'
import { useAction, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
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
  subtotal: number      // paise
  gstAmount: number     // paise
  discountAmount: number // paise
  total: number         // paise
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

export default function PaymentButton({
  items, subtotal, gstAmount, discountAmount, total,
  couponCode, address, onSuccess, disabled = false
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const createRazorpayOrder = useAction(api.payments.createRazorpayOrder)
  const createOrder = useMutation(api.orders.createOrder)

  const handlePay = async () => {
    setError('')
    setLoading(true)

    try {
      // 1. Load Razorpay checkout script
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error('Failed to load Razorpay. Check your network connection.')

      // 2. Create Razorpay order SERVER-SIDE (amount set on backend)
      const rzpOrder = await createRazorpayOrder({
        amount: total, // paise — verified server-side
        currency: 'INR',
        receipt: `bwr_${Date.now()}`,
      })

      // 3. Create order in our DB BEFORE payment (status: pending)
      await createOrder({
        razorpayOrderId: rzpOrder.razorpayOrderId,
        items: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          productSlug: item.productSlug,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costBreakdown: item.costBreakdown,
          customisations: item.customisations || {},
          customText: item.customText || {},
          imageRef: item.imageRef,
        })),
        subtotal,
        gstAmount,
        discountAmount,
        couponCode,
        total,
        addressSnapshot: address,
      })

      // 4. Open Razorpay checkout modal
      const options = {
        key: rzpOrder.keyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: 'BWR Works',
        description: 'Custom 3D Printed Products',
        image: '/logo.png',
        order_id: rzpOrder.razorpayOrderId,
        prefill: {
          name: address.name,
          contact: address.phone,
        },
        theme: { color: '#FF5C1A' },
        modal: { ondismiss: () => setLoading(false) },
        handler: (_response: { razorpay_payment_id: string; razorpay_order_id: string }) => {
          // 5. Success — webhook handles verification + fulfillment
          // We navigate to confirm page immediately for UX
          onSuccess(rzpOrder.razorpayOrderId)
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed. Please try again.'
      setError(msg)
      setLoading(false)
    }
  }

  const totalRupees = (total / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 0, maximumFractionDigits: 0
  })

  return (
    <div className={styles.wrapper}>
      {error && (
        <div className={styles.errorBox}>
          <span>⚠️ {error}</span>
        </div>
      )}
      <button
        id="pay-now-btn"
        className={styles.btn}
        onClick={handlePay}
        disabled={disabled || loading}
      >
        {loading ? (
          <span className={styles.btnLoading}>
            <span className={styles.spinner} />
            Processing...
          </span>
        ) : (
          <span>Pay ₹{totalRupees} →</span>
        )}
      </button>
      <p className={styles.secureNote}>
        🔒 Secured by Razorpay · UPI · Cards · NetBanking · EMI
      </p>
    </div>
  )
}
