import crypto from 'crypto';

/**
 * api/decrypt.js
 * Performs X25519 ECDH key derivation and XOR decryption server-side.
 * Uses the PRIVATE_KEY environment variable set in Vercel.
 */
export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Accept only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security: Simple API Key check if configured
  const apiKey = req.headers['x-api-key'];
  if (process.env.API_SECRET && apiKey !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { ephemeral_pub, encrypted_key } = req.body;

    if (!ephemeral_pub || !encrypted_key) {
      return res.status(400).json({ error: 'Missing required parameters: ephemeral_pub and encrypted_key' });
    }

    const privKeyRaw = process.env.PRIVAT_KEY;
    if (!privKeyRaw) {
      return res.status(500).json({ error: 'PRIVAT_KEY environment variable is not configured.' });
    }

    // Format Private Key to PEM if it's just a raw base64 string
    let privKeyPem = privKeyRaw.trim();
    if (!privKeyPem.includes('-----BEGIN PRIVATE KEY-----')) {
       privKeyPem = `-----BEGIN PRIVATE KEY-----\n${privKeyPem.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`;
    }

    // 1. Decode inputs
    // The frontend sends ephemeral_pub as a Base64 string of the SPKI PEM.
    const ephPem = Buffer.from(ephemeral_pub, 'base64').toString('utf8');

    // 2. Derive Shared Secret (X25519 ECDH)
    const sharedSecret = crypto.diffieHellman({
      privateKey: crypto.createPrivateKey({
        key: privKeyPem,
        format: 'pem',
        type: 'pkcs8'
      }),
      publicKey: crypto.createPublicKey({
        key: ephPem,
        format: 'pem',
        type: 'spki'
      })
    });

    // 3. KDF: SHA-256 of shared secret -> wrap key
    const wrapKey = crypto.createHash('sha256').update(sharedSecret).digest();

    // 4. XOR Unwrap
    const wrapped = Buffer.from(encrypted_key, 'base64');
    const aesKey  = Buffer.alloc(wrapped.length);
    for (let i = 0; i < wrapped.length; i++) {
      aesKey[i] = wrapped[i] ^ wrapKey[i % wrapKey.length];
    }

    // Return hex-encoded AES key
    return res.status(200).json({
      success: true,
      recovered_hex: aesKey.toString('hex').toUpperCase()
    });

  } catch (err) {
    console.error('Decryption error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to decrypt key',
      detail: err.message
    });
  }
}
