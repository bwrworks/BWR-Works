import { useState, useEffect, useCallback } from 'react'
import styles from './Testimonials.module.css'

const testimonials = [
  {
    quote: "The keychain with my bike's number plate is the coolest thing I own. Everyone at my riding group wants one now.",
    author: 'Arjun K.',
    city: 'Bengaluru',
    tag: 'Keychains',
    light: false,
  },
  {
    quote: "Got the key holder as a housewarming gift for my brother. The LED lights up when you pick the keys — his jaw literally dropped.",
    author: 'Priya M.',
    city: 'Mumbai',
    tag: 'Key Holder',
    light: true,
  },
  {
    quote: "Ordered a photo frame for my parents' anniversary. The quality is insane — they thought I got it from some high-end store abroad.",
    author: 'Rohan S.',
    city: 'Hyderabad',
    tag: 'Photo Frame',
    light: false,
  },
  {
    quote: "I run a small car accessories shop. BWR's key holders are my best-selling gift item. Customers love the personalisation.",
    author: 'Nandita R.',
    city: 'Pune',
    tag: 'Key Holder',
    light: true,
  },
  {
    quote: "The attention to detail is unreal. You can feel this isn't factory-made. The matte finish, the weight — everything is premium.",
    author: 'Sneha V.',
    city: 'Delhi',
    tag: 'Keychains',
    light: false,
  },
]

export default function Testimonials() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
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
              <div className={styles.avatar}>{t.author[0]}</div>
              <div>
                <span className={styles.name}>{t.author}</span>
                <span className={styles.city}>{t.city}</span>
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
