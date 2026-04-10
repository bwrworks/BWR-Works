import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import FeaturedDropPage from './pages/FeaturedDropPage'
import Craft from './pages/Craft'
import Contact from './pages/Contact'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Checkout from './pages/Checkout'
import OrderConfirm from './pages/OrderConfirm'
import OrderTracking from './pages/OrderTracking'
import Invoice from './pages/Invoice'
import CartDrawer from './components/cart/CartDrawer'
import CustomCursor from './components/ui/CustomCursor'
import { AuthGuard } from './components/auth/AuthGuard'
import { AdminGuard } from './components/auth/AdminGuard'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOrders from './pages/admin/AdminOrders'
import AdminCoupons from './pages/admin/AdminCoupons'
import AdminProducts from './pages/admin/AdminProducts'
import AdminContent from './pages/admin/AdminContent'
import AdminInventory from './pages/admin/AdminInventory'
import AdminInquiries from './pages/admin/AdminInquiries'
import PricingCalculator from './pages/admin/PricingCalculator'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from '@vercel/speed-insights/react'
import WhatsAppFloat from './components/ui/WhatsAppFloat'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-transition">
      <Routes location={location}>
        {/* ── PUBLIC ROUTES ── */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/featured-drop" element={<FeaturedDropPage />} />
        <Route path="/the-craft" element={<Craft />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/auth" element={<Auth />} />

        {/* ── CUSTOMER SECURE ROUTES ── */}
        <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
        <Route path="/checkout" element={<AuthGuard><Checkout /></AuthGuard>} />
        <Route path="/order-confirm" element={<AuthGuard><OrderConfirm /></AuthGuard>} />
        <Route path="/order/:orderId" element={<AuthGuard><OrderTracking /></AuthGuard>} />
        <Route path="/invoice/:orderId" element={<AuthGuard><Invoice /></AuthGuard>} />

        {/* ── ADMIN ROUTES (nested under AdminLayout) ── */}
        <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:orderId" element={<AdminOrders />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="inquiries" element={<AdminInquiries />} />
          <Route path="pricing" element={<PricingCalculator />} />
        </Route>
      </Routes>
    </div>
  )
}

function App() {
  return (
    <>
      <AnimatedRoutes />
      {/* Global overlays — available on every page */}
      <CartDrawer />
      <CustomCursor />
      <WhatsAppFloat />
      <Analytics />
      <SpeedInsights />
    </>
  )
}

export default App
