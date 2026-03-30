import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useConvexAuth } from 'convex/react'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount, setIsOpen } = useCart()
  const location = useLocation()
  const { isAuthenticated } = useConvexAuth()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on page change
  useEffect(() => {
    setMobileOpen(false)
  }, [location])

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <Link to="/" className={styles.logo}>
        BW<span className={styles.logoAccent}>R</span>
      </Link>

      <ul className={`${styles.links} ${mobileOpen ? styles.linksOpen : ''}`}>
        <li><Link to="/products" onClick={() => setMobileOpen(false)}>Collection</Link></li>
        <li><Link to="/featured-drop" onClick={() => setMobileOpen(false)}>Featured Drop</Link></li>
        <li><Link to="/the-craft" onClick={() => setMobileOpen(false)}>The Craft</Link></li>
        <li><Link to="/contact" onClick={() => setMobileOpen(false)}>Contact</Link></li>
      </ul>

      <div className={styles.actions}>
        {isAuthenticated ? (
          <Link to="/dashboard" className={styles.navLink}>Dashboard</Link>
        ) : (
          <Link to="/auth" className={styles.navLink}>Login</Link>
        )}
        {/* Cart button */}
        <button
          className={styles.cartBtn}
          onClick={() => setIsOpen(true)}
          aria-label="Open cart"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          {itemCount > 0 && (
            <span className={styles.cartBadge}>{itemCount}</span>
          )}
        </button>

        {/* Enquire CTA */}
        <Link to="/#contact" className={styles.cta}>Enquire Now</Link>

        {/* Mobile burger */}
        <button
          className={styles.burger}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`${styles.burgerLine} ${mobileOpen ? styles.burgerOpen : ''}`} />
          <span className={`${styles.burgerLine} ${mobileOpen ? styles.burgerOpen : ''}`} />
        </button>
      </div>
    </nav>
  )
}
