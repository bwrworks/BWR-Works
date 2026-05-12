import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import styles from './Testimonials.module.css'

export default function Testimonials() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  
  const fetchedReviews = useQuery(api.reviews.getTopReviews)
  
  const testimonials = useMemo(() => {
    if (fetchedReviews && fetchedReviews.length > 0) {
      return fetchedReviews.map((r, index) => ({
        quote: r.reviewText,
        author: r.userName,
        city: '',
        tag: r.productCategory,
        light: index % 2 !== 0,
      }))
    }
    return []
  }, [fetchedReviews])

  const total = testimonials.length

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % total)
  }, [total])

  const goPrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + total) % total)
  }, [total])

  // Auto-advance every 5s
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(goNext, 5000)
    return () => clearInterval(timer)
  }, [goNext, isPaused])

  const t = testimonials[current]

  if (!t) return null

  return (
    <div
      className={styles.section}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles.inner}>
        <div className="section-eyebrow reveal" style={{ color: 'var(--orange)', justifyContent: 'center' }}>
          Real People. Real Reactions.
        </div>
        <div className={styles.headerRow} style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
          <h2 className="section-title reveal" style={{ textAlign: 'center', margin: 0 }}>
            THEY SAID<br />
            <span className="outline">WHAT?</span>
          </h2>
          {/* Nav arrows — desktop */}
          <div className={styles.navDesktop}>
            <button className={styles.navBtn} onClick={goPrev} aria-label="Previous">
              ←
            </button>
            <span className={styles.counter}>
              {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
            <button className={styles.navBtn} onClick={goNext} aria-label="Next">
              →
            </button>
          </div>
        </div>

        {/* ── CAROUSEL ── */}
        <div className={styles.carousel}>
          <div
            key={current}
            className={`${styles.card} ${t.light ? styles.lightCard : styles.darkCard}`}
          >
            <div className={styles.cardTag}>{t.tag}</div>
            <div className={styles.quote}>{t.quote}</div>
            <div className={styles.author}>
              <div className={styles.avatar}>{t.author[0]?.toUpperCase()}</div>
              <div>
                <span className={styles.name}>{t.author}</span>
                {t.city && <span className={styles.city}>{t.city}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ── DOTS ── */}
        <div className={styles.dots}>
          {testimonials.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>

        {/* Nav arrows — mobile */}
        <div className={styles.navMobile}>
          <button className={styles.navBtn} onClick={goPrev} aria-label="Previous">
            ←
          </button>
          <span className={styles.counter}>
            {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <button className={styles.navBtn} onClick={goNext} aria-label="Next">
            →
          </button>
        </div>
      </div>
    </div>
  )
}
