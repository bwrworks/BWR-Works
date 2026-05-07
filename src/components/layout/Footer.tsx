import { Link } from 'react-router-dom'
import { useCms } from '../../hooks/useCms'
import styles from './Footer.module.css'

export default function Footer() {
  const { cms } = useCms()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <div className={styles.brandName}>
            BW<span>R</span>
          </div>
          <div className={styles.tagline}>
            Black &amp; White Rogue<br />
            Premium Functional Design Studio<br />
            {cms('footer', 'address', 'Bengaluru, India')}
          </div>
        </div>
        <div>
          <div className={styles.colTitle}>Collection</div>
          <ul className={styles.links}>
            <li><Link to="/products">All Products</Link></li>
            <li><Link to="/products?cat=keychain">Customised Keychains</Link></li>
            <li><Link to="/products?cat=keyholder">Car Garage Key Holder</Link></li>
            <li><Link to="/products?cat=photoframe">Photo Frames</Link></li>
          </ul>
        </div>
        <div>
          <div className={styles.colTitle}>Studio</div>
          <ul className={styles.links}>
            <li><Link to="/the-craft">The Craft</Link></li>
            <li><Link to="/featured-drop">Featured Drop</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
          </ul>
        </div>
        <div>
          <div className={styles.colTitle}>Connect</div>
          <ul className={styles.links}>
            <li><a href={`https://wa.me/${cms('footer', 'phone', '918431797007').replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp Us</a></li>
            <li><a href={cms('footer', 'instagram', 'https://instagram.com/bwrworks')} target="_blank" rel="noopener noreferrer">Instagram</a></li>
            <li><Link to="/dashboard">My Account</Link></li>
          </ul>
        </div>
      </div>
      <div className={styles.bottom}>
        <span className={styles.copy}>© 2026 BWR — Black &amp; White Rogue. All rights reserved.</span>
        <span className={styles.copy}>Crafted with intention. Never mass-made.</span>
      </div>
    </footer>
  )
}

