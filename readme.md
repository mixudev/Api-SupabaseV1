# 🔐 SECURE FILE ENCRYPTION SYSTEM v3.0
## Enterprise-Grade File Encryption with AES-256-GCM + Argon2id + FIPS Support

![C++](https://img.shields.io/badge/C%2B%2B-17-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Security](https://img.shields.io/badge/Security-Enterprise-red) ![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-brightgreen)

---

## 📋 Daftar Isi
- [Ringkasan](#-ringkasan)
- [Fitur Utama](#-fitur-utama)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Instalasi](#-instalasi)
- [Konfigurasi](#-konfigurasi)
- [Penggunaan](#-penggunaan)
- [Keamanan & Anti-Forensik](#-keamanan--anti-forensik)
- [Alur Kerja](#-alur-kerja-detail)
- [API & Integrasi](#-api--integrasi)
- [Troubleshooting](#-troubleshooting)
- [FAQ](#-faq)

---

## 🎯 Ringkasan

**SECURE FILE ENCRYPTION SYSTEM v3.0** adalah solusi enkripsi file **enterprise-grade** yang dirancang untuk melindungi data sensitif dengan standar keamanan tinggi. Sistem ini menggunakan algoritma kriptografi modern dan fitur anti-forensik untuk mencegah akses tidak sah.

### Teknologi Utama
- **AES-256-GCM** (Authenticated Encryption with Associated Data)
- **Argon2id** untuk derivasi kunci password-based
- **RSA** untuk enkripsi kunci master
- **OpenSSL** sebagai backend kriptografi
- **FIPS 140-3** mode support (opsional)
- **Certificate Pinning** untuk secure network
- **Secure deletion** (DoD-style multiple passes)
- **Anti-debugging** dan anti-forensic measures

### Digunakan untuk:
- 🔒 Enkripsi file dalam batch otomatis
- 🏢 Compliance enterprise (GDPR, HIPAA, NIST)
- 🕵️ Perlindungan dari forensik disk
- 🌐 Anonymity di jaringan publik/tidak aman
- 🔑 Key management dengan upload otomatis

---

## ✨ Fitur Utama

### Enkripsi
| Fitur | Detail |
|-------|--------|
| **Cipher** | AES-256-GCM (NIST-approved AEAD) |
| **Authentication** | 128-bit GCM tag untuk integrity |
| **Key Size** | 256-bit master key + derived keys |
| **IV** | 96-bit random per-file |
| **Mode** | Authenticated Encryption with Associated Data |

### Key Derivation
| Parameter | Nilai | Alasan |
|-----------|-------|--------|
| **Algorithm** | Argon2id | Memory-hard, timing-resistant |
| **Time Cost** | 5 iterations | Balance speed vs security |
| **Memory Cost** | 256 MB per operation | Prevent rainbow table attacks |
| **Parallelism** | 2 threads | Parallel hashing support |
| **Salt** | 256-bit random | Unique per master key |

### File Management
```
Whitelist/Blacklist Modes:
- whitelist  → Hanya file dalam whitelist dienkripsi
- blacklist  → Semua file kecuali yang di-blacklist
- all        → Semua file (except .locked, .key, system)
```

### Security Hardening
- ✅ Anti-debugger detection (Windows + POSIX)
- ✅ Constant-time string comparison
- ✅ Machine binding (SHA-256 hardware ID)
- ✅ Secure memory cleanup (OPENSSL_cleanse)
- ✅ Secure file deletion (DoD-style multiple passes)
- ✅ Auto log deletion post-encryption
- ✅ Session isolation per run
- ✅ FIPS mode support
- ✅ Self-integrity verification
- ✅ TPM integration (stub)

### Network Security
- ✅ HTTPS + API Key authentication
- ✅ HTTP/SOCKS proxy support
- ✅ Tor anonymity network ready
- ✅ Certificate pinning
- ✅ Exponential backoff retry logic
- ✅ Background auto-retry on network fail
- ✅ Multipart form-data upload (RFC 2388)

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────┐
│           SECURE FILE ENCRYPTION SYSTEM             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐  ┌──────────────┐                │
│  │ encrypt.exe  │  │ decrypt.exe  │                │
│  └──────────────┘  └──────────────┘                │
│       │                    │                        │
│       ├─────────┬──────────┤                        │
│       │         │          │                        │
│   ┌───▼───┐ ┌───▼────┐ ┌──▼─────┐                 │
│   │Config │ │Crypto  │ │Network │                 │
│   │Loader │ │Engine  │ │Handler │                 │
│   └───┬───┘ └───┬────┘ └──┬─────┘                 │
│       │         │         │                        │
│   config.json  AES-GCM   Tor/Proxy                │
│               Argon2id   WinHTTP                   │
│                          Threading                 │
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │      encrypt.key (JSON, AES-encrypted)      │ │
│  │      password.txt (512-bit hex, secure)     │ │
│  │      *.locked (AES-256-GCM ciphertext)      │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Komponen Utama

#### 1. **encrypt.cpp** (Main Encryption Engine)
```cpp
Fungsi:
- Load configuration dari JSON
- Generate 512-bit random recovery key
- Derive master key dari password + Argon2id
- Encrypt master key dengan AES-256-GCM
- Save encrypted key file (JSON format)
- Iterate target directories (recursive/flat)
- Apply extension filters (whitelist/blacklist)
- Perform AES-256-GCM file encryption
- Save .locked ciphertext files
- Optional: Secure delete originals
- Optional: Send recovery key via API (background thread)
- Secure cleanup: password + master key + logs

Entry Point:
  ./encrypt.exe [config_path]
```

#### 2. **decrypt.cpp** (Main Decryption Engine)
```cpp
Fungsi:
- Load configuration
- Load encrypted key file
- Prompt recovery key input (password)
- Derive key dari Argon2id + salt
- Verify authentication tag (GCM)
- Decrypt each .locked file
- Restore original files
- Auto-delete key file post-decrypt (optional)
- Anti-debug: Terminate if debugger attached

Entry Point:
  ./decrypt.exe [config_path] [optional_password]
```

#### 3. **config_loader.h** (Header-Only Config Parser)
```cpp
Fitur:
- Minimal JSON parser (no external deps)
- Extract: targets, extensions, options
- Validate extension whitelist/blacklist
- Parse proxy configuration
- Parse remote API settings
- Mode: whitelist | blacklist | all
```

#### 4. **crypto_secure.h** (Header-Only Crypto Library)
```cpp
Exports:
- aesGcmEncrypt/Decrypt (in-memory)
- aesGcmTransformFile/DecryptFile (streamed)
- deriveKeyArgon2 (PBK2D)
- generateRandomBytes (RAND_bytes)
- hasStringSha256 (for machine ID)
- toBase64/fromBase64 (for JSON serialization)
- secure_zero (OPENSSL_cleanse)
- secure_delete (3x Gutmann overwrite)
- constantTimeEqual (timing-resistant compare)
- isDebuggerPresentEnhanced (cross-OS anti-debug)
- get_machine_id (hardware binding)
- saveKeyFile/loadKeyFile (JSON key management)
```

#### 5. **config.json** (Configuration File)
```json
Sections:
- targets: Direktori files yang akan dienkripsi
- extensions: Whitelist/blacklist file types
- options: Behavior, retry, proxy, API settings
```

---

## 📦 Instalasi

### Generate RSA KEY
```powershell
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in private_key.pem -out public_key.pem
```

### Prerequisites

#### Windows
```powershell
# Option 1: MSYS2 UCRT64 (Recommended)
pacman -S mingw-w64-ucrt-x86_64-openssl mingw-w64-ucrt-x86_64-libargon2

# Option 2: vcpkg
vcpkg install openssl phc-winner-argon2
```

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y libssl-dev libargon2-dev build-essential cmake
```

#### macOS
```bash
brew install openssl argon2 cmake
```

### Kompilasi

#### Windows (MSYS2)
```powershell
cd D:\SECURITY-LAB
.\build.ps1
# Output: encrypt.exe, decrypt.exe di folder root
```

#### Linux/macOS
```bash
cd /path/to/SECURITY-LAB
mkdir -p build && cd build
cmake .. -G "Unix Makefiles"
cmake --build . --config Release
# Output: build/encrypt, build/decrypt
```

#### Manual g++ (Linux/Windows)
```bash
# Compile resource (Windows only)
windres resource.rc -o resource.o

# Build encrypt
g++ -std=c++17 -O2 \
  -I/usr/include/openssl \
  -I/usr/include/argon2 \
  encrypt.cpp resource.o \
  -L/usr/lib -lssl -lcrypto -largon2 \
  -o encrypt.exe -static-libgcc -static-libstdc++

# Build decrypt
g++ -std=c++17 -O2 \
  -I/usr/include/openssl \
  -I/usr/include/argon2 \
  decrypt.cpp resource.o \
  -L/usr/lib -lssl -lcrypto -largon2 \
  -o decrypt.exe -static-libgcc -static-libstdc++
```

---

## 🔧 Konfigurasi

### config.json Structure

```json
{
  "targets": [
    "D:\\SECURITY-LAB\\test_lab",
    "D:\\SECURITY-LAB\\test_lab2"
  ],
  "mode": "all",
  "extensions": {
    "whitelist": [".txt", ".docx", ".pdf", ".mp4"],
    "blacklist": [".exe", ".dll", ".sys", ".key"]
  },
  "options": {
    "recursive": true,
    "delete_original": true,
    "key_filename": "encrypt.key",
    "password_file": "password.txt",
    "log_file": "encrypt_log.txt",
    "secure_wipe_password": true,
    "verbose": true,
    "password_file_path": "password_hidden/password.txt",
    "send_to_url": true,
    "url_endpoint": "https://api.example.com/upload",
    "api_key": "your-secret-key",
    "delete_encrypted_key_after_encrypt": false,
    "delete_encrypted_key_after_send": true,
    "delete_password_after_send": true,
    "fips_mode": false,
    "enforce_cert_pinning": false,
    "pinned_cert": "",
    "enforce_self_integrity": false,
    "use_tpm": false,
    "secure_delete_passes": 5,
    "flush_file_buffers": true,
    "randomize_file_metadata_before_delete": true,
    "retry_interval_minutes": 5,
    "proxy_type": "http",
    "proxy_host": "proxy.example.com",
    "proxy_port": 8080
  }
}
```

### Parameter Penjelasan

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| **targets** | Array | Directori untuk dienkripsi |
| **mode** | String | `all`, `whitelist`, `blacklist` |
| **whitelist** | Array | Ext file untuk dienkripsi (whitelist mode) |
| **blacklist** | Array | Ext file dikecualikan (semua mode) |
| **recursive** | Boolean | Proses subfolder recursive |
| **delete_original** | Boolean | Hapus file original setelah encrypt |
| **key_filename** | String | Nama file encrypted key |
| **password_file** | String | Nama file recovery key |
| **log_file** | String | Nama file log (kosong = no log) |
| **secure_wipe_password** | Boolean | Secure delete password. txt |
| **verbose** | Boolean | Verbose logging output |
| **password_file_path** | String | Path menyimpan password file |
| **send_to_url** | Boolean | Aktif kirim recovery key ke API |
| **url_endpoint** | String | URL API endpoint POST |
| **api_key** | String | API key header 'x-api-key' |
| **delete_password_after_send** | Boolean | Hapus password file setelah kirim sukses |
| **retry_interval_minutes** | Integer | Interval retry send (minutes) |
| **proxy_type** | String | `http` (SOCKS belum di WinHTTP) |
| **proxy_host** | String | Proxy hostname/IP |
| **proxy_port** | Integer | Proxy port number |

---

## 🚀 Penggunaan

### Mode 1: Encrypt Files (Interactive)

```bash
./encrypt.exe
# atau dengan custom config
./encrypt.exe config.json

Output:
================================================
      SECURE FILE ENCRYPTION SYSTEM v2.0        
================================================

=== Recovery Key Generation ===
[CONFIG] Loaded from: config.json
[INFO] Temporary recovery key saved to: password_hidden/password.txt
[KEY] 58197D68-643C3D2F-01EF7285-EEDE421E-78D8C496-...
[NOTICE] This file will be SECURELY DELETED after encryption.

=== Initializing Session ===
[KEY] Master key loaded successfully
[TARGET] D:\SECURITY-LAB\test_lab
[ENCRYPTED] D:\SECURITY-LAB\test_lab\file1.txt
[ENCRYPTED] D:\SECURITY-LAB\test_lab\document.docx
...

=== Encryption Session Complete ===
Encrypted: 15
Skipped  : 3
Failed   : 0

[CLEANUP] Log file securely deleted.
```

### Mode 2: Decrypt Files (Interactive)

```bash
./decrypt.exe
# atau dengan password direct (not secure!)
./decrypt.exe config.json "58197D68-643C3D2F-..."

Output:
================================================
      SECURE FILE DECRYPTION SYSTEM v2.0        
================================================

=== Manual Recovery Key Entry ===
Enter the 512-bit recovery key to unlock your files.
Key: ****...

[KEY] Master key loaded successfully
[TARGET] D:\SECURITY-LAB\test_lab
[UNLOCKED] D:\SECURITY-LAB\test_lab\file1.txt
[UNLOCKED] D:\SECURITY-LAB\test_lab\document.docx
...

=== Decryption Session Complete ===
Decrypted  : 15
Skipped    : 0
Failed     : 0
```

### Mode 3: Batch Mode (Scripted)

```bash
# Encrypt dengan config custom
./encrypt.exe D:\SECURITY-LAB\custom_config.json

# Decrypt dengan password dari environment
set RECOVERY_KEY=58197D68-643C3D2F-...
./decrypt.exe config.json %RECOVERY_KEY%
```

---

## 🔐 Keamanan & Anti-Forensik

### Security Model

```
┌─────────────────────────────────────────────┐
│          SECURITY LAYERS                    │
├─────────────────────────────────────────────┤
│                                             │
│  Layer 1: ENCRYPTION                        │
│  ├─ AES-256-GCM (256-bit key)               │
│  ├─ 96-bit random IV per file               │
│  ├─ 128-bit authentication tag (AEAD)       │
│  └─ Chunked streaming (memory-efficient)    │
│                                             │
│  Layer 2: KEY DERIVATION                    │
│  ├─ Argon2id (memory-hard, timing-safe)     │
│  ├─ 256-bit random salt                     │
│  ├─ 256 MB memory cost                      │
│  └─ 5 iterations                            │
│                                             │
│  Layer 3: KEY STORAGE                       │
│  ├─ Master key encrypted dengan derived key │
│  ├─ JSON format (salt, IV, tag, ciphertext) │
│  ├─ Machine binding (hardware ID hash)      │
│  └─ Auto-zero memory setelah use            │
│                                             │
│  Layer 4: FILE DELETION                     │
│  ├─ Overwrite 3x dengan random data         │
│  ├─ Delete file handle                      │
│  └─ Prevent forensic recovery (SSD TRIM)    │
│                                             │
│  Layer 5: ANTI-DEBUG                        │
│  ├─ IsDebuggerPresent() (Windows)           │
│  ├─ ptrace(PTRACE_TRACEME) (POSIX)          │
│  ├─ Terminate program jika detected         │
│  └─ Return 0xDEAD                           │
│                                             │
│  Layer 6: NETWORK SECURITY                  │
│  ├─ HTTPS (TLS encryption)                  │
│  ├─ API key authentication                  │
│  ├─ HTTP/proxy anonymity                    │
│  └─ Retry loop sampai sukses                │
│                                             │
│  Layer 7: MEMORY HANDLING                   │
│  ├─ OPENSSL_cleanse (secure wipe)           │
│  ├─ Constant-time compare                   │
│  ├─ No sprintf/strcpy (safe functions)      │
│  └─ Stack local var auto-zeroed             │
│                                             │
│  Layer 8: LOG DELETION                      │
│  ├─ Secure delete log file post-session     │
│  ├─ No audit trail tersisa                  │
│  └─ Verbose mode optional                   │
│                                             │
└─────────────────────────────────────────────┘
```

### Anti-Forensik Features

#### 1. **Secure File Deletion**
```cpp
// Metode: Gutmann-style (3-pass overwrite)
// Pass 1: Random data
// Pass 2: Inverted random data
// Pass 3: Random data lagi
// Result: Original file data recovered mustahil
```

**Protection Against:**
- ✅ Simple `rm` / `del` recovery
- ✅ Undelete utilities (Recuva, EaseUS)
- ✅ Forensic carving (untuk HDD)
- ⚠️ SSD TRIM (depends on SSD firmware)
- ⚠️ Write-once media (CD, WORM)

#### 2. **Memory Sanitization**
```cpp
// OPENSSL_cleanse() untuk:
- Password strings
- Master key bytes
- Derived key material
- Plaintext buffers
// Prevent: Cold boot attacks, RAM forensics
```

#### 3. **Machine Binding**
```
Key File Validation:
1. Get hardware ID (volume serial / registry GUID / /etc/machine-id)
2. Hash dengan SHA-256
3. Store dalam encrypt.key
4. On decrypt: Compare hash, reject jika mismatch
Result: Key file tidak bisa pindah antar device
```

#### 4. **Log Cleanup**
```
Post-encryption:
- encrypt_log.txt → secure deleted
- stdout buffering minimal
- Verbose mode dapat di-disable
Result: Tidak ada audit trail di disk
```

#### 5. **Zero-Knowledge Recovery**
```
Password flow:
1. Generate 512-bit random key (client)
2. Never send key plain (send encrypted + delete local)
3. Server hanya store session ID + expiry
4. Client only has encrypted.key file
Result: Even admins cannot recover key
```

---

## 🔄 Alur Kerja Detail

### ENCRYPTION FLOWCHART

```
START (encrypt.exe)
    │
    ├─ [1] Check Debugger Attached
    │       ├─ YES → Print 0xDEAD & EXIT
    │       └─ NO  → Continue
    │
    ├─ [2] Load config.json
    │       ├─ Try argv[1] path
    │       ├─ Try exe folder config.json
    │       └─ Try embedded resource (Windows)
    │
    ├─ [3] Validate Targets
    │       └─ targets array not empty?
    │
    ├─ [4] Generate Recovery Key
    │       ├─ generateRandomBytes(64) → 512-bit
    │       ├─ Format HEX → XXXXXXXX-XXXXXXXX-...
    │       └─ Save password_file_path
    │
    ├─ [5] Spawn Send Thread (Background)
    │       ├─ Read password file
    │       ├─ Retry loop (every N min)
    │       ├─ POST multipart form-data
    │       ├─ On success → secure_delete(password)
    │       └─ Continue retry sampai sukses
    │
    ├─ [6] Generate Master Key
    │       └─ generateRandomBytes(32) → AES-256
    │
    ├─ [7] For each TARGET directory
    │       ├─ [7.1] Load/Create encrypt.key
    │       │         ├─ Prompt password input
    │       │         ├─ Argon2id(password, salt) → derived_key
    │       │         ├─ AES-256-GCM(master_key, derived_key) → ciphertext
    │       │         └─ Save JSON: {salt, IV, tag, ciphertext}
    │       │
    │       └─ [7.2] For each file in target (recursive/flat)
    │                 ├─ Check extension (whitelist/blacklist)
    │                 ├─ Read plaintext
    │                 ├─ Encrypt: AES-256-GCM
    │                 │   ├─ Generate random IV
    │                 │   ├─ Encrypt data
    │                 │   ├─ Get auth tag
    │                 │   └─ Write: [IV(12)][TAG(16)][CIPHERTEXT]
    │                 ├─ Rename → *.locked
    │                 ├─ If delete_original: secure_delete()
    │                 └─ Log entry
    │
    ├─ [8] Zero Master Key
    │       └─ secure_zero(masterKey)
    │
    ├─ [9] Wait Send Thread Complete
    │       └─ sendThread.join()
    │
    ├─ [10] Cleanup
    │        ├─ Zero password string
    │        ├─ Secure delete log_file
    │        └─ Print summary
    │
    └─ EXIT (Success)
```

### DECRYPTION FLOWCHART

```
START (decrypt.exe)
    │
    ├─ [1] Check Debugger Attached
    │       ├─ YES → Print 0xDEAD & EXIT
    │       └─ NO  → Continue
    │
    ├─ [2] Load config.json
    │       └─ Same as encrypt
    │
    ├─ [3] For each TARGET directory
    │       ├─ Load encrypt.key (JSON)
    │       ├─ Prompt recovery key input
    │       │   └─ getPasswordInput() [hidden]
    │       │
    │       ├─ Derive key: Argon2id(password, salt)
    │       │   └─ Use salt dari encrypt.key
    │       │
    │       ├─ Decrypt master key
    │       │   ├─ Get nonce, tag, ciphertext dari JSON
    │       │   ├─ AES-256-GCM decrypt
    │       │   └─ Verify auth tag (if fail → abort)
    │       │
    │       └─ For each *.locked file
    │           ├─ Read [IV(12)][TAG(16)][CIPHERTEXT]
    │           ├─ AES-256-GCM decrypt
    │           ├─ Verify auth tag
    │           ├─ Write plaintext → remove .locked ext
    │           ├─ If delete_original: delete .locked
    │           └─ Log entry
    │
    ├─ [4] Delete encrypt.key (optional)
    │       └─ fs::remove()
    │
    ├─ [5] Zero sensitive data
    │       ├─ secure_zero(password)
    │       └─ secure_zero(masterKey)
    │
    ├─ [6] Print summary
    │       ├─ Decrypted count
    │       ├─ Skipped count
    │       └─ Failed count
    │
    └─ EXIT
```

---

## 🌐 API & Integrasi

### Remote API Integration

Sistem dapat mengirim recovery key (RSA-encrypted AES key) ke server backend untuk penyimpanan aman:

```http
POST /api/upload HTTP/1.1
Host: api.example.com
Content-Type: multipart/form-data; boundary=----Boundary...
x-api-key: your-secret-key
Content-Length: 1024

------Boundary...
Content-Disposition: form-data; name="file"; filename="key_encrypted.txt"
Content-Type: text/plain

<Base64-encoded-RSA-encrypted-AES-key>
------Boundary...--
```

### Request Details
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Headers**:
  - `x-api-key`: API key untuk authentication
- **Body**: File berisi Base64 string dari RSA-encrypted AES key
- **File Name**: `key_encrypted.txt` (atau sesuai config)

### Response Expected
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Key uploaded successfully",
  "file_id": "unique-session-id",
  "timestamp": 1711401600
}
```

Atau error:
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "success": false,
  "error": "Invalid API key"
}
```

### Retry Behavior
```
Attempt #1: Fail (network error)
  └─ Wait 5 minutes (configurable)

Attempt #2: Fail (network error)
  └─ Wait 5 minutes

... (up to 100 attempts)
```

### Server Implementation Examples

#### Node.js + Express
```javascript
const express = require('express');
const multer = require('multer');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/api/upload', upload.single('file'), (req, res) => {
  const apiKey = req.headers['x-api-key'];
  
  if (apiKey !== 'your-secret-key') {
    return res.status(401).json({ success: false, error: 'Invalid API key' });
  }
  
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }
  
  // Process the uploaded encrypted key
  const fileContent = fs.readFileSync(req.file.path, 'utf8');
  console.log('Received encrypted key:', fileContent);
  
  // Store securely (e.g., database, encrypted file)
  const fileId = `key_${Date.now()}`;
  fs.renameSync(req.file.path, `keys/${fileId}.txt`);
  
  res.json({
    success: true,
    message: 'Key uploaded successfully',
    file_id: fileId,
    timestamp: Math.floor(Date.now() / 1000)
  });
});

app.listen(3000, () => console.log('API server running on port 3000'));
```

#### Python + Flask
```python
from flask import Flask, request, jsonify
import os
import time

app = Flask(__name__)

@app.route('/api/upload', methods=['POST'])
def upload_key():
    api_key = request.headers.get('x-api-key')
    if api_key != 'your-secret-key':
        return jsonify({'success': False, 'error': 'Invalid API key'}), 401
    
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No selected file'}), 400
    
    # Save the encrypted key
    file_id = f"key_{int(time.time())}"
    file_path = os.path.join('keys', f"{file_id}.txt")
    file.save(file_path)
    
    # Log the upload
    with open(file_path, 'r') as f:
        encrypted_key = f.read()
    print(f"Received encrypted key for {file_id}: {encrypted_key[:50]}...")
    
    return jsonify({
        'success': True,
        'message': 'Key uploaded successfully',
        'file_id': file_id,
        'timestamp': int(time.time())
    })

if __name__ == '__main__':
    os.makedirs('keys', exist_ok=True)
    app.run(port=3000)
```

#### PHP
```php
<?php
header('Content-Type: application/json');

$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
if ($apiKey !== 'your-secret-key') {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Invalid API key']);
    exit;
}

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['file'];
$uploadDir = 'keys/';
$fileId = 'key_' . time() . '.txt';
$filePath = $uploadDir . $fileId;

if (move_uploaded_file($file['tmp_name'], $filePath)) {
    $encryptedKey = file_get_contents($filePath);
    error_log("Received encrypted key for $fileId: " . substr($encryptedKey, 0, 50) . "...");
    
    echo json_encode([
        'success' => true,
        'message' => 'Key uploaded successfully',
        'file_id' => $fileId,
        'timestamp' => time()
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Upload failed']);
}
?>
```

### API Security Best Practices
- ✅ Use HTTPS only
- ✅ Validate API key on every request
- ✅ Store encrypted keys securely (encrypted database)
- ✅ Implement rate limiting
- ✅ Log uploads for audit
- ✅ Use certificate pinning (recommended)
- ✅ Implement proper error handling

Attempt #100: Fail
  └─ Stop, log error
```

### Proxy Routing
```
Client → Proxy (HTTP) → Server
       ↓
       [WinHTTP sets proxy via config.json]

Contoh config untuk Tor:
{
  "proxy_type": "http",
  "proxy_host": "127.0.0.1",
  "proxy_port": 8118  // Tor HTTP port (jika menggunakan Privoxy)
}
```

---

## 🔧 Troubleshooting

### Build Errors
- **OpenSSL not found**: Install OpenSSL dev packages (`apt install libssl-dev`, `pacman -S openssl`)
- **libcurl missing**: `apt install libcurl4-openssl-dev` (Linux/macOS)
- **CMake version**: Upgrade to 3.10+
- **FIPS mode fail**: Ensure OpenSSL compiled with FIPS support

### Runtime Errors
- **Public key not found**: Check `rsa_public_key_path` in config.json
- **Network timeout**: Verify proxy settings or URL endpoint
- **Certificate pinning fail**: Check `pinned_cert` format (should be hash)
- **FIPS mode error**: OpenSSL may not support FIPS on your system

### Common Issues
- **Files not encrypted**: Check whitelist/blacklist in config
- **Key upload failed**: Verify API key and endpoint URL
- **Decryption failed**: Ensure AES key hex is correct (64 characters)
- **Memory issues**: Reduce `secure_delete_passes` if system low on RAM

### Debug Mode
Enable `"verbose": true` in config for detailed logs.

### FIPS Mode Setup
```bash
# Check if FIPS available
openssl version -f

# If not available, recompile OpenSSL with FIPS
./Configure enable-fips --prefix=/usr/local/openssl-fips
make && make install
```
brew install argon2
```

### Problem 3: Encryption Slow (CPU 100%)

**Analisis:**
- Argon2id memory-hard → expected lambat
- 256 MB × 5 iterations = high CPU/memory usage
- Tunggu proses selesai

**Solusi:**
- Turun ARGON2_MEMORY jika urgent (edit crypto_secure.h)
- Gunakan SSD untuk I/O performance

### Problem 4: Password File Not Deleted

**Cek:**
```json
"delete_password_after_send": true,  // Must be true
"send_to_url": true,                 // Must be true
```

**Debug:**
- Pastikan network stable
- Check server API returns HTTP 200-299
- Lihat encrypt_log.txt untuk error detail

### Problem 5: Decrypt Says "Authentication Failed"

**Possible Causes:**
1. Wrong recovery password input
2. Corrupted encrypt.key file
3. Corrupted .locked file
4. Different machine (key binding failed)

**Fix:**
```bash
# Cek encrypt.key machine_id binding
cat encrypt.key | grep machine_id
# Compare dengan current machine ID dari code

# Jika key rusak: restore dari backup atau recovery API
```

### Problem 6: Debugger Detection False Positive

**Issue:**
```
[SECURITY] Debugger detected. Terminating.
```

**Cause:**
- Run dalam debugger (Visual Studio, GDB, etc)
- Profiler attached (CPU profiler, dll)
- Antivirus scanning (sometimes hooks ptrace)

**Fix:**
```cpp
// Untuk development, disable anti-debug:
// Comment out: if (isDebuggerPresentEnhanced()) { ... }
```

---

## ❓ FAQ

### Apakah aman?
Ya, menggunakan AES-256-GCM + Argon2id + RSA. FIPS-compliant jika diaktifkan.

### Berjalan di OS apa saja?
Runtime: Windows, Linux, macOS. Build: Windows (PowerShell), Linux/macOS (bash + make).

### Bagaimana recovery jika lupa password?
Tidak bisa. Gunakan password yang kuat dan backup kunci recovery.

### Apakah mendukung file besar?
Ya, streaming encryption, tidak load ke memory penuh.

### Bagaimana dengan TPM?
Stub saat ini, bisa dikembangkan untuk hardware security module.

### Apa beda v3.0 dengan v2.0?
- FIPS mode support
- Certificate pinning
- DoD-style secure deletion
- Self-integrity checks
- Enterprise hardening features

### Bagaimana setup API server?
Lihat contoh Node.js/Python/PHP di atas. Pastikan HTTPS dan validasi API key.

### Mengapa key dihapus setelah upload?
Untuk zero-trust: kunci tidak tersimpan lokal setelah dikirim ke server aman.
**A:** 
- File yang sudah .locked = aman (terenkripsi)
- File yang belum tercopy = plaintext (tidak terenkripsi)
- encrypt.key partial = mungkin corrupt (restore dari backup)
- Recommended: Run lagi dari target directory

### Q: Berapa lama proses encrypt untuk 1000 files?
**A:** Tergantung:
- CPU speed: I7 ≈ 1-2 detik per file
- Disk speed: SSD > HDD
- Crypto op: AES-256-GCM + Argon2id ≈ 0.5-1 detik overhead
- Estimasi: 1000 files ≈ 15-30 menit

### Q: Apa bedanya mode whitelist vs blacklist?
**A:** 
- **whitelist**: Hanya *.txt, *.docx, *.pdf → encrypt (secure)
- **blacklist**: Semua EXCEPT *.exe, *.dll → encrypt (risky)
- **all**: Semua termasuk (most aggressive)

### Q: Apakah ada backdoor/NSA-approved cipher?
**A:** Tidak. Sistem gunakan:
- AES: Cipher NIST standard (public design)
- Argon2id: Open-source PHC winner
- OpenSSL: Widely audited crypto library
- No closed-source components

### Q: Support offline mode?
**A:** Ya. Jika network down:
- Encryption tetap berjalan (key generation local)
- Recovery key simpan di disk (file password.txt)
- Saat online lagi: Thread background kirim otomatis
- Good untuk air-gapped systems

---

## 📚 Referensi & Standar

- **AES-256-GCM**: NIST SP 800-38D
- **Argon2id**: RFC 9106, PHC Winner 2015
- **OpenSSL**: https://www.openssl.org/
- **WinHTTP**: Microsoft MSDN Docs
- **Secure Delete**: Gutmann Method, DOD 5220.22-M

---

## 📄 License

MIT License - Bebas untuk commercial + personal use

---

## 👨‍💻 Support & Kontribusi

**Report Issues:**
- GitHub Issues: [link]
- Email: security@example.com

**Kontribusi Welcome:**
- Fork repository
- Create feature branch (`git checkout -b feature/amazing`)
- Commit changes (`git commit -m 'Add amazing feature'`)
- Push branch (`git push origin feature/amazing`)
- Open Pull Request

---

## ⚠️ DISCLAIMER

**PERINGATAN KRITIS:**

1. **Recovery Key Backup**: Simpan recovery key di tempat aman! Jika hilang, file tidak bisa di-recover.
2. **API Endpoint Security**: Tentukan endpoint HTTPS trusted. Jangan gunakan HTTP plain.
3. **No Warranty**: Sistem ini provided AS-IS tanpa warranty. User bertanggung jawab data integrity.
4. **Legal**: Check local laws sebelum encrypt data orang lain.
5. **Performance**: Argon2id slow by design. Expected behavior.

---

**Made with 🔒 Security First**

Last Updated: March 26, 2026
