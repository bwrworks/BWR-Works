import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import styles from './Toast.module.css'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ConfirmState {
  message: string
  resolve: (ok: boolean) => void
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
  confirm: (message: string) => Promise<boolean>
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside <ToastProvider>')
  return ctx
}

const ICONS: Record<ToastType, string> = {
  success: '✓', error: '✕', info: 'i', warning: '!',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const timerMap = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    clearTimeout(timerMap.current[id])
    delete timerMap.current[id]
  }, [])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev.slice(-4), { id, type, message }])
    timerMap.current[id] = setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmState({ message, resolve })
    })
  }, [])

  const handleConfirm = (ok: boolean) => {
    confirmState?.resolve(ok)
    setConfirmState(null)
  }

  const ctx: ToastContextValue = {
    toast: addToast,
    success: (m) => addToast(m, 'success'),
    error: (m) => addToast(m, 'error'),
    info: (m) => addToast(m, 'info'),
    warning: (m) => addToast(m, 'warning'),
    confirm,
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}

      {/* ── CONFIRM DIALOG ── */}
      {confirmState && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmBox}>
            <div className={styles.confirmIcon}><AlertTriangle size={32} /></div>
            <p className={styles.confirmMessage}>{confirmState.message}</p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => handleConfirm(false)}>Cancel</button>
              <button className={styles.confirmOk} onClick={() => handleConfirm(true)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST LIST ── */}
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

