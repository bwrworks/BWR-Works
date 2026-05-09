import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import styles from './Testimonials.module.css'

const DEFAULT_TESTIMONIALS = [
  {
    quote: "Got my bike's number plate on a keychain. It's solid, looks premium, and now everyone in my riding group keeps asking where I got it.",
    author: 'Arjun K.',
    city: 'Bengaluru',
    tag: 'Keychains',
    light: false,
  },
  {
    quote: "Gifted the key holder for a housewarming. The way the LED lights up when you grab the keys is such a neat touch. They loved it.",
    author: 'Priya M.',
    city: 'Mumbai',
    tag: 'Key Holder',
    light: true,
  },
  {
    quote: "The photo frame was for my parents' anniversary. It feels so well-made, definitely doesn't look like your usual store-bought stuff.",
    author: 'Rohan S.',
    city: 'Hyderabad',
    tag: 'Photo Frame',
    light: false,
  },
  {
    quote: "I keep a few of these in my auto accessories shop. They always sell out quickly because the finish is just that good.",
    author: 'Nandita R.',
    city: 'Pune',
    tag: 'Key Holder',
    light: true,
  },
  {
    quote: "You can really tell these are made with care. The weight is perfect and the matte finish gives it a very clean look.",
    author: 'Sneha V.',
    city: 'Delhi',
    tag: 'Keychains',
    light: false,
  },
]

export default function Testimonials() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  
  const fetchedReviews = useQuery(api.reviews.getTopReviews)
  
  const testimonials = useMemo(() => {
    if (fetchedReviews && fetchedReviews.length > 0) {
      return fetchedReviews.map((r, index) => ({
        quote: r.reviewText,
        author: r.userName,
        city: '', // User location isn't stored in reviews currently
        tag: r.productCategory,
        light: index % 2 !== 0, // Alternate dark/light cards
      }))
    }
    return DEFAULT_TESTIMONIALS
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
