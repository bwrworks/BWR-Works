import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

// ═══════════════════════════════════════════════════
// BWR WORKS — Cart Context
// Cart is persisted to localStorage so it survives refreshes.
// Prices are verified server-side before checkout.
// ═══════════════════════════════════════════════════

export interface CostBreakdown {
  material: number; electricity: number; machine: number
  consumables: number; design: number; labour: number
  packaging: number; overheads: number; subtotalCost: number
  riskBuffer: number; trueCost: number; margin: number; sellingPrice: number
}

export interface CartItem {
  id: string
  productId: string
  productSlug: string
  productName: string
  unitPrice: number // paise
  quantity: number
  costBreakdown: CostBreakdown
  customisations: Record<string, string | number | boolean>
  customText?: Record<string, string>
  imageRef?: string
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

const CART_STORAGE_KEY = 'bwr_cart_v1'

const CartContext = createContext<CartContextType | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CartItem[]
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)
  const [isOpen, setIsOpen] = useState(false)

  // Persist to localStorage on every cart change
  useEffect(() => {
    saveCart(items)
  }, [items])

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    setItems((prev) => {
      // If same product + same customisations, increase quantity
      const existingIndex = prev.findIndex(
        (i) =>
          i.productId === newItem.productId &&
          JSON.stringify(i.customisations) === JSON.stringify(newItem.customisations)
      )
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + newItem.quantity,
        }
        return updated
      }
      return [...prev, { ...newItem, id: generateId() }]
    })
    setIsOpen(true)
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
    localStorage.removeItem(CART_STORAGE_KEY)
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
