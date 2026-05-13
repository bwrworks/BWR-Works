import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { fmt, safe } from '../lib/formatters'
import styles from './OrderTracking.module.css'

const STATUS_STEPS = ['received', 'printing', 'shipped', 'delivered'] as const
type OrderStatus = typeof STATUS_STEPS[number]

const STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'Order Received',
  printing: 'Currently Crafting',
  shipped: 'Shipped',
  delivered: 'Delivered',
}

const STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  received: "We've received your order and are preparing the design.",
  printing: "Your custom piece is being crafted right now. This usually takes 2–4 days.",
  shipped: "Your order is with our delivery partner and on its way. Check the tracking number below.",
  delivered: "Your order has been delivered. Hope you love it! 🎉",
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const colors: Record<OrderStatus, string> = {
    received: '#FF5C1A',
    printing: '#F57C00',
    shipped: '#1565C0',
    delivered: '#2E7D32',
  }
  return (
    <span className={styles.badge} style={{ background: colors[status] }}>
      {STATUS_LABELS[status].toUpperCase()}
    </span>
  )
}

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const order = useQuery(api.orders.getOrderById, { orderId: orderId || '' })

  useEffect(() => { window.scrollTo(0, 0) }, [])
  useEffect(() => {
    if (order === null) navigate('/dashboard')
  }, [order, navigate])

  if (order === undefined) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loading}><div className={styles.spinner} /></div>
      </div>
    )
  }

  if (!order) return null

  const currentStep = STATUS_STEPS.indexOf(order.status as OrderStatus)


  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <Link to="/dashboard" className={styles.backLink}>← Back to Dashboard</Link>
          <div className={styles.eyebrow}>ORDER TRACKING</div>
          <h1 className={styles.title}>{safe(order.orderId)}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <StatusBadge status={order.status as OrderStatus} />
            <Link 
              to={`/invoice/${order.orderId}`} 
              target="_blank"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#111',
                textDecoration: 'underline',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Print Invoice 🖨️
            </Link>
          </div>
        </div>

        <div className={styles.layout}>
          {/* LEFT: Status Timeline */}
          <div className={styles.left}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Order Progress</h2>

              <div className={styles.timeline}>
                {STATUS_STEPS.map((step, i) => {
                  const isDone = i <= currentStep
                  const isCurrent = i === currentStep
                  return (
                    <div key={step} className={styles.timelineItem}>
                      <div className={styles.timelineLeft}>
                        <div className={`${styles.dot} ${isDone ? styles.dotDone : ''} ${isCurrent ? styles.dotCurrent : ''}`}>
                          {isDone && !isCurrent && (
                            <svg width="10" height="8" viewBox="0 0 10 8">
                              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                            </svg>
                          )}
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`${styles.connector} ${isDone && i < currentStep ? styles.connectorDone : ''}`} />
                        )}
                      </div>
                      <div className={styles.timelineContent}>
                        <div className={`${styles.stepName} ${isCurrent ? styles.stepNameActive : ''}`}>
                          {STATUS_LABELS[step]}
                        </div>
                        {isCurrent && (
                          <div className={styles.stepDesc}>{STATUS_DESCRIPTIONS[step]}</div>
                        )}
                        {step === 'shipped' && order.trackingNumber && (
                          <div className={styles.trackingNum}>
                            Tracking: <strong>{safe(order.trackingNumber)}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order Items */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Items Ordered</h2>
              <div className={styles.itemList}>
                {order.items.map((item, i) => (
                  <div key={i} className={styles.item}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{safe(item.productName)}</span>
                      <span className={styles.itemQty}>Qty: {item.quantity}</span>
                    </div>
                    <span className={styles.itemPrice}>{fmt(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Order Details */}
          <div className={styles.right}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Order Summary</h2>
              <div className={styles.summaryRow}>
                <span>Subtotal</span><span>{fmt(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                  <span>Discount {order.couponCode && `(${safe(order.couponCode)})`}</span>
                  <span>−{fmt(order.discountAmount)}</span>
                </div>
              )}
              <div className={styles.summaryRow}>
                <span>GST (18%)</span><span>{fmt(order.gstAmount)}</span>
              </div>
              <div className={styles.summaryDivider} />
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Total Paid</span><span>{fmt(order.total)}</span>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Delivery Address</h2>
              <div className={styles.addressBox}>
                <div className={styles.addressName}>{safe(order.addressSnapshot.name)}</div>
                <div className={styles.addressLine}>{safe(order.addressSnapshot.line1)}</div>
                {order.addressSnapshot.line2 && <div className={styles.addressLine}>{safe(order.addressSnapshot.line2)}</div>}
                <div className={styles.addressLine}>{safe(order.addressSnapshot.city)}, {safe(order.addressSnapshot.state)} — {safe(order.addressSnapshot.pincode)}</div>
                <div className={styles.addressLine}>📱 {safe(order.addressSnapshot.phone)}</div>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Need Help?</h2>
              <a
                href={`https://wa.me/918431797007?text=Hi%2C%20my%20order%20is%20${order.orderId}%20and%20I%20need%20help`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappBtn}
              >
                💬 WhatsApp Support
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
