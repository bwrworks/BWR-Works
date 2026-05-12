import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/layout/SEO'
import CustomiserPanel from '../components/product/CustomiserPanel'
import ReviewSection from '../components/product/ReviewSection'
import RelatedProducts from '../components/product/RelatedProducts'
import { formatPrice } from '../lib/formatters'
import styles from './ProductDetail.module.css'

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const product = useQuery(api.products.getBySlug, slug ? { slug } : 'skip')
  
  // Fetch pristine base price from pricing engine
  const pricingData = useQuery(
    api.pricing.getProductPrice,
    product ? { productId: product._id } : 'skip'
  )
  const basePrice = pricingData?.unitPrice ?? 0

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
        <SEO title="Product Not Found | BWR Works" description="This product does not exist." />
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

  const handleShare = async () => {
    const shareData = {
      title: `${product.name} | BWR Works`,
      text: `Check out this custom ${product.name} at BWR Works!\n\n${product.shortTagline}`,
      url: window.location.href,
    }
    
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
        alert('Link copied to clipboard!')
      }
    } catch (err) {
      // Share failed silently
    }
  }

  // Generate JSON-LD Schema for Google Rich Results
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images || [],
    "description": product.description,
    "sku": product._id,
    "brand": {
      "@type": "Brand",
      "name": "BWR Works"
    },
    "offers": {
      "@type": "Offer",
      "url": typeof window !== 'undefined' ? window.location.href : '',
      "priceCurrency": "INR",
      "price": basePrice ? (basePrice / 100).toFixed(2) : "162.00",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      "itemCondition": "https://schema.org/NewCondition"
    }
  }

  return (
    <>
      <SEO 
        title={`${product.name} | BWR Works`}
        description={product.description}
        image={currentImage}
        schema={productSchema}
      />
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
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const shape = e.currentTarget.parentElement?.querySelector(`.${styles.shape}`) as HTMLElement;
                    if (shape) shape.style.display = '';
                  }}
                />
              ) : null}
              {/* Placeholder shape — hidden when image loads, shown on error */}
              <div className={styles.shape} style={currentImage ? { display: 'none' } : undefined}>
                <div className={styles.shapeInner}>
                  <div className={styles.shapeCore} />
                </div>
              </div>
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
                <p className={styles.darkInfoText}>Made with high-quality, dense polymers formulated for an architectural finish. A flawless look that feels permanent to the touch.</p>
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
          <div className={styles.titleRow}>
            <h1 className={styles.productName}>{product.name}</h1>
            <button className={styles.shareBtn} onClick={handleShare} aria-label="Share product">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </button>
          </div>
          <p className={styles.tagline}>{product.shortTagline}</p>

          <div className={styles.priceBlock}>
            <span className={styles.price}>
              {basePrice ? formatPrice(basePrice) : 'Custom'}
            </span>
            <span className={styles.priceNote}>incl. GST · Free shipping over ₹999</span>
          </div>

          <div className={styles.divider} />

          <p className={styles.description}>{product.description}</p>

          <div className={styles.emotionalQuote}>
            <span className={styles.quoteIcon}>"</span>
            {product.emotionalAngle}
          </div>

          {/* Specifications Table (UX-10) */}
          {product.specifications && typeof product.specifications === 'object' && Object.keys(product.specifications).length > 0 && (
            <div className={styles.specsSection}>
              <h3 className={styles.specsTitle}>Specifications</h3>
              <table className={styles.specsTable}>
                <tbody>
                  {Object.entries(product.specifications as Record<string, string>).map(([key, value]) => (
                    <tr key={key}>
                      <td className={styles.specLabel}>{key}</td>
                      <td className={styles.specValue}>{String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className={styles.divider} />

          {/* Dynamic Customiser (off-white version) */}
          <CustomiserPanel
            config={product.customisationConfig}
            productId={product._id}
            productName={product.name}
            productSlug={product.slug}
            image={product.images?.[0]}
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
