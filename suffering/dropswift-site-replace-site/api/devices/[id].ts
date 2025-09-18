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

export default async function handler(req: any, res: any) {
  if (req.method !== 'DELETE') return res.status(405).end()
  const id = (req.query?.id as string) || ''
  try {
    const supabase = supabaseFromReq(req)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ ok: true })
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Server error' })
  }
}
