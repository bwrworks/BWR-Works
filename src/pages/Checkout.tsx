import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useCart } from '../context/CartContext'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import AddressForm from '../components/checkout/AddressForm'
import OrderSummary, { calculateTotals } from '../components/checkout/OrderSummary'
import PaymentButton from '../components/checkout/PaymentButton'
import styles from './Checkout.module.css'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { useCms } from '../hooks/useCms'

type Step = 'address' | 'review' | 'payment'

export default function Checkout() {
  useScrollReveal()
  const navigate = useNavigate()
  const { items, clearCart } = useCart()
  const { cms } = useCms()
  const user = useQuery(api.users.current)
  const addresses = useQuery(api.addresses.getMyAddresses)
  const validateCoupon = useMutation(api.coupons.validateCoupon)

  const [step, setStep] = useState<Step>('address')
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState<null | {
    couponId: string; code: string; discountType: 'flat' | 'percent'
    discountValue: number; discountAmount: number
  }>(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  // Redirect if cart is empty or not logged in
  useEffect(() => { window.scrollTo(0, 0) }, [])
  useEffect(() => {
    if (items.length === 0) navigate('/products')
  }, [items, navigate])
  useEffect(() => {
    if (user === null) navigate('/auth?redirect=/checkout')
  }, [user, navigate])

  // Auto-select default address
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find(a => a.isDefault) || addresses[0]
      setSelectedAddressId(def._id)
    }
  }, [addresses])

  if (user === undefined || addresses === undefined) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    )
  }

  const checkoutItems = items.map(item => ({
    productId: item.productId,
    productName: item.productName,
    productSlug: item.productSlug,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    costBreakdown: item.costBreakdown,
    customisations: item.customisations as Record<string, string>,
    customText: (item.customText || {}) as Record<string, string>,
    imageRef: item.imageRef,
  }))

  const isGstEnabled = cms('invoice', 'gst_enabled', 'true') === 'true'
  const gstPercent = isGstEnabled ? 0.18 : 0

  const { subtotal, discount, gstAmount, total } = calculateTotals(
    checkoutItems, coupon?.discountAmount ?? 0, gstPercent
  )

  const selectedAddress = addresses.find(a => a._id === selectedAddressId)

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponError('')
    setCouponLoading(true)
    try {
      const result = await validateCoupon({ code: couponInput.trim(), orderSubtotal: subtotal })
      setCoupon(result as typeof coupon)
      setCouponInput('')
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Invalid coupon')
      setCoupon(null)
    } finally {
      setCouponLoading(false)
    }
  }

  const handlePaymentSuccess = (razorpayOrderId: string) => {
    clearCart()
    navigate(`/order-confirm?rzp=${razorpayOrderId}`)
  }

  return (
    <div className={styles.page}>
      <Navbar />

      {/* CC-06: Sticky mobile order summary bar — visible only on mobile via CSS */}
      <div className={styles.mobileSummaryBar}>
        <span className={styles.mobileSummaryCount}>
          {items.length} item{items.length !== 1 ? 's' : ''} in cart
        </span>
        <span className={styles.mobileSummaryTotal}>
          ₹{total.toLocaleString('en-IN')}
        </span>
      </div>

      <div className={`${styles.container} page-enter`}>
        {/* ── PAGE HEADER ── */}
        <div className={styles.header}>
          <div className="section-eyebrow reveal" style={{ color: 'var(--orange)' }}>SECURE CHECKOUT</div>
          <h1 className={`${styles.title} reveal reveal-delay-1`}>Complete Your Order</h1>
        </div>

        <div className={styles.layout}>
          {/* ── LEFT: FORM STEPS ── */}
          <div className={styles.left}>

            {/* STEP INDICATOR */}
            <div className={styles.steps}>
              {(['address', 'review', 'payment'] as Step[]).map((s, i) => (
                <div key={s} className={styles.stepItem}>
                  <div className={`${styles.stepDot} ${step === s ? styles.stepActive : styles.stepDone}`}>
                    {i + 1}
                  </div>
                  <span className={styles.stepLabel}>
                    {s === 'address' ? 'Delivery' : s === 'review' ? 'Review' : 'Payment'}
                  </span>
                  {i < 2 && <div className={styles.stepLine} />}
                </div>
              ))}
            </div>

            {/* ── STEP 1: ADDRESS ── */}
            {step === 'address' && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Delivery Address</h2>

                {addresses.length > 0 && (
                  <div className={styles.addressList}>
                    {addresses.map(addr => (
                      <label
                        key={addr._id}
                        className={`${styles.addressCard} ${selectedAddressId === addr._id ? styles.addressCardSelected : ''}`}
                      >
                        <input
                          type="radio"
                          name="address"
                          className={styles.radioHidden}
                          checked={selectedAddressId === addr._id}
                          onChange={() => { setSelectedAddressId(addr._id); setShowNewAddress(false) }}
                        />
                        <div className={styles.addressDetails}>
                          <div className={styles.addressName}>
                            {addr.name}
                            {addr.isDefault && <span className={styles.defaultBadge}>DEFAULT</span>}
                          </div>
                          <div className={styles.addressText}>{addr.line1}</div>
                          {addr.line2 && <div className={styles.addressText}>{addr.line2}</div>}
                          <div className={styles.addressText}>{addr.city}, {addr.state} — {addr.pincode}</div>
                          <div className={styles.addressText}>📱 {addr.phone}</div>
                        </div>
                        <div className={`${styles.radioIndicator} ${selectedAddressId === addr._id ? styles.radioSelected : ''}`} />
                      </label>
                    ))}
                  </div>
                )}

                {showNewAddress ? (
                  <div className={styles.newAddressForm}>
                    <h3 className={styles.subTitle}>New Address</h3>
                    <AddressForm
                      onSave={() => { setShowNewAddress(false) }}
                      onCancel={() => setShowNewAddress(false)}
                    />
                  </div>
                ) : (
                  <button className={styles.btnOutline} onClick={() => setShowNewAddress(true)}>
                    + Add New Address
                  </button>
                )}

                <button
                  className={styles.btnPrimary}
                  disabled={!selectedAddressId}
                  onClick={() => setStep('review')}
                >
                  Continue to Review →
                </button>
              </div>
            )}

            {/* ── STEP 2: REVIEW + COUPON ── */}
            {step === 'review' && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Review Your Order</h2>

                {/* Address Summary */}
                {selectedAddress && (
                  <div className={styles.reviewCard}>
                    <div className={styles.reviewCardHeader}>
                      <span className={styles.reviewLabel}>DELIVERING TO</span>
                      <button className={styles.changeBtn} onClick={() => setStep('address')}>Change</button>
                    </div>
                    <div className={styles.reviewValue}>{selectedAddress.name}</div>
                    <div className={styles.reviewMuted}>{selectedAddress.line1}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}</div>
                    <div className={styles.reviewMuted}>📱 {selectedAddress.phone}</div>
                  </div>
                )}

                {/* Coupon */}
                <div className={styles.couponBox}>
                  <h3 className={styles.subTitle}>Have a coupon?</h3>
                  {coupon ? (
                    <div className={styles.couponApplied}>
                      <span>✅ <strong>{coupon.code}</strong> applied!</span>
                      <button className={styles.removeCoupon} onClick={() => setCoupon(null)}>Remove</button>
                    </div>
                  ) : (
                    <div className={styles.couponInput}>
                      <input
                        className={styles.input}
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                        onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                      />
                      <button className={styles.btnApply} onClick={handleApplyCoupon} disabled={couponLoading}>
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {couponError && <p className={styles.couponError}>{couponError}</p>}
                </div>

                <button className={styles.btnPrimary} onClick={() => setStep('payment')}>
                  Proceed to Payment →
                </button>
                <button className={styles.btnBack} onClick={() => setStep('address')}>
                  ← Back
                </button>
              </div>
            )}

            {/* ── STEP 3: PAYMENT ── */}
            {step === 'payment' && selectedAddress && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Payment</h2>

                <div className={styles.reviewCard}>
                  <div className={styles.reviewCardHeader}>
                    <span className={styles.reviewLabel}>DELIVERING TO</span>
                    <button className={styles.changeBtn} onClick={() => setStep('address')}>Change</button>
                  </div>
                  <div className={styles.reviewValue}>{selectedAddress.name}</div>
                  <div className={styles.reviewMuted}>{selectedAddress.line1}, {selectedAddress.city}</div>
                </div>

                <PaymentButton
                  items={checkoutItems}
                  subtotal={subtotal}
                  gstAmount={gstAmount}
                  discountAmount={discount}
                  total={total}
                  couponCode={coupon?.code}
                  address={{
                    name: selectedAddress.name,
                    line1: selectedAddress.line1,
                    line2: selectedAddress.line2,
                    city: selectedAddress.city,
                    state: selectedAddress.state,
                    pincode: selectedAddress.pincode,
                    phone: selectedAddress.phone,
                  }}
                  onSuccess={handlePaymentSuccess}
                />

                <button className={styles.btnBack} onClick={() => setStep('review')}>
                  ← Back
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT: ORDER SUMMARY ── */}
          <div className={styles.right}>
            <OrderSummary items={checkoutItems} coupon={coupon} gstPercent={gstPercent} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
