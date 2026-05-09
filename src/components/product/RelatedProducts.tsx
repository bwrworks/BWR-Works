import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import ProductCard from './ProductCard'
import styles from './RelatedProducts.module.css'

interface Props {
  currentSlug: string
  currentCategory: string
}

export default function RelatedProducts({ currentSlug, currentCategory }: Props) {
  const allProducts = useQuery(api.products.listActive)

  if (!allProducts || allProducts.length <= 1) return null

  // Filter out current product
  const others = allProducts.filter(p => p.slug !== currentSlug)

  if (others.length === 0) return null

  // Prioritise same category, then fill with rest
  const sameCategory = others.filter(p => p.category === currentCategory)
  const different = others.filter(p => p.category !== currentCategory)

  // Combine: same category first, then different, limit to 4
  const related = [...sameCategory, ...different].slice(0, 4)

  return (
    <section className={styles.section}>
      <div className={styles.sectionInner}>
        <h2 className={styles.heading}>You May Also Like</h2>
        <p className={styles.subheading}>More handcrafted pieces from our collection</p>
        <div className={styles.grid}>
          {related.map(product => (
            <ProductCard
              key={product._id}
              slug={product.slug}
              name={product.name}
              category={product.category}
              shortTagline={product.shortTagline}
              description={product.description}
              price={product.price}
              images={product.images}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
