import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useScrollReveal } from '../hooks/useScrollReveal'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import styles from './FeaturedDropPage.module.css'

export default function FeaturedDropPage() {
  useScrollReveal()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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
                CAR GARAGE<br />
                <span className={styles.outline}>KEY HOLDER</span>
              </h1>
              <p className={styles.description}>
                Museum-quality scale meets everyday utility. The Drop 001 Car Garage Key Holder features permanent matte black PLA, edge-lit LED accents, and enough presence to anchor an entire room.
              </p>
              <div className={styles.tags}>
                <span className={styles.chip}>Matte Black PLA</span>
                <span className={styles.chip}>0.12mm Precision</span>
                <span className={styles.chip}>LED Capable</span>
              </div>
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
      </section>

      {/* ── BOTTOM: LIGHT DETAILS ── */}
      <section className={styles.detailsLight}>
        <div className="container">
          <div className={styles.detailsGrid}>
            
            {/* Scarcity / Price */}
            <div className={`${styles.pricingBox} reveal`}>
              <h3 className={styles.boxTitle}>Investment</h3>
              <div className={styles.priceRow}>
                <div className={styles.price}>₹5,000+</div>
                <div className={styles.priceNote}>
                  Starting price<br />
                  Custom sizing available
                </div>
              </div>
              <div className={styles.availability}>
                <div className={styles.availProgress}>
                  <div className={styles.availBar} style={{ width: '70%' }} />
                </div>
                <div className={styles.availText}>
                  <strong>7 / 10</strong> Units Available This Month
                </div>
              </div>
              
              <Link to="/contact?subject=bulk_order" className={styles.btnPrimary}>
                Enquire For Drop 001 →
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
                <p>Designed to be seen from across the room. While most key holders blend into the wall, the Garage demands attention and anchors your entryway.</p>
              </div>
              <div className={styles.specItem}>
                <h4>The Customisation</h4>
                <p>Every order is tailored to your specific vehicle profile. Our design team models your car's exact silhouette and number plate before the 14-hour crafting process begins.</p>
              </div>
            </div>

          </div>

          <div className={`${styles.divider} reveal`}></div>

          {/* New Content: The Process */}
          <div className={styles.processSection}>
            <div className={`${styles.processHeader} reveal`}>
              <h3 className={styles.boxTitle}>Acquisition Process</h3>
              <p className={styles.processSub}>Due to the bespoke nature of Drop 001, each piece follows a strict timeline.</p>
            </div>
            
            <div className={styles.processSteps}>
              <div className={`${styles.step} reveal`}>
                <div className={styles.stepNum}>01</div>
                <h4>Consultation</h4>
                <p>We discuss your vehicle model and specific customization requirements.</p>
              </div>
              <div className={`${styles.step} reveal reveal-delay-1`}>
                <div className={styles.stepNum}>02</div>
                <h4>Digital Sculpting</h4>
                <p>Our artists create a custom digital profile of your vehicle, matching the exact aesthetic of the Drop.</p>
              </div>
              <div className={`${styles.step} reveal reveal-delay-2`}>
                <div className={styles.stepNum}>03</div>
                <h4>Fabrication</h4>
                <p>A continuous 14-hour manufacturing process on our precision architecture arrays.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  )
}
