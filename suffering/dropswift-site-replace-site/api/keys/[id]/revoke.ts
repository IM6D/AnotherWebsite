import { createClient } from '@supabase/supabase-js'

function supabaseFromReq(req: any) {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) throw new Error('Missing Supabase env vars')

  const auth = req.headers?.authorization || ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : ''

  return createClient(url, anon, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  })
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const id = (req.query?.id ?? '').toString()
  if (!id) return res.status(400).json({ error: 'Missing key id' })

  try {
    const supabase = supabaseFromReq(req)

    // who is calling?
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Unauthorized' })
    const userId = userData.user.id

    // 1) revoke the key (status only)
    const { data: keyRows, error: upErr } = await supabase
      .from('activation_keys')
      .update({ status: 'revoked' })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id') // returns [] if nothing matched
    if (upErr) {
      console.error('revoke key update error', upErr)
      return res.status(400).json({ error: upErr.message })
    }
    if (!keyRows || keyRows.length === 0) {
      return res.status(404).json({ error: 'Key not found' })
    }

    // 2) mark any devices for that key as revoked (devices table still has revoked_at)
    const { error: devErr } = await supabase
      .from('devices')
      .update({ revoked_at: new Date().toISOString() })
      .eq('activation_key_id', id)
      .eq('user_id', userId)
    if (devErr) {
      console.error('revoke devices error', devErr)
      // Non-fatal: key is revoked even if device update failed.
      return res.status(200).json({ ok: true, note: 'Key revoked; failed to update devices' })
    }

    return res.status(200).json({ ok: true })
  } catch (e: any) {
    console.error('revoke handler error', e)
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}
