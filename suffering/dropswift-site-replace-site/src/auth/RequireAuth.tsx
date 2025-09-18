import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabaseBrowser as supabase } from '../lib/supabase'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    const client = supabase()
    client.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session)
      setLoading(false)
    })
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>
  if (!hasSession) return <Navigate to="/login" replace />
  return <>{children}</>
}
