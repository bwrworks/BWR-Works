import { useState, useEffect } from 'react'
import { useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useToast } from '../context/ToastContext'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { useScrollReveal } from '../hooks/useScrollReveal'
import styles from './Contact.module.css'

const FAQS = [
  {
    q: 'How long does shipping take?',
    a: 'Every piece is made-to-order. Fabrication takes 14-24 hours depending on the product, and shipping within India typically takes 3-5 business days. Expect your order in 7 days.'
  },
  {
    q: 'Can I request a custom design not on the website?',
    a: 'Yes. Select "Custom Bulk Order / B2B" in the contact form opposite. We regularly design entirely new functional objects for corporate gifting and bulk hospitality orders.'
  },
  {
    q: 'Do you offer returns or refunds?',
    a: 'Because every item is personalised (e.g. your specific car silhouette or number plate), we cannot accept returns unless the item arrived damaged or defective.'
  },
  {
    q: 'What is the material made of? Is it fragile?',
    a: 'We use industrial Matte PLA and PETG. It is highly impact-resistant and feels solid and heavy. However, extreme heat (like leaving it on a car dashboard in the sun) is not recommended for PLA items.'
  }
]

export default function Contact() {
  useScrollReveal()
  const submitInquiry = useMutation(api.inquiries.submitInquiry)
  const sendEmail = useAction(api.notifications.sendContactFormEmail)
  const { error: toastError, success: toastSuccess } = useToast()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'support',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  useEffect(() => {
    window.scrollTo(0, 0)
    
    // Auto-select subject if coming from another page
    const params = new URLSearchParams(window.location.search)
    const subj = params.get('subject')
    if (subj === 'bulk_order' || subj === 'general' || subj === 'support') {
      setFormData(prev => ({ ...prev, subject: subj }))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // 1. Save to database — returns { inquiryId, threadId }
      const result = await submitInquiry({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject as any,
        message: formData.message
      })
      // 2. Send email with thread ID (non-blocking)
      if (result?.threadId) {
        sendEmail({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          subject: formData.subject,
          message: formData.message,
          threadId: result.threadId,
        }).catch(err => console.warn('Email send failed:', err))
      }

      setIsSuccess(true)
      toastSuccess('Message sent! We\'ll reply within 24 hours.')
      setFormData({ name: '', email: '', phone: '', subject: 'support', message: '' })
    } catch (error: any) {
      console.error('Failed to submit inquiry:', error)
      const errMsg = error?.data || 'Something went wrong. Please try again or WhatsApp us.'
      toastError(errMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.splitLayout}>
        
        {/* ── LEFT: FORM (DARK) ── */}
        <div className={styles.leftHalf}>
          <div className={styles.leftContent}>
            <div className="section-eyebrow reveal-left" style={{ color: 'var(--orange)' }}>Start a Conversation</div>
            <h1 className={`${styles.title} reveal-left reveal-delay-1`}>
              GOT SOMETHING<br />
              <span className={styles.outline}>IN MIND?</span>
            </h1>

            {isSuccess ? (
              <div className={styles.successBox}>
                <h3>MESSAGE RECEIVED</h3>
                <p>We've logged your inquiry. Our team will get back to you within 24 hours.</p>
                <button onClick={() => setIsSuccess(false)} className={styles.btnSecondary}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label>Name *</label>
                    <input 
                      required 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Bruce Wayne" 
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Email *</label>
                    <input 
                      required 
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      placeholder="bruce@wayne.com" 
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label>Phone Number (Optional)</label>
                    <input 
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      placeholder="+91" 
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Subject</label>
                    <select
                      value={formData.subject}
                      onChange={e => setFormData({...formData, subject: e.target.value})}
                    >
                      <option value="support">Order Support</option>
                      <option value="bulk_order">Custom Bulk Order / B2B</option>
                      <option value="general">General Question</option>
                    </select>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Message *</label>
                  <textarea 
                    required 
                    rows={5}
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    placeholder="Tell us what you're looking for..." 
                  />
                </div>

                <button 
                  type="submit" 
                  className={styles.submitBtn} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message →'}
                </button>
              </form>
            )}

          </div>
        </div>

        {/* ── RIGHT: FAQS (LIGHT) ── */}
        <div className={styles.rightHalf}>
          <div className={styles.rightContent}>
            <div className="section-eyebrow reveal-right" style={{ color: 'var(--orange)' }}>Need to know</div>
            <h2 className={`${styles.faqTitle} reveal-right reveal-delay-1`}>
              FREQUENTLY ASKED
            </h2>

            <div className={styles.faqList}>
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx
                return (
                  <div key={idx} className={`${styles.faqItem} ${isOpen ? styles.faqOpen : ''}`}>
                    <button 
                      className={styles.faqQuestion} 
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      type="button"
                    >
                      {faq.q}
                      <span className={styles.faqIcon}>{isOpen ? '−' : '+'}</span>
                    </button>
                    <div className={styles.faqAnswer} style={{
                      maxHeight: isOpen ? '200px' : '0',
                      opacity: isOpen ? 1 : 0
                    }}>
                      <div className={styles.faqInner}>{faq.a}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className={styles.directContact}>
              <p>Prefer direct contact?</p>
              <a href="mailto:contact@bwrworks.com" className={styles.contactLink}>contact@bwrworks.com</a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
