# 🛡️ BitLocker Security Suite: The Phantom-7 Protocol

Sistem ini adalah mahakarya *Native C++ Security* yang dirancang untuk portabilitas ekstrem, keamanan tingkat militer, dan antarmuka visual yang memberikan efek psikologis "Total Lockdown".

---

## 🚀 1. Core Architecture (The Zero-Trace Engine)

Tidak seperti alat keamanan biasa yang bergantung pada Python atau Framework berat (Qt/Electron), sistem ini dibangun murni menggunakan **Native Win32 API & GDI+**.

- **Zero-Dependency**: Berjalan di sistem Windows apa pun tanpa instalasi *runtime* tambahan.
- **Ultra-Portable**: Seluruh mesin enkripsi, GUI, dan sistem pertahanan dikompresi menjadi satu binari tunggal (~3MB) menggunakan *UPX Ultra-Compression*.
- **Stealth Boot**: Begitu dijalankan, sistem secara instan membebaskan konsol (`FreeConsole`) dan berjalan sebagai proses latar belakang murni sebelum jendela GUI muncul.

---

## 🔒 2. Military-Grade Encryption Flow

Mesin enkripsi tidak hanya mengunci berkas, ia "menghancurkan" akses secara struktural.

1. **AES-256 CTR Cipher**: Menggunakan algoritma enkripsi simetris paling kuat di dunia. Setiap byte data diubah secara kriptografis.
2. **Hardware-Bound Privacy**: 
   - Sistem menghasilkan **Unique Device ID** berdasarkan sidik jari perangkat keras (Motherboard/CPU).
   - Kunci enkripsi diikat secara unik ke perangkat tersebut. Kunci dari satu komputer **tidak akan bisa** digunakan di komputer lain.
3. **JSON Key Package**: Hasil enkripsi disimpan dalam paket JSON terstruktur yang berisi metadata keamanan dan ID perangkat.

---

## 🎨 3. Psychological Warfare GUI (Cyberpunk Interface)

Antarmuka pengguna bukan sekadar visual, melainkan alat untuk memberikan kendali penuh bagi pemilik sistem sekaligus intimidasi bagi pihak yang tidak berwenang.

- **Double-Buffered GDI+**: Memberikan animasi halus tanpa *flicker*, termasuk efek *scanlines* dan vibrasi layar jika terjadi kesalahan input.
- **Lockdown Experience**: Saat aktif, GUI akan mengambil fokus penuh (*Foreground Locking*) untuk memastikan pengguna hanya berinteraksi dengan gerbang keamanan resmi.
- **Typewriter Feedback**: Setiap aksi (sukses/gagal) dikomunikasikan melalui animasi teks *real-time* bergaya terminal intelijen.

---

## 🛡️ 4. Active Self-Defense (Hardening)

Walaupun fitur orphaning masih dalam tahap riset, sistem ini sudah dilengkapi dengan pertahanan aktif di level handle:

- **DACL Hardening**: Secara dinamis memodifikasi *Access Control List* pada prosesnya sendiri untuk menolak akses `PROCESS_TERMINATE`. 
- **Thread Sealing**: Mengunci thread GUI agar tidak bisa diinterupsi oleh perintah terminasi standar.
- **Safe Exit Protocol**: Hanya pemilik yang tahu cara keluar dari sistem menggunakan pintasan keyboard rahasia `Ctrl + X` yang memicu *Global Safe-Exit Event*.

---

## 🛠️ 5. Deployment Flow

1. **User Action**: Menjalankan `BitLocker_Security.exe`.
2. **Hash Morphing**: Sistem menciptakan salinan unik dirinya di folder `%TEMP%` dengan tanda tangan digital yang berbeda setiap saat.
3. **Security Locking**: Menutup akses ke file sensitif dan memunculkan Master GUI.
4. **Key Validation**: Menunggu input kunci HEX yang valid.
5. **Restoration**: Setelah divalidasi, sistem melakukan deskripsi massal, membersihkan jejak di folder `%TEMP%`, dan menghancurkan dirinya sendiri dari sistem secara bersih (*Self-Deletion*).

---
> **"Security is not a product, it's a process. And this process is absolute."**
