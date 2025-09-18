import React, { useEffect, useState } from 'react'
import RequireAuth from '@/auth/RequireAuth'
import { supabaseBrowser } from '@/lib/supabase'

type DeviceRow = {
  id: string; activation_key_id: string; label: string | null
  device_fingerprint: string; last_seen: string | null; created_at: string
}

function DevicesPageInner() {
  const [rows, setRows] = useState<DeviceRow[]>([])
  const load = async () => {
    const supabase = supabaseBrowser()
    const { data } = await supabase
      .from('devices')
      .select('id,activation_key_id,label,device_fingerprint,last_seen,created_at')
      .order('created_at', { ascending: false })
    setRows((data ?? []) as DeviceRow[])
  }
  useEffect(() => { load() }, [])

  const unlink = async (id: string) => {
    if (!confirm('Unlink this device?')) return
    const res = await fetch(`/api/devices/${id}`, { method: 'DELETE' })
    if (!res.ok) alert('Failed to unlink')
    await load()
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Devices</h1>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            {/* <tr>
              <th className="text-left p-3">Label</th>
              <th className="text-left p-3">Fingerprint</th>
              <th className="text-left p-3">Key</th>
              <th className="text-left p-3">Last Seen</th>
              <th className="text-left p-3">Added</th>
              <th className="text-left p-3"></th>
            </tr> */}
          </thead>
          <tbody>
            {rows.map(d => (
              <tr key={d.id} className="border-t">
                <td className="p-3">{d.label ?? '—'}</td>
                <td className="p-3">{d.device_fingerprint}</td>
                <td className="p-3"><code className="text-xs">{d.activation_key_id.slice(0,8)}…</code></td>
                <td className="p-3">{d.last_seen ? new Date(d.last_seen).toLocaleString() : '—'}</td>
                <td className="p-3">{new Date(d.created_at).toLocaleString()}</td>
                <td className="p-3">
                  <button className="text-red-600 hover:underline" onClick={() => unlink(d.id)}>Unlink</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">No devices yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Page() {
  return <RequireAuth><DevicesPageInner /></RequireAuth>
}
