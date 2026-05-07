import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Ticker from '../components/home/Ticker'
import ProductGrid from '../components/product/ProductGrid'
import { useScrollReveal } from '../hooks/useScrollReveal'
import styles from './Products.module.css'

export default function Products() {
  const products = useQuery(api.products.listActive)
  useScrollReveal()

  return (
    <>
      <Navbar />
      <div>
        <Ticker
          variant="top"
          items={[
            'Customised Keychains',
            'Car Garage Key Holder',
            'Photo Frames',
            'Made to Order',
            'Premium Quality',
            'Designed in Bengaluru',
          ]}
        />

        {/* ── DARK HEADER (Top 50%) ── */}
        <div className={styles.darkSection}>
          <div className={styles.watermark}>THE<br/>COLLEC<br/>TION</div>
          <div className={styles.headerInner}>
            <div className={styles.heroContent}>
              <div className="section-eyebrow reveal" style={{ color: 'var(--orange)' }}>
                Our Collection
              </div>
              <h1 className={`${styles.title} reveal reveal-delay-1`}>
                EVERY PIECE<br />
                <span className={styles.outlineDark}>TELLS A STORY.</span>
              </h1>
              <p className={`${styles.subtitleDark} reveal reveal-delay-2`}>
                Premium 3D-designed objects crafted with Bambu Lab P1S precision.
                Each piece made to order — never mass-produced.
              </p>
            </div>
            <div className={`${styles.heroVisual} reveal reveal-delay-1`}>
              <div className={styles.shapeContainer}>
                <div className={styles.shapeMain}>
                  <div className={styles.shapeInner}>
                    <div className={styles.shapeCore} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── OFF-WHITE PRODUCTS GRID (Bottom 50%) ── */}
        <div className={styles.lightSection}>
          <div className={`${styles.gridContainer} reveal`}>
            <ProductGrid products={products} />
          </div>
        </div>

        <Ticker
          variant="bottom"
          items={[
            'Made With Intention',
            'Bambu Lab P1S Precision',
            '0.12mm Layer Resolution',
            'Ships in 7 Days',
            'Each Piece Unique',
          ]}
        />
        <Footer />
      </div>
    </>
  )
}
