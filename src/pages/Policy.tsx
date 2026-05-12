import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/layout/SEO'
import { useScrollReveal } from '../hooks/useScrollReveal'
import styles from './Policy.module.css'

export default function Policy() {
  useScrollReveal()

  return (
    <div className={styles.page}>
      <SEO 
        title="Shipping, Returns & Privacy Policy | BWR Works" 
        description="Shipping timelines, return policy, and privacy practices for BWR Works. Made to order in Bengaluru, India."
      />
      <Navbar />

      <div className={styles.container}>
        <div className="section-eyebrow reveal" style={{ color: 'var(--orange)' }}>
          POLICIES
        </div>
        <h1 className={`${styles.title} reveal reveal-delay-1`}>
          SHIPPING, RETURNS<br />& PRIVACY
        </h1>

        {/* ── SHIPPING ── */}
        <div className={`${styles.section} reveal`}>
          <h2 className={styles.sectionTitle}>Shipping</h2>
          <span className={styles.highlight}>Made to Order · Ships within 7 business days</span>
          <p className={styles.text}>
            Every BWR Works piece is crafted individually after your order is confirmed. 
            Since nothing is pre-made, please allow 5–7 business days for crafting before 
            your piece ships.
          </p>
          <ul className={styles.list}>
            <li>Crafting time: 5–7 business days</li>
            <li>Shipping via trusted courier partners (Delhivery, DTDC, India Post)</li>
            <li>Delivery within 3–5 business days after dispatch</li>
            <li>Tracking number provided once your order ships</li>
            <li>Free shipping on orders above ₹999</li>
            <li>Currently shipping within India only</li>
          </ul>
        </div>

        {/* ── RETURNS ── */}
        <div className={`${styles.section} reveal`}>
          <h2 className={styles.sectionTitle}>Returns & Exchanges</h2>
          <span className={styles.highlight}>Custom products · Limited return eligibility</span>
          <p className={styles.text}>
            Because each piece is custom-made to your exact specifications, we cannot 
            accept returns for change of mind or incorrect customisation details provided 
            by the buyer.
          </p>
          <p className={styles.text}><strong>We will replace or refund if:</strong></p>
          <ul className={styles.list}>
            <li>The product arrives damaged or broken during shipping</li>
            <li>The product has a manufacturing defect (layer separation, warping, etc.)</li>
            <li>The wrong product or customisation was delivered</li>
          </ul>
          <p className={styles.text}>
            To initiate a return, contact us within 48 hours of delivery with photos of the 
            issue. We'll arrange a replacement or full refund at our discretion.
          </p>
        </div>

        {/* ── CANCELLATIONS ── */}
        <div className={`${styles.section} reveal`}>
          <h2 className={styles.sectionTitle}>Cancellations</h2>
          <p className={styles.text}>
            Orders can be cancelled within 2 hours of placement if production hasn't started. 
            Once crafting begins, cancellation is not possible as the product is custom-made. 
            Refunds for eligible cancellations are processed within 5–7 business days.
          </p>
        </div>

        {/* ── PRIVACY ── */}
        <div className={`${styles.section} reveal`}>
          <h2 className={styles.sectionTitle}>Privacy Policy</h2>
          <p className={styles.text}>
            Your privacy matters to us. We collect only the information necessary to 
            fulfil your order and improve your experience.
          </p>
          <p className={styles.text}><strong>What we collect:</strong></p>
          <ul className={styles.list}>
            <li>Name, email, phone number, and delivery address for order fulfilment</li>
            <li>Order history and customisation preferences</li>
            <li>Payment information (processed securely by Razorpay — we never store card details)</li>
          </ul>
          <p className={styles.text}><strong>What we don't do:</strong></p>
          <ul className={styles.list}>
            <li>We never sell your personal data to third parties</li>
            <li>We never share your information without your consent</li>
            <li>We never store payment card details on our servers</li>
          </ul>
        </div>

        {/* ── CONTACT ── */}
        <div className={`${styles.contactNote} reveal`}>
          <h3>Questions?</h3>
          <p>
            Reach us anytime on{' '}
            <a href="https://wa.me/918431797007" target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
            {' '}or email us at{' '}
            <a href="mailto:hello@bwrworks.com">hello@bwrworks.com</a>.
            We respond within 24 hours.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}
