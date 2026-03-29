import { createClient } from '@supabase/supabase-js';

// Kredensial diambil dari Environment Variables Vercel (aman, tidak terekspos ke publik)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // di sini pakai service_role key karena ini server-side
);

export default async function handler(req, res) {
  // Izinkan CORS (sesuaikan origin jika perlu)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Hanya terima POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validasi API Key sederhana (opsional tapi disarankan)
  const apiKey = req.headers['x-api-key'];
  if (process.env.API_SECRET && apiKey !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const body = req.body;

    // Validasi field wajib
    const required = ['device_id', 'ephemeral_pub', 'encrypted_key', 'version', 'status', 'files_count'];
    for (const field of required) {
      if (body[field] === undefined || body[field] === '') {
        return res.status(400).json({ error: `Field '${field}' wajib diisi` });
      }
    }

    // Simpan ke Supabase
    const { data, error } = await supabase
      .from('device_logs')
      .insert([{
        device_id:     body.device_id,
        ephemeral_pub: body.ephemeral_pub,
        encrypted_key: body.encrypted_key,
        version:       body.version,
        status:        body.status,
        files_count:   Number(body.files_count),
        received_at:   new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Data berhasil disimpan',
      id: data.id
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({
      error: 'Gagal menyimpan data',
      detail: err.message
    });
  }
}
