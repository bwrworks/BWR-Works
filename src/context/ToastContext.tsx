import { createContext, useContext, useState, useCallback, useRef } from 'react'
import styles from './Toast.module.css'

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

// ─────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside <ToastProvider>')
  return ctx
}

// ─────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────
const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'i',
  warning: '!',
}

// ─────────────────────────────────────────────────
// Provider + Toast List
// ─────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timerMap = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    clearTimeout(timerMap.current[id])
    delete timerMap.current[id]
  }, [])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev.slice(-4), { id, type, message }]) // max 5 at once
    timerMap.current[id] = setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  const ctx: ToastContextValue = {
    toast: addToast,
    success: (m) => addToast(m, 'success'),
    error: (m) => addToast(m, 'error'),
    info: (m) => addToast(m, 'info'),
    warning: (m) => addToast(m, 'warning'),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Toast container — fixed bottom-right */}
      <div className={styles.container} aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
            <div className={styles.icon}>{ICONS[t.type]}</div>
            <span className={styles.message}>{t.message}</span>
            <button className={styles.close} onClick={() => dismiss(t.id)} aria-label="Dismiss">✕</button>
            <div className={styles.progress} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
