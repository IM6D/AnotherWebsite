// api/devices/deactivate.ts
import { adminClient } from '../_lib/supabase';
import { withCors } from '../_lib/cors';

async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { device_fingerprint } = (req.body || {}) as { device_fingerprint?: string };
    if (!device_fingerprint) {
      return res.status(400).json({ error: 'Missing device_fingerprint' });
    }

    const supabase = adminClient();

    // Column is "fingerprint" per your SQL
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('fingerprint', device_fingerprint);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error('deactivate error:', e);
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}

export default withCors(handler);
