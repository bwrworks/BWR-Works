import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Navigate } from 'react-router-dom'
import { useConvexAuth } from 'convex/react'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth()
  const user = useQuery(api.users.current)

  if (isAuthLoading || user === undefined) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--white)' }}>
        <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />
  }

  if (user.role !== 'admin') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--white)', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--ink)' }}>ACCESS DENIED</h1>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginTop: '16px' }}>Requires Administrator Privileges.</p>
      </div>
    )
  }

  return <>{children}</>
}
