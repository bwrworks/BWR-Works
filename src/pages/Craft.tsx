import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { useCms } from '../hooks/useCms'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import styles from './Craft.module.css'

export default function Craft() {
  useScrollReveal()
  const { cms } = useCms()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className={styles.page}>
      <Navbar />
      
      {/* ── HERO SHIFT (INK) ── */}
      <section className={styles.heroDark}>
        <div className={styles.heroWatermark}>THE<br/>CRAFT</div>
        <div className="container">
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className="section-eyebrow reveal" style={{ color: 'var(--orange)' }}>
                The Process
              </div>
              <h1 className={`${styles.title} reveal reveal-delay-1`}>
                {cms('about', 'title', 'MACHINED.\nREFINED.').split('\n').map((line, i) => (
                  <span key={i}>
                    {i > 0 && <br />}
                    {i > 0 ? <span className={styles.outline}>{line}</span> : line}
                  </span>
                ))}
              </h1>
              <p className={`${styles.description} reveal reveal-delay-2`}>
                {cms('about', 'body', 'We reject the disposable culture of mass manufacturing. Every BWR piece is individually 3D-crafted using industrial-grade materials, taking hours to produce a single perfect unit.')}
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
      </section>

      {/* ── MATERIAL SECTION (LIGHT) ── */}
      <section className={styles.sectionLight}>
        <div className="container">
          <div className={styles.splitGrid}>
            <div className={`${styles.contentBox} reveal`}>
              <h2>The Materials</h2>
              <p>
                We formulate our objects using specialized Matte PLA and PETG blends. These aren't your typical plastics; they are dense, high-impact polymers designed to absorb light, offering an architectural, stone-like finish that feels permanent to the touch.
              </p>
              <ul className={styles.specList}>
                <li><strong>Matte Black PLA:</strong> Deep light absorption, perfect finish.</li>
                <li><strong>Industrial PETG:</strong> High thermal resistance for car interiors.</li>
                <li><strong>100% Solid Infill:</strong> Weighty, premium hand-feel.</li>
              </ul>
            </div>
            <div className={`${styles.visualBox} reveal reveal-delay-1`}>
              <div className={styles.materialCube}>
                <div className={styles.cubeFace} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MACHINE SECTION (INK) ── */}
      <section className={styles.sectionDark}>
        <div className="container">
          <div className={`${styles.splitGrid} ${styles.reversed}`}>
            <div className={`${styles.contentBox} reveal`}>
              <h2>The Precision</h2>
              <p>
                Running on Bambu Lab P1S architecture, our print farm operates at a microscopic <strong>0.12mm layer height</strong>. This obsession with resolution ensures smooth gradients, sharp typography, and flawless geometric angles that factory molds can't replicate without massive waste.
              </p>
              <div className={styles.statsRow}>
                <div className={styles.stat}>
                  <div className={styles.statVal}>0.12</div>
                  <div className={styles.statLabel}>MM PRECISION</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statVal}>14</div>
                  <div className={styles.statLabel}>HOUR PRINT TIME</div>
                </div>
              </div>
            </div>
            <div className={`${styles.visualBox} reveal reveal-delay-1`}>
              <div className={styles.wireframeGrid}>
                {/* Visual abstraction of a tech grid */}
                <div className={styles.gridLineV} />
                <div className={styles.gridLineV} />
                <div className={styles.gridLineV} />
                <div className={styles.gridLineH} />
                <div className={styles.gridLineH} />
                <div className={styles.gridLineH} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ENDING CTA (LIGHT) ── */}
      <section className={styles.sectionLight}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className={styles.ctaTitle}>{cms('about', 'tagline', 'Experience the Craft')}</h2>
          <p className={styles.ctaSub}>Every order is made specifically for you.</p>
          <div className={styles.ctaActions}>
            <Link to="/products" className={styles.btnPrimary}>View Collection →</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
