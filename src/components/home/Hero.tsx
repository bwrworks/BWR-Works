import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useCms } from '../../hooks/useCms'
import styles from './Hero.module.css'

export default function Hero() {
  const products = useQuery(api.products.listActive)
  const { cms } = useCms()

  // Pick a random product on each page load (stable for the session)
  const featured = useMemo(() => {
    if (!products || products.length === 0) return null
    const idx = Math.floor(Math.random() * products.length)
    return products[idx]
  }, [products])

  // Pick a random image from the featured product's gallery
  const heroImage = useMemo(() => {
    if (!featured?.images?.length) return null
    const idx = Math.floor(Math.random() * featured.images.length)
    return featured.images[idx]
  }, [featured])

  return (
    <section className={styles.hero}>
      <div className={styles.left}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          <span>{featured ? `Featured — ${featured.name}` : 'Featured — Now Live'}</span>
        </div>
        <h1 className={styles.title}>
          {cms('hero', 'headline', 'Crafted.\nNot Mass-Made.').split('\n').map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {i === 0 ? line : <><span className={styles.accent}>{line.split(' ')[0]}</span><span className={styles.outline}>{line.split(' ').slice(1).join(' ')}</span></>}
            </span>
          ))}
        </h1>
        <p className={styles.sub}>
          {cms('hero', 'subheadline', 'Premium customized objects for the moments that matter most. Memory. Identity. Spirit. Pride. Each piece crafted with intention — never mass-produced, never without purpose.')}
        </p>
        <div className={styles.actions}>
          <a href="#products" className={styles.btnPrimary}>
            {cms('hero', 'cta_text', 'Explore Collection →')}
          </a>
          <a href="#process" className={styles.btnSecondary}>
            See The Process
          </a>
        </div>
        <div className={styles.statBar}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{products?.length ?? '3'}</span>
            <span className={styles.statLabel}>Products Live</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>7</span>
            <span className={styles.statLabel}>Day Delivery</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>100</span>
            <span className={styles.statLabel}>% Custom</span>
          </div>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.productDisplay}>
          <div className={styles.productTag}>Featured Drop</div>
          {heroImage ? (
            <div className={styles.productImageWrap}>
              <img
                src={heroImage}
                alt={featured?.name || 'BWR Works Product'}
                className={styles.productImage}
              />
            </div>
          ) : (
            <div className={styles.productShape}>
              <div className={styles.shapeMain}>
                <div className={styles.shapeInner}>
                  <div className={styles.shapeCore} />
                </div>
              </div>
            </div>
          )}
          <div className={styles.productLabel}>{featured?.name ?? 'Car Garage Key Holder'}</div>
          <div className={styles.productSub}>{featured?.shortTagline ?? 'Matte Black PLA · LED Accent'}</div>
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
