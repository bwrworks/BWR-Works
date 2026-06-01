import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/layout/SEO'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { Mail } from 'lucide-react'
import styles from './Policy.module.css'

export default function Policy() {
  useScrollReveal()

  const policies = [
    {
      id: 'company',
      num: '01',
      title: 'Company Information',
      desc: 'BWR Works operates out of Bengaluru, India. We specialize in custom-made, high-quality personalized items.',
      bullets: [
        'Business Name: BWR Works',
        'Proudly made in Bengaluru, Karnataka, India'
      ]
    },
    {
      id: 'shipping',
      num: '02',
      title: 'Shipping & Delivery',
      desc: 'Every BWR Works piece is crafted individually after your order is confirmed. Since nothing is pre-made, please allow 5–7 business days for crafting.',
      highlight: 'Made to Order · Ships within 7 business days',
      bullets: [
        'Crafting time: 5–7 business days',
        'Shipping via trusted courier partners (Delhivery, DTDC, India Post)',
        'Delivery within 3–5 business days after dispatch',
        'Tracking number provided once your order ships',
        'Free shipping on orders above ₹999',
        'Currently shipping within India only'
      ]
    },
    {
      id: 'returns',
      num: '03',
      title: 'Returns & Exchanges',
      desc: 'Because each piece is custom-made to your exact specifications, we cannot accept returns for change of mind or incorrect customisation details.',
      highlight: 'Custom products · Limited return eligibility',
      subheading: 'We will replace or refund if:',
      bullets: [
        'The product arrives damaged or broken during shipping',
        'The product has a manufacturing defect (layer separation, warping, etc.)',
        'The wrong product or customisation was delivered'
      ],
      footer: 'To initiate a return, contact us within 48 hours of delivery with photos of the issue. We\'ll arrange a replacement or full refund at our discretion.'
    },
    {
      id: 'cancellations',
      num: '04',
      title: 'Cancellations',
      desc: 'Orders can be cancelled within 2 hours of placement if production hasn\'t started. Once crafting begins, cancellation is not possible as the product is custom-made. Refunds for eligible cancellations are processed within 5–7 business days.'
    },
    {
      id: 'privacy',
      num: '05',
      title: 'Privacy Policy',
      desc: 'Your privacy matters to us. We collect only the information necessary to fulfil your order and improve your experience.',
      subheading: 'What we collect vs what we don\'t do:',
      bullets: [
        'Name, email, phone number, and delivery address for order fulfilment',
        'Payment information is processed securely by Razorpay',
        'We never sell your personal data to third parties',
        'We never store payment card details on our servers'
      ]
    }
  ]

  return (
    <div className={styles.page}>
      <SEO 
        title="Shipping, Returns & Privacy Policy | BWR Works" 
        description="Shipping timelines, return policy, and privacy practices for BWR Works. Made to order in Bengaluru, India."
      />
      <Navbar />

      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroInner}>
          <div className="section-eyebrow reveal" style={{ color: 'var(--orange)' }}>
            THE FINE PRINT
          </div>
          <h1 className={`${styles.title} reveal reveal-delay-1`}>
            SHIPPING, RETURNS<br />
            <span className={styles.outlineDark}>& PRIVACY</span>
          </h1>
          <p className={`${styles.subtitle} reveal reveal-delay-2`}>
            Clear, transparent policies for a premium custom experience. No surprises.
          </p>
        </div>
        <div className={styles.heroBg} />
      </div>

      <div className={styles.container}>
        <div className={styles.grid}>
          {policies.map((p, i) => (
            <div key={p.id} className={`${styles.card} reveal reveal-delay-${i % 3}`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>{p.num}</span>
                <h2 className={styles.cardTitle}>{p.title}</h2>
              </div>
              {p.highlight && <div className={styles.highlight}>{p.highlight}</div>}
              <p className={styles.text}>{p.desc}</p>
              
              {p.subheading && <div className={styles.subheading}>{p.subheading}</div>}
              
              {p.bullets && (
                <ul className={styles.list}>
                  {p.bullets.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              )}
              
              {p.footer && <p className={styles.text} style={{ marginTop: '16px', fontStyle: 'italic' }}>{p.footer}</p>}
            </div>
          ))}
        </div>

        {/* ── CONTACT ── */}
        <div className={`${styles.contactNote} reveal`}>
          <div className={styles.contactContent}>
            <h3>Still have questions?</h3>
            <p>
              We're always here to help. Reach us on{' '}
              <a href="https://wa.me/918431797007" target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
              {' '}or email us at{' '}
              <a href="mailto:hello@bwrworks.com">hello@bwrworks.com</a>.
              We aim to respond within 24 hours.
            </p>
          </div>
          <div className={styles.contactVisual}><Mail size={32} /></div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
