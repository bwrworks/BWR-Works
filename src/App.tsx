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
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>

      {/* Cart drawer available on every page */}
      <CartDrawer />
    </>
  )
}

export default App
