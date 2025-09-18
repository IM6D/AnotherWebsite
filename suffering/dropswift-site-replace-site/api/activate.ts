// api/activate.ts
import { randomUUID, createHash, timingSafeEqual } from 'crypto';
import { adminClient } from './_lib/supabase';
import { withCors } from './_lib/cors';

// stored format: "salt:hexhash"
function verifyKey(plaintext: string, stored: string): boolean {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hexHash] = stored.split(':');
  if (!salt || !hexHash) return false;

  const checkHex = createHash('sha256').update(`${salt}:${plaintext}`).digest('hex');
  const a = Buffer.from(hexHash, 'hex');
  const b = Buffer.from(checkHex, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const supabase = adminClient();
    const { key, device_fingerprint, label } =
      (req.body || {}) as { key?: string; device_fingerprint?: string; label?: string };

    if (!key || !device_fingerprint) {
      return res.status(400).json({ error: 'Missing key or device_fingerprint' });
    }

    // 1) Load keys (not revoked). We’ll filter expiry + hash match in app.
    const { data: keys, error: kErr } = await supabase
      .from('activation_keys')
      .select('id,user_id,key_hash,status,expires_at,max_devices')
      .neq('status', 'revoked');

    if (kErr) return res.status(400).json({ error: kErr.message });

    const now = Date.now();
    const match = (keys || []).find(
      (k: any) =>
        (!k.expires_at || new Date(k.expires_at).getTime() > now) &&
        k.key_hash &&
        verifyKey(key, k.key_hash)
    );

    if (!match) return res.status(400).json({ error: 'Invalid or expired key' });

    // 2) Enforce device limit for (activation_key_id, user_id)
    const { count, error: cErr } = await supabase
      .from('devices')
      .select('id', { count: 'exact', head: true })
      .eq('activation_key_id', match.id)
      .eq('user_id', match.user_id);

    if (cErr) return res.status(400).json({ error: cErr.message });
    if ((count ?? 0) >= (match.max_devices ?? 1)) {
      return res.status(403).json({ error: 'Device limit reached' });
    }

    // 3) Upsert device by (activation_key_id, fingerprint)
    const { data: up, error: dErr } = await supabase
      .from('devices')
      .upsert(
        {
          id: randomUUID(),
          user_id: match.user_id,
          activation_key_id: match.id,
          fingerprint: device_fingerprint, // <-- matches your SQL schema
          label: label ?? null,
          last_seen: new Date().toISOString(),
        },
        { onConflict: 'activation_key_id,fingerprint' } // <-- matches unique index
      )
      .select('id')
      .single();

    if (dErr) return res.status(400).json({ error: dErr.message });

    return res
      .status(200)
      .json({ ok: true, activation_key_id: match.id, device_id: up?.id as string });
  } catch (e: any) {
    console.error('activate error:', e);
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}

export default withCors(handler);
