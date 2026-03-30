import styles from './BrandStrip.module.css'

export default function BrandStrip() {
  return (
    <div className={styles.strip}>
      <div>
        <div className={styles.title}>BW<span>R</span></div>
        <div className={styles.desc}>
          Black &amp; White Rogue · Premium Functional Design Studio · Bengaluru, India
        </div>
      </div>
      <div className={styles.tags}>
        <div className={styles.tag}>Keychains</div>
        <div className={styles.tag}>Key Holders</div>
        <div className={styles.tag}>Photo Frames</div>
        <div className={styles.tag}>Custom Design</div>
        <div className={styles.tag}>Made to Order</div>
      </div>
    </div>
  )
}
