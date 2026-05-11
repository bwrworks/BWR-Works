import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useScrollReveal } from '../hooks/useScrollReveal'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { formatPrice } from '../lib/formatters'
import styles from './FeaturedDropPage.module.css'

export default function FeaturedDropPage() {
  useScrollReveal()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // B-06: Pull featured product from DB instead of hardcoding
  const products = useQuery(api.products.listActive)
  const featured = products?.find((p: any) => p.isFeatured) ?? products?.[0]

  return (
    <div className={styles.page}>
      <Navbar />
      
      {/* ── TOP: DARK HERO ── */}
      <section className={styles.heroDark}>
        <div className={styles.heroWatermark}>DROP<br/>001</div>
        <div className="container">
          <div className={styles.heroGrid}>
            <div className={`${styles.heroContent} reveal`}>
              <div className="section-eyebrow" style={{ color: 'var(--orange)' }}>
                Limited Release
              </div>
              <h1 className={styles.title}>
                {featured ? (
                  <>
                    {featured.name.split(' ').slice(0, 2).join(' ')}<br />
                    <span className={styles.outline}>
                      {featured.name.split(' ').slice(2).join(' ') || 'EDITION'}
                    </span>
                  </>
                ) : (
                  <>FEATURED<br /><span className={styles.outline}>DROP</span></>
                )}
              </h1>
              <p className={styles.description}>
                {featured?.description || 'Loading featured product...'}
              </p>
              <div className={styles.tags}>
                {featured?.category && <span className={styles.chip}>{featured.category}</span>}
                <span className={styles.chip}>Made to Order</span>
                <span className={styles.chip}>Premium Finish</span>
              </div>
            </div>
            
            <div className={`${styles.heroVisual} reveal reveal-delay-1`}>
              <div className={styles.shapeContainer}>
                {featured?.images?.[0] ? (
                  <img
                    src={featured.images[0]}
                    alt={featured?.name || 'Featured Product'}
                    className={styles.shapeMain}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                  />
                ) : (
                  <div className={styles.shapeMain}>
                    <div className={styles.shapeInner}>
                      <div className={styles.shapeCore} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM: LIGHT DETAILS ── */}
      <section className={styles.detailsLight}>
        <div className="container">
          <div className={styles.detailsGrid}>
            
            {/* Scarcity / Price */}
            <div className={`${styles.pricingBox} reveal`}>
              <h3 className={styles.boxTitle}>Investment</h3>
              <div className={styles.priceRow}>
                <div className={styles.price}>
                  {featured?.price ? formatPrice(featured.price) : 'Custom'}
                </div>
                <div className={styles.priceNote}>
                  Starting price<br />
                  Custom sizing available
                </div>
              </div>
              <div className={styles.availability}>
                <div className={styles.availProgress}>
                  <div
                    className={styles.availBar}
                    style={{
                      width: featured?.stock
                        ? `${Math.min(100, (featured.stock / 10) * 100)}%`
                        : '70%'
                    }}
                  />
                </div>
                <div className={styles.availText}>
                  <strong>{featured?.stock ?? '—'}</strong> Units Available
                </div>
              </div>
              
              <Link
                to={featured ? `/products/${featured.slug}` : '/products'}
                className={styles.btnPrimary}
              >
                {featured ? `Shop ${featured.name} →` : 'Browse Collection →'}
              </Link>
            </div>

            {/* Spec Details */}
            <div className={`${styles.specsBox} reveal`}>
              <div className={styles.specItem}>
                <h4>The Material</h4>
                <p>Manufactured from high-grade industrial polymers, offering a dense, matte finish that refuses to reflect glare. It feels substantial, permanent, and architectural.</p>
              </div>
              <div className={styles.specItem}>
                <h4>The Scale</h4>
                <p>Designed to be seen from across the room. While most products blend into the background, every BWR Works piece demands attention and anchors your space.</p>
              </div>
              <div className={styles.specItem}>
                <h4>The Customisation</h4>
                <p>Every order is tailored to your specifications. Our design team models your exact requirements before the precision crafting process begins.</p>
              </div>
            </div>

          </div>

          <div className={`${styles.divider} reveal`}></div>

          {/* The Process */}
          <div className={styles.processSection}>
            <div className={`${styles.processHeader} reveal`}>
              <h3 className={styles.boxTitle}>Acquisition Process</h3>
              <p className={styles.processSub}>Due to the bespoke nature of each piece, every order follows a strict timeline.</p>
            </div>
            
            <div className={styles.processSteps}>
              <div className={`${styles.step} reveal`}>
                <div className={styles.stepNum}>01</div>
                <h4>Consultation</h4>
                <p>We discuss your specific customization requirements.</p>
              </div>
              <div className={`${styles.step} reveal reveal-delay-1`}>
                <div className={styles.stepNum}>02</div>
                <h4>Digital Sculpting</h4>
                <p>Our artists create a custom digital profile matching your exact aesthetic.</p>
              </div>
              <div className={`${styles.step} reveal reveal-delay-2`}>
                <div className={styles.stepNum}>03</div>
                <h4>Fabrication</h4>
                <p>A continuous precision manufacturing process on our architecture arrays.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  )
}
