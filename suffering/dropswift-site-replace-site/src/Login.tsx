import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabaseBrowser as supabase } from './lib/supabase'

export default function Login() {
  const nav = useNavigate()
  const [mode, setMode] = useState<'signin'|'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [info, setInfo] = useState<string|null>(null)
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let mounted = true
    const client = supabase()
    client.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (data.session) nav('/dashboard/activation-keys', { replace: true })
      else setChecking(false)
    })
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (session) nav('/dashboard/activation-keys', { replace: true })
    })
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [nav])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(null); setInfo(null)
    const client = supabase()
    try {
      if (mode === 'signin') {
        const { error } = await client.auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message || 'Unable to sign in')
        nav('/dashboard/activation-keys', { replace: true })
      } else {
        const { data, error } = await client.auth.signUp({ email, password })
        if (error) {
          if (error.message?.toLowerCase().includes('already'))
            throw new Error('This email already has an account. Please sign in.')
          throw new Error(error.message || 'Unable to sign up')
        }
        if (data.user && data.session) nav('/dashboard/activation-keys', { replace: true })
        else setInfo('Check your email to confirm your account, then sign in.')
      }
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const onForgotPassword = async () => {
    setError(null); setInfo(null)
    if (!email) { setError('Enter your email first, then click “Forgot password?”.'); return }
    const redirectTo = `${window.location.origin}/reset-password`
    const client = supabase()
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) setError(error.message || 'Failed to send reset email')
    else setInfo('If an account exists for that email, a reset link has been sent.')
  }

  if (checking) return <div style={{ padding: 16 }}>Loading…</div>

  return (
    <div style={{maxWidth:420, margin:'48px auto', padding:24, border:'1px solid #ddd', borderRadius:12}}>
      <h1 style={{marginBottom:12}}>{mode === 'signin' ? 'Sign in' : 'Create account'}</h1>
      <form onSubmit={onSubmit} style={{display:'grid', gap:12}}>
        <input
          type="email" placeholder="Email"
          value={email} onChange={e=>setEmail(e.target.value)}
          style={{padding:10, border:'1px solid #ccc', borderRadius:8}} required
        />

        <div style={{display:'grid', gap:6}}>
          <div style={{display:'flex', gap:8}}>
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={password} onChange={e=>setPassword(e.target.value)}
              style={{flex:1, padding:10, border:'1px solid #ccc', borderRadius:8}} required
            />
            <button
              type="button"
              onClick={()=>setShowPw(s => !s)}
              style={{padding:'0 12px', borderRadius:8, border:'1px solid #ccc', background:'#f7f7f7', cursor:'pointer'}}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              title={showPw ? 'Hide' : 'Show'}
            >
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>

          {mode === 'signin' && (
            <button
              type="button"
              onClick={onForgotPassword}
              style={{alignSelf:'flex-start', border:'none', background:'transparent', color:'#06c', cursor:'pointer', padding:0}}
            >
              Forgot password?
            </button>
          )}
        </div>

        {error && <div style={{color:'#c00', fontSize:14}}>{error}</div>}
        {info && <div style={{color:'#08660b', fontSize:14}}>{info}</div>}

        <button disabled={busy} style={{padding:10, borderRadius:8, background: busy ? '#666' : '#000', color:'#fff'}}>
          {busy ? 'Please wait…' : (mode === 'signin' ? 'Sign in' : 'Sign up')}
        </button>
      </form>

      <div style={{marginTop:12, fontSize:14}}>
        {mode === 'signin' ? (
          <>No account?{' '}
            <button onClick={()=>{ setMode('signup'); setError(null); setInfo(null) }}
              style={{border:'none', background:'transparent', color:'#06c', cursor:'pointer'}}>Sign up</button>
          </>
        ) : (
          <>Already have an account?{' '}
            <button onClick={()=>{ setMode('signin'); setError(null); setInfo(null) }}
              style={{border:'none', background:'transparent', color:'#06c', cursor:'pointer'}}>Sign in</button>
          </>
        )}
      </div>
    </div>
  )
}
