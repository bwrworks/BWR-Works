import styles from './Footer.module.css'

export default function Footer() {
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
            Bengaluru, India
          </div>
        </div>
        <div>
          <div className={styles.colTitle}>Collection</div>
          <ul className={styles.links}>
            <li><a href="#products">Customised Keychains</a></li>
            <li><a href="#products">Car Garage Key Holder</a></li>
            <li><a href="#products">Customizable Photo Frames</a></li>
          </ul>
        </div>
        <div>
          <div className={styles.colTitle}>Studio</div>
          <ul className={styles.links}>
            <li><a href="#process">The Craft</a></li>
            <li><a href="#contact">WhatsApp</a></li>
            <li><a href="#contact">Instagram</a></li>
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
