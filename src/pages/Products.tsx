import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Ticker from '../components/home/Ticker'
import ProductGrid from '../components/product/ProductGrid'
import SEO from '../components/layout/SEO'
import { useScrollReveal } from '../hooks/useScrollReveal'
import styles from './Products.module.css'

export default function Products() {
  const products = useQuery(api.products.listActive)
  const location = useLocation()
  const navigate = useNavigate()
  useScrollReveal()

  const searchParams = new URLSearchParams(location.search)
  const catFilter = searchParams.get('cat')?.toLowerCase()

  const filteredProducts = products ? (catFilter ? products.filter(p => {
    const cat = p.category.toLowerCase()
    return cat.includes(catFilter) || catFilter.includes(cat) || cat.replace(/\s+/g, '').includes(catFilter)
  }) : products) : undefined

  return (
    <>
      <SEO 
        title="Shop Custom Keychains & Gifts | BWR Works India" 
        description="Explore our premium collection of custom-made pieces, ready to be personalized with your story. Never mass-produced. Made in Bengaluru."
      />
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
                Premium customized objects designed for the moments that matter.
                Each piece crafted exactly to your specifications — never mass-produced.
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
          {/* P-06: Category filter tabs */}
          <div className={`${styles.gridContainer} reveal`}>
            <div className={styles.filterTabs}>
              {[
                { label: 'All', value: '' },
                { label: 'Keychains', value: 'keychain' },
                { label: 'Key Holders', value: 'keyholder' },
                { label: 'Photo Frames', value: 'photoframe' },
              ].map(tab => (
                <button
                  key={tab.value}
                  className={`${styles.filterTab} ${(catFilter ?? '') === tab.value ? styles.filterTabActive : ''}`}
                  onClick={() => navigate(tab.value ? `/products?cat=${tab.value}` : '/products')}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <ProductGrid products={filteredProducts} />
          </div>
        </div>

        <Ticker
          variant="bottom"
          items={[
            'Made With Intention',
            'Precision Crafted',
            'Perfectly Detailed',
            'Ships in 7 Days',
            'Each Piece Unique',
          ]}
        />
        <Footer />
      </div>
    </>
  )
}
