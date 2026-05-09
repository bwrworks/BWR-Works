import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import CustomiserPanel from '../components/product/CustomiserPanel'
import ReviewSection from '../components/product/ReviewSection'
import RelatedProducts from '../components/product/RelatedProducts'
import { formatPrice } from '../lib/formatters'
import styles from './ProductDetail.module.css'

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const product = useQuery(api.products.getBySlug, slug ? { slug } : 'skip')
  const [selectedImage, setSelectedImage] = useState(0)

  if (product === undefined) {
    return (
      <>
        <Navbar />
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading product...</span>
        </div>
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className={styles.notFound}>
          <h1>Product Not Found</h1>
          <p>This product doesn't exist or has been removed.</p>
          <Link to="/products" className={styles.backLink}>← Back to Collection</Link>
        </div>
        <Footer />
      </>
    )
  }

  const currentImage = product.images?.[selectedImage] || product.images?.[0]

  return (
    <>
      <Navbar />
      {/* ── BREADCRUMB BAR ── */}
      <div className={styles.breadcrumbBar}>
        <div className={styles.breadcrumb}>
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">Collection</Link>
          <span>/</span>
          <span className={styles.breadcrumbActive}>{product.name}</span>
        </div>
      </div>

      <div className={styles.page}>
        {/* LEFT — DARK Product Visual (50%) */}
        <div className={styles.darkHalf}>
          <div className={styles.visualSticky}>
            <div className={styles.visualBox}>
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.name}
                  className={styles.productImage}
                />
              ) : (
                <div className={styles.shape}>
                  <div className={styles.shapeInner}>
                    <div className={styles.shapeCore} />
                  </div>
                </div>
              )}
            </div>
            {/* Thumbnail gallery for multiple images */}
            {product.images && product.images.length > 1 && (
              <div className={styles.thumbRow}>
                {product.images.map((img, i) => (
                  <div
                    key={i}
                    className={`${styles.thumbItem} ${i === selectedImage ? styles.thumbActive : ''}`}
                    onClick={() => setSelectedImage(i)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSelectedImage(i)}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}
            <div className={styles.visualMeta}>
              <span className={styles.metaStock}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Made to order'}
              </span>
              <span className={styles.metaDot} />
              <span>Ships in 7 days</span>
            </div>
          </div>

          {/* ── INFO PANELS (fill empty dark space below image) ── */}
          <div className={styles.darkInfoPanels}>

            <div className={styles.darkInfoCard}>
              <div className={styles.darkInfoIcon}>🎨</div>
              <div>
                <h3 className={styles.darkInfoTitle}>Handcrafted to Order</h3>
                <p className={styles.darkInfoText}>Every piece is custom-made just for you. No mass production — each item is individually crafted with care and precision.</p>
              </div>
            </div>

            <div className={styles.darkInfoCard}>
              <div className={styles.darkInfoIcon}>🔬</div>
              <div>
                <h3 className={styles.darkInfoTitle}>Premium Materials</h3>
                <p className={styles.darkInfoText}>Made with high-quality PLA and precision-grade 3D printing technology for a flawless finish every time.</p>
              </div>
            </div>

            <div className={styles.darkInfoCard}>
              <div className={styles.darkInfoIcon}>📦</div>
              <div>
                <h3 className={styles.darkInfoTitle}>Ships in 5–7 Days</h3>
                <p className={styles.darkInfoText}>Carefully packaged with premium protective materials. Free shipping on orders over ₹999 across India.</p>
              </div>
            </div>

            <div className={styles.darkInfoCard}>
              <div className={styles.darkInfoIcon}>🛡️</div>
              <div>
                <h3 className={styles.darkInfoTitle}>Quality Guarantee</h3>
                <p className={styles.darkInfoText}>Not happy with your order? We'll remake it or refund you — no questions asked. Your satisfaction is our priority.</p>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT — OFF-WHITE Product Info (50%) */}
        <div className={styles.lightHalf}>
          <div className={styles.categoryBadge}>
            {product.category}
          </div>
          <h1 className={styles.productName}>{product.name}</h1>
          <p className={styles.tagline}>{product.shortTagline}</p>

          <div className={styles.priceBlock}>
            <span className={styles.price}>
              {product.price ? formatPrice(product.price) : 'Custom'}
            </span>
            <span className={styles.priceNote}>incl. GST · Free shipping over ₹999</span>
          </div>

          <div className={styles.divider} />

          <p className={styles.description}>{product.description}</p>

          <div className={styles.emotionalQuote}>
            <span className={styles.quoteIcon}>"</span>
            {product.emotionalAngle}
          </div>

          <div className={styles.divider} />

          {/* Dynamic Customiser (off-white version) */}
          <CustomiserPanel
            config={product.customisationConfig}
            productId={product._id}
            productName={product.name}
            variant="light"
          />

          {/* Reviews Section */}
          <ReviewSection productId={product._id} />
        </div>
      </div>

      {/* ── RELATED PRODUCTS ── */}
      {slug && (
        <RelatedProducts
          currentSlug={slug}
          currentCategory={product.category}
        />
      )}

      <Footer />
    </>
  )
}
