import { useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import styles from './OrderConfirm.module.css'

export default function OrderConfirm() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const rzpOrderId = params.get('rzp') || ''

  useEffect(() => { window.scrollTo(0, 0) }, [])
  useEffect(() => {
    if (!rzpOrderId) navigate('/')
  }, [rzpOrderId, navigate])

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.card}>
          {/* Animated checkmark */}
          <div className={styles.iconWrap}>
            <svg className={styles.checkIcon} viewBox="0 0 52 52">
              <circle className={styles.checkCircle} cx="26" cy="26" r="25" />
              <path className={styles.checkMark} d="M14 27l8 8 16-18" />
            </svg>
          </div>

          <div className={styles.eyebrow}>ORDER CONFIRMED</div>
          <h1 className={styles.title}>
            Your order is<br />
            <span className={styles.accent}>in our hands.</span>
          </h1>

          <p className={styles.body}>
            We've received your order and our team will start crafting your piece soon.
            You'll receive a confirmation email shortly.
          </p>

          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>REFERENCE</span>
              <span className={styles.infoValue}>{rzpOrderId.slice(-10).toUpperCase()}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>STATUS</span>
              <span className={`${styles.infoValue} ${styles.statusBadge}`}>RECEIVED</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>PRODUCTION TIME</span>
              <span className={styles.infoValue}>5–7 Working Days</span>
            </div>
          </div>

          <div className={styles.timeline}>
            <div className={`${styles.timelineStep} ${styles.timelineActive}`}>
              <div className={styles.timelineDot} />
              <div className={styles.timelineText}>Received</div>
            </div>
            <div className={styles.timelineLine} />
            <div className={styles.timelineItem}>
              <div className={styles.timelineDot} />
              <div className={styles.timelineText}>Crafting</div>
            </div>
            <div className={styles.timelineLine} />
            <div className={styles.timelineStep}>
              <div className={styles.timelineDot} />
              <div className={styles.timelineText}>Shipped</div>
            </div>
            <div className={styles.timelineLine} />
            <div className={styles.timelineStep}>
              <div className={styles.timelineDot} />
              <div className={styles.timelineText}>Delivered</div>
            </div>
          </div>

          <div className={styles.actions}>
            <Link to="/dashboard" className={styles.btnPrimary}>
              Track Your Order →
            </Link>
            <Link to="/products" className={styles.btnOutline}>
              Continue Shopping
            </Link>
          </div>

          <p className={styles.whatsapp}>
            Questions? WhatsApp us at{' '}
            <a
              href="https://wa.me/918431797007?text=Hi%2C%20I%20have%20a%20question%20about%20my%20BWR%20order"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              +91 70194 27272
            </a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
