import styles from './Ticker.module.css'

interface TickerProps {
  items: string[]
  variant?: 'top' | 'light' | 'bottom'
}

export default function Ticker({ items, variant = 'top' }: TickerProps) {
  const doubled = [...items, ...items]

  return (
    <div className={`${styles.wrap} ${styles[variant]}`}>
      <div className={`${styles.track} ${variant === 'bottom' ? styles.reverse : ''}`}>
        {doubled.map((item, i) => (
          <span key={i} className={styles.item}>
            {item}
            <span className={styles.dot}>◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}
