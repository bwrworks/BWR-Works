import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConvexReactClient } from 'convex/react'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import App from './App'
import './index.css'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <BrowserRouter>
        <CartProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </CartProvider>
      </BrowserRouter>
    </ConvexAuthProvider>
  </React.StrictMode>
)

