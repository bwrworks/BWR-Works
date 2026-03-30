import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Hero from '../components/home/Hero'
import Ticker from '../components/home/Ticker'
import BrandStrip from '../components/home/BrandStrip'
import FeaturedProducts from '../components/home/FeaturedProducts'
import FeaturedDrop from '../components/home/FeaturedDrop'
import ProcessSection from '../components/home/ProcessSection'
import Testimonials from '../components/home/Testimonials'
import CtaSection from '../components/home/CtaSection'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function Home() {
  useScrollReveal()

  return (
    <>
      <Navbar />
      <Ticker
        variant="top"
        items={[
          'Made With Intention',
          'Bambu Lab P1S Precision',
          'Black or White — Never Both By Accident',
          '0.12mm Layer Resolution',
          'Designed in India',
          'Premium PLA Matte Finish',
          'Ships in 7 Days',
          'Objects That Mean Something',
        ]}
      />
      <Hero />
      <BrandStrip />
      <FeaturedProducts />
      <Ticker
        variant="light"
        items={[
          'Crafted Not Mass-Made',
          'Premium PLA · Matte Finish',
          'Designed in India',
          'No Two Are The Same',
          'Objects That Mean Something',
          'Your Story · Sculpted',
        ]}
      />
      <FeaturedDrop />
      <div style={{
        width: '100%',
        height: '4px',
        background: 'linear-gradient(to right, var(--orange) 0%, var(--gold) 50%, #6B21FF 100%)'
      }} />
      <ProcessSection />
      <div style={{
        width: '100%',
        height: '4px',
        background: 'linear-gradient(to right, var(--orange) 0%, var(--gold) 50%, #6B21FF 100%)'
      }} />
      <Testimonials />
      <CtaSection />
      <Ticker
        variant="bottom"
        items={[
          'Customised Keychains',
          'Car Garage Key Holder',
          'Photo Frames',
          'Made to Order',
          'Premium Quality',
          'Designed in Bengaluru',
        ]}
      />
      <Footer />
    </>
  )
}
