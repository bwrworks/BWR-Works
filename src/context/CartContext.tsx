import { createContext, useContext, useState, type ReactNode } from 'react'

// ═══════════════════════════════════════════════════
// BWR WORKS — Cart Context
// Client-side cart state. Prices are verified server-side
// before checkout. NEVER trust frontend prices alone.
// ═══════════════════════════════════════════════════

export interface CartItem {
  id: string // Random unique ID for this cart line
  productId: string
  productSlug: string
  productName: string
  // Price displayed (from pricing engine), verified at checkout
  unitPrice: number // paise
  quantity: number
  // Snapshot of user's customisations
  customisations: Record<string, string | number | boolean>
  customText?: Record<string, string>
  // Optional file reference (uploaded separately)
  fileRef?: string
}

interface CartContextType {
  items: CartItem[]
  itemCount: number
  subtotal: number // paise
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    setItems((prev) => [...prev, { ...newItem, id: generateId() }])
    setIsOpen(true) // Open cart drawer when item is added
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    )
  }

  const clearCart = () => {
    setItems([])
    setIsOpen(false)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
