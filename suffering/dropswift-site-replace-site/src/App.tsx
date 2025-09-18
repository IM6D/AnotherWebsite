import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import RequireAuth from './auth/RequireAuth'
import Home from './routes/Home'
import ActivationKeys from './routes/ActivationKeys'
import Devices from './routes/Devices'
import Login from './Login'
import ResetPassword from './routes/ResetPassword'
import { supabaseBrowser as supabase } from './lib/supabase'
import './Nav.css'

function AuthMenu() {
  const [signedIn, setSignedIn] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const client = supabase()
    client.auth.getSession().then(({ data }) => setSignedIn(!!data.session))
    const { data: sub } = client.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])

  const signOut = async () => {
    const client = supabase()
    await client.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="nav-inner">
      <Link to="/home" className="nav-link">Home</Link>
      <Link to="/dashboard/activation-keys" className="nav-link">Activation Keys</Link>
      <Link to="/dashboard/devices" className="nav-link">Devices</Link>
      {signedIn ? (
        <button onClick={signOut} className="nav-button">Sign out</button>
      ) : (
        <Link to="/login" className="nav-link">Login</Link>
      )}
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="nav">
        <AuthMenu />
      </nav>
      <main className="page">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/dashboard/activation-keys" element={<RequireAuth><ActivationKeys /></RequireAuth>} />
          <Route path="/dashboard/devices" element={<RequireAuth><Devices /></RequireAuth>} />

          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<div style={{ padding: 24 }}>404</div>} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}
