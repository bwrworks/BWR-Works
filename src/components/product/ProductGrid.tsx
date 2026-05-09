import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import ProductCard from './ProductCard'
import styles from './ProductGrid.module.css'

// ═══════════════════════════════════════════════════
// BWR WORKS — ProductGrid
// Reusable responsive grid of ProductCards.
// Handles loading skeleton and empty states.
// Now includes star ratings fetched from backend.
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

/** Wrapper to fetch rating for a single product card */
function RatedProductCard({ product }: { product: Product }) {
  const ratingData = useQuery(api.reviews.getAverageRating, {
    productId: product._id as Id<'products'>,
  })

  return (
    <ProductCard
      slug={product.slug}
      name={product.name}
      category={product.category}
      shortTagline={product.shortTagline}
      description={product.description}
      price={product.price}
      images={product.images}
      rating={ratingData?.avg}
      reviewCount={ratingData?.count}
    />
  )
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
        <RatedProductCard key={p._id} product={p} />
      ))}
    </div>
  )
}
