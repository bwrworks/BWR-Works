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
import SEO from '../components/layout/SEO'
import { useScrollReveal } from '../hooks/useScrollReveal'

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "BWR Works",
  "url": "https://www.bwrworks.com",
  "logo": "https://www.bwrworks.com/favicon.svg",
  "description": "Premium customized keychains, key holders, and photo frames. Precision crafted and personalized to tell your story.",
  "sameAs": [
    "https://instagram.com/bwrworks",
    "https://wa.me/918431797007"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+91-8431797007",
    "contactType": "customer service",
    "availableLanguage": ["English", "Hindi"]
  }
}

export default function Home() {
  useScrollReveal()

  return (
    <>
      <SEO 
        title="BWR Works | Custom High-Quality Gifts & Accessories" 
        description="Premium customized keychains, key holders, and photo frames. Precision crafted and personalized to tell your story."
        schema={organizationSchema}
      />
      <Navbar />
      <Hero />
      <Ticker
        variant="top"
        items={[
          'Made With Intention',
          'Precision Crafted',
          'Black or White — Never Both By Accident',
          'Perfectly Detailed',
          'Designed in India',
          'Premium Matte Finish',
          'Ships in 7 Days',
          'Objects That Mean Something',
        ]}
      />
      <BrandStrip />
      <FeaturedProducts />
      <Ticker
        variant="light"
        items={[
          'Crafted Not Mass-Made',
          'Premium Matte Finish',
          'Designed in India',
          'No Two Are The Same',
          'Objects That Mean Something',
          'Your Story · Sculpted',
        ]}
      />
      <FeaturedDrop />
      <ProcessSection />
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
