import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import styles from './FeaturedProducts.module.css'

// Tag styling map — category-based
const tagMap: Record<string, { class: string; label: string }> = {
  keychain: { class: 'tagIdentity', label: 'Identity' },
  keyholder: { class: 'tagPremium', label: 'Premium' },
  photoframe: { class: 'tagMemory', label: 'Memory' },
}

// Card background variants (cycle through)
const cardClasses = ['card1', 'card2', 'card3', 'card4']

function formatPrice(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`
}

export default function FeaturedProducts() {
  const products = useQuery(api.products.listActive)

  return (
    <div id="products" className={styles.section}>
      <div className={styles.container}>
        <div className="section-eyebrow reveal">The Collection</div>
        <h2 className="section-title reveal">
          THE COLLECTION.<br />
          <span className="outline">INFINITE STORIES.</span>
        </h2>
        <div className={styles.grid}>
          {products === undefined ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`${styles.card} ${styles.cardSkeleton}`}>
                <div className={styles.skeletonShape} />
                <div className={styles.content}>
                  <div className={styles.skeletonText} />
                  <div className={styles.skeletonTextSm} />
                </div>
              </div>
            ))
          ) : (
            products.map((p, i) => {
              const tag = tagMap[p.category] ?? { class: 'tagIdentity', label: p.category }
              const cardClass = cardClasses[i % cardClasses.length]
              return (
                <a
                  key={p._id}
                  href={`/products/${p.slug}`}
                  className={`${styles.card} ${styles[cardClass]}`}
                >
                  <div className={styles.hoverLine} />
                  <div className={`${styles.tag} ${styles[tag.class]}`}>{tag.label}</div>
                  <div className={styles.bg}>
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div className={styles.shape}>
                        <div className={styles.shapeInner} />
                      </div>
                    )}
                  </div>
                  <div className={styles.content}>
                    <div className={styles.name}>
                      {p.name.split(' ').reduce((acc: string[][], word, idx) => {
                        // Split name into ~2 lines
                        const lineIdx = idx < Math.ceil(p.name.split(' ').length / 2) ? 0 : 1
                        if (!acc[lineIdx]) acc[lineIdx] = []
                        acc[lineIdx].push(word)
                        return acc
                      }, []).map((lineWords, j) => (
                        <span key={j}>{lineWords.join(' ')}<br /></span>
                      ))}
                    </div>
                    <div className={styles.tagline}>{p.shortTagline}</div>
                    <div className={styles.footer}>
                      <span className={styles.price}>
                        {p.price ? `Starting at ${formatPrice(p.price)}` : 'Custom pricing'}
                      </span>
                      <div className={styles.arrow}>→</div>
                    </div>
                  </div>
                </a>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
