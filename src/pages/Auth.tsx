import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthActions } from '@convex-dev/auth/react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import styles from './Auth.module.css'

export default function Auth() {
  const navigate = useNavigate()
  const { signIn } = useAuthActions()
  
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Check if we are already logged in to redirect
  // We don't have a specific user query yet, but signIn handles the session.

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    
    try {
      await signIn('resend-otp', { email })
      setStep('otp')
    } catch (err: any) {
      setError("Failed to send code. Make sure your email is valid.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await signIn('resend-otp', { email, code })
      // Login successful
      navigate('/dashboard')
    } catch (err: any) {
      setError("Invalid or expired code. Please try again.")
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
            
            <div className="section-eyebrow" style={{ color: 'var(--orange)' }}>
              IDENTIFICATION
            </div>
            <h1 className={styles.title}>
              ACCESS<br />
              <span className={styles.outline}>PORTAL</span>
            </h1>
            
            {error && <div className={styles.errorBox}>{error}</div>}

            {step === 'email' ? (
              <form className={styles.form} onSubmit={handleRequestOTP}>
                <p className={styles.instruction}>
                  Enter your email address to receive a secure, one-time access code. No passwords required.
                </p>
                <div className={styles.inputGroup}>
                  <label>Email Address</label>
                  <input 
                    required 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="bruce@wayne.com" 
                  />
                </div>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Request Access Code →'}
                </button>
              </form>
            ) : (
              <form className={styles.form} onSubmit={handleVerifyOTP}>
                <p className={styles.instruction}>
                  A 6-character access code was dispatched to <strong>{email}</strong>.
                </p>
                <div className={styles.inputGroup}>
                  <label>Access Code</label>
                  <input 
                    required 
                    type="text" 
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. A1B2C3" 
                    maxLength={6}
                    style={{ letterSpacing: '4px', textTransform: 'uppercase' }}
                  />
                </div>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Verifying...' : 'Authenticate →'}
                </button>
                <p className={styles.resend} onClick={() => setStep('email')}>
                  Didn't receive it? Need to try a different email?
                </p>
              </form>
            )}

          </div>
        </div>

        {/* ── RIGHT: INFO (LIGHT) ── */}
        <div className={styles.rightHalf}>
          <div className={styles.rightContent}>
            <div className="section-eyebrow" style={{ color: 'var(--orange)' }}>CLIENT PROFILE</div>
            <h2 className={styles.infoTitle}>
              YOUR PERSONAL GARAGE
            </h2>
            <div className={styles.perksList}>
              <div className={styles.perk}>
                <h4>Track Production</h4>
                <p>Since our pieces take up to 24 hours to craft, monitor your order's real-time journey from the digital render to physical extrusion.</p>
              </div>
              <div className={styles.perk}>
                <h4>Manage Addresses</h4>
                <p>Securely store your shipping details for rapid checkout on future limited-edition drops.</p>
              </div>
              <div className={styles.perk}>
                <h4>Order Repository</h4>
                <p>View your complete history of commissioned 3D pieces, download invoices, and initiate re-orders.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
      
      <Footer />
    </div>
  )
}
