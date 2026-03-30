import { Link } from 'react-router-dom'
import { formatPrice } from '../../lib/formatters'
import styles from './ProductCard.module.css'

// ═══════════════════════════════════════════════════
// BWR WORKS — ProductCard
// Reusable card for product grids across the site.
// Renders image (Cloudinary) or fallback geometric shape.
// ═══════════════════════════════════════════════════

const TAG_MAP: Record<string, { class: string; label: string }> = {
  keychain:   { class: 'tagIdentity', label: 'Identity' },
  keyholder:  { class: 'tagPremium',  label: 'Premium' },
  photoframe: { class: 'tagMemory',   label: 'Memory' },
}

interface ProductCardProps {
  slug: string
  name: string
  category: string
  shortTagline: string
  description: string
  price: number | null  // paise from pricing engine
  images: string[]       // Cloudinary URLs
}

export default function ProductCard({
  slug,
  name,
  category,
  shortTagline,
  description,
  price,
  images,
}: ProductCardProps) {
  const tag = TAG_MAP[category] ?? { class: 'tagIdentity', label: category }
  const hasImage = images.length > 0

  return (
    <Link to={`/products/${slug}`} className={styles.card}>
      {/* Dark visual section */}
      <div className={styles.cardVisual}>
        {hasImage ? (
          <img
            src={images[0]}
            alt={name}
            className={styles.cardImage}
            loading="lazy"
          />
        ) : (
          <div className={styles.shape}>
            <div className={styles.shapeInner}>
              <div className={styles.shapeCore} />
            </div>
          </div>
        )}
        <div className={`${styles.cardTag} ${styles[tag.class]}`}>
          {tag.label}
        </div>
      </div>

      {/* Light info section */}
      <div className={styles.cardInfo}>
        <h2 className={styles.cardName}>{name}</h2>
        <p className={styles.cardTagline}>{shortTagline}</p>
        <p className={styles.cardDesc}>
          {description.length > 100 ? description.slice(0, 100) + '...' : description}
        </p>
        <div className={styles.cardFooter}>
          <span className={styles.cardPrice}>
            {price ? `Starting at ${formatPrice(price)}` : 'Custom pricing'}
          </span>
          <span className={styles.cardArrow}>View →</span>
        </div>
      </div>
    </Link>
  )
}
