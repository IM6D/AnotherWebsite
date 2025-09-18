import React, { useEffect, useState } from 'react'
import RequireAuth from '@/auth/RequireAuth'
import { supabaseBrowser } from '@/lib/supabase'

type KeyRow = {
  id: string; key_prefix: string; status: string; max_devices: number
  expires_at: string | null; created_at: string
}

function ActivationKeysPage() {
  const [keys, setKeys] = useState<KeyRow[]>([])
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)

  const load = async () => {
    const client = supabaseBrowser()
    const { data, error } = await client
      .from('activation_keys')
      .select('id,key_prefix,status,max_devices,expires_at,created_at')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('load keys error:', error)
    }
    setKeys((data ?? []) as KeyRow[])
  }

  useEffect(() => { load() }, [])

  const createKey = async () => {
    setCreating(true); setNewKey(null)
    const supabase = supabaseBrowser()
    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token ?? ''}`
      }
    })

    if (res.ok) {
      const { plaintext } = await res.json()
      setNewKey(plaintext)
      await load()
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Failed to create key' }))
      alert(error || 'Failed to create key')
    }
    setCreating(false)
  }

  const revoke = async (id: string) => {
  if (!confirm('Revoke this key?')) return
  const supabase = supabaseBrowser()
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`/api/keys/${id}/revoke`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
  })
  if (!res.ok) {
    const txt = await res.text().catch(()=>'')
    try { alert(JSON.parse(txt).error) } catch { alert(txt || 'Failed to revoke') }
  } else {
    await load()
  }
}




  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Activation Keys</h1>
        <button className="rounded-xl px-4 py-2 bg-black text-white"
          onClick={createKey} disabled={creating}>
          {creating ? 'Creating…' : 'Generate New Key'}
        </button>
      </div>

      {newKey && (
        <div className="rounded-xl border p-4">
          <div className="font-medium mb-2">New key (copy now — shown once):</div>
          <code className="text-sm break-all">{newKey}</code>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/10">
            {/* <tr>
              <th className="text-left p-3">Prefix</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Max Devices</th>
              <th className="text-left p-3">Expires</th>
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3"></th>
            </tr> */}
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k.id} className="border-t border-white/10">
                <td className="p-3">{k.key_prefix}</td>
                <td className="p-3">{k.status}</td>
                <td className="p-3">{k.max_devices}</td>
                <td className="p-3">{k.expires_at ? new Date(k.expires_at).toLocaleString() : '—'}</td>
                <td className="p-3">{new Date(k.created_at).toLocaleString()}</td>
                <td className="p-3">
                  <button className="text-red-400 hover:underline" onClick={() => revoke(k.id)}>Revoke</button>
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-400">No keys yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Page() {
  return <RequireAuth><ActivationKeysPage /></RequireAuth>
}
