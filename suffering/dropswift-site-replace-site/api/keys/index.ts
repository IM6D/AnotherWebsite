import { randomBytes, createHash } from 'crypto'
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

  const authHeader: string = req?.headers?.authorization ?? ''
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7)
    : ''

  return createClient(url, anon, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  })
}

function generatePlaintextKey() {
  // Always generate exactly 4 uppercase letters/numbers
  const chunk = () =>
    randomBytes(4).toString('hex').toUpperCase().slice(0, 4);
  
  // Format: DSWIFT-xxxx-xxxx-xxxx-xxxx (total length: 22 chars)
  return `DSWIFT-${chunk()}-${chunk()}-${chunk()}-${chunk()}`;
}

function hashKey(plaintext: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = createHash('sha256').update(`${salt}:${plaintext}`).digest('hex')
  return `${salt}:${hash}`
}
function prefixFromKey(plaintext: string) {
  const m = plaintext.match(/^([A-Z0-9]+-[A-Z0-9]{4})/)
  return m ? m[1] : plaintext.slice(0, 12)
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const supabase = supabaseFromReq(req)
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) return res.status(401).json({ error: 'Unauthorized' })

    const plaintext = generatePlaintextKey()
    const key_hash = hashKey(plaintext)
    const key_prefix = prefixFromKey(plaintext)

    const { error } = await supabase
      .from('activation_keys')
      .insert({ user_id: user.id, key_hash, key_prefix, max_devices: 1 })
    if (error) return res.status(400).json({ error: error.message })

    return res.status(200).json({ plaintext })
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Server error' })
  }
}
