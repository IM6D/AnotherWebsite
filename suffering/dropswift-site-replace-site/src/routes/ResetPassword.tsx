import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabaseBrowser as supabase } from '@/lib/supabase'

export default function ResetPassword() {
  const nav = useNavigate()
  const [ready, setReady] = useState(false)
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Supabase creates a temporary recovery session when arriving from the email link.
  useEffect(() => {
    let mounted = true
    const client = supabase()
    client.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) setErr(error.message)
      const hasSession = !!data?.session
      setReady(hasSession)
      if (!hasSession) {
        setErr('Recovery link invalid or expired. Request a new password reset from the login page.')
      }
    })
    return () => { mounted = false }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null); setInfo(null)

    if (pw1.length < 6) { setErr('Password must be at least 6 characters.'); return }
    if (pw1 !== pw2) { setErr('Passwords do not match.'); return }

    setBusy(true)
    try {
      const client = supabase()
      const { error } = await client.auth.updateUser({ password: pw1 })
      if (error) throw error
      setInfo('Password updated. Redirecting to sign in…')
      setTimeout(() => nav('/login', { replace: true }), 1200)
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to update password.')
    } finally {
      setBusy(false)
    }
  }

  if (!ready) {
    return (
      <div style={{ padding: 24 }}>
        Checking reset link… {err && <div style={{ color: '#c00' }}>{err}</div>}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 420, margin: '48px auto', padding: 24, border: '1px solid #ddd', borderRadius: 12 }}>
      <h1 style={{ marginBottom: 12 }}>Set a new password</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <input
          type="password" placeholder="New password" value={pw1}
          onChange={e => setPw1(e.target.value)}
          style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }} required
        />
        <input
          type="password" placeholder="Confirm password" value={pw2}
          onChange={e => setPw2(e.target.value)}
          style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }} required
        />
        {err && <div style={{ color: '#c00', fontSize: 14 }}>{err}</div>}
        {info && <div style={{ color: '#08660b', fontSize: 14 }}>{info}</div>}
        <button disabled={busy} style={{ padding: 10, borderRadius: 8, background: busy ? '#666' : '#000', color: '#fff' }}>
          {busy ? 'Please wait…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
