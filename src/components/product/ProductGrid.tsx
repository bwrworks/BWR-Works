import ProductCard from './ProductCard'
import styles from './ProductGrid.module.css'

// ═══════════════════════════════════════════════════
// BWR WORKS — ProductGrid
// Reusable responsive grid of ProductCards.
// Handles loading skeleton and empty states.
// ═══════════════════════════════════════════════════

interface Product {
  _id: string
  slug: string
  name: string
  category: string
  shortTagline: string
  description: string
  price: number | null
  images: string[]
}

interface ProductGridProps {
  products: Product[] | undefined  // undefined = loading
}

export default function ProductGrid({ products }: ProductGridProps) {
  // Loading state — skeleton
  if (products === undefined) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.skeleton}>
            <div className={styles.skelImg} />
            <div className={styles.skelText} />
            <div className={styles.skelTextSm} />
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No products available yet. Check back soon!</p>
      </div>
    )
  }

  // Products grid
  return (
    <div className={styles.grid}>
      {products.map((p) => (
        <ProductCard
          key={p._id}
          slug={p.slug}
          name={p.name}
          category={p.category}
          shortTagline={p.shortTagline}
          description={p.description}
          price={p.price}
          images={p.images}
        />
      ))}
    </div>
  )
}
