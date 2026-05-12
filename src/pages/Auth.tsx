import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthActions } from '@convex-dev/auth/react'
import { useConvexAuth } from 'convex/react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import styles from './Auth.module.css'

export default function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuthActions()
  const { isAuthenticated, isLoading } = useConvexAuth()
  
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // CC-04: Detect if user was redirected from checkout
  const searchParams = new URLSearchParams(location.search)
  const fromCheckout = searchParams.get('redirect') === '/checkout'

  // Determine where to redirect after login
  const redirectTo = (location.state as any)?.from?.pathname || '/dashboard'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // ⚡ KEY FIX: If the user is already authenticated (e.g. after Google OAuth
  // callback or switching users), redirect immediately to dashboard.
  // This also fixes the "Login button stays after signing in" bug.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(redirectTo, { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo])

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
              WELCOME BACK
            </div>
            <h1 className={styles.title}>
              SIGN<br />
              <span className={styles.outline}>IN</span>
            </h1>

            {/* CC-04: Checkout redirect context */}
            {fromCheckout && (
              <div style={{
                marginBottom: 20, padding: '14px 18px',
                background: 'rgba(255,92,26,0.08)',
                border: '1px solid rgba(255,92,26,0.2)',
                borderRadius: 4,
                fontFamily: 'var(--font-body)', fontSize: '0.85rem',
                color: 'var(--off-white)', lineHeight: 1.6,
              }}>
                Almost there — sign in to complete your order. Your cart is saved and will be ready after sign in.
              </div>
            )}
            
            {error && <div className={styles.errorBox}>{error}</div>}

            {step === 'email' ? (
              <div className={styles.formWrapper}>
                <button 
                  type="button" 
                  className={styles.googleBtn} 
                  onClick={() => signIn('google')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
                
                <div className={styles.divider}>
                  <span>OR</span>
                </div>

                <form className={styles.form} onSubmit={handleRequestOTP}>
                  <p className={styles.instruction}>
                    Enter your email address to receive a secure, one-time access code.
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
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleVerifyOTP}>
                <p className={styles.instruction}>
                  We sent a 6-character code to <strong>{email}</strong>.
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
                  Didn&apos;t receive it? Need to try a different email?
                </p>
              </form>
            )}
          </div>
        </div>

        {/* ── RIGHT: INFO (LIGHT) ── */}
        <div className={styles.rightHalf}>
          <div className={styles.rightContent}>
            <div className="section-eyebrow" style={{ color: 'var(--orange)' }}>YOUR ACCOUNT</div>
            <h2 className={styles.infoTitle}>
              YOUR PERSONAL DASHBOARD
            </h2>
            <div className={styles.perksList}>
              <div className={styles.perk}>
                <h4>Track Your Orders</h4>
                <p>Since our pieces take up to 24 hours to craft, follow your order's journey from design to delivery.</p>
              </div>
              <div className={styles.perk}>
                <h4>Manage Addresses</h4>
                <p>Securely store your shipping details for faster checkout on future orders.</p>
              </div>
              <div className={styles.perk}>
                <h4>Order History</h4>
                <p>View your past orders, download invoices, and reorder your favourite pieces.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
      
      <Footer />
    </div>
  )
}
