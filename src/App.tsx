import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import FeaturedDropPage from './pages/FeaturedDropPage'
import Craft from './pages/Craft'
import Contact from './pages/Contact'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import CartDrawer from './components/cart/CartDrawer'
import CustomCursor from './components/ui/CustomCursor'
import { AuthGuard } from './components/auth/AuthGuard'
import { AdminGuard } from './components/auth/AdminGuard'
import PricingCalculator from './pages/admin/PricingCalculator'
import { Analytics } from "@vercel/analytics/next"

function App() {
  return (
    <>
      <Routes>
        {/* ── PUBLIC ROUTES ── */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/featured-drop" element={<FeaturedDropPage />} />
        <Route path="/the-craft" element={<Craft />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* ── SECURE ROUTES ── */}
        <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
        
        {/* ── ADMIN ROUTES ── */}
        {/* ── FUNC ROUTES ── */}
        <Route path="/admin/pricing" element={<AdminGuard><PricingCalculator /></AdminGuard>} />
      </Routes>

      {/* Cart drawer available on every page */}
      <CartDrawer />
      <CustomCursor />
      <Analytics />
    </>
  )
}

export default App
