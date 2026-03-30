import styles from './FeaturedDrop.module.css'

export default function FeaturedDrop() {
  return (
    <div id="featured" className={styles.section}>
      <div className={styles.bigText}>DROP 001</div>
      <div className={styles.inner}>
        <div className={`${styles.left} reveal`}>
          <div className={styles.visual}>
            <div className={styles.shape}>
              <div className={styles.shapeInner}>
                <div className={styles.shapeCore} />
              </div>
            </div>
            <div className={styles.tag}>Drop 001</div>
            <div className={styles.limited}>Only 10 available this month</div>
          </div>
        </div>
        <div className={`${styles.right} reveal reveal-delay-1`}>
          <div className="section-eyebrow" style={{ color: 'var(--orange)' }}>
            Featured Drop
          </div>
          <h2 className={styles.title}>
            CAR GARAGE<br />
            <span className={styles.outline}>KEY HOLDER</span>
          </h2>
          <div className={styles.punches}>
            <div className={`${styles.punch} ${styles.punchActive}`}>
              Matte. Black. Permanent.
            </div>
            <div className={`${styles.punch} ${styles.punchActive}`}>
              Your car. Sculpted.
            </div>
            <div className={styles.punch}>
              LED accent lighting. Wall mount.
            </div>
            <div className={styles.punch}>
              Museum quality. Home scale.
            </div>
          </div>
          <div className={styles.priceRow}>
            <div className={styles.price}>₹5,000+</div>
            <div className={styles.priceNote}>
              Starting price<br />
              Custom sizing available
            </div>
          </div>
          <div className={styles.actions}>
            <button className={styles.btnPrimary}>
              Enquire for This Drop →
            </button>
            <button className={styles.btnSecondary}>View Details</button>
          </div>
          <div className={styles.availability}>
            <div className={styles.availDot} />
            <span>7 of 10 units still available · Ships within 7 days</span>
          </div>
        </div>
      </div>
    </div>
  )
}
