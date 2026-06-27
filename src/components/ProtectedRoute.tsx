import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { customer, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="container-page grid min-h-[40vh] place-items-center text-slate-soft">
        Loading…
      </div>
    )
  }
  if (!customer) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return <>{children}</>
}
