import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.left}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          <span>Drop #01 — Now Live</span>
        </div>
        <h1 className={styles.title}>
          Crafted.<br />
          <span className={styles.accent}>Not</span>
          <span className={styles.outline}>Mass-Made.</span>
        </h1>
        <p className={styles.sub}>
          Premium 3D-designed objects for the moments that{' '}
          <strong>matter most.</strong> Memory. Identity. Spirit. Pride.
          Each piece made with intention — never in bulk, never without purpose.
        </p>
        <div className={styles.actions}>
          <a href="#products" className={styles.btnPrimary}>
            Explore Collection →
          </a>
          <a href="#process" className={styles.btnSecondary}>
            See The Process
          </a>
        </div>
        <div className={styles.statBar}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>3</span>
            <span className={styles.statLabel}>Hero Products</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>7</span>
            <span className={styles.statLabel}>Day Delivery</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>0.12</span>
            <span className={styles.statLabel}>mm Precision</span>
          </div>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.productDisplay}>
          <div className={styles.productTag}>Featured Drop</div>
          <div className={styles.productShape}>
            <div className={styles.shapeMain}>
              <div className={styles.shapeInner}>
                <div className={styles.shapeCore} />
              </div>
            </div>
          </div>
          <div className={styles.productLabel}>Car Garage Key Holder</div>
          <div className={styles.productSub}>Matte Black PLA · LED Accent</div>
        </div>
        <div className={styles.rightCorner}>
          BWR — Black &amp; White Rogue<br />
          Premium Functional Design<br />
          Bengaluru, India
        </div>
      </div>
    </section>
  )
}
